/**
 * Test Instagram Reel scraping
 * Run with: npx tsx scripts/test-ig-reel.ts
 */

import { config } from 'dotenv';
import { scrapeInstagramMetrics, calculateEngagementRate } from '../src/services/apify';

config();

async function testIGReel() {
  const url = 'https://www.instagram.com/reel/DPO-IZZETWQ/';

  console.log('📸 Testing Instagram Reel:');
  console.log(url);
  console.log('\n⏳ Fetching metrics from Apify...\n');

  try {
    const metrics = await scrapeInstagramMetrics(url);

    if (!metrics) {
      console.log('❌ No metrics returned');
      return;
    }

    console.log('\n✅ Metrics fetched!');
    console.log('='.repeat(50));
    console.log('\n📊 Raw Metrics:');
    console.log(JSON.stringify(metrics, null, 2));

    const engagement = calculateEngagementRate(
      metrics.likes,
      metrics.comments,
      metrics.shares || 0,
      metrics.views || 0
    );

    console.log('\n📈 Engagement Rate:', `${engagement}%`);

    console.log('\n🔥 Virality Status:');
    const views = metrics.views || 0;
    if (views >= 20000) {
      console.log('🚀 VIRAL! (>20K views)');
    } else if (views >= 5000) {
      console.log('🔥 Gaining traction! (>5K views)');
    } else {
      console.log('📊 Regular post (<5K views)');
    }

    console.log('\n💰 UGC Creator Earnings (if 12 posts/week):');
    const ugcCpmRate = 1.5;
    const ugcFixedRate = 300;
    const ugcCpmEarnings = (views / 1000) * ugcCpmRate;
    const ugcTotal = ugcFixedRate + ugcCpmEarnings;
    console.log(`  Fixed: $${ugcFixedRate.toFixed(2)}`);
    console.log(`  CPM ($1.5): $${ugcCpmEarnings.toFixed(2)}`);
    console.log(`  Total: $${ugcTotal.toFixed(2)}`);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
  }
}

testIGReel().catch(console.error);
