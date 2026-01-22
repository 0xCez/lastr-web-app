/**
 * Send follow-up emails to inactive users
 * Run with: npx tsx scripts/send-followup-emails.ts
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

async function sendFollowupEmail(to: string, fullName: string): Promise<boolean> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-followup-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ to, fullName }),
  });
  return response.ok;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
  application_status: string | null;
}

async function main() {
  // Get approved UGC creators
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, application_status')
    .is('deleted_at', null)
    .eq('role', 'ugc_creator')
    .eq('application_status', 'approved');

  // Get onboarding checklist
  const { data: checklists } = await supabase
    .from('onboarding_checklist')
    .select('user_id, watched_tutorial_at');

  const checklistMap = new Map<string, { watched_tutorial_at: string | null }>();
  if (checklists) {
    checklists.forEach((c: { user_id: string; watched_tutorial_at: string | null }) => {
      checklistMap.set(c.user_id, c);
    });
  }

  // Filter inactive users (haven't watched tutorial)
  const inactive = (users as User[])?.filter((u) => {
    const checklist = checklistMap.get(u.id);
    return !checklist || !checklist.watched_tutorial_at;
  }) || [];

  console.log(`\n📧 Sending follow-up emails to ${inactive.length} users...\n`);

  let sent = 0;
  let failed = 0;

  for (const user of inactive) {
    const success = await sendFollowupEmail(user.email, user.full_name || 'there');
    if (success) {
      console.log(`✅ ${user.full_name} - ${user.email}`);
      sent++;
    } else {
      console.log(`❌ ${user.full_name} - ${user.email}`);
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`✅ Sent: ${sent} | ❌ Failed: ${failed}`);
  console.log(`════════════════════════════════════════\n`);
}

main().catch(console.error);
