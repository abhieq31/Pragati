import { Notification } from '@/models/Notification';
import { User } from '@/models/User';

/**
 * Fire-and-forget notification creation, called from API routes after an
 * event (task assigned, task done, …). Never throws into the caller — a
 * failed notification must not fail the action that triggered it.
 *
 * Self-notifications are skipped: there's no point telling you about an
 * action you just took yourself (pass `actorId` to suppress).
 */
export async function notify(opts: {
  userId: string; // recipient
  actorId?: string; // who caused it (skip if same as recipient)
  type?: 'task_assigned' | 'task_done' | 'task_waiting' | 'general';
  title: string;
  body?: string;
  taskId?: string;
  projectId?: string;
  // When set, the recipient's matching preference flag on User is checked
  // before creating the notification — if it's explicitly false, the
  // notification is skipped entirely.
  preferenceKey?: 'notifTaskAssigned' | 'notifTaskDueSoon' | 'notifTaskOverdue' | 'notifProjectUpdate';
}): Promise<void> {
  try {
    if (!opts.userId) return;
    if (opts.actorId && String(opts.actorId) === String(opts.userId)) return;
    if (opts.preferenceKey) {
      const recipient = await User.findById(opts.userId).select(opts.preferenceKey).lean();
      if (recipient && (recipient as any)[opts.preferenceKey] === false) return;
    }
    await Notification.create({
      userId: opts.userId,
      type: opts.type || 'general',
      title: opts.title,
      body: opts.body || '',
      taskId: opts.taskId,
      projectId: opts.projectId,
    });
  } catch {
    // Swallow — notifications are best-effort.
  }
}
