import { redirect, notFound } from 'next/navigation';
import { getCurrentUserFromCookie } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { CsvActivity } from '@/models/CsvActivity';
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

  return <CsvSheetClient initialSheet={serializeCsvActivity(sheet)} />;
}
