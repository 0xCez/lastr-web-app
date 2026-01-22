import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnose() {
  console.log('======================');
  console.log('USERS & ROLES');
  console.log('======================\n');

  const { data: users } = await supabase
    .from('users')
    .select('id, email, role, full_name')
    .in('email', ['cesar@betaiapp.com', 'cesarpderey@gmail.com']);

  console.log('Users:', JSON.stringify(users, null, 2));

  console.log('\n======================');
  console.log('ACCOUNTS (Social Handles)');
  console.log('======================\n');

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, platform, handle');

  console.log('All accounts:', JSON.stringify(accounts, null, 2));

  console.log('\n======================');
  console.log('USER_ACCOUNTS (Ownership Links)');
  console.log('======================\n');

  const { data: userAccounts } = await supabase
    .from('user_accounts')
    .select(`
      user_id,
      account_id,
      users!inner(email),
      accounts!inner(handle, platform)
    `);

  console.log('Account ownership:', JSON.stringify(userAccounts, null, 2));

  console.log('\n======================');
  console.log('POSTS (Who submitted what)');
  console.log('======================\n');

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      url,
      status,
      submitted_by,
      account_id,
      users!posts_submitted_by_fkey(email),
      accounts!inner(handle, platform)
    `)
    .limit(20)
    .order('created_at', { ascending: false });

  console.log('Recent posts:', JSON.stringify(posts, null, 2));

  console.log('\n======================');
  console.log('RLS POLICIES');
  console.log('======================\n');

  // This will fail with anon key but shows what we're checking
  console.log('Check Supabase dashboard for RLS policies on:');
  console.log('- accounts (SELECT)');
  console.log('- user_accounts (SELECT)');
  console.log('- posts (SELECT)');
  console.log('- analytics (SELECT)');
}

diagnose().then(() => process.exit(0)).catch(console.error);
