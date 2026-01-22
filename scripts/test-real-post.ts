/**
 * Test with real TikTok and Instagram posts to validate data extraction
 * Run with: npx tsx scripts/test-real-post.ts
 */

import { config } from 'dotenv';
import { scrapeTikTokMetrics, scrapeInstagramMetrics, calculateEngagementRate } from '../src/services/apify';

// Load environment variables
config();

async function testRealPost() {
  console.log('🧪 Testing with Real Posts\n');
  console.log('='.repeat(50));

  // Test URLs
  const realTikTokUrl = 'https://www.tiktok.com/@draftkings/photo/7578523217141173535';
  const realInstagramUrl = 'https://www.instagram.com/p/DRH-VtviU2D/';

  // Test TikTok
  console.log('\n📱 TikTok Post URL:');
  console.log(realTikTokUrl);
  console.log('\n⏳ Fetching TikTok metrics from Apify...\n');

  try {
    const tiktokMetrics = await scrapeTikTokMetrics(realTikTokUrl);

    if (!tiktokMetrics) {
      console.log('❌ No TikTok metrics returned');
    } else {
      console.log('\n✅ TikTok metrics fetched!');
      console.log('='.repeat(50));
      console.log('\n📊 TikTok Raw Metrics:');
      console.log(JSON.stringify(tiktokMetrics, null, 2));

      const ttEngagement = calculateEngagementRate(
        tiktokMetrics.likes,
        tiktokMetrics.comments,
        tiktokMetrics.shares,
        tiktokMetrics.views
      );

      console.log('\n📈 TikTok Engagement Rate:', `${ttEngagement}%`);

      // Virality check
      console.log('\n🔥 TikTok Virality:');
      if (tiktokMetrics.views >= 20000) {
        console.log('🚀 VIRAL! (>20K views)');
      } else if (tiktokMetrics.views >= 5000) {
        console.log('🔥 Gaining traction! (>5K views)');
      } else {
        console.log('📊 Regular post (< 5K views)');
      }

      // UGC Creator earnings (example)
      const ugcCpmRate = 1.5;
      const ugcFixedRate = 300;
      const ugcCpmEarnings = (tiktokMetrics.views / 1000) * ugcCpmRate;
      const ugcTotal = ugcFixedRate + ugcCpmEarnings;
      console.log('\n💰 UGC Creator Earnings (if 12 posts/week):');
      console.log(`  Fixed: $${ugcFixedRate.toFixed(2)}`);
      console.log(`  CPM ($1.5): $${ugcCpmEarnings.toFixed(2)}`);
      console.log(`  Total: $${ugcTotal.toFixed(2)}`);
    }

  } catch (error: any) {
    console.error('\n❌ TikTok test failed:', error.message);
  }

  // Test Instagram
  console.log('\n\n' + '='.repeat(50));
  console.log('\n📸 Instagram Post URL:');
  console.log(realInstagramUrl);
  console.log('\n⏳ Fetching Instagram metrics from Apify...\n');

  try {
    const igMetrics = await scrapeInstagramMetrics(realInstagramUrl);

    if (!igMetrics) {
      console.log('❌ No Instagram metrics returned');
    } else {
      console.log('\n✅ Instagram metrics fetched!');
      console.log('='.repeat(50));
      console.log('\n📊 Instagram Raw Metrics:');
      console.log(JSON.stringify(igMetrics, null, 2));

      const igEngagement = calculateEngagementRate(
        igMetrics.likes,
        igMetrics.comments,
        igMetrics.shares || 0,
        igMetrics.views || 0
      );

      console.log('\n📈 Instagram Engagement Rate:', `${igEngagement}%`);

      // Virality check
      console.log('\n🔥 Instagram Virality:');
      const igViews = igMetrics.views || 0;
      if (igViews >= 20000) {
        console.log('🚀 VIRAL! (>20K views)');
      } else if (igViews >= 5000) {
        console.log('🔥 Gaining traction! (>5K views)');
      } else {
        console.log('📊 Regular post (< 5K views)');
      }

      // UGC Creator earnings (example)
      const ugcCpmRate = 1.5;
      const ugcFixedRate = 300;
      const ugcCpmEarnings = (igViews / 1000) * ugcCpmRate;
      const ugcTotal = ugcFixedRate + ugcCpmEarnings;
      console.log('\n💰 UGC Creator Earnings (if 12 posts/week):');
      console.log(`  Fixed: $${ugcFixedRate.toFixed(2)}`);
      console.log(`  CPM ($1.5): $${ugcCpmEarnings.toFixed(2)}`);
      console.log(`  Total: $${ugcTotal.toFixed(2)}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  }
}

testRealPost().catch(console.error);
