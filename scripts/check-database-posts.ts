/**
 * Check what posts exist in the database
 * Run with: npx tsx scripts/check-database-posts.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('🔍 Checking Database for Posts...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Check all posts
  const { data: allPosts, error: allError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (allError) {
    console.error('❌ Error fetching posts:', allError);
    return;
  }

  console.log(`📊 Total posts in database: ${allPosts?.length || 0}`);

  if (!allPosts || allPosts.length === 0) {
    console.log('\n⚠️  No posts found in database.');
    console.log('You need to create some test posts first.');
    console.log('\nTo create a test post, you can:');
    console.log('1. Use the app UI to submit a post');
    console.log('2. Or run the insert-test-posts.ts script (if we create one)');
    return;
  }

  // Group by status
  const byStatus = allPosts.reduce((acc: any, post: any) => {
    acc[post.status] = (acc[post.status] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📋 Posts by status:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // Group by platform
  const byPlatform = allPosts.reduce((acc: any, post: any) => {
    acc[post.platform] = (acc[post.platform] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📱 Posts by platform:');
  Object.entries(byPlatform).forEach(([platform, count]) => {
    console.log(`  ${platform}: ${count}`);
  });

  // Show approved posts (what analytics would process)
  const approvedPosts = allPosts.filter(p => p.status === 'approved');
  console.log(`\n✅ Approved posts (ready for analytics): ${approvedPosts.length}`);

  if (approvedPosts.length > 0) {
    console.log('\nSample approved posts:');
    approvedPosts.slice(0, 5).forEach((post: any, i: number) => {
      console.log(`\n${i + 1}. ${post.platform.toUpperCase()} Post`);
      console.log(`   ID: ${post.id}`);
      console.log(`   URL: ${post.url}`);
      console.log(`   Created: ${new Date(post.created_at).toLocaleString()}`);
    });
  }

  // Check if any posts already have analytics
  const { data: analyticsData, error: analyticsError } = await supabase
    .from('analytics')
    .select('post_id, views, likes, engagement_rate, fetched_at');

  if (!analyticsError && analyticsData && analyticsData.length > 0) {
    console.log(`\n📊 Posts with existing analytics: ${analyticsData.length}`);
    console.log('\nSample analytics:');
    analyticsData.slice(0, 3).forEach((a: any, i: number) => {
      console.log(`${i + 1}. Post ${a.post_id.substring(0, 8)}... - ${a.views} views, ${a.likes} likes (${a.engagement_rate}% engagement)`);
    });
  } else {
    console.log('\n📊 No analytics data found yet.');
  }
}

main().catch(console.error);
