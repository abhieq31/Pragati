/**
 * Seed an example tracker sheet to demonstrate the generic, configurable QMS
 * module. This particular example configures the sheet's columns as a six-step
 * validation workflow and fills a few rows — but the columns are just data: any
 * team can define their own.
 *
 * Idempotent: re-running replaces the sheet with the same reference.
 *
 *   npm run seed:csv-activity
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db';
import { User } from '../src/models/User';
import { Team } from '../src/models/Team';
import { CsvActivity } from '../src/models/CsvActivity';
import { normalizeRows } from '../src/lib/csvActivity';
import type { StageDef } from '../src/lib/csvStages';

type S = 'done' | 'pending' | 'na';
const cell = (key: string, ref: string, date: string | null, status: S) => ({
  key,
  ref,
  date,
  status,
});

// This example sheet's columns — a validation workflow. Any team can rename,
// add, or remove these from the sheet UI.
const STAGES: StageDef[] = [
  { key: 'cs', label: 'CS' },
  { key: 'cdd_val', label: 'CDD (Val)' },
  { key: 'oq', label: 'OQ' },
  { key: 'cdd_prod', label: 'CDD (Prod)' },
  { key: 'vsr', label: 'VSR' },
  { key: 'shf', label: 'SHF' },
];

// The first four items share one documentation set (26P258), all approved.
const set258 = () => [
  cell('cs', 'DCSV\\C\\26P258\\Doc\\001 - 00', '23/04/2026', 'done'),
  cell('cdd_val', 'DCSV\\C\\26P258\\CDD\\001 - 00', '24/04/2026', 'done'),
  cell('oq', 'DCSV\\C\\26P258\\OQTS\\001 - 00', '28/04/2026', 'done'),
  cell('cdd_prod', 'DCSV\\C\\26P258\\CDD\\002 - 00', '09/05/2026', 'done'),
  cell('vsr', 'DCSV\\C\\26P258\\VSR\\001 - 00', '11/05/2026', 'done'),
  cell('shf', 'DCSV\\C\\26P258\\Doc\\002-00', '12/05/2026', 'done'),
];

const rows = [
  {
    ref: 'F4\\QA\\SOP\\0004-F005',
    name: 'Log book for numbering of drain point',
    note: 'F4',
    stages: set258(),
  },
  {
    ref: 'F4\\QA\\SOP\\0004-F002',
    name: 'Log book for numbering of rooms/ utility user points/instruments',
    note: 'F4',
    stages: set258(),
  },
  {
    ref: 'F4\\QA\\SOP\\0003-F001',
    name: 'Equipment / instrument ID number log',
    note: 'F4',
    stages: set258(),
  },
  {
    ref: 'F1\\QA\\SOP\\0019-F003',
    name: 'Log book for Equipment / Instrument ID Assigning',
    note: 'F1',
    stages: set258(),
  },
  {
    ref: 'F5\\QC\\SOP\\0040-F002',
    name: 'Validated Calculation Spreadsheet',
    note: 'F5',
    stages: [
      cell('cs', 'DCSV\\C\\26P338\\Doc\\001 - 00', '16/05/2026', 'done'),
      cell('cdd_val', 'DCSV\\C\\26P339\\CDD\\001 - 00', '26/05/2026', 'done'),
      cell('oq', 'DCSV\\C\\26P338\\OQTS\\001 - 00', '30/05/2026', 'done'),
      cell('cdd_prod', '', null, 'pending'),
      cell('vsr', '', null, 'pending'),
      cell('shf', '', null, 'pending'),
    ],
  },
  {
    ref: 'F1\\QC\\SOP\\0038-F004',
    name: 'Record of Differential pressure of Dynamic pass box',
    note: 'F1',
    stages: [
      cell('cs', 'DCSV\\C\\26P338\\Doc\\001 - 00', '16/05/2026', 'done'),
      cell('cdd_val', 'DCSV\\C\\26P339\\CDD\\001 - 00', '26/05/2026', 'done'),
      cell('oq', 'DCSV\\C\\26P338\\OQTS\\001 - 00', '30/05/2026', 'done'),
      cell('cdd_prod', '', null, 'pending'),
      cell('vsr', '', null, 'pending'),
      cell('shf', '', null, 'pending'),
    ],
  },
  {
    ref: 'C\\QA\\SOP\\0037-F038',
    name: 'API Vendor Notification log',
    note: 'A1, A2, A3',
    stages: [
      cell('cs', 'DCSV\\C\\26P337\\Doc\\001 - 00', '16/05/2026', 'done'),
      cell('cdd_val', 'DCSV\\C\\26P339\\CDD\\001 - 00', '26/05/2026', 'done'),
      cell('oq', 'DCSV\\C\\26P337\\OQTS\\001 - 00', '30/05/2026', 'done'),
      cell('cdd_prod', '', null, 'pending'),
      cell('vsr', '', null, 'pending'),
      cell('shf', '', null, 'pending'),
    ],
  },
  {
    ref: 'Revision',
    name: 'Issuance of Formats',
    note: 'F1, F2, F3, F4, F5, A1, A2, A3',
    stages: [
      cell('cs', 'DCSV\\C\\26P340\\Doc\\001 - 00', '18/06/2026', 'done'),
      cell('cdd_val', 'DCSV\\C\\26P340\\CDD\\001 - 00', null, 'done'),
      cell('oq', '', null, 'na'),
      cell('cdd_prod', '', null, 'pending'),
      cell('vsr', '', null, 'na'),
      cell('shf', '', null, 'na'),
    ],
  },
  {
    ref: 'Revision',
    name: 'CQA CAPA Tracker log',
    note: 'CQA',
    stages: [
      cell('cs', 'DCSV\\C\\26P339\\Doc\\001 - 00', '16/05/2026', 'done'),
      cell('cdd_val', 'DCSV\\C\\26P339\\CDD\\001 - 00', '26/05/2026', 'done'),
      cell('oq', 'DCSV\\C\\26P339\\OQTS\\001 - 00', '30/05/2026', 'done'),
      cell('cdd_prod', '', null, 'pending'),
      cell('vsr', '', null, 'na'),
      cell('shf', '', null, 'na'),
    ],
  },
];

async function main() {
  await connectDB();
  const REFERENCE = 'C/CC/PCC/2026/0765';

  const owner =
    (await User.findOne({ role: { $in: ['master_admin', 'admin', 'lead'] } }, '_id name').lean()) ||
    (await User.findOne({}, '_id name').lean());
  if (!owner) {
    console.error('[seed:csv-activity] No users found — seed users first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  const ownerId = (owner as any)._id;

  // Tracker sheets live inside a team's QMS module. Attach to an existing team
  // the owner can see (preferring one that already has QMS on), else create a
  // dedicated team with QMS enabled.
  let team =
    (await Team.findOne({ 'modules.qms.enabled': true })) ||
    (await Team.findOne({ $or: [{ leadId: ownerId }, { memberIds: ownerId }] })) ||
    (await Team.findOne({}));
  if (!team) {
    team = await Team.create({
      name: 'Quality Team',
      description: 'Tracks records through a configurable workflow.',
      leadId: ownerId,
      memberIds: [ownerId],
      function: 'general',
      modules: { qms: { enabled: true }, tickets: { enabled: true } },
    });
  } else if (!team.modules?.qms?.enabled) {
    team.modules = {
      qms: { enabled: true },
      tickets: { enabled: team.modules?.tickets?.enabled ?? false },
    } as any;
    await team.save();
  }

  await CsvActivity.deleteMany({ reference: REFERENCE, teamId: team._id });
  const sheet = await CsvActivity.create({
    teamId: team._id,
    reference: REFERENCE,
    reference2: '108743',
    title: 'Example tracker — validation workflow',
    stages: STAGES,
    createdBy: ownerId,
    createdByName: (owner as any).name || '',
    rows: normalizeRows(rows, STAGES),
  });

  console.log(
    `[seed:csv-activity] Created ${REFERENCE} with ${sheet.rows.length} items on team "${team.name}".`,
  );
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
