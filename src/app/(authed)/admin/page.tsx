import { redirect } from 'next/navigation';
import { getCurrentUserFromCookie, isAdmin } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { Invite } from '@/models/Invite';
import { Project } from '@/models/Project';
import { Team } from '@/models/Team';
import { Task } from '@/models/Task';
import AdminConsole from './AdminConsole';

export const runtime = 'nodejs';

export default async function AdminPage() {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');
  if (!isAdmin(jwt.role)) redirect('/');

  await connectDB();

  const now = new Date();

  const [
    totalActive,
    leadCount,
    lockedUsers,
    lockedTotal,
    mustChangePw,
    pendingInvites,
    deactivatedCount,
    recentActivity,
    allUsers,
    allProjects,
    allTeams,
    totalProjects,
    totalTasks,
    recentFailedLogins,
  ] = await Promise.all([
    User.countDocuments({ active: { $ne: false } }),
    User.countDocuments({ role: { $in: ['lead', 'admin'] }, active: { $ne: false } }),
    User.find({ locked: true, active: { $ne: false } })
      .select('name username email lockedAt')
      .sort({ lockedAt: -1 })
      .limit(10)
      .lean(),
    // The list above is capped at 10 for the card preview, but the stat must
    // count EVERY locked account — otherwise an admin with >10 lockouts sees a
    // misleadingly low "10" and may miss accounts that need attention.
    User.countDocuments({ locked: true, active: { $ne: false } }),
    User.find({ mustChangePassword: true, active: { $ne: false } })
      .select('name username email createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Invite.countDocuments({
      consumedAt: null,
      revokedAt: null,
      expiresAt: { $gt: now },
    }),
    User.countDocuments({ active: false }),
    AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(12)
      .lean(),
    User.find({ active: { $ne: false } })
      .select('name username email role locked lockedAt createdAt mustChangePassword')
      .sort({ createdAt: -1 })
      .lean(),
    Project.find({ status: { $ne: 'archived' }, isPersonal: { $ne: true }, personal: { $ne: true } })
      .select('name code status priority ownerId createdAt')
      .sort({ createdAt: -1 })
      .lean(),
    Team.find({})
      .select('name memberIds createdAt')
      .lean(),
    Project.countDocuments({}),
    Task.countDocuments({}),
    AuditLog.countDocuments({
      action: 'auth.login_failed',
      createdAt: { $gte: new Date(Date.now() - 86400000) },
    }),
  ]);

  const serializeUser = (u: any) => ({
    id: String(u._id),
    name: u.name || '',
    username: u.username || '',
    email: u.email || '',
    role: u.role || 'contributor',
    locked: u.locked || false,
    lockedAt: u.lockedAt ? (u.lockedAt instanceof Date ? u.lockedAt.toISOString() : String(u.lockedAt)) : null,
    createdAt: u.createdAt ? (u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt)) : null,
    mustChangePassword: u.mustChangePassword || false,
  });

  return (
    <AdminConsole
      adminName={jwt.name}
      stats={{
        totalActive,
        leadCount,
        contributorCount: totalActive - leadCount,
        lockedCount: lockedTotal,
        pendingInvites,
        deactivatedCount,
        totalProjects,
        totalTasks,
        recentFailedLogins,
      }}
      lockedUsers={(lockedUsers as any[]).map(serializeUser)}
      mustChangePwUsers={(mustChangePw as any[]).map(serializeUser)}
      recentActivity={(recentActivity as any[]).map((r) => ({
        id: String(r._id),
        action: r.action || '',
        category: r.category || 'general',
        actorName: r.actorName || '',
        targetLabel: r.targetLabel || '',
        summary: r.summary || '',
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      }))}
      allUsers={(allUsers as any[]).map(serializeUser)}
      allProjects={(allProjects as any[]).map((p) => ({
        id: String(p._id),
        name: p.name || '',
        code: p.code || '',
        status: p.status || 'planning',
        priority: p.priority || 'medium',
        ownerId: p.ownerId ? String(p.ownerId) : null,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
      }))}
      allTeams={(allTeams as any[]).map((t) => ({
        id: String(t._id),
        name: t.name || '',
        memberCount: Array.isArray(t.memberIds) ? t.memberIds.length : 0,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
      }))}
    />
  );
}
