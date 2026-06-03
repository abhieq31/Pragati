import { connectDB } from './db';
import { AuditLog } from '@/models/AuditLog';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';

export type AuditCategory = 'project' | 'task' | 'team' | 'user' | 'auth' | 'general';

interface Actor { sub?: string; id?: string; name?: string }

/**
 * Hard privacy guard for personal projects. A personal project is the user's
 * private to-do list — by design it must NEVER appear in any cross-user view,
 * including the audit trail. Even the title is sensitive. The route handlers
 * already gate audit writes for personal projects, but this writer enforces
 * the same rule centrally so that future endpoints can't accidentally leak
 * personal data through audit.
 *
 *  - Returns true if the (targetType, targetId) maps to a personal project,
 *    or to a task inside one. The caller must not write the audit row.
 *  - Anything that can't be resolved (no DB, missing ids) defaults to "not
 *    personal" so the legitimate cross-user audit trail keeps working.
 */
async function isPersonalScope(targetType: string | undefined, targetId: string | undefined, meta: any): Promise<boolean> {
  if (!targetType || !targetId) return false;
  try {
    if (targetType === 'project') {
      const p = await Project.findById(targetId).select('isPersonal personal code').lean();
      if (!p) return false;
      return !!((p as any).isPersonal || (p as any).personal || String((p as any).code || '').startsWith('PRSN-'));
    }
    if (targetType === 'task') {
      // Allow callers to hint via meta.projectId to save a round-trip.
      let projectId = meta?.projectId;
      if (!projectId) {
        const t = await Task.findById(targetId).select('projectId').lean();
        projectId = (t as any)?.projectId;
        if (!projectId) return false;
      }
      const p = await Project.findById(projectId).select('isPersonal personal code').lean();
      if (!p) return false;
      return !!((p as any).isPersonal || (p as any).personal || String((p as any).code || '').startsWith('PRSN-'));
    }
  } catch { /* fall through — never let a privacy check break the request */ }
  return false;
}

/**
 * Write an operational audit entry. Deliberately fire-and-forget and fully
 * guarded: a logging failure must never break the operation that triggered it.
 *
 * Personal projects (and the tasks inside them) are silently dropped before
 * the row is written, even when individual callers forget the explicit
 * `if (!isPersonal)` gate. That keeps personal projects fully private — no
 * title, no action, no reason ever leaves the owner's account.
 */
export async function logOperation(entry: {
  action: string;
  category: AuditCategory;
  actor?: Actor | null;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  summary: string;
  meta?: any;
}): Promise<void> {
  try {
    await connectDB();

    if (await isPersonalScope(entry.targetType, entry.targetId, entry.meta)) {
      // Defence in depth — silently swallow. The owner's own client still
      // shows their own activity through other surfaces (recent items,
      // contribution graph); this is only about the *cross-user* audit trail.
      return;
    }

    await AuditLog.create({
      action: entry.action,
      category: entry.category,
      actorId: entry.actor?.sub || entry.actor?.id || undefined,
      actorName: entry.actor?.name || '',
      targetType: entry.targetType || '',
      targetId: entry.targetId || '',
      targetLabel: entry.targetLabel || '',
      summary: entry.summary,
      meta: entry.meta ?? null,
    });
  } catch (e) {
    console.error('[audit] failed to write log entry', e);
  }
}
