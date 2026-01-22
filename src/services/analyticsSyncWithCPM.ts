/**
 * @deprecated This service is DEPRECATED. Use the edge function instead.
 *
 * The unified analytics sync is now handled by:
 *   /supabase/functions/fetch-analytics/index.ts
 *
 * This edge function:
 *   - Runs daily via cron job (primary)
 *   - Can be called manually via HTTP POST (secondary)
 *   - Handles: analytics fetching, CPM calculation, viral alerts
 *
 * To trigger manually, call the edge function endpoint:
 *   POST /functions/v1/fetch-analytics
 *   Body: { accountIds?: string[] }
 *
 * This file is kept for reference only and will be removed in a future cleanup.
 * ============================================================================
 *
 * ORIGINAL DESCRIPTION:
 * Analytics Sync with CPM Calculation
 * Fetches analytics from Apify AND calculates CPM daily deltas
 * Stores both in database for tracking
 *
 * Data Flow:
 *   1. Query posts table for pending/approved posts
 *   2. For each post, fetch metrics from Apify (with retry)
 *   3. Insert into analytics table (with verification)
 *   4. If approved, calculate and insert into cpm_post_breakdown (with verification)
 */

import { supabase } from '../lib/supabase';
import { scrapeTikTokMetrics, scrapeInstagramMetrics } from './apify';
import { CPM_RATE, CPM_WINDOW_DAYS } from '../config/constants';

// CPM Cap Constants
const CPM_CAP_PER_POST = 350; // $350 max per post
const CPM_CAP_PER_USER_MONTHLY = 5000; // $5000 max per user per month

// Retry Configuration
const MAX_APIFY_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface SyncResult {
  success: number;
  failed: number;
  errors: { postId: string; url: string; error: string; stage: string }[];
  verified: {
    analyticsInserted: number;
    cpmInserted: number;
  };
  sanityChecks: {
    passed: number;
    failed: number;
    mismatches: { postId: string; analyticsViews: number; cpmViews: number }[];
  };
}

interface SyncOptions {
  accountIds?: string[]; // Optional: filter by specific account IDs
  onProgress?: (current: number, total: number) => void; // Progress callback
}

/**
 * Helper: Sleep for a given number of milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper: Fetch metrics with retry logic
 */
async function fetchMetricsWithRetry(
  platform: string,
  url: string,
  maxRetries: number = MAX_APIFY_RETRIES
): Promise<{ views: number; likes: number; comments: number; shares: number; bookmarks: number; downloads: number } | null> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  → Apify attempt ${attempt}/${maxRetries}...`);

      let metrics;
      if (platform === 'tiktok') {
        metrics = await scrapeTikTokMetrics(url);
      } else if (platform === 'instagram') {
        metrics = await scrapeInstagramMetrics(url);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      if (metrics && metrics.views !== null && metrics.views !== undefined) {
        return metrics;
      }

      lastError = new Error('Apify returned null or no views');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown Apify error');
      console.log(`  → Attempt ${attempt} failed: ${lastError.message}`);
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delay = RETRY_DELAY_MS * attempt;
      console.log(`  → Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }

  throw lastError || new Error('All Apify retry attempts failed');
}

/**
 * Helper: Verify analytics was inserted
 */
async function verifyAnalyticsInserted(postId: string, expectedViews: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('analytics')
    .select('views')
    .eq('post_id', postId)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.log(`  ⚠️ Analytics verification failed: ${error?.message || 'No data found'}`);
    return false;
  }

  if (data.views !== expectedViews) {
    console.log(`  ⚠️ Analytics views mismatch: expected ${expectedViews}, got ${data.views}`);
    return false;
  }

  return true;
}

/**
 * Helper: Verify CPM was inserted
 */
async function verifyCPMInserted(postId: string, date: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('cpm_post_breakdown')
    .select('id')
    .eq('post_id', postId)
    .eq('date', date)
    .single();

  if (error || !data) {
    console.log(`  ⚠️ CPM verification failed: ${error?.message || 'No data found'}`);
    return false;
  }

  return true;
}

/**
 * Sanity check: Verify analytics and cpm_post_breakdown have matching views
 * This ensures data consistency between the two tables
 */
