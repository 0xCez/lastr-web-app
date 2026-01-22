/**
 * Test multiple Instagram Reels to verify accuracy
 * Run with: npx tsx scripts/test-ig-multiple.ts
 */

import { config } from 'dotenv';
import { scrapeInstagramMetrics, calculateEngagementRate } from '../src/services/apify';

config();

const testUrls = [
  'https://www.instagram.com/reel/DPO-IZZETWQ/',
  'https://www.instagram.com/reel/DPJ-VoOEkhU/',
  'https://www.instagram.com/reel/DPE6zUIkjfN/',
];

async function testMultipleReels() {
  console.log('📸 Testing Multiple Instagram Reels\n');
  console.log('='.repeat(60));

  for (let i = 0; i < testUrls.length; i++) {
    const url = testUrls[i];
    console.log(`\n\n${i + 1}. Testing: ${url}`);
    console.log('⏳ Fetching metrics from Apify...\n');

    try {
      const metrics = await scrapeInstagramMetrics(url);

      if (!metrics) {
        console.log('❌ No metrics returned');
        continue;
      }

      console.log('✅ Metrics fetched!');
      console.log('-'.repeat(60));
      console.log('\n📊 Raw Metrics:');
      console.log(JSON.stringify(metrics, null, 2));

      const engagement = calculateEngagementRate(
        metrics.likes,
        metrics.comments,
        metrics.shares || 0,
        metrics.views || 0
      );

      const views = metrics.views || 0;

      console.log('\n📈 Summary:');
      console.log(`  Views: ${views.toLocaleString()}`);
      console.log(`  Likes: ${metrics.likes.toLocaleString()}`);
      console.log(`  Comments: ${metrics.comments.toLocaleString()}`);
      console.log(`  Engagement Rate: ${engagement}%`);

      console.log('\n🔥 Virality Status:');
      if (views >= 20000) {
        console.log('  🚀 VIRAL! (>20K views)');
      } else if (views >= 5000) {
        console.log('  🔥 Gaining traction! (>5K views)');
      } else {
        console.log('  📊 Regular post (<5K views)');
      }

      const ugcCpmEarnings = (views / 1000) * 1.5;
      const ugcTotal = 300 + ugcCpmEarnings;
      console.log(`\n💰 UGC Earnings: $${ugcTotal.toFixed(2)} ($300 + $${ugcCpmEarnings.toFixed(2)} CPM)`);

    } catch (error: any) {
      console.error('\n❌ Test failed:', error.message);
    }

    // Add delay between requests to avoid rate limiting
    if (i < testUrls.length - 1) {
      console.log('\n⏱️  Waiting 3 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ All tests completed!\n');
}

testMultipleReels().catch(console.error);
