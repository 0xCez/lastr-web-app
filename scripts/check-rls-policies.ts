/**
 * Debug script to check RLS policies on analytics and cpm_post_breakdown tables
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPolicies() {
  console.log('🔍 Checking RLS policies...\n');

  // Query pg_policies for our tables
  const { data: policies, error } = await supabase
    .rpc('check_policies', {})
    .select('*');

  // Since we can't run arbitrary SQL, let's check what we can insert

  console.log('='.repeat(60));
  console.log('TEST 1: Check if we can read from cpm_post_breakdown');
  console.log('='.repeat(60));

  const { data: cpmData, error: cpmError } = await supabase
    .from('cpm_post_breakdown')
    .select('*')
    .limit(5);

  if (cpmError) {
    console.log('❌ Error reading cpm_post_breakdown:', cpmError.message);
  } else {
    console.log('✅ Successfully read cpm_post_breakdown');
    console.log(`   Found ${cpmData?.length || 0} records`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Check if we can read from analytics');
  console.log('='.repeat(60));

  const { data: analyticsData, error: analyticsError } = await supabase
    .from('analytics')
    .select('*')
    .limit(5);

  if (analyticsError) {
    console.log('❌ Error reading analytics:', analyticsError.message);
  } else {
    console.log('✅ Successfully read analytics');
    console.log(`   Found ${analyticsData?.length || 0} records`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: List all posts and their status');
  console.log('='.repeat(60));

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      id,
      status,
      url,
      created_at,
      accounts!posts_account_id_fkey (
        handle,
        platform
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (postsError) {
    console.log('❌ Error reading posts:', postsError.message);
  } else {
    console.log('Posts with their status:');
    posts?.forEach(p => {
      const acc = p.accounts as any;
      console.log(`  - [${p.status}] @${acc?.handle || 'unknown'} (${acc?.platform || '?'}) - ${p.id.slice(0, 8)}...`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Check CPM breakdown by post');
  console.log('='.repeat(60));

  // For each post, check if it has CPM breakdown records
  for (const post of posts || []) {
    const { data: cpm, error: cpmErr } = await supabase
      .from('cpm_post_breakdown')
      .select('date, views_delta, cpm_earned')
      .eq('post_id', post.id)
      .order('date', { ascending: false })
      .limit(3);

    const { data: analytics, error: analyticsErr } = await supabase
      .from('analytics')
      .select('views, fetched_at')
      .eq('post_id', post.id)
      .order('fetched_at', { ascending: false })
      .limit(1);

    const acc = post.accounts as any;
    const latestViews = analytics?.[0]?.views || 'N/A';
    const cpmCount = cpm?.length || 0;
    const latestCPM = cpm?.[0]?.cpm_earned || 0;

    if (cpmCount === 0 && post.status === 'approved') {
      console.log(`⚠️  @${acc?.handle} [${post.status}] - Views: ${latestViews}, CPM Records: ${cpmCount} <- MISSING CPM!`);
    } else {
      console.log(`   @${acc?.handle} [${post.status}] - Views: ${latestViews}, CPM Records: ${cpmCount}, Latest CPM: $${latestCPM}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  // Count approved posts with and without CPM
  const approvedPosts = posts?.filter(p => p.status === 'approved') || [];
  let withCPM = 0;
  let withoutCPM = 0;

  for (const post of approvedPosts) {
    const { data: cpm } = await supabase
      .from('cpm_post_breakdown')
      .select('id')
      .eq('post_id', post.id)
      .limit(1);

    if (cpm && cpm.length > 0) {
      withCPM++;
    } else {
      withoutCPM++;
    }
  }

  console.log(`Total approved posts: ${approvedPosts.length}`);
  console.log(`  - With CPM data: ${withCPM}`);
  console.log(`  - Without CPM data: ${withoutCPM} <- These need investigation!`);
}

checkPolicies().catch(console.error);
