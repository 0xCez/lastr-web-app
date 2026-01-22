/**
 * Check for users who haven't watched the welcome/tutorial message
 * Run with: npx tsx scripts/check-unwatched-tutorial.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Get all UGC creators
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, email, role, created_at, application_status')
    .is('deleted_at', null)
    .eq('role', 'ugc_creator')
    .order('created_at', { ascending: false });

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  // Get onboarding checklist data (watched_tutorial_at is here)
  const { data: checklists, error: checklistError } = await supabase
    .from('onboarding_checklist')
    .select('user_id, watched_tutorial_at');

  if (checklistError) {
    console.error('Error fetching checklists:', checklistError);
  }

  const checklistMap = new Map<string, { watched_tutorial_at: string | null }>();
  if (checklists) {
    checklists.forEach((c: { user_id: string; watched_tutorial_at: string | null }) => {
      checklistMap.set(c.user_id, c);
    });
  }

  console.log('═'.repeat(90));
  console.log("📭 UGC CREATORS WHO HAVEN'T WATCHED THE WELCOME/TUTORIAL");
  console.log('═'.repeat(90));
  console.log('');

  interface User {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
    created_at: string;
    application_status: string | null;
  }

  const unwatched = (users as User[])?.filter((u) => {
    const checklist = checklistMap.get(u.id);
    return !checklist || !checklist.watched_tutorial_at;
  }) || [];

  console.log(`Total: ${unwatched.length} users\n`);
  console.log('─'.repeat(90));
  console.log(
    'Name'.padEnd(25) +
    'Email'.padEnd(35) +
    'Status'.padEnd(12) +
    'Registered'
  );
  console.log('─'.repeat(90));

  unwatched.forEach((u) => {
    const name = (u.full_name || 'N/A').substring(0, 24).padEnd(25);
    const email = u.email.substring(0, 34).padEnd(35);
    const status = (u.application_status || 'N/A').substring(0, 11).padEnd(12);
    const registered = new Date(u.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    console.log(name + email + status + registered);
  });

  // Show those who HAVE watched
  const watched = (users as User[])?.filter((u) => {
    const checklist = checklistMap.get(u.id);
    return checklist && checklist.watched_tutorial_at;
  }) || [];

  console.log('');
  console.log('═'.repeat(90));
  console.log(`✅ Users who HAVE watched the tutorial: ${watched.length}`);
  console.log('═'.repeat(90));

  if (watched.length > 0) {
    console.log('');
    watched.forEach((u) => {
      const name = (u.full_name || 'N/A').substring(0, 24).padEnd(25);
      const email = u.email.substring(0, 34).padEnd(35);
      console.log(name + email);
    });
  }
}

main().catch(console.error);
