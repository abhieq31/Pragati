/**
 * Report fragments for support-ticket tracking — shared by the project and team
 * report builders so the HTML/PDF and CSV exports render the daily count the
 * same way everywhere. Pure string builders; no DOM, no DB.
 */
import { wowText, type TicketSummary } from '@/lib/tickets';

export { wowText };

export interface TicketReportEntry {
  dateKey: string;
  open: number;
  logged: number;
  resolved: number;
  note?: string;
}
export interface TicketReportData {
  label: string;
  summary: TicketSummary;
  entries: TicketReportEntry[];
}

function esc(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function csvCell(v: any): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** An HTML section (KPI row + recent-days table) for a project/team report.
 *  Returns '' when there's nothing logged, so callers can drop it inline. */
export function ticketHtmlSection(t: TicketReportData | null | undefined, heading?: string): string {
  if (!t || !t.summary || t.summary.count === 0) return '';
  const s = t.summary;
  const h = heading || t.label || 'Support tickets';
  const recent = [...t.entries].slice(-14).reverse();
  const rows = recent
    .map(
      (e) =>
        `<tr><td>${esc(e.dateKey)}</td><td style="text-align:right">${e.open}</td><td style="text-align:right">${e.logged}</td><td style="text-align:right">${e.resolved}</td><td>${esc(e.note || '')}</td></tr>`,
    )
    .join('');
  const netColor = s.netFlow7 > 0 ? '#b91c1c' : s.netFlow7 < 0 ? '#15803d' : '';
  return `
    <h2>${esc(h)}</h2>
    <p class="sub" style="margin-top:-4px">${esc(s.headline)}</p>
    <div class="kpis">
      <div class="kpi"><div class="n">${s.open}</div><div class="l">Open now</div></div>
      <div class="kpi"><div class="n">+${s.loggedToday} / −${s.resolvedToday}</div><div class="l">In / Out today</div></div>
      <div class="kpi"><div class="n" style="${netColor ? `color:${netColor}` : ''}">${s.netFlow7 > 0 ? '+' : ''}${s.netFlow7}</div><div class="l">Net flow · 7d</div></div>
      <div class="kpi"><div class="n">${s.avgOpen7}</div><div class="l">Avg open · 7d</div></div>
      <div class="kpi"><div class="n">${esc(wowText(s))}</div><div class="l">Backlog</div></div>
      <div class="kpi"><div class="n">${s.clearEtaDays !== null ? `~${s.clearEtaDays}d` : '—'}</div><div class="l">Clears in</div></div>
    </div>
    <table><thead><tr><th>Date</th><th style="text-align:right">Open</th><th style="text-align:right">New</th><th style="text-align:right">Resolved</th><th>Note</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" class="muted">No readings.</td></tr>'}</tbody></table>`;
}

/* ── Team rollup (per-project breakdown) ──────────────────────────────────── */

export interface TeamTicketReportData {
  totalOpen: number; // sum of latest open across projects
  combined: TicketSummary; // team-wide series
  projects: { name: string; code?: string; label: string; summary: TicketSummary }[];
}

/** A team report section: combined KPIs plus a per-project breakdown table. */
export function teamTicketHtmlSection(t: TeamTicketReportData | null | undefined): string {
  if (!t || !t.projects || t.projects.length === 0) return '';
  const c = t.combined;
  const rows = t.projects
    .map((p) => {
      const s = p.summary;
      return `<tr><td>${esc(p.name)}</td><td style="text-align:right">${s.open}</td><td style="text-align:center">+${s.loggedToday} / −${s.resolvedToday}</td><td style="text-align:right">${s.netFlow7 > 0 ? '+' : ''}${s.netFlow7}</td><td style="text-align:right">${s.avgOpen7}</td><td>${esc(wowText(s))}</td><td style="text-align:right">${s.clearEtaDays !== null ? `~${s.clearEtaDays}d` : '—'}</td></tr>`;
    })
    .join('');
  return `
    <h2>Support tickets — by project</h2>
    <p class="sub" style="margin-top:-4px">${esc(c.headline)} · ${t.projects.length} project${t.projects.length === 1 ? '' : 's'} tracking</p>
    <div class="kpis">
      <div class="kpi"><div class="n">${t.totalOpen}</div><div class="l">Open now · all</div></div>
      <div class="kpi"><div class="n">+${c.loggedToday} / −${c.resolvedToday}</div><div class="l">In / Out today</div></div>
      <div class="kpi"><div class="n" style="${c.netFlow7 > 0 ? 'color:#b91c1c' : c.netFlow7 < 0 ? 'color:#15803d' : ''}">${c.netFlow7 > 0 ? '+' : ''}${c.netFlow7}</div><div class="l">Net flow · 7d</div></div>
      <div class="kpi"><div class="n">${esc(wowText(c))}</div><div class="l">Backlog</div></div>
      <div class="kpi"><div class="n">${c.clearEtaDays !== null ? `~${c.clearEtaDays}d` : '—'}</div><div class="l">Clears in</div></div>
    </div>
    <table><thead><tr><th>Project</th><th style="text-align:right">Open</th><th style="text-align:center">In / Out today</th><th style="text-align:right">Net 7d</th><th style="text-align:right">Avg 7d</th><th>Backlog</th><th style="text-align:right">Clears in</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

/** Team CSV lines — combined stanza then a per-project table. */
export function teamTicketCsvLines(t: TeamTicketReportData | null | undefined): string[] {
  if (!t || !t.projects || t.projects.length === 0) return [];
  const c = t.combined;
  const head = (k: string, v: string) => [k, v].map(csvCell).join(',');
  return [
    head('Support tickets (team)', ''),
    head('Open now (all projects)', String(t.totalOpen)),
    head('New today', String(c.loggedToday)),
    head('Resolved today', String(c.resolvedToday)),
    head('Net flow (7d)', `${c.netFlow7 > 0 ? '+' : ''}${c.netFlow7}`),
    head('Backlog wk/wk', wowText(c)),
    head('Summary', c.headline),
    ',',
    ['Project', 'Open', 'New today', 'Resolved today', 'Net 7d', 'Avg open 7d', 'Backlog', 'Clears in']
      .map(csvCell)
      .join(','),
    ...t.projects.map((p) => {
      const s = p.summary;
      return [
        p.name,
        String(s.open),
        String(s.loggedToday),
        String(s.resolvedToday),
        `${s.netFlow7 > 0 ? '+' : ''}${s.netFlow7}`,
        String(s.avgOpen7),
        wowText(s),
        s.clearEtaDays !== null ? `~${s.clearEtaDays} days` : '—',
      ]
        .map(csvCell)
        .join(',');
    }),
    ',',
  ];
}

/** CSV lines (already escaped) for a labelled ticket block: a summary stanza
 *  then the daily log. Callers splice these into their own line array. */
export function ticketCsvLines(t: TicketReportData | null | undefined, title?: string): string[] {
  if (!t || !t.summary || t.summary.count === 0) return [];
  const s = t.summary;
  const head = (k: string, v: string) => [k, v].map(csvCell).join(',');
  const lines: string[] = [
    head(title || t.label || 'Support tickets', ''),
    head('Open now', String(s.open)),
    head('New today', String(s.loggedToday)),
    head('Resolved today', String(s.resolvedToday)),
    head('Net flow (7d)', `${s.netFlow7 > 0 ? '+' : ''}${s.netFlow7}`),
    head('Avg open (7d)', String(s.avgOpen7)),
    head('Backlog wk/wk', wowText(s)),
    head('Clears in', s.clearEtaDays !== null ? `~${s.clearEtaDays} days` : '—'),
    head('Summary', s.headline),
    ',',
    ['Date', 'Open', 'New', 'Resolved', 'Note'].map(csvCell).join(','),
    ...[...t.entries]
      .slice(-60)
      .reverse()
      .map((e) =>
        [e.dateKey, String(e.open), String(e.logged), String(e.resolved), e.note || '']
          .map(csvCell)
          .join(','),
      ),
    ',',
  ];
  return lines;
}
