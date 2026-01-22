import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uziactaapbzrqxazhpts.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function countRows(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) return `error: ${error.message}`;
  return count;
}

async function deleteAll(table, whereClause = null) {
  let query = supabase.from(table).delete();

  if (whereClause) {
    query = query.neq(whereClause.column, whereClause.value);
  } else {
    // Delete all - need to use a filter that matches all rows
    query = query.gte('id', '00000000-0000-0000-0000-000000000000');
  }

  const { error, count } = await query;
  if (error) {
    console.error(`  ❌ ${table}: ${error.message}`);
    return false;
  }
  console.log(`  ✓ ${table} deleted`);
  return true;
}

async function main() {
  console.log('🔍 Current data counts:');

  const tables = [
    'users', 'accounts', 'user_accounts', 'posts', 'analytics',
    'contracts', 'notifications', 'cpm_payments', 'cpm_post_breakdown', 'failed_posts_queue'
  ];

  for (const table of tables) {
    const count = await countRows(table);
    console.log(`  ${table}: ${count}`);
  }

  console.log('\n🗑️  Deleting data in foreign key order...');

  // Delete in order (children first)
  await deleteAll('failed_posts_queue');
  await deleteAll('cpm_post_breakdown');
  await deleteAll('cpm_payments');
  await deleteAll('analytics');
  await deleteAll('notifications');
  await deleteAll('posts');
  await deleteAll('contracts');
  await deleteAll('user_accounts');
  await deleteAll('accounts');

  // Delete users except admin
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .neq('email', 'cesar@betaiapp.com');

  if (userError) {
    console.error(`  ❌ users: ${userError.message}`);
  } else {
    console.log('  ✓ users (except admin) deleted');
  }

  console.log('\n✅ Final counts after cleanup:');
  for (const table of tables) {
    const count = await countRows(table);
    console.log(`  ${table}: ${count}`);
  }

  // Verify admin exists
  const { data: admin } = await supabase
    .from('users')
    .select('email, role')
    .eq('email', 'cesar@betaiapp.com')
    .single();

  if (admin) {
    console.log(`\n👤 Admin preserved: ${admin.email} (${admin.role})`);
  } else {
    console.error('\n❌ Admin user not found!');
  }
}

main().catch(console.error);
