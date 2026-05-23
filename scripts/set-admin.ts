/**
 * Promote a user to the single 'admin' super-role.
 *
 *   npx tsx scripts/set-admin.ts <email>
 *
 * The admin role unlocks unrestricted visibility (every team / project /
 * user) and reset-password access. There's intentionally only one admin
 * per workspace — running this against a different email simply moves the
 * flag; the previous admin is demoted to lead.
 *
 * Same effect as setting ADMIN_EMAIL=<that email> in env: the login route
 * auto-promotes the matching user on their next sign-in.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  if (!email) {
    console.error('usage: tsx scripts/set-admin.ts <email>');
    process.exit(1);
  }

  await connectDB();

  const target = await User.findOne({ email });
  if (!target) {
    console.error(`No user found with email ${email}.`);
    process.exit(1);
  }

  const previousAdmin = await User.findOne({ role: 'admin' });
  if (previousAdmin && String(previousAdmin._id) !== String(target._id)) {
    previousAdmin.role = 'lead' as any;
    await previousAdmin.save();
    console.log(`Demoted previous admin: ${previousAdmin.email} → lead`);
  }

  if (target.role === 'admin') {
    console.log(`${email} is already admin.`);
  } else {
    target.role = 'admin' as any;
    await target.save();
    console.log(`Promoted ${email} → admin.`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
