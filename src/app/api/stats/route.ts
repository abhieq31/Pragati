import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleError } from '@/lib/http';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Project } from '@/models/Project';
import { Task } from '@/models/Task';
import { Application } from '@/models/Application';

export const runtime = 'nodejs';

// Lightweight tiles for "is this a fresh install?" detection. The landing page
// uses these to decide whether to show a first-run wizard or the normal dashboard.
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireUser(req);
    if (error) return error;
    await connectDB();
    const [users, teams, applications, projects, tasks] = await Promise.all([
      User.countDocuments(),
      Team.countDocuments(),
      Application.countDocuments(),
      Project.countDocuments(),
      Task.countDocuments()
    ]);
    return NextResponse.json({ users, teams, applications, projects, tasks });
  } catch (e) {
    return handleError(e);
  }
}
