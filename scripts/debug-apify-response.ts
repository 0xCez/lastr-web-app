/**
 * Debug script to see ALL raw fields from Apify
 * Run with: npx tsx scripts/debug-apify-response.ts
 */

import { config } from 'dotenv';

config();

const APIFY_TOKEN = process.env.VITE_APIFY_API_TOKEN!;

async function debugInstagramResponse(url: string) {
  console.log(`\n🔍 Debugging Instagram URL: ${url}\n`);

  const actorId = 'shu8hvrXbJbY3Eb9W';

  // Start the actor run
  const runResponse = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_TOKEN}`,
      },
      body: JSON.stringify({
        directUrls: [url],
        resultsLimit: 1,
      }),
    }
  );

  const runResult = await runResponse.json();
  const runId = runResult.data?.id || runResult.id;

  console.log('⏳ Waiting for Apify to finish...\n');

  // Wait for completion
  let status = runResult.data?.status || runResult.status;
  let attempts = 0;

  while (status !== 'SUCCEEDED' && status !== 'FAILED' && attempts < 60) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}`,
      {
        headers: {
          'Authorization': `Bearer ${APIFY_TOKEN}`,
        },
      }
    );

    const statusData = await statusResponse.json();
    status = statusData.data?.status || statusData.status;
    attempts++;
  }

  if (status !== 'SUCCEEDED') {
    console.error('❌ Run failed with status:', status);
    return;
  }

  // Fetch the results
  const datasetId = runResult.data?.defaultDatasetId || runResult.defaultDatasetId;
  const datasetResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items`,
    {
      headers: {
        'Authorization': `Bearer ${APIFY_TOKEN}`,
      },
    }
  );

  const items = await datasetResponse.json();

  if (!items || items.length === 0) {
    console.log('❌ No data returned');
    return;
  }

  const data = items[0];

  console.log('✅ Raw Response from Apify:\n');
  console.log('='.repeat(80));
  console.log(JSON.stringify(data, null, 2));
  console.log('='.repeat(80));

  console.log('\n📊 Available Fields:');
  console.log(Object.keys(data).join(', '));

  console.log('\n🔍 View Count Fields:');
  const viewFields = Object.keys(data).filter(key =>
    key.toLowerCase().includes('view') ||
    key.toLowerCase().includes('play')
  );
  viewFields.forEach(field => {
    console.log(`  ${field}: ${data[field]}`);
  });

  console.log('\n💡 Engagement Fields:');
  const engagementFields = ['likes', 'likesCount', 'comments', 'commentsCount', 'shares', 'sharesCount'];
  engagementFields.forEach(field => {
    if (data[field] !== undefined) {
      console.log(`  ${field}: ${data[field]}`);
    }
  });
}

// Test with the problematic URL
const testUrl = 'https://www.instagram.com/reel/DPO-IZZETWQ/';
debugInstagramResponse(testUrl).catch(console.error);
