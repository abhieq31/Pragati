import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/models/Task';
import { Project } from '@/models/Project';
import { Team } from '@/models/Team';
import { User } from '@/models/User';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { getLeadScope } from '@/lib/leadScope';

export const runtime = 'nodejs';

// GET /api/me/calendar?from=<ISO>&to=<ISO>
// Read-only feed of open tasks DUE within [from, to], scoped to the signed-in
// user and the teams they lead or belong to. Powers the sidebar mini-calendar:
// a dot on every day that has work due, plus enough per-task detail for the
// hover popover. No persistent records are touched, so no Zod body schema is
// required (GxP audit trail is unaffected — this is a pure read).
//
// "Due" uses the same effective-due rule as the dashboards: the pharma Change
// Control Target Completion Date (ccTcd) takes precedence over a plain dueDate,
// so the calendar agrees with what each task page shows.
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await requireUser(req);
    if (error) return error;
    await connectDB();

    const userId = user.sub;
    const scope = await getLeadScope(userId);

    // Window — default to a generous ±45 day band around today when the caller
    // omits the range, so the first paint always has something to show.
    const now = new Date();
    const from = req.nextUrl.searchParams.get('from');
    const to = req.nextUrl.searchParams.get('to');
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const toDate = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth() + 2, 0);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 });
    }

    // Projects belonging to the user's teams (or owned by them). Used both to
    // widen the task scope beyond personally-assigned work and to label each
    // task with its team for the hover card. Select ccNo so the hover card can
    // show the project's reference number when set.
    const projects = await Project.find({
      $or: [{ teamId: { $in: scope.teamOids } }, { ownerId: scope.userOid }],
    })
      .select('_id code name teamId ccNo')
      .lean();

    const projMap = new Map(projects.map((p) => [String(p._id), p]));
    const projIds = projects.map((p) => p._id);

    const teams = await Team.find({ _id: { $in: scope.teamOids } })
      .select('_id name')
      .lean();
    const teamMap = new Map(teams.map((t) => [String(t._id), t.name]));

    // Open tasks due in-window that are either mine or live in a team project.
    const rangeMatch = { $gte: fromDate, $lte: toDate };
    const tasks = await Task.find({
      status: { $ne: 'done' },
      $and: [
        { $or: [{ assigneeId: scope.userOid }, { projectId: { $in: projIds } }] },
        { $or: [{ dueDate: rangeMatch }, { ccTcd: rangeMatch }] },
      ],
    })
      .select('_id title status dueDate ccTcd assigneeId projectId priority')
      .limit(500)
      .lean();

    // Resolve assignee names in one batch query rather than N individual lookups.
    const assigneeIds = [
      ...new Set((tasks as any[]).filter((t) => t.assigneeId).map((t) => String(t.assigneeId))),
    ];
    const nameMap = new Map<string, string>();
    if (assigneeIds.length > 0) {
      const assignees = await User.find({ _id: { $in: assigneeIds } })
        .select('_id name')
        .lean();
      for (const a of assignees as any[]) {
        nameMap.set(String(a._id), a.name);
      }
    }

    const out = [];
    for (const t of tasks as any[]) {
      const eff = t.ccTcd || t.dueDate;
      if (!eff) continue;
      const effDate = new Date(eff);
      if (effDate < fromDate || effDate > toDate) continue;
      const p = projMap.get(String(t.projectId));
      const teamName = p?.teamId ? teamMap.get(String(p.teamId)) : undefined;
      // Show ccNo when set (user-defined reference), otherwise fall back to
      // the auto-generated project code.
      const projectRef = (p as any)?.ccNo || (p as any)?.code || null;
      out.push({
        id: String(t._id),
        title: t.title,
        status: t.status,
        due: effDate.toISOString(),
        mine: String(t.assigneeId) === String(scope.userOid),
        assigneeName: t.assigneeId ? nameMap.get(String(t.assigneeId)) || null : null,
        teamName: teamName || null,
        projectRef,
        priority: t.priority || null,
      });
    }

    return NextResponse.json({ tasks: out });
  } catch (e) {
    return handleError(e);
  }
}
