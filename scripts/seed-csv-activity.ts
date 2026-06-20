/**
 * Seed the example CSV Activity sheet from the IDP team's change control
 * C/CC/PCC/2026/0765 (PR 108743) — transcribed verbatim from the status email
 * so the team opens the tracker with their real data already in.
 *
 * Idempotent: re-running replaces the sheet with the same change-control number.
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

type S = 'done' | 'pending' | 'na';
const cell = (key: string, docNo: string, date: string | null, status: S) => ({
  key,
  docNo,
  approvalDate: date,
  status,
});

// The first four formats share one documentation set (26P258), all approved.
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
    formatNumber: 'F4\\QA\\SOP\\0004-F005',
    formatTitle: 'Log book for numbering of drain point',
    elogbookTitle: 'Log book for numbering of drain point',
    sites: 'F4',
    stages: set258(),
  },
  {
    formatNumber: 'F4\\QA\\SOP\\0004-F002',
    formatTitle: 'Log book for numbering of rooms/ utility user points/instruments',
    elogbookTitle: 'Log book for numbering of rooms/ utility user points/instruments',
    sites: 'F4',
    stages: set258(),
  },
  {
    formatNumber: 'F4\\QA\\SOP\\0003-F001',
    formatTitle: 'Equipment / instrument ID number log',
    elogbookTitle: 'Equipment / instrument ID number log',
    sites: 'F4',
    stages: set258(),
  },
  {
    formatNumber: 'F1\\QA\\SOP\\0019-F003',
    formatTitle: 'Log book for Equipment / Instrument ID Assigning',
    elogbookTitle: 'Log book for Equipment / Instrument ID Assigning',
    sites: 'F1',
    stages: set258(),
  },
  {
    formatNumber: 'F5\\QC\\SOP\\0040-F002',
    formatTitle: 'Validated Calculation Spreadsheet',
    elogbookTitle: 'Validated Calculation Spreadsheet',
    sites: 'F5',
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
    formatNumber: 'F1\\QC\\SOP\\0038-F004',
    formatTitle: 'Record of Differential pressure of Dynamic pass box',
    elogbookTitle: 'Record of Differential pressure of Dynamic pass box',
    sites: 'F1',
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
    formatNumber: 'C\\QA\\SOP\\0037-F038',
    formatTitle: 'API Vendor Notification',
    elogbookTitle: 'API Vendor Notification log',
    sites: 'A1, A2, A3',
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
    formatNumber: 'Revision',
    formatTitle: 'Issuance of Formats',
    elogbookTitle: 'Issuance of Formats',
    sites: 'F1, F2, F3, F4, F5, A1, A2, A3',
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
    formatNumber: 'Revision',
    formatTitle: 'CQA CAPA Tracker log',
    elogbookTitle: 'CQA CAPA Tracker log',
    sites: 'CQA',
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
  const CHANGE_CONTROL = 'C/CC/PCC/2026/0765';

  const owner =
    (await User.findOne({ role: { $in: ['master_admin', 'admin', 'lead'] } }, '_id name').lean()) ||
    (await User.findOne({}, '_id name').lean());
  if (!owner) {
    console.error('[seed:csv-activity] No users found — seed users first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  const ownerId = (owner as any)._id;

  // CSV Activity now lives inside a team's QMS module. Attach to an existing
  // team the owner can see (preferring one that already has QMS on), else
  // create a dedicated IDP team with QMS enabled.
  let team =
    (await Team.findOne({ 'modules.qms.enabled': true })) ||
    (await Team.findOne({ $or: [{ leadId: ownerId }, { memberIds: ownerId }] })) ||
    (await Team.findOne({}));
  if (!team) {
    team = await Team.create({
      name: 'IDP / CSV Team',
      description: 'Computer System Validation activity tracking.',
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

  await CsvActivity.deleteMany({ changeControlNo: CHANGE_CONTROL, teamId: team._id });
  const sheet = await CsvActivity.create({
    teamId: team._id,
    changeControlNo: CHANGE_CONTROL,
    prNo: '108743',
    title: 'CSV activity status — IDP team',
    createdBy: ownerId,
    createdByName: (owner as any).name || '',
    rows: normalizeRows(rows),
  });

  console.log(
    `[seed:csv-activity] Created ${CHANGE_CONTROL} with ${sheet.rows.length} formats on team "${team.name}".`,
  );
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
