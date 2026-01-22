/**
 * Fix the incorrect CPM record for maxime_perf
 * Correct calculation: 2573 views × $1.50/1000 = $3.86
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CPM_RATE = 1.5; // $1.50 per 1000 views

async function fixMaximeCPM() {
  console.log('🔧 Fixing maxime_perf CPM record...\n');

  // 1. Find the maxime_perf account
  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('handle', 'maxime_perf')
    .single();

  if (!account) {
    console.log('❌ Account not found');
    return;
  }

  console.log(`Found account: ${account.id}`);

  // 2. Find the post
  const { data: post } = await supabase
    .from('posts')
    .select('id, submitted_by, created_at, status')
    .eq('account_id', account.id)
    .single();

  if (!post) {
    console.log('❌ Post not found');
    return;
  }

  console.log(`Found post: ${post.id} (status: ${post.status})`);

  // 3. Get the latest analytics for this post
  const { data: analytics } = await supabase
    .from('analytics')
    .select('views, fetched_at')
    .eq('post_id', post.id)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (!analytics) {
    console.log('❌ No analytics found');
    return;
  }

  console.log(`Latest analytics: ${analytics.views} views (fetched: ${analytics.fetched_at})`);

  // 4. Delete the incorrect CPM record
  const { error: deleteError } = await supabase
    .from('cpm_post_breakdown')
    .delete()
    .eq('post_id', post.id);

  if (deleteError) {
    console.log('❌ Error deleting old record:', deleteError.message);
    return;
  }

  console.log('✅ Deleted old incorrect CPM record');

  // 5. Calculate correct CPM
  const views = analytics.views;
  const cpmEarned = (views / 1000) * CPM_RATE;
  const today = new Date().toISOString().split('T')[0];

  // Calculate post age
  const postCreated = new Date(post.created_at);
  const todayDate = new Date(today);
  const postAgeDays = Math.floor((todayDate.getTime() - postCreated.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`\n📊 Correct CPM Calculation:`);
  console.log(`   Views: ${views}`);
  console.log(`   CPM Rate: $${CPM_RATE}/1000 views`);
  console.log(`   CPM Earned: $${cpmEarned.toFixed(2)}`);
  console.log(`   Post Age: ${postAgeDays} days`);

  // 6. Insert correct CPM record
  const { error: insertError } = await supabase
    .from('cpm_post_breakdown')
    .insert({
      post_id: post.id,
      user_id: post.submitted_by,
      date: today,
      cumulative_views: views,
      views_delta: views, // First record, so delta = total
      cpm_earned: Number(cpmEarned.toFixed(2)),
      post_age_days: postAgeDays,
      cumulative_post_cpm: Number(cpmEarned.toFixed(2)),
      cumulative_user_monthly_cpm: Number(cpmEarned.toFixed(2)),
      is_post_capped: false,
      is_user_monthly_capped: false,
    });

  if (insertError) {
    console.log('❌ Error inserting correct record:', insertError.message);
    return;
  }

  console.log(`\n✅ Inserted correct CPM record: $${cpmEarned.toFixed(2)}`);

  // 7. Verify
  const { data: verification } = await supabase
    .from('cpm_post_breakdown')
    .select('*')
    .eq('post_id', post.id)
    .single();

  console.log('\n📋 Verification:');
  console.log(JSON.stringify(verification, null, 2));
}

fixMaximeCPM().catch(console.error);
