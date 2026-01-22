import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDatabase() {
  console.log('Checking accounts...\n');

  // Get accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*')
    .limit(10);

  if (accountsError) {
    console.error('Error fetching accounts:', accountsError);
  } else {
    console.log('Accounts:', JSON.stringify(accounts, null, 2));
  }

  console.log('\n======================\n');
  console.log('Checking user_accounts linkage...\n');

  // Get user_accounts
  const { data: userAccounts, error: userAccountsError } = await supabase
    .from('user_accounts')
    .select('*')
    .limit(10);

  if (userAccountsError) {
    console.error('Error fetching user_accounts:', userAccountsError);
  } else {
    console.log('User-Account linkages:', JSON.stringify(userAccounts, null, 2));
  }

  console.log('\n======================\n');
  console.log('Checking recent posts...\n');

  // Get recent posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, created_at, status, submitted_by, account_id')
    .order('created_at', { ascending: false })
    .limit(10);

  if (postsError) {
    console.error('Error fetching posts:', postsError);
  } else {
    console.log('Recent posts:', JSON.stringify(posts, null, 2));
  }
}

checkDatabase().then(() => process.exit(0));
