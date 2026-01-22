/**
 * CPM Calculation Service
 * Calculates real-time CPM earnings for UGC creators based on 30-day tracking window
 *
 * Logic:
 * - Posts earn CPM for 30 days after submission
 * - Only approved posts count
 * - CPM = (views / 1000) × $1.50
 * - Uses time-series analytics to track view growth
 */

import { supabase } from '@/lib/supabase';
import { CPM_RATE, CPM_WINDOW_DAYS } from '@/config/constants';
import { Database } from '@/types/database.types';

type Post = Database['public']['Tables']['posts']['Row'];
type Analytics = Database['public']['Tables']['analytics']['Row'];

interface PostWithAnalytics extends Post {
  analytics: Analytics[];
}

export interface PostCPMBreakdown {
  postId: string;
  postUrl: string;
  postCreatedAt: string;
  viewsThisMonth: number;
  cpmEarned: number;
  periodStart: string;
  periodEnd: string;
  isActive: boolean; // Still within 30-day window
  daysRemaining: number;
}

export interface CPMCalculationResult {
  // Current month totals
  totalViews: number;
  totalPosts: number;
  totalCPM: number;

  // Per-post breakdown
  posts: PostCPMBreakdown[];

  // Metadata
  calculatedAt: string;
  monthStart: string;
  monthEnd: string;
}

/**
 * Calculate current month CPM earnings for a specific user
 * @param userId - The user ID to calculate CPM for
 * @returns CPM calculation result with per-post breakdown
 */
