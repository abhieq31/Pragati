import { AuditLog } from '@/models/AuditLog';
import type { JwtPayload } from '@/lib/auth';

/**
 * Fire-and-forget operations-log writer. Called from API routes right after
 * a record-changing operation succeeds. Never throws into the caller — a
 * failed audit write must not fail (or roll back) the action it records,
 * and the append-only log is best-effort at the write boundary.
 */
export async function logOperation(opts: {
  actor?: Pick<JwtPayload, 'sub' | 'name' | 'role'> | null;
  action: string;          // dotted verb, e.g. 'user.lock', 'project.delete'
  entityType?: string;     // 'user' | 'project' | 'team' | 'auth' | ...
  entityId?: string;
  summary: string;         // human-readable one-liner
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await AuditLog.create({
      actorId:    opts.actor?.sub,
      actorName:  opts.actor?.name || '',
      actorRole:  opts.actor?.role || '',
      action:     opts.action,
      entityType: opts.entityType || '',
      entityId:   opts.entityId || '',
      summary:    opts.summary,
      meta:       opts.meta || {},
    });
  } catch {
    // Swallow — the log is best-effort and must never break the operation.
  }
}
