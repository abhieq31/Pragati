/**
 * Bootstrap / recovery: set a password for any account directly from the CLI.
 * Use this when you need to (re)gain access to an account but can't go through
 * the in-app reset flow — e.g. the founding admin who hasn't logged in yet,
 * or any lead who has lost their password and there is no other admin online
 * to reset it for them.
 *
 *   MONGODB_URI="<prod-uri>" npx tsx scripts/set-password.ts <email> <new-password>
 *
 * The account is also flagged `mustChangePassword: true` so the next sign-in
 * forces a fresh password — the value you type on the command line never
 * becomes the long-term credential, which keeps the audit trail honest.
 *
 * Combine with ADMIN_EMAIL=<email> (or `npm run set-admin <email>`) to grant
 * the admin super-role to the same account.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

async function main() {
  const email = process.argv[2]?.toLowerCase().trim();
  const password = process.argv[3];
  if (!email || !password) {
    console.error('usage: tsx scripts/set-password.ts <email> <new-password>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found with email ${email}.`);
    console.error('Sign up first via /signup, then re-run this script.');
    process.exit(1);
  }

  user.passwordHash = bcrypt.hashSync(password, 10);
  user.mustChangePassword = true;
  await user.save();

  console.log(`\n✓ Password set for ${email}.`);
  console.log(`  Role: ${user.role}`);
  console.log(`  mustChangePassword: true — next login will prompt for a new password.`);
  if (user.role !== 'admin') {
    console.log(`\nTo also grant admin: npx tsx scripts/set-admin.ts ${email}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