export async function calculateCurrentMonthCPM(userId: string): Promise<CPMCalculationResult> {
  // 1. Get current month boundaries
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 2. Calculate 30-day cutoff (posts older than this don't earn CPM anymore)
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - CPM_WINDOW_DAYS);

  // 3. Fetch all approved posts within or overlapping the 30-day window
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*, analytics(*)')
    .eq('submitted_by', userId)
    .eq('status', 'approved')
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false });

  if (postsError) {
    throw new Error(`Failed to fetch posts: ${postsError.message}`);
  }

  if (!posts || posts.length === 0) {
    return {
      totalViews: 0,
      totalPosts: 0,
      totalCPM: 0,
      posts: [],
      calculatedAt: now.toISOString(),
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
    };
  }

  // 4. Calculate CPM for each post
  const postBreakdowns: PostCPMBreakdown[] = [];
  let totalViews = 0;
  let totalCPM = 0;

  for (const post of posts as PostWithAnalytics[]) {
    const postCreatedAt = new Date(post.created_at);

    // Calculate this post's active CPM period
    const postExpiresAt = new Date(postCreatedAt);
    postExpiresAt.setDate(postExpiresAt.getDate() + CPM_WINDOW_DAYS);

    const isActive = now <= postExpiresAt;
    const daysRemaining = isActive
      ? Math.ceil((postExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Determine the active period THIS MONTH for this post
    // A post can span multiple months, so we calculate only the views gained THIS month
    const periodStart = postCreatedAt > monthStart ? postCreatedAt : monthStart;
    const periodEnd = postExpiresAt < now ? postExpiresAt : (monthEnd < now ? monthEnd : now);

    // Only calculate if the post was active during this month
    if (periodStart <= periodEnd) {
      // Get analytics snapshots for this period
      const analytics = post.analytics || [];

      if (analytics.length === 0) {
        // No analytics yet - skip this post
        postBreakdowns.push({
          postId: post.id,
          postUrl: post.url,
          postCreatedAt: post.created_at,
          viewsThisMonth: 0,
          cpmEarned: 0,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          isActive,
          daysRemaining,
        });
        continue;
      }

      // Sort analytics by fetched_at ascending
      const sortedAnalytics = [...analytics].sort((a, b) =>
        new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
      );

      // Find first snapshot at or after period start
      const firstSnapshot = sortedAnalytics.find(a =>
        new Date(a.fetched_at) >= periodStart
      ) || sortedAnalytics[0]; // Fallback to earliest if none found

      // Find last snapshot at or before period end
      const lastSnapshot = [...sortedAnalytics]
        .reverse()
        .find(a => new Date(a.fetched_at) <= periodEnd) || sortedAnalytics[sortedAnalytics.length - 1];

      // Calculate views gained this month
      const viewsStart = firstSnapshot.views || 0;
      const viewsEnd = lastSnapshot.views || 0;
      const viewsThisMonth = Math.max(0, viewsEnd - viewsStart);

      // Calculate CPM for this post
      const cpmEarned = (viewsThisMonth / 1000) * CPM_RATE;

      postBreakdowns.push({
        postId: post.id,
        postUrl: post.url,
        postCreatedAt: post.created_at,
        viewsThisMonth,
        cpmEarned: Number(cpmEarned.toFixed(2)),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        isActive,
        daysRemaining,
      });

      totalViews += viewsThisMonth;
      totalCPM += cpmEarned;
    }
  }

  return {
    totalViews,
    totalPosts: postBreakdowns.length,
    totalCPM: Number(totalCPM.toFixed(2)),
    posts: postBreakdowns,
    calculatedAt: now.toISOString(),
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
  };
}

/**
 * Calculate CPM for a specific month (for payment processing)
 * @param userId - The user ID to calculate CPM for
 * @param year - Year (e.g., 2025)
 * @param month - Month (1-12)
 * @returns CPM calculation result for that month
 */
export async function calculateMonthCPM(
  userId: string,
  year: number,
  month: number
): Promise<CPMCalculationResult> {
  // Month boundaries
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  // 30-day window - posts must have been created within 30 days before month end
  const cutoffDate = new Date(monthEnd);
  cutoffDate.setDate(cutoffDate.getDate() - CPM_WINDOW_DAYS);

  // Fetch posts that were active during this month
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*, analytics(*)')
    .eq('submitted_by', userId)
    .eq('status', 'approved')
    .gte('created_at', cutoffDate.toISOString())
    .lte('created_at', monthEnd.toISOString())
    .order('created_at', { ascending: false });

  if (postsError) {
    throw new Error(`Failed to fetch posts: ${postsError.message}`);
  }

  if (!posts || posts.length === 0) {
    return {
      totalViews: 0,
      totalPosts: 0,
      totalCPM: 0,
      posts: [],
      calculatedAt: new Date().toISOString(),
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
    };
  }

  // Calculate CPM for each post (same logic as above but frozen to month end)
  const postBreakdowns: PostCPMBreakdown[] = [];
  let totalViews = 0;
  let totalCPM = 0;

  for (const post of posts as PostWithAnalytics[]) {
    const postCreatedAt = new Date(post.created_at);
    const postExpiresAt = new Date(postCreatedAt);
    postExpiresAt.setDate(postExpiresAt.getDate() + CPM_WINDOW_DAYS);

    // Active period for this post THIS MONTH
    const periodStart = postCreatedAt > monthStart ? postCreatedAt : monthStart;
    const periodEnd = postExpiresAt < monthEnd ? postExpiresAt : monthEnd;

    if (periodStart <= periodEnd) {
      const analytics = post.analytics || [];

      if (analytics.length === 0) {
        postBreakdowns.push({
          postId: post.id,
          postUrl: post.url,
          postCreatedAt: post.created_at,
          viewsThisMonth: 0,
          cpmEarned: 0,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          isActive: false,
          daysRemaining: 0,
        });
        continue;
      }

      const sortedAnalytics = [...analytics].sort((a, b) =>
        new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
      );

      const firstSnapshot = sortedAnalytics.find(a =>
        new Date(a.fetched_at) >= periodStart
      ) || sortedAnalytics[0];

      const lastSnapshot = [...sortedAnalytics]
        .reverse()
        .find(a => new Date(a.fetched_at) <= periodEnd) || sortedAnalytics[sortedAnalytics.length - 1];

      const viewsStart = firstSnapshot.views || 0;
      const viewsEnd = lastSnapshot.views || 0;
      const viewsThisMonth = Math.max(0, viewsEnd - viewsStart);
      const cpmEarned = (viewsThisMonth / 1000) * CPM_RATE;

      postBreakdowns.push({
        postId: post.id,
        postUrl: post.url,
        postCreatedAt: post.created_at,
        viewsThisMonth,
        cpmEarned: Number(cpmEarned.toFixed(2)),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        isActive: false,
        daysRemaining: 0,
      });

      totalViews += viewsThisMonth;
      totalCPM += cpmEarned;
    }
  }

  return {
    totalViews,
    totalPosts: postBreakdowns.length,
    totalCPM: Number(totalCPM.toFixed(2)),
    posts: postBreakdowns,
    calculatedAt: new Date().toISOString(),
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
  };
}
