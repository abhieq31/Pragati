import { redirect } from 'next/navigation';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { CsvActivity } from '@/models/CsvActivity';
import { serializeCsvActivity } from '@/lib/csvActivity';
import CsvActivityClient from './CsvActivityClient';

/**
 * CSV Activity tracker — a digital replacement for the IDP / CSV team's Excel
 * "CSV activity status" sheet. Lists every Change Control sheet; each opens
 * into an editable grid (formats down, the six validation-document stages
 * across).
 */
export default async function CsvActivityPage() {
  const jwt = await getCurrentUserFromCookie();
  if (!jwt) redirect('/login');

  await connectDB();
  const sheets = await CsvActivity.find().sort({ createdAt: -1 }).limit(200);
  const initial = sheets.map((s) => serializeCsvActivity(s));

  return <CsvActivityClient initialSheets={initial} />;
}
