/**
 * Analytics Sync Service
 * Fetches analytics from Apify for all approved posts and stores in database
 */

import { supabase } from '../lib/supabase';
import { scrapeTikTokMetrics, scrapeInstagramMetrics } from './apify';
import { APIFY_RETRY_ATTEMPTS } from '../config/constants';

interface SyncResult {
  success: number;
  failed: number;
  errors: { postId: string; url: string; error: string }[];
}

interface Post {
  id: string;
  url: string;
  platform: string;
}

/**
 * Sync analytics for all approved posts
 * Fetches metrics from Apify and inserts new analytics snapshots
 */
export async function syncAllAnalytics(): Promise<SyncResult> {
  const result: SyncResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    // 1. Get all approved posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, url, platform')
      .eq('status', 'approved');

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    if (!posts || posts.length === 0) {
      console.log('No approved posts found to sync');
      return result;
    }

    console.log(`Found ${posts.length} approved posts to sync`);

    // 2. Fetch analytics for each post
    for (const post of posts as Post[]) {
      try {
        console.log(`Syncing analytics for post ${post.id} (${post.platform})`);

        let metrics;

        // Fetch from Apify based on platform
        if (post.platform === 'tiktok') {
          metrics = await scrapeTikTokMetrics(post.url);
        } else if (post.platform === 'instagram') {
          metrics = await scrapeInstagramMetrics(post.url);
        } else {
          throw new Error(`Unsupported platform: ${post.platform}`);
        }

        if (!metrics) {
          throw new Error('Failed to fetch metrics from Apify');
        }

        // Calculate engagement rate
        const totalEngagements =
          (metrics.likes || 0) +
          (metrics.comments || 0) +
          (metrics.shares || 0) +
          (metrics.bookmarks || 0);

        const engagementRate = metrics.views && metrics.views > 0
          ? (totalEngagements / metrics.views) * 100
          : 0;

        // 3. Insert new analytics snapshot
        const { error: insertError } = await supabase
          .from('analytics')
          .insert({
            post_id: post.id,
            views: metrics.views || 0,
            likes: metrics.likes || 0,
            comments: metrics.comments || 0,
            shares: metrics.shares || 0,
            bookmarks: metrics.bookmarks || 0,
            downloads: metrics.downloads || 0,
            engagement_rate: Number(engagementRate.toFixed(2)),
            fetched_at: new Date().toISOString(),
            source: 'apify',
          });

        if (insertError) {
          throw new Error(`Failed to insert analytics: ${insertError.message}`);
        }

        result.success++;
        console.log(`✓ Successfully synced post ${post.id}`);

      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({
          postId: post.id,
          url: post.url,
          error: errorMessage,
        });
        console.error(`✗ Failed to sync post ${post.id}:`, errorMessage);
      }
    }

    console.log(`\nSync complete: ${result.success} succeeded, ${result.failed} failed`);
    return result;

  } catch (error) {
    console.error('Analytics sync failed:', error);
    throw error;
  }
}

/**
 * Sync analytics for a single post
 * Useful for manual retries or on-demand fetches
 */
export async function syncSinglePost(postId: string): Promise<boolean> {
  try {
    // Get post details
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, url, platform, status')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      throw new Error(`Post not found: ${postId}`);
    }

    if (post.status !== 'approved') {
      throw new Error(`Post ${postId} is not approved (status: ${post.status})`);
    }

    // Fetch metrics
    let metrics;
    if (post.platform === 'tiktok') {
      metrics = await scrapeTikTokMetrics(post.url);
    } else if (post.platform === 'instagram') {
      metrics = await scrapeInstagramMetrics(post.url);
    } else {
      throw new Error(`Unsupported platform: ${post.platform}`);
    }

    if (!metrics) {
      throw new Error('Failed to fetch metrics from Apify');
    }

    // Calculate engagement rate
    const totalEngagements =
      (metrics.likes || 0) +
      (metrics.comments || 0) +
      (metrics.shares || 0) +
      (metrics.bookmarks || 0);

    const engagementRate = metrics.views && metrics.views > 0
      ? (totalEngagements / metrics.views) * 100
      : 0;

    // Insert analytics
    const { error: insertError } = await supabase
      .from('analytics')
      .insert({
        post_id: post.id,
        views: metrics.views || 0,
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0,
        bookmarks: metrics.bookmarks || 0,
        downloads: metrics.downloads || 0,
        engagement_rate: Number(engagementRate.toFixed(2)),
        fetched_at: new Date().toISOString(),
        source: 'apify',
      });

    if (insertError) {
      throw new Error(`Failed to insert analytics: ${insertError.message}`);
    }

    console.log(`✓ Successfully synced post ${postId}`);
    return true;

  } catch (error) {
    console.error(`Failed to sync post ${postId}:`, error);
    return false;
  }
}
