import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPostAccounts() {
  console.log('Checking posts and their linked accounts...\n');

  // Query posts with account and user information
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      url,
      platform,
      account_id,
      submitted_by,
      created_at,
      accounts (
        id,
        handle,
        display_name,
        platform
      ),
      users:submitted_by (
        id,
        email,
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  console.log(`Found ${posts?.length || 0} posts:\n`);

  posts?.forEach((post, index) => {
    console.log(`--- Post ${index + 1} ---`);
    console.log(`Post ID: ${post.id}`);
    console.log(`URL: ${post.url}`);
    console.log(`Platform: ${post.platform}`);
    console.log(`Account ID: ${post.account_id || 'NULL'}`);
    console.log(`Submitted By: ${post.submitted_by}`);

    if (post.accounts) {
      console.log(`\nLinked Account:`);
      console.log(`  Handle: ${(post.accounts as any).handle}`);
      console.log(`  Display Name: ${(post.accounts as any).display_name}`);
      console.log(`  Platform: ${(post.accounts as any).platform}`);
    } else {
      console.log(`\nLinked Account: NONE (account_id is NULL or invalid)`);
    }

    if (post.users) {
      console.log(`\nSubmitted By User:`);
      console.log(`  Email: ${(post.users as any).email}`);
      console.log(`  Name: ${(post.users as any).full_name || 'Not set'}`);
    }

    console.log('\n');
  });

  // Check if there are any accounts in the database
  console.log('\n--- All Accounts in Database ---');
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*');

  if (accountsError) {
    console.error('Error fetching accounts:', accountsError);
  } else {
    console.log(`Found ${accounts?.length || 0} accounts:`);
    accounts?.forEach(account => {
      console.log(`  - ${account.platform}: @${account.handle} (${account.display_name})`);
    });
  }

  // Check user_accounts junction table
  console.log('\n--- User-Account Links ---');
  const { data: userAccounts, error: userAccountsError } = await supabase
    .from('user_accounts')
    .select(`
      *,
      users (email),
      accounts (handle, platform)
    `);

  if (userAccountsError) {
    console.error('Error fetching user_accounts:', userAccountsError);
  } else {
    console.log(`Found ${userAccounts?.length || 0} user-account links:`);
    userAccounts?.forEach(link => {
      console.log(`  - User: ${(link.users as any)?.email} → Account: @${(link.accounts as any)?.handle} (${(link.accounts as any)?.platform})`);
    });
  }
}

checkPostAccounts();
