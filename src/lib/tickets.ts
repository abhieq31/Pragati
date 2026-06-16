/**
 * Support-ticket analytics — deterministic, auditable statistics over a
 * project's daily ticket readings. No model, no LLM: the same first-principles
 * math the rest of Pragati uses, so every number a manager reads in a report or
 * the morning brief can be reproduced by hand from the raw series.
 *
 * The input is a clean one-reading-per-day series (see models/TicketLog.ts):
 *   { dateKey, open, logged, resolved }
 *   - open:     backlog still open at log time   (the headline count)
 *   - logged:   new tickets that day             (inflow)
 *   - resolved: tickets closed that day          (throughput)
 *
 * What we compute and why it's useful to "the daily meeting":
 *   - week-over-week backlog movement (avg open last 7 days vs the prior 7),
 *   - 7-day inflow vs throughput → net flow (is the backlog growing?),
 *   - a least-squares trend slope on the backlog (direction without the noise
 *     of any single day),
 *   - a robust MAD-based anomaly flag on the latest reading (a real spike vs
 *     ordinary jitter), and
 *   - a "clears in ~N days at current pace" projection when the team is
 *     out-resolving inflow.
 */

export interface TicketEntry {
  dateKey: string; // YYYY-MM-DD (workspace-local day)
  open: number;
  logged: number;
  resolved: number;
}

export interface TicketSummary {
  count: number; // number of readings
  latest: TicketEntry | null;
  open: number; // latest backlog (headline)
  loggedToday: number; // latest day's inflow
  resolvedToday: number; // latest day's throughput

  // 7-day windows
  logged7: number; // inflow over the most recent ≤7 readings
  resolved7: number; // throughput over the most recent ≤7 readings
  netFlow7: number; // logged7 − resolved7  (>0 ⇒ backlog grew)
  avgOpen7: number; // mean backlog, most recent ≤7 readings
  avgOpenPrev7: number; // mean backlog, the 7 readings before that
  openWoWDelta: number; // avgOpen7 − avgOpenPrev7 (absolute backlog change)
  openWoWPct: number | null; // % change vs prior week (null when no prior data)

  trendSlope: number; // least-squares slope of `open` per reading (backlog/day)
  direction: 'rising' | 'falling' | 'flat';
  anomaly: { isAnomalous: boolean; z: number } | null; // latest open vs robust baseline
  clearEtaDays: number | null; // backlog ÷ net daily resolution, when shrinking

  sparkline: number[]; // `open`, oldest→newest, capped to the last 30
  headline: string; // one-line management summary
}

/* ── Pure stats ─────────────────────────────────────────────────────────── */

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Median absolute deviation — a breakdown-resistant spread estimate that a
 *  single wild day can't inflate the way a standard deviation can. */
export function mad(xs: number[], med = median(xs)): number {
  if (xs.length === 0) return 0;
  return median(xs.map((x) => Math.abs(x - med)));
}

/** Least-squares slope of ys against its own index (0,1,2,…). Returns 0 for
 *  fewer than two points or a degenerate (flat-x) fit. */
export function linearSlope(ys: number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    num += dx * (ys[i] - meanY);
    den += dx * dx;
  }
  return den === 0 ? 0 : num / den;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/* ── Summary ────────────────────────────────────────────────────────────── */

/** Roll a raw daily series into the management-facing summary. Tolerates an
 *  unsorted/short series; sorts ascending by dateKey defensively. Pure. */
