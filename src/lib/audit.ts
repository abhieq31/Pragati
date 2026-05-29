import { connectDB } from './db';
import { AuditLog } from '@/models/AuditLog';

export type AuditCategory = 'project' | 'task' | 'team' | 'user' | 'auth' | 'general';

interface Actor { sub?: string; id?: string; name?: string }

/**
 * Write an operational audit entry. Deliberately fire-and-forget and fully
 * guarded: a logging failure must never break the operation that triggered it.
 * Callers can `await` it (cheap) or not.
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