async function sanityCheckViewsMatch(postId: string, date: string): Promise<{ match: boolean; analytics: number; cpm: number }> {
  // Get latest analytics views
  const { data: analyticsData } = await supabase
    .from('analytics')
    .select('views')
    .eq('post_id', postId)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  // Get CPM cumulative views for today
  const { data: cpmData } = await supabase
    .from('cpm_post_breakdown')
    .select('cumulative_views')
    .eq('post_id', postId)
    .eq('date', date)
    .single();

  const analyticsViews = analyticsData?.views ?? 0;
  const cpmViews = cpmData?.cumulative_views ?? 0;

  const match = analyticsViews === cpmViews;

  if (!match) {
    console.log(`  ⚠️ SANITY CHECK FAILED: Analytics views (${analyticsViews}) ≠ CPM views (${cpmViews})`);
  }

  return { match, analytics: analyticsViews, cpm: cpmViews };
}

export async function syncAllAnalyticsWithCPM(options: SyncOptions = {}): Promise<SyncResult> {
  const result: SyncResult = {
    success: 0,
    failed: 0,
    errors: [],
    verified: {
      analyticsInserted: 0,
      cpmInserted: 0,
    },
    sanityChecks: {
      passed: 0,
      failed: 0,
      mismatches: [],
    },
  };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    // 1. Get all posts (pending and approved) within 4-week window
    // Analytics can be fetched regardless of approval status
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - CPM_WINDOW_DAYS);

    // Build query with optional account filter
    let query = supabase
      .from('posts')
      .select('id, url, platform, submitted_by, created_at, status, account_id')
      .in('status', ['pending', 'approved'])
      .gte('created_at', cutoffDate.toISOString());

    // Apply account filter if provided (for efficiency)
    if (options.accountIds && options.accountIds.length > 0) {
      query = query.in('account_id', options.accountIds);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`);
    }

    if (!posts || posts.length === 0) {
      console.log('No posts to sync');
      return result;
    }

    const totalPosts = posts.length;

    // 2. Fetch analytics for each post AND calculate CPM
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];

      // Call progress callback
      if (options.onProgress) {
        options.onProgress(i + 1, totalPosts);
      }

      try {
        console.log(`Syncing post ${i + 1}/${totalPosts}: ${post.id} (${post.platform})`);

        // Fetch from Apify with retry logic
        const metrics = await fetchMetricsWithRetry(post.platform, post.url);

        if (!metrics) {
          throw new Error('Failed to fetch metrics from Apify after all retries');
        }

        const cumulativeViews = metrics.views;

        // Calculate engagement rate
        const totalEngagements =
          (metrics.likes || 0) +
          (metrics.comments || 0) +
          (metrics.shares || 0) +
          (metrics.bookmarks || 0);

        const engagementRate = cumulativeViews > 0
          ? (totalEngagements / cumulativeViews) * 100
          : 0;

        // 3. Insert analytics snapshot
        const { error: analyticsError } = await supabase
          .from('analytics')
          .insert({
            post_id: post.id,
            views: cumulativeViews,
            likes: metrics.likes || 0,
            comments: metrics.comments || 0,
            shares: metrics.shares || 0,
            bookmarks: metrics.bookmarks || 0,
            downloads: metrics.downloads || 0,
            engagement_rate: Number(engagementRate.toFixed(2)),
            fetched_at: new Date().toISOString(),
            source: 'apify',
          });

        if (analyticsError) {
          throw new Error(`Failed to insert analytics: ${analyticsError.message}`);
        }

        // Verify analytics was actually inserted
        const analyticsVerified = await verifyAnalyticsInserted(post.id, cumulativeViews);
        if (analyticsVerified) {
          result.verified.analyticsInserted++;
        } else {
          console.log(`  ⚠️ Analytics inserted but verification failed for post ${post.id}`);
        }

        // 4. Check for viral alert (every 10K milestone)
        await checkAndUpdateViralAlert(post.id, cumulativeViews);

        // 5. Calculate CPM for TODAY (only for approved posts)
        if (post.status === 'approved') {
          await calculateAndStoreDailyCPM(post.id, post.submitted_by, post.created_at, cumulativeViews, todayStr);

          // Verify CPM was inserted
          const cpmVerified = await verifyCPMInserted(post.id, todayStr);
          if (cpmVerified) {
            result.verified.cpmInserted++;
          } else {
            console.log(`  ⚠️ CPM calculation completed but verification failed for post ${post.id}`);
          }

          // 6. Sanity check: Ensure analytics and CPM views match
          const sanityResult = await sanityCheckViewsMatch(post.id, todayStr);
          if (sanityResult.match) {
            result.sanityChecks.passed++;
          } else {
            result.sanityChecks.failed++;
            result.sanityChecks.mismatches.push({
              postId: post.id,
              analyticsViews: sanityResult.analytics,
              cpmViews: sanityResult.cpm,
            });
          }
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
          stage: 'sync',
        });
        console.error(`✗ Failed to sync post ${post.id}:`, errorMessage);
      }
    }

    console.log(`\nSync complete: ${result.success} succeeded, ${result.failed} failed`);
    console.log(`Verifications: ${result.verified.analyticsInserted} analytics, ${result.verified.cpmInserted} CPM`);
    console.log(`Sanity checks: ${result.sanityChecks.passed} passed, ${result.sanityChecks.failed} failed`);

    if (result.sanityChecks.mismatches.length > 0) {
      console.log(`\n⚠️ View mismatches detected:`);
      result.sanityChecks.mismatches.forEach(m => {
        console.log(`  - Post ${m.postId}: analytics=${m.analyticsViews}, cpm=${m.cpmViews}`);
      });
    }

    return result;

  } catch (error) {
    console.error('Analytics sync failed:', error);
    throw error;
  }
}

/**
 * Calculate and store daily CPM for a post
 * This is where the magic happens!
 */
async function calculateAndStoreDailyCPM(
  postId: string,
  userId: string,
  postCreatedAt: string,
  cumulativeViews: number,
  date: string
): Promise<void> {
  // 1. Check if we already have a record for this post today
  const { data: existingRecord } = await supabase
    .from('cpm_post_breakdown')
    .select('*')
    .eq('post_id', postId)
    .eq('date', date)
    .single();

  if (existingRecord) {
    console.log(`  → CPM already calculated for post ${postId} on ${date}`);
    return;
  }

  // 2. Calculate post age
  const postCreated = new Date(postCreatedAt);
  const today = new Date(date);
  const postAgeDays = Math.floor((today.getTime() - postCreated.getTime()) / (1000 * 60 * 60 * 24));

  // 3. Check if post is still within 4-week window
  if (postAgeDays > CPM_WINDOW_DAYS) {
    console.log(`  → Post ${postId} is ${postAgeDays} days old (> ${CPM_WINDOW_DAYS}), skipping CPM`);
    return;
  }

  // 4. Get the most recent previous record to calculate delta
  // (handles gaps if a sync was missed - uses last known views instead of assuming 0)
  const { data: previousRecord } = await supabase
    .from('cpm_post_breakdown')
    .select('cumulative_views, cumulative_post_cpm, date')
    .eq('post_id', postId)
    .lt('date', date)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  const previousViews = previousRecord?.cumulative_views || 0;
  const previousPostCPM = previousRecord?.cumulative_post_cpm || 0;

  // 5. Calculate views delta
  const viewsDelta = Math.max(0, cumulativeViews - previousViews);
  console.log(`  → Views: cumulative=${cumulativeViews}, previous=${previousViews}, delta=${viewsDelta}`);

  // 6. Check if post has hit $350 cap
  if (previousPostCPM >= CPM_CAP_PER_POST) {
    console.log(`  → Post ${postId} has hit $350 cap, no more CPM`);

    // Still insert record but with 0 CPM
    await supabase.from('cpm_post_breakdown').insert({
      post_id: postId,
      user_id: userId,
      date: date,
      cumulative_views: cumulativeViews,
      views_delta: viewsDelta,
      cpm_earned: 0,
      post_age_days: postAgeDays,
      cumulative_post_cpm: previousPostCPM,
      cumulative_user_monthly_cpm: 0, // Will calculate below
      is_post_capped: true,
      is_user_monthly_capped: false,
    });
    return;
  }

  // 7. Calculate CPM for these new views
  let cpmEarned = (viewsDelta / 1000) * CPM_RATE;

  // Apply post cap (can't exceed $350 total for this post)
  const newPostTotal = previousPostCPM + cpmEarned;
  if (newPostTotal > CPM_CAP_PER_POST) {
    cpmEarned = CPM_CAP_PER_POST - previousPostCPM;
    console.log(`  → Post ${postId} capping at $350`);
  }

  // 8. Check user's monthly total
  const monthStart = new Date(date);
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const { data: monthlyRecords } = await supabase
    .from('cpm_post_breakdown')
    .select('cpm_earned')
    .eq('user_id', userId)
    .gte('date', monthStartStr)
    .lte('date', date); // Include today's records (so we see CPM from earlier posts in this sync run)

  const monthlyTotal = monthlyRecords?.reduce((sum, r) => sum + Number(r.cpm_earned), 0) || 0;

  let isUserMonthlyCapped = false;

  // 9. Apply monthly cap ($5K per month)
  if (monthlyTotal >= CPM_CAP_PER_USER_MONTHLY) {
    console.log(`  → User ${userId} has hit $5K monthly cap, no more CPM this month`);
    cpmEarned = 0;
    isUserMonthlyCapped = true;
  } else if (monthlyTotal + cpmEarned > CPM_CAP_PER_USER_MONTHLY) {
    cpmEarned = CPM_CAP_PER_USER_MONTHLY - monthlyTotal;
    isUserMonthlyCapped = true;
    console.log(`  → User ${userId} capping at $${CPM_CAP_PER_USER_MONTHLY} monthly`);
  }

  const cumulativePostCPM = previousPostCPM + cpmEarned;
  const cumulativeUserMonthlyCPM = monthlyTotal + cpmEarned;

  // 10. Insert today's CPM record
  const { error: insertError } = await supabase
    .from('cpm_post_breakdown')
    .insert({
      post_id: postId,
      user_id: userId,
      date: date,
      cumulative_views: cumulativeViews,
      views_delta: viewsDelta,
      cpm_earned: Number(cpmEarned.toFixed(2)),
      post_age_days: postAgeDays,
      cumulative_post_cpm: Number(cumulativePostCPM.toFixed(2)),
      cumulative_user_monthly_cpm: Number(cumulativeUserMonthlyCPM.toFixed(2)),
      is_post_capped: cumulativePostCPM >= CPM_CAP_PER_POST,
      is_user_monthly_capped: isUserMonthlyCapped,
    });

  if (insertError) {
    throw new Error(`Failed to insert CPM breakdown: ${insertError.message}`);
  }

  console.log(`  → CPM: ${viewsDelta} views × $${CPM_RATE}/1K = $${cpmEarned.toFixed(2)} (post total: $${cumulativePostCPM.toFixed(2)})`);
}

/**
 * Check if post hit a new viral milestone and update alert
 * Milestones: Every 10K views (10K, 20K, 30K, 100K, 1M, etc.)
 */
async function checkAndUpdateViralAlert(postId: string, currentViews: number): Promise<void> {
  try {
    // Get current post data
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('viral_alert_views')
      .eq('id', postId)
      .single();

    if (postError) {
      console.error(`Failed to fetch post for viral alert: ${postError.message}`);
      return;
    }

    // Calculate current milestone (round down to nearest 10K)
    const MILESTONE_INCREMENT = 10000;
    const currentMilestone = Math.floor(currentViews / MILESTONE_INCREMENT) * MILESTONE_INCREMENT;
    const previousMilestone = post.viral_alert_views ?? 0;

    // Check if we hit a new milestone OR if this is the first time checking (previousMilestone is null)
    // This ensures viral alerts are generated on manual fetch even if the post already has high views
    const shouldUpdateAlert = currentMilestone >= MILESTONE_INCREMENT && (
      post.viral_alert_views === null || currentMilestone > previousMilestone
    );

    if (shouldUpdateAlert) {
      // Format the views number for display
      const formatViews = (views: number): string => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
        return views.toString();
      };

      const message = `🔥 Your post reached ${formatViews(currentMilestone)} views! Don't forget to engage!`;

      // Update post with new viral alert (replaces previous alert)
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          viral_alert_message: message,
          viral_alert_views: currentMilestone,
          viral_alert_created_at: new Date().toISOString(),
          viral_alert_acknowledged: false, // Reset acknowledged status
        })
        .eq('id', postId);

      if (updateError) {
        console.error(`Failed to update viral alert: ${updateError.message}`);
        return;
      }

      console.log(`  🌟 VIRAL ALERT: Post hit ${formatViews(currentMilestone)} views!`);
    }
  } catch (error) {
    console.error('Error checking viral alert:', error);
  }
}
