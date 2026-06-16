/**
 * Server-side ticket rollups — the DB-touching layer that turns raw TicketLog
 * rows into the per-project and team-wide summaries used by the team report,
 * the team page, the daily digest email and the in-app brief. The pure math
 * lives in lib/tickets.ts; this file only loads and groups.
 */
import { TicketLog } from '@/models/TicketLog';
import { summarizeTickets, combineSeries, type TicketEntry, type TicketSummary } from '@/lib/tickets';

const MAX_DAYS = 200;

export interface ProjectTicketRollup {
  projectId: string;
  code: string;
  name: string;
  label: string;
  summary: TicketSummary;
  series: TicketEntry[]; // kept for combining; callers decide whether to serialize it
}

export interface TeamTicketRollup {
  projects: ProjectTicketRollup[]; // only projects with ≥1 reading, worst backlog first
  combined: TicketSummary; // team-wide series summed across projects
  totalOpen: number; // sum of latest open across projects
  trackingCount: number; // projects with tracking ON that have data
}

interface ProjectLike {
  _id: any;
  code?: string;
  ccNo?: string;
  name: string;
  ticketLabel?: string;
}

/**
 * For a set of (already visibility-filtered) tracking projects, load each
 * one's recent series and summary. Returns only projects that actually carry
 * at least one reading, ordered by largest open backlog first.
 */
export async function getProjectTicketRollups(projects: ProjectLike[]): Promise<ProjectTicketRollup[]> {
  const ids = projects.map((p) => p._id);
  if (ids.length === 0) return [];
  const rows = await TicketLog.find({ projectId: { $in: ids } })
    .select('projectId dateKey open logged resolved')
    .sort({ dateKey: 1 })
    .limit(ids.length * MAX_DAYS)
    .lean();

  const byProject = new Map<string, TicketEntry[]>();
  for (const r of rows as any[]) {
    const k = String(r.projectId);
    let arr = byProject.get(k);
    if (!arr) {
      arr = [];
      byProject.set(k, arr);
    }
    arr.push({ dateKey: r.dateKey, open: r.open || 0, logged: r.logged || 0, resolved: r.resolved || 0 });
  }

  const out: ProjectTicketRollup[] = [];
  for (const p of projects) {
    const series = byProject.get(String(p._id));
    if (!series || series.length === 0) continue;
    out.push({
      projectId: String(p._id),
      code: p.ccNo || p.code || '',
      name: p.name,
      label: p.ticketLabel || 'Support tickets',
      summary: summarizeTickets(series),
      series,
    });
  }
  out.sort((a, b) => b.summary.open - a.summary.open);
  return out;
}

/** Per-project rollups plus a single combined team-wide trend. */
export async function buildTeamTicketRollup(projects: ProjectLike[]): Promise<TeamTicketRollup> {
  const rollups = await getProjectTicketRollups(projects);
  const combined = summarizeTickets(combineSeries(rollups.map((r) => r.series)));
  return {
    projects: rollups,
    combined,
    totalOpen: rollups.reduce((a, r) => a + r.summary.open, 0),
    trackingCount: rollups.length,
  };
}

/** Strip the heavy `series` array for JSON responses that only need summaries. */
export function rollupForWire(r: ProjectTicketRollup) {
  return { projectId: r.projectId, code: r.code, name: r.name, label: r.label, summary: r.summary };
}