export function summarizeTickets(entriesIn: TicketEntry[]): TicketSummary {
  const entries = [...entriesIn].sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0));
  const empty: TicketSummary = {
    count: 0,
    latest: null,
    open: 0,
    loggedToday: 0,
    resolvedToday: 0,
    logged7: 0,
    resolved7: 0,
    netFlow7: 0,
    avgOpen7: 0,
    avgOpenPrev7: 0,
    openWoWDelta: 0,
    openWoWPct: null,
    trendSlope: 0,
    direction: 'flat',
    anomaly: null,
    clearEtaDays: null,
    sparkline: [],
    headline: 'No readings logged yet.',
  };
  if (entries.length === 0) return empty;

  const latest = entries[entries.length - 1];
  const opens = entries.map((e) => e.open);

  const last7 = entries.slice(-7);
  const prev7 = entries.slice(-14, -7);
  const logged7 = last7.reduce((a, e) => a + e.logged, 0);
  const resolved7 = last7.reduce((a, e) => a + e.resolved, 0);
  const avgOpen7 = last7.reduce((a, e) => a + e.open, 0) / last7.length;
  const avgOpenPrev7 = prev7.length ? prev7.reduce((a, e) => a + e.open, 0) / prev7.length : 0;
  const openWoWDelta = prev7.length ? avgOpen7 - avgOpenPrev7 : 0;
  const openWoWPct = prev7.length && avgOpenPrev7 > 0 ? (openWoWDelta / avgOpenPrev7) * 100 : null;
  const netFlow7 = logged7 - resolved7;

  // Direction from a slope on the whole (capped) series, with a deadband that
  // scales to the backlog so a handful of tickets on a 500-deep queue reads as
  // "flat", not "rising".
  const trendSlope = linearSlope(opens);
  const deadband = Math.max(0.5, 0.05 * avgOpen7);
  const direction: TicketSummary['direction'] =
    trendSlope > deadband ? 'rising' : trendSlope < -deadband ? 'falling' : 'flat';

  // Robust anomaly test on the latest reading vs the baseline of everything
  // before it (modified z-score; |z| > 3.5 is the conventional MAD cutoff).
  let anomaly: TicketSummary['anomaly'] = null;
  if (entries.length >= 5) {
    const baseline = opens.slice(0, -1);
    const med = median(baseline);
    const dispersion = mad(baseline, med);
    // 0.6745 makes MAD a consistent estimator of σ for normal-ish data.
    const z = dispersion > 0 ? (0.6745 * (latest.open - med)) / dispersion : 0;
    anomaly = { isAnomalous: Math.abs(z) > 3.5, z: round1(z) };
  }

  // "Clears in ~N days" only when the team is genuinely out-resolving inflow
  // over the recent window — otherwise the backlog isn't trending to zero and
  // an ETA would be a fiction.
  const days = last7.length;
  const netDailyResolution = days > 0 ? (resolved7 - logged7) / days : 0;
  const clearEtaDays =
    netDailyResolution > 0 && latest.open > 0
      ? Math.min(999, Math.ceil(latest.open / netDailyResolution))
      : null;

  const summary: TicketSummary = {
    count: entries.length,
    latest,
    open: latest.open,
    loggedToday: latest.logged,
    resolvedToday: latest.resolved,
    logged7,
    resolved7,
    netFlow7,
    avgOpen7: round1(avgOpen7),
    avgOpenPrev7: round1(avgOpenPrev7),
    openWoWDelta: round1(openWoWDelta),
    openWoWPct: openWoWPct === null ? null : round1(openWoWPct),
    trendSlope: round1(trendSlope),
    direction,
    anomaly,
    clearEtaDays,
    sparkline: opens.slice(-30),
    headline: '',
  };
  summary.headline = composeTicketHeadline(summary);
  return summary;
}

/** Sum several projects' daily series into one team-wide series — same day
 *  keys add their open/logged/resolved. Used for the team-level rollup so a
 *  lead sees one combined backlog trend across every tracking project. Pure. */
export function combineSeries(serieses: TicketEntry[][]): TicketEntry[] {
  const map = new Map<string, TicketEntry>();
  for (const s of serieses) {
    for (const e of s) {
      const cur = map.get(e.dateKey) || { dateKey: e.dateKey, open: 0, logged: 0, resolved: 0 };
      cur.open += e.open;
      cur.logged += e.logged;
      cur.resolved += e.resolved;
      map.set(e.dateKey, cur);
    }
  }
  return [...map.values()].sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0));
}

/** ↑ / ↓ / → for a signed delta (rising backlog is ↑). */
export function ticketArrow(delta: number): '↑' | '↓' | '→' {
  if (delta > 0) return '↑';
  if (delta < 0) return '↓';
  return '→';
}

/** Backlog week-over-week as a short human string ("↑ 4.2% wk/wk"). Shared by
 *  every surface (panel, reports, brief, email) so the phrasing matches. */
export function wowText(s: TicketSummary): string {
  if (s.openWoWPct !== null) return `${ticketArrow(s.openWoWDelta)} ${Math.abs(s.openWoWPct)}% wk/wk`;
  if (s.direction !== 'flat') return `backlog ${s.direction}`;
  return 'steady';
}

/** A crisp, management-readable one-liner. Leads with the standing backlog,
 *  then today's flow, then the week-over-week move, then an ETA if it's
 *  genuinely clearing. */
export function composeTicketHeadline(s: TicketSummary): string {
  if (s.count === 0 || !s.latest) return 'No readings logged yet.';
  const parts: string[] = [`${s.open} open`];
  if (s.loggedToday || s.resolvedToday) {
    parts.push(`+${s.loggedToday} in / −${s.resolvedToday} out today`);
  }
  if (s.openWoWPct !== null) {
    parts.push(`backlog ${ticketArrow(s.openWoWDelta)} ${Math.abs(s.openWoWPct)}% wk/wk`);
  } else if (s.direction !== 'flat') {
    parts.push(`backlog ${s.direction}`);
  }
  if (s.clearEtaDays !== null) {
    parts.push(`clears in ~${s.clearEtaDays}d at current pace`);
  } else if (s.netFlow7 > 0) {
    parts.push(`inflow outpacing resolution`);
  }
  return parts.join(' · ');
}
