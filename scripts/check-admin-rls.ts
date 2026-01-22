/**
 * Diagnostic script to check admin RLS policies
 * Run this to see what policies are currently active in the database
 */

import { supabase } from '../src/lib/supabase.js';

async function checkAdminRLS() {
  console.log('🔍 Checking RLS Policies for Admin Access...\n');

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ Not authenticated');
    return;
  }

  console.log(`👤 Current User: ${user.email}`);

  // Check user role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, email')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('❌ Error fetching user role:', userError.message);
  } else {
    console.log(`📋 Role: ${userData?.role || 'unknown'}`);
  }

  console.log('\n--- Testing Data Access ---\n');

  // Test 1: Can we see all users?
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, email, role')
    .limit(5);

  console.log('1️⃣ USERS table:');
  if (usersError) {
    console.error('   ❌ Error:', usersError.message);
  } else {
    console.log(`   ✅ Can see ${allUsers?.length || 0} users`);
    allUsers?.forEach(u => console.log(`      - ${u.email} (${u.role})`));
  }

  // Test 2: Can we see all accounts?
  const { data: allAccounts, error: accountsError } = await supabase
    .from('accounts')
    .select('id, platform, handle')
    .limit(5);

  console.log('\n2️⃣ ACCOUNTS table:');
  if (accountsError) {
    console.error('   ❌ Error:', accountsError.message);
  } else {
    console.log(`   ✅ Can see ${allAccounts?.length || 0} accounts`);
    allAccounts?.forEach(a => console.log(`      - ${a.handle} (${a.platform})`));
  }

  // Test 3: Can we see all user_accounts links?
  const { data: allUserAccounts, error: userAccountsError } = await supabase
    .from('user_accounts')
    .select(`
      id,
      user_id,
      account_id,
      accounts:account_id (handle, platform),
      users:user_id (email)
    `)
    .limit(10);

  console.log('\n3️⃣ USER_ACCOUNTS table (account links):');
  if (userAccountsError) {
    console.error('   ❌ Error:', userAccountsError.message);
  } else {
    console.log(`   ✅ Can see ${allUserAccounts?.length || 0} links`);
    allUserAccounts?.forEach((ua: any) => {
      console.log(`      - ${ua.users?.email || 'unknown'} → ${ua.accounts?.handle || 'unknown'} (${ua.accounts?.platform || 'unknown'})`);
    });
  }

  // Test 4: Can we see all posts?
  const { data: allPosts, error: postsError } = await supabase
    .from('posts')
    .select('id, url, platform, submitted_by, status')
    .limit(5);

  console.log('\n4️⃣ POSTS table:');
  if (postsError) {
    console.error('   ❌ Error:', postsError.message);
  } else {
    console.log(`   ✅ Can see ${allPosts?.length || 0} posts`);
    allPosts?.forEach(p => console.log(`      - ${p.url} (${p.status})`));
  }

  // Test 5: Can we see CPM breakdown for all users?
  const { data: allCPM, error: cpmError } = await supabase
    .from('cpm_post_breakdown')
    .select('id, user_id, post_id, cpm_earned')
    .limit(5);

  console.log('\n5️⃣ CPM_POST_BREAKDOWN table:');
  if (cpmError) {
    console.error('   ❌ Error:', cpmError.message);
  } else {
    console.log(`   ✅ Can see ${allCPM?.length || 0} CPM records`);
  }

  console.log('\n--- Summary ---');
  console.log('If you are admin and any tests show errors or limited data,');
  console.log('there is an RLS policy blocking admin access.');
}

checkAdminRLS().catch(console.error);
