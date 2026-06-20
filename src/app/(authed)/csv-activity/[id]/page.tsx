import { redirect, notFound } from 'next/navigation';
import { getCurrentUserFromCookie, isAdmin } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { CsvActivity } from '@/models/CsvActivity';
import { Team } from '@/models/Team';
import { serializeCsvActivity } from '@/lib/csvActivity';
import CsvSheetClient from './CsvSheetClient';

export default async function CsvSheetPage({ params }: { params: { id: string } }) {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');

  await connectDB();
  let sheet;
  try {
    sheet = await CsvActivity.findById(params.id);
  } catch {
    notFound();
  }
  if (!sheet) notFound();

  // Membership is the access boundary — only a member/lead of the owning team
  // (or an admin) may open the sheet.
  const team = await Team.findById(sheet.teamId).select('name leadId memberIds').lean();
  if (!team) notFound();
  const me = String(jwt.sub);
  const isMember =
    isAdmin(jwt.role) ||
    String((team as any).leadId || '') === me ||
    ((team as any).memberIds || []).some((m: any) => String(m) === me);
  if (!isMember) notFound();

  return (
    <CsvSheetClient initialSheet={serializeCsvActivity(sheet)} teamName={(team as any).name || 'Team'} />
  );
}
