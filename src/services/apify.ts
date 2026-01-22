/**
 * Apify Service
 * Handles TikTok and Instagram scraping via Apify actors
 */

// Lazy-load API token to support both Vite and Node environments
function getApifyToken(): string {
  // Vite environment
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APIFY_API_TOKEN) {
    return import.meta.env.VITE_APIFY_API_TOKEN;
  }
  // Node environment
  if (typeof process !== 'undefined' && process.env?.VITE_APIFY_API_TOKEN) {
    return process.env.VITE_APIFY_API_TOKEN;
  }
  return '';
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

interface ApifyRunResult {
  id: string;
  status: string;
  defaultDatasetId: string;
}

interface TikTokMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  downloads?: number;
}

interface InstagramMetrics {
  views?: number;
  likes: number;
  comments: number;
  shares?: number;
  bookmarks?: number;
}

/**
 * Helper function to retry API calls
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429 || response.status >= 500) {
        if (attempt === retries) {
          throw new Error(`API error after ${retries} attempts: ${response.status}`);
        }

        const delay = RETRY_DELAY * attempt;
        console.log(`Attempt ${attempt} failed with status ${response.status}, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = RETRY_DELAY * attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Failed after all retry attempts');
}

/**
 * Extract TikTok video/photo ID from URL
 * Supports formats:
 * - https://www.tiktok.com/@username/video/1234567890123456789
 * - https://www.tiktok.com/@username/photo/1234567890123456789
 * - https://vm.tiktok.com/ZM12345678/
 */
function extractTikTokId(url: string): string | null {
  // Standard TikTok URL (video or photo)
  const standardMatch = url.match(/\/(video|photo)\/(\d+)/);
  if (standardMatch) return standardMatch[2];

  // Short URL format
  const shortMatch = url.match(/vm\.tiktok\.com\/([A-Za-z0-9]+)/);
  if (shortMatch) return shortMatch[1];

  return null;
}

/**
 * Extract Instagram post ID from URL
 * Supports formats:
 * - https://www.instagram.com/p/ABC123def45/
 * - https://www.instagram.com/reel/ABC123def45/
 */
function extractInstagramId(url: string): string | null {
  const match = url.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
  return match ? match[2] : null;
}

/**
 * Scrape TikTok video metrics using Apify
 */
export async function scrapeTikTokMetrics(videoUrl: string): Promise<TikTokMetrics | null> {
  const apiToken = getApifyToken();
  if (!apiToken) {
    throw new Error('Apify API token not configured');
  }

  const videoId = extractTikTokId(videoUrl);
  if (!videoId) {
    throw new Error(`Invalid TikTok URL: ${videoUrl}`);
  }

  try {
    // TikTok Scraper Actor
    const actorId = 'GdWCkxBtKWOsKjdch';

    // Start the actor run
    const runResponse = await fetchWithRetry(
      `https://api.apify.com/v2/acts/${actorId}/runs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          postURLs: [videoUrl],
          resultsLimit: 1,
        }),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`Apify API error response (${runResponse.status}):`, errorText);
      throw new Error(`Apify run failed: ${runResponse.status} - ${errorText}`);
    }

    const runResult = await runResponse.json();
    console.log('TikTok - Apify run started:', JSON.stringify(runResult, null, 2));

    // Wait for the run to complete
    let status = runResult.data?.status || runResult.status;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    console.log('TikTok - Initial status:', status);

    while (status !== 'SUCCEEDED' && status !== 'FAILED' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetchWithRetry(
        `https://api.apify.com/v2/actor-runs/${runResult.data?.id || runResult.id}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
        }
      );

      const statusData = await statusResponse.json();
      console.log('TikTok - Status check:', JSON.stringify(statusData, null, 2));
      status = statusData.data?.status || statusData.status;
      attempts++;
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Apify run did not succeed: ${status}`);
    }

    // Fetch the results
    const datasetId = runResult.data?.defaultDatasetId || runResult.defaultDatasetId;
    const datasetResponse = await fetchWithRetry(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    const items = await datasetResponse.json();

    if (!items || items.length === 0) {
      return null;
    }

    const data = items[0];

    return {
      views: data.playCount || data.views || 0,
      likes: data.diggCount || data.likes || 0,
      comments: data.commentCount || data.comments || 0,
      shares: data.shareCount || data.shares || 0,
      bookmarks: data.collectCount || data.bookmarks || 0,
      downloads: data.downloadCount || 0,
    };
  } catch (error) {
    console.error('Error scraping TikTok metrics:', error);
    throw error;
  }
}

/**
 * Scrape Instagram post/reel metrics using Apify
 */
export async function scrapeInstagramMetrics(postUrl: string): Promise<InstagramMetrics | null> {
  const apiToken = getApifyToken();
  if (!apiToken) {
    throw new Error('Apify API token not configured');
  }

  const postId = extractInstagramId(postUrl);
  if (!postId) {
    throw new Error(`Invalid Instagram URL: ${postUrl}`);
  }

  try {
    // Instagram Scraper Actor
    const actorId = 'shu8hvrXbJbY3Eb9W';

    // Start the actor run
    const runResponse = await fetchWithRetry(
      `https://api.apify.com/v2/acts/${actorId}/runs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          directUrls: [postUrl],
          resultsLimit: 1,
        }),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`Apify API error response (${runResponse.status}):`, errorText);
      throw new Error(`Apify run failed: ${runResponse.status} - ${errorText}`);
    }

    const runResult = await runResponse.json();
    console.log('Instagram - Apify run started:', JSON.stringify(runResult, null, 2));

    // Wait for completion (similar to TikTok)
    let status = runResult.data?.status || runResult.status;
    let attempts = 0;
    const maxAttempts = 60;

    console.log('Instagram - Initial status:', status);

    while (status !== 'SUCCEEDED' && status !== 'FAILED' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetchWithRetry(
        `https://api.apify.com/v2/actor-runs/${runResult.data?.id || runResult.id}`,
        {
          headers: {
            'Authorization': `Bearer ${apiToken}`,
          },
        }
      );

      const statusData = await statusResponse.json();
      console.log('Instagram - Status check:', JSON.stringify(statusData, null, 2));
      status = statusData.data?.status || statusData.status;
      attempts++;
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Apify run did not succeed: ${status}`);
    }

    // Fetch results
    const datasetId = runResult.data?.defaultDatasetId || runResult.defaultDatasetId;
    const datasetResponse = await fetchWithRetry(
      `https://api.apify.com/v2/datasets/${datasetId}/items`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    const items = await datasetResponse.json();

    if (!items || items.length === 0) {
      return null;
    }

    const data = items[0];

    return {
      views: data.videoPlayCount || data.videoViewCount || data.views || 0,
      likes: data.likesCount || data.likes || 0,
      comments: data.commentsCount || data.comments || 0,
      shares: data.sharesCount || data.shares || 0,
      bookmarks: data.savesCount || data.bookmarks || 0,
    };
  } catch (error) {
    console.error('Error scraping Instagram metrics:', error);
    throw error;
  }
}

/**
 * Calculate engagement rate
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  views: number
): number {
  if (views === 0) return 0;
  const totalEngagement = likes + comments + shares;
  return Number(((totalEngagement / views) * 100).toFixed(2));
}
