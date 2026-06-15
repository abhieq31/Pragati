import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { requireRole } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { task as taskS } from '@/lib/serialize';
import { logOperation } from '@/lib/audit';
import { recordTaskFlowEvent } from '@/lib/flow/events';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error, user } = await requireRole(req, 'lead', 'admin');
    if (error) return error;
    await connectDB();
    const t = await Task.findById(params.id);
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!t.requiresQaSignoff)
      return NextResponse.json({ error: 'Task does not require QA sign-off' }, { status: 400 });
    // An e-signature is a one-time, attributable act — never overwrite an
    // existing one (21 CFR Part 11 §11.70 signature/record linking).
    if ((t as any).qaSignoffAt)
      return NextResponse.json({ error: 'This task has already been signed off' }, { status: 409 });

    // Capture the meaning of the signature (21 CFR Part 11 §11.50). The client
    // may post { reason }; we never require it, but we record whatever is given
    // (defaulting to a clear default meaning) in the immutable audit trail.
    const body = await req.json().catch(() => ({}) as any);
    const reason =
      (typeof body?.reason === 'string' && body.reason.trim()) || 'QA sign-off — reviewed and approved';

    // Atomic conditional write: only the FIRST signer wins, even if two leads
    // sign the same task in the same instant. A load-modify-save would let the
    // later save silently overwrite the earlier signer's attribution.
    const signedAt = new Date();
    const res = await Task.updateOne(
      { _id: params.id, qaSignoffAt: null },
      { $set: { qaSignoffUserId: user.sub, qaSignoffAt: signedAt } },
    );
    if (res.matchedCount === 0)
      return NextResponse.json({ error: 'This task has already been signed off' }, { status: 409 });
    // Reflect the win on the in-memory doc for the response + audit payload.
    t.qaSignoffUserId = user.sub as any;
    t.qaSignoffAt = signedAt;

    void recordTaskFlowEvent({
      taskId: params.id,
      projectId: String((t as any).projectId || ''),
      eventType: 'signoff_completed',
      actorId: user.sub,
      occurredAt: signedAt,
      taskType: (t as any)?.taskType || undefined,
    });

    // §11.10(e): the act of signing a GxP record MUST produce an immutable,
    // attributable audit entry (who / what / when / meaning). Fire-and-forget.
    await logOperation({
      action: 'task.signoff',
      category: 'task',
      actor: user,
      targetType: 'task',
      targetId: params.id,
      targetLabel: (t as any).title || '',
      summary: `QA signed off "${(t as any).title || 'task'}"`,
      meta: {
        meaning: reason,
        signedBy: user.name || user.sub,
        signedAt: signedAt.toISOString(),
        gxpCritical: !!(t as any).gxpCritical,
        before: { signed: false },
        after: { signed: true, qaSignoffUserId: String(user.sub) },
      },
    });

    return NextResponse.json(taskS(t));
  } catch (e) {
    return handleError(e);
  }
}
