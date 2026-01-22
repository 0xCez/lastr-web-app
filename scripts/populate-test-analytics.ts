/**
 * Populate Test Analytics Data
 *
 * This script:
 * 1. Fetches your existing posts from the database
 * 2. Scrapes their metrics using Apify
 * 3. Inserts analytics snapshots into the analytics table
 *
 * Run with: npm run populate-analytics
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { scrapeTikTokMetrics, scrapeInstagramMetrics } from '../src/services/apify';
import { calculateEngagementRate } from '../src/services/analytics-shared';

interface PostMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  bookmarks?: number;
}

// Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Need service role key to bypass RLS

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Post {
  id: string;
  url: string;
  platform: 'tiktok' | 'instagram';
  submitted_by: string;
  account_id: string;
  created_at: string;
}

async function populateAnalytics() {
  console.log('🔄 Starting analytics population...\n');

  // 1. Fetch all posts from database
  console.log('📊 Fetching posts from database...');
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (postsError) {
    console.error('❌ Error fetching posts:', postsError);
    process.exit(1);
  }

  if (!posts || posts.length === 0) {
    console.log('⚠️  No posts found in database. Please submit some posts first.');
    process.exit(0);
  }

  console.log(`✅ Found ${posts.length} posts\n`);

  // 2. Process each post
  let successCount = 0;
  let errorCount = 0;

  for (const post of posts as Post[]) {
    console.log(`\n📹 Processing post: ${post.url}`);
    console.log(`   Platform: ${post.platform}`);
    console.log(`   Post ID: ${post.id}`);

    try {
      // Fetch metrics from Apify
      console.log('   🔍 Fetching metrics from Apify...');
      let metrics: PostMetrics | null = null;

      if (post.platform === 'tiktok') {
        metrics = await scrapeTikTokMetrics(post.url);
      } else if (post.platform === 'instagram') {
        metrics = await scrapeInstagramMetrics(post.url);
      }

      if (!metrics) {
        console.error(`   ❌ Failed to fetch metrics`);
        errorCount++;
        continue;
      }

      // Use default values for undefined metrics
      const views = metrics.views || 0;
      const likes = metrics.likes || 0;
      const comments = metrics.comments || 0;
      const shares = metrics.shares || 0;
      const bookmarks = metrics.bookmarks || 0;

      console.log(`   📈 Metrics fetched:`);
      console.log(`      Views: ${views.toLocaleString()}`);
      console.log(`      Likes: ${likes.toLocaleString()}`);
      console.log(`      Comments: ${comments.toLocaleString()}`);
      console.log(`      Shares: ${shares.toLocaleString()}`);
      console.log(`      Bookmarks: ${bookmarks.toLocaleString()}`);

      // Calculate engagement rate
      const engagementRate = calculateEngagementRate(
        likes,
        comments,
        shares,
        views
      );

      // Insert into analytics table
      console.log('   💾 Inserting into analytics table...');
      const { error: insertError } = await supabase
        .from('analytics')
        .insert({
          post_id: post.id,
          views,
          likes,
          comments,
          shares,
          bookmarks,
          downloads: 0,
          engagement_rate: engagementRate,
          fetched_at: new Date().toISOString(),
          source: 'apify',
        });

      if (insertError) {
        console.error(`   ❌ Error inserting analytics:`, insertError.message);
        errorCount++;
      } else {
        console.log(`   ✅ Analytics saved successfully!`);
        successCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`   ❌ Error processing post:`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Analytics Population Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Successfully processed: ${successCount}/${posts.length}`);
  console.log(`❌ Errors: ${errorCount}/${posts.length}`);
  console.log('\n🎉 You can now refresh your dashboard to see real data!\n');
}

// Run the script
populateAnalytics().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
