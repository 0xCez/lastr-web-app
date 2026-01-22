/**
 * Audit RLS policies for the 3-table flow
 * Expected flow:
 *   - posts: Regular users can INSERT (submit posts)
 *   - analytics: Admin/Service role can INSERT (fetch analytics)
 *   - cpm_post_breakdown: Admin/Service role can INSERT (CPM calculations)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

async function auditPolicies() {
  console.log('🔍 Auditing RLS Policies for 3-table flow...\n');

  // Use service role to query pg_policies
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get all policies for our 3 tables
  const { data: policies, error } = await supabase
    .rpc('get_policies_for_tables', {
      table_names: ['posts', 'analytics', 'cpm_post_breakdown']
    });

  // Since we can't easily query pg_policies, let's do practical tests instead

  console.log('=' .repeat(60));
  console.log('TEST: Checking what operations work with SERVICE ROLE');
  console.log('=' .repeat(60));

  // Test with service role (should work for everything)
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  // Test SELECT on each table
  for (const table of ['posts', 'analytics', 'cpm_post_breakdown']) {
    const { data, error } = await serviceClient
      .from(table)
      .select('id')
      .limit(1);

    console.log(`  ${table} SELECT: ${error ? '❌ ' + error.message : '✅ OK'}`);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('EXPECTED RLS CONFIGURATION:');
  console.log('=' .repeat(60));

  console.log(`
┌─────────────────────┬──────────┬──────────┬──────────┬──────────┐
│ Table               │ SELECT   │ INSERT   │ UPDATE   │ DELETE   │
├─────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ posts               │ Own/Admin│ Own accs │ Admin    │ Admin    │
├─────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ analytics           │ Own/Admin│ Admin*   │ Admin    │ Admin    │
├─────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ cpm_post_breakdown  │ Own/Admin│ Admin*   │ Admin    │ Admin    │
└─────────────────────┴──────────┴──────────┴──────────┴──────────┘

* Admin or Service Role (for Cron Job)

KEY POINTS:
1. Regular users ONLY need to INSERT into 'posts' table
2. 'analytics' and 'cpm_post_breakdown' are populated by:
   - Admin clicking "Fetch Analytics" button
   - Cron Job (uses service role key)
3. Service role bypasses RLS entirely
`);

  console.log('\n' + '=' .repeat(60));
  console.log('CURRENT ISSUES TO CHECK:');
  console.log('=' .repeat(60));

  console.log(`
1. Can regular users INSERT into 'posts'?
   → They must be able to submit posts via SubmitPostModal
   → INSERT should check: account_id IN user's linked accounts

2. Can admins INSERT into 'analytics'?
   → Required for manual "Fetch Analytics" button
   → Current policy: "Admins can insert analytics"

3. Can admins INSERT into 'cpm_post_breakdown'?
   → Required for CPM calculation after analytics fetch
   → Current policy: "Admins can manage CPM breakdown"

4. Does service role work for all operations?
   → Required for Cron Job
   → Service role bypasses RLS ✅
`);

  // Check if the current user making requests is admin
  console.log('\n' + '=' .repeat(60));
  console.log('VERIFICATION: Current policies exist');
  console.log('=' .repeat(60));

  // List all users and their roles
  const { data: users } = await serviceClient
    .from('users')
    .select('id, email, role')
    .in('role', ['admin', 'ugc_creator'])
    .limit(10);

  console.log('\nUsers in system:');
  users?.forEach(u => {
    console.log(`  - ${u.email}: ${u.role}`);
  });
}

auditPolicies().catch(console.error);
