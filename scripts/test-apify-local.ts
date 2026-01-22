/**
 * Local test script for Apify analytics integration
 * Run with: npx tsx scripts/test-apify-local.ts
 *
 * This tests the Apify functions WITHOUT deploying or modifying the database
 */

import { config } from 'dotenv';
import { scrapeTikTokMetrics, scrapeInstagramMetrics, calculateEngagementRate } from '../src/services/apify';

// Load environment variables
config();

// Test URLs (public posts for testing)
const TEST_URLS = {
  tiktok: 'https://www.tiktok.com/@zachking/video/7017580145810828549', // Famous magician, public post
  instagram: 'https://www.instagram.com/p/C4qZJyqRzJX/', // Example public post
};

async function testTikTokScraping() {
  console.log('\n🎵 Testing TikTok Scraping...');
  console.log(`URL: ${TEST_URLS.tiktok}`);

  try {
    const metrics = await scrapeTikTokMetrics(TEST_URLS.tiktok);

    if (!metrics) {
      console.log('❌ No metrics returned');
      return false;
    }

    console.log('✅ TikTok metrics fetched successfully:');
    console.log(JSON.stringify(metrics, null, 2));

    // Test engagement rate calculation
    const engagementRate = calculateEngagementRate(
      metrics.likes,
      metrics.comments,
      metrics.shares,
      metrics.views
    );
    console.log(`📊 Engagement Rate: ${engagementRate}%`);

    return true;
  } catch (error: any) {
    console.error('❌ TikTok scraping failed:', error.message);
    return false;
  }
}

async function testInstagramScraping() {
  console.log('\n📸 Testing Instagram Scraping...');
  console.log(`URL: ${TEST_URLS.instagram}`);

  try {
    const metrics = await scrapeInstagramMetrics(TEST_URLS.instagram);

    if (!metrics) {
      console.log('❌ No metrics returned');
      return false;
    }

    console.log('✅ Instagram metrics fetched successfully:');
    console.log(JSON.stringify(metrics, null, 2));

    // Test engagement rate calculation
    const engagementRate = calculateEngagementRate(
      metrics.likes,
      metrics.comments,
      metrics.shares || 0,
      metrics.views || 0
    );
    console.log(`📊 Engagement Rate: ${engagementRate}%`);

    return true;
  } catch (error: any) {
    console.error('❌ Instagram scraping failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Apify Analytics Local Test');
  console.log('================================\n');

  // Check API token
  const apiToken = process.env.VITE_APIFY_API_TOKEN;
  if (!apiToken) {
    console.error('❌ VITE_APIFY_API_TOKEN not found in environment variables');
    console.log('Make sure .env file has: VITE_APIFY_API_TOKEN=apify_api_...');
    process.exit(1);
  }

  console.log('✅ Apify API token found');
  console.log(`Token: ${apiToken.substring(0, 15)}...`);

  console.log('\n⚠️  WARNING: This will use Apify credits!');
  console.log('Estimated cost: ~$0.001 per test');
  console.log('\nWaiting 3 seconds before proceeding...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const results = {
    tiktok: false,
    instagram: false,
  };

  // Test TikTok
  results.tiktok = await testTikTokScraping();

  // Wait between tests
  console.log('\n⏳ Waiting 5 seconds before next test...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test Instagram
  results.instagram = await testInstagramScraping();

  // Summary
  console.log('\n================================');
  console.log('📋 Test Summary:');
  console.log(`TikTok: ${results.tiktok ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Instagram: ${results.instagram ? '✅ PASS' : '❌ FAIL'}`);

  if (results.tiktok && results.instagram) {
    console.log('\n🎉 All tests passed! Ready to deploy.');
  } else {
    console.log('\n⚠️  Some tests failed. Fix issues before deploying.');
  }
}

main().catch(console.error);
