import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';
import { requireUser, isAdmin } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { getLeadScope, projectsVisibleFilter } from '@/lib/leadScope';
import { logOperation } from '@/lib/audit';
import { bustDashboardCache } from '@/lib/leadDashboard';
import { bustProjectsPageCache } from '@/lib/projectList';

export const runtime = 'nodejs';

/**
 * DELETE /api/projects/[id]/phases/[phaseId]
 *
 * Removes one phase from a project. Destructive structure change, so it is
 * gated on PROJECT OWNERSHIP (plus workspace admins, who can already delete
 * the whole project) — leads who merely see the project may not reshape it.
 *
 * Tasks are never destroyed by removing a phase: anything still attached to
 * the phase is moved to the project's "Unphased" bucket so no work (or its
 * audit history) is lost.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; phaseId: string } },
) {
  try {
    const { error, user } = await requireUser(req);
    if (error) return error;
    await connectDB();

    const scope = await getLeadScope(user!.sub, user!.role);
    const project = await Project.findOne({ _id: params.id, ...projectsVisibleFilter(scope) })
      .select('_id name ownerId isPersonal code phases').lean();
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const ownsProject = String((project as any).ownerId) === user!.sub;
    if (!isAdmin(user!.role) && !ownsProject) {
      return NextResponse.json({ error: 'Only the project owner can delete phases.' }, { status: 403 });
    }

    const phase = ((project as any).phases || []).find((ph: any) => String(ph._id) === params.phaseId);
    if (!phase) return NextResponse.json({ error: 'Phase not found' }, { status: 404 });

    // Detach tasks first, then drop the phase — if the second write fails the
    // worst case is an empty phase, never an orphaned phaseId.
    const detached = await Task.updateMany(
      { projectId: params.id, phaseId: params.phaseId },
      { $set: { phaseId: null } },
    );
    await Project.updateOne({ _id: params.id }, { $pull: { phases: { _id: params.phaseId } } });

    const isShared = !((project as any).isPersonal || String((project as any).code || '').startsWith('PRSN-'));
    if (isShared) {
      await logOperation({
        action: 'project.phase.delete', category: 'project', actor: user,
        targetType: 'project', targetId: params.id, targetLabel: (project as any).name || '',
        summary: `Deleted phase "${phase.name}" (${detached.modifiedCount} task${detached.modifiedCount === 1 ? '' : 's'} moved to Unphased)`,
        meta: { phaseId: params.phaseId, phaseName: phase.name, tasksDetached: detached.modifiedCount },
      });
    }

    void bustDashboardCache(user!.sub, user!.role);
    void bustProjectsPageCache(user!.sub, user!.role);
    return NextResponse.json({ ok: true, tasksDetached: detached.modifiedCount });
  } catch (e) {
    return handleError(e);
  }
}
