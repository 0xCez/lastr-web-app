/**
 * Unified Dashboard Analytics Hook
 * Works for all roles: Admin, UGC Creator, Influencer, Account Manager
 * Fetches real data from database with filters
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import {
  getCurrentWeekBoundaries,
  getMonthBoundaries,
  getWeeksInMonth,
  toISOString,
  toDateString,
  isDateInRange,
} from '@/utils/dateUtils';
import {
  UGC_OPTION_1,
  ContractOption,
  calculateWeeklyRetainer,
  getWeeklyPostTarget,
  getPostsRemaining,
} from '@/constants/contracts';

type Post = Database['public']['Tables']['posts']['Row'];
type Analytics = Database['public']['Tables']['analytics']['Row'];

interface PostWithAnalytics extends Post {
  analytics: Analytics[];
  accounts?: {
    handle: string;
    platform: string;
  };
}

export interface ViralAlert {
  postId: string;
  message: string;
  views: string;
  action: string;
  postUrl?: string;
  accountHandle?: string;
  createdAt?: string;
}

export interface DashboardStats {
  // Display values (formatted strings)
  totalViews: string;
  totalPosts: string;
  totalPostsTikTok?: number; // Raw TikTok post count (for admin breakdown)
  totalPostsInstagram?: number; // Raw Instagram post count (for admin breakdown)
  // 24h trends
  viewsTrend?: { value: string; positive: boolean }; // e.g., "12.5%"
  postsTrend?: { value: string; positive: boolean }; // e.g., "5.0%"
  engagement: string;
  likes: string;
  comments: string;
  bookmarks: string;
  shares: string;

  // UGC Creator specific
  targetPostsWeekly?: number;
  postsThisWeek?: number; // Count of cross-posted videos (min of TT and IG)
  postsThisWeekTikTok?: number; // Raw TikTok post count
  postsThisWeekInstagram?: number; // Raw Instagram post count
  leftToTarget?: number;
  fixedFeePayout?: string; // $75/week retainer for Option 1 when quota met
  cpmPayout?: string; // CPM earnings ($1.5 per 1000 views)
  totalPayout?: string; // Fixed Fee + CPM Payout combined
  weeklyTargetMet?: boolean; // true when postsThisWeek >= 12
  weeksMissed?: number; // Number of weeks this month where quota was NOT met (0-4)
  weeksHit?: number; // Number of weeks this month where quota WAS met (0-4)

  // Admin specific
  revenue?: string;
  downloads?: string;
  rpi?: string;
  rpm?: string;
  cpm?: string;
  conversion?: string;

  // Daily metrics (admin only)
  dailyViews?: string;
  dailyPosts?: number;
  dailySpend?: string;
  dailyPostsTikTok?: number;
  dailyPostsInstagram?: number;
  _rawDaily?: {
    views: number;
    posts: number;
    spend: number;
    crossPostedCount: number;
    cpmSpend: number;
    fixedFeeSpend: number;
    fixedFeeRate: number; // Per-item rate ($6.25 for UGC cross-post, $1.00 for slideshow)
    fixedFeeCount: number; // Number of items (cross-posts or slideshows)
  };

  // Influencer specific
  targetViews?: string;
  leftToTargetViews?: string;
  bonus?: string;

  // Virality alerts
  viralAlerts: ViralAlert[];

  // Raw numbers (for calculations)
  _raw: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalBookmarks: number;
    totalPosts: number;
    // For payout breakdown calculations
    cpmRate?: number; // e.g., 1.5
    cpmViews?: number; // views used for CPM calculation
    cpmAmount?: number; // raw CPM payout amount
    fixedFeePerPost?: number; // e.g., 6.25
    crossPostedCount?: number; // min(TT, IG)
    fixedFeeAmount?: number; // raw fixed fee payout amount
    totalPayoutAmount?: number; // raw total payout
  };
}

interface UseDashboardAnalyticsOptions {
  role: 'admin' | 'ugc_creator' | 'influencer' | 'account_manager';
  userId?: string;
  dateRange?: string[]; // [startDate, endDate]
  accountIds?: string[];
  platformFilter?: string[];
  creatorFilter?: string; // For admin: filter by specific creator
  refreshTrigger?: number; // Increment to force refetch
  contentTypeFilter?: 'ugc_video' | 'slideshow'; // For admin: filter by content type
}

export function useDashboardAnalytics(options: UseDashboardAnalyticsOptions) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        // Only show full loading state on initial load
        // For subsequent refreshes, show subtle refresh indicator
        if (!hasLoadedOnce) {
          setLoading(true);
        } else {
          setIsRefreshing(true);
        }

        // Build query based on role
        let postsQuery = supabase
          .from('posts')
          .select('*, analytics(*), accounts(handle, platform)')
          .eq('status', 'approved') // Only count approved posts
          .order('created_at', { ascending: false });

        // For non-admins, filter by current user
        if (options.role !== 'admin') {
          let userId = options.userId;
          if (!userId) {
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!authUser) throw new Error('No authenticated user');
            userId = authUser.id;
          }
          postsQuery = postsQuery.eq('submitted_by', userId);
        }

        // Apply date range filter
        if (options.dateRange && options.dateRange.length === 2) {
          const [startDate, endDate] = options.dateRange;
          postsQuery = postsQuery
            .gte('created_at', startDate)
            .lte('created_at', endDate);
        }

        // Apply account filter
        if (options.accountIds && options.accountIds.length > 0) {
          postsQuery = postsQuery.in('account_id', options.accountIds);
        }

        // Apply platform filter
        if (options.platformFilter && options.platformFilter.length > 0) {
          postsQuery = postsQuery.in('platform', options.platformFilter as ('tiktok' | 'instagram' | 'facebook')[]);
        }

        // Apply creator filter (admin only)
        if (options.role === 'admin' && options.creatorFilter) {
          postsQuery = postsQuery.eq('submitted_by', options.creatorFilter);
        }

        // Apply content type filter (admin only)
        if (options.role === 'admin' && options.contentTypeFilter) {
          postsQuery = postsQuery.eq('content_type', options.contentTypeFilter);
        }

        const { data: posts, error: postsError } = await postsQuery;

        if (postsError) throw postsError;

        // Calculate aggregated metrics
        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalShares = 0;
        let totalBookmarks = 0;
        let totalDownloads = 0;

        (posts as PostWithAnalytics[])?.forEach(post => {
          // Get latest analytics for each post
          if (post.analytics && post.analytics.length > 0) {
            const sortedAnalytics = [...post.analytics].sort((a, b) =>
              new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
            );
            const latestAnalytics = sortedAnalytics[0];

            totalViews += latestAnalytics.views || 0;
            totalLikes += latestAnalytics.likes || 0;
            totalComments += latestAnalytics.comments || 0;
            totalShares += latestAnalytics.shares || 0;
            totalBookmarks += latestAnalytics.bookmarks || 0;
            totalDownloads += latestAnalytics.downloads || 0;
          }
        });

        // Calculate trend percentages helper
        const calculateTrend = (current: number, previous: number): { value: string; positive: boolean } | undefined => {
          if (previous === 0) {
            if (current === 0) return undefined; // No data to compare
            return { value: "+100%", positive: true };
          }
          const percentChange = ((current - previous) / previous) * 100;
          const sign = percentChange >= 0 ? "+" : "";
          return {
            value: `${sign}${percentChange.toFixed(1)}%`,
            positive: percentChange >= 0
          };
        };

        // Period-over-period comparison (compare current period to equivalent previous period)
        let viewsTrend: { value: string; positive: boolean } | undefined;
        let postsTrend: { value: string; positive: boolean } | undefined;

        if (options.dateRange && options.dateRange.length === 2) {
          const [startDate, endDate] = options.dateRange;
          const periodStart = new Date(startDate);
          const periodEnd = new Date(endDate);
          const periodDurationMs = periodEnd.getTime() - periodStart.getTime();

          // Calculate previous period (same duration, immediately before)
          const prevPeriodEnd = new Date(periodStart.getTime() - 1); // 1ms before current period start
          const prevPeriodStart = new Date(prevPeriodEnd.getTime() - periodDurationMs);

          // Fetch posts from previous period for comparison
          let prevPostsQuery = supabase
            .from('posts')
            .select('*, analytics(*)')
            .eq('status', 'approved')
            .gte('created_at', prevPeriodStart.toISOString())
            .lte('created_at', prevPeriodEnd.toISOString());

          // Apply same filters as main query
          if (options.role !== 'admin') {
            let userId = options.userId;
            if (!userId) {
              const { data: { user: authUser } } = await supabase.auth.getUser();
              userId = authUser?.id;
            }
            if (userId) {
              prevPostsQuery = prevPostsQuery.eq('submitted_by', userId);
            }
          }

          if (options.accountIds && options.accountIds.length > 0) {
            prevPostsQuery = prevPostsQuery.in('account_id', options.accountIds);
          }

          if (options.platformFilter && options.platformFilter.length > 0) {
            prevPostsQuery = prevPostsQuery.in('platform', options.platformFilter as ('tiktok' | 'instagram' | 'facebook')[]);
          }

          if (options.role === 'admin' && options.creatorFilter) {
            prevPostsQuery = prevPostsQuery.eq('submitted_by', options.creatorFilter);
          }

          if (options.role === 'admin' && options.contentTypeFilter) {
            prevPostsQuery = prevPostsQuery.eq('content_type', options.contentTypeFilter);
          }

          const { data: prevPosts } = await prevPostsQuery;

          // Calculate previous period totals
          let prevTotalViews = 0;
          (prevPosts as PostWithAnalytics[] || []).forEach(post => {
            if (post.analytics && post.analytics.length > 0) {
              const sortedAnalytics = [...post.analytics].sort((a, b) =>
                new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
              );
              prevTotalViews += sortedAnalytics[0]?.views || 0;
            }
          });

          const prevTotalPosts = prevPosts?.length || 0;
          const currentTotalPosts = posts?.length || 0;

          // Calculate trends
          viewsTrend = calculateTrend(totalViews, prevTotalViews);
          postsTrend = calculateTrend(currentTotalPosts, prevTotalPosts);
        }

        // Calculate engagement rate
        const totalEngagements = totalLikes + totalComments + totalShares + totalBookmarks;
        const engagementRate = totalViews > 0
          ? (totalEngagements / totalViews) * 100
          : 0;

        // Format numbers
        const formatNumber = (num: number): string => {
          if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
          if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
          return num.toString();
        };

        const formatCurrency = (num: number): string => {
          return `$${num.toFixed(2)}`;
        };

        // Fetch viral alerts from posts table (simple database read)
        // Only show unacknowledged alerts
        let viralAlertsQuery = supabase
          .from('posts')
          .select('id, url, viral_alert_message, viral_alert_views, viral_alert_created_at, accounts(handle)')
          .eq('status', 'approved')
          .eq('viral_alert_acknowledged', false)
          .not('viral_alert_message', 'is', null)
          .order('viral_alert_created_at', { ascending: false });

        // Filter by user for non-admins
        if (options.role !== 'admin') {
          let userId = options.userId;
          if (!userId) {
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!authUser) throw new Error('No authenticated user');
            userId = authUser.id;
          }
          viralAlertsQuery = viralAlertsQuery.eq('submitted_by', userId);
        }

        // Apply creator filter for admin
        if (options.role === 'admin' && options.creatorFilter) {
          viralAlertsQuery = viralAlertsQuery.eq('submitted_by', options.creatorFilter);
        }

        // Apply content type filter for admin
        if (options.role === 'admin' && options.contentTypeFilter) {
          viralAlertsQuery = viralAlertsQuery.eq('content_type', options.contentTypeFilter);
        }

        const { data: viralAlertPosts, error: viralAlertsError } = await viralAlertsQuery;

        if (viralAlertsError) {
          console.error('Error fetching viral alerts:', viralAlertsError);
        }

        // Transform to ViralAlert format
        const viralAlerts: ViralAlert[] = (viralAlertPosts || []).map(post => ({
          postId: post.id,
          message: post.viral_alert_message || '',
          views: formatNumber(post.viral_alert_views || 0),
          action: 'Engaged',
          postUrl: post.url,
          accountHandle: post.accounts?.handle || 'Unknown',
          createdAt: new Date(post.viral_alert_created_at || '').toLocaleDateString(),
        }));

        // Calculate platform breakdown for total posts
        const totalPostsTikTok = (posts as PostWithAnalytics[])?.filter(p => p.platform === 'tiktok').length || 0;
        const totalPostsInstagram = (posts as PostWithAnalytics[])?.filter(p => p.platform === 'instagram').length || 0;

        // Base stats (all roles)
        const baseStats: DashboardStats = {
          totalViews: formatNumber(totalViews),
          totalPosts: posts?.length.toString() || "0",
          totalPostsTikTok,
          totalPostsInstagram,
          viewsTrend,
          postsTrend,
          engagement: `${engagementRate.toFixed(2)}%`,
          likes: formatNumber(totalLikes),
          comments: formatNumber(totalComments),
          bookmarks: formatNumber(totalBookmarks),
          shares: formatNumber(totalShares),
          viralAlerts, // Add viral alerts
          _raw: {
            totalViews,
            totalLikes,
            totalComments,
            totalShares,
            totalBookmarks,
            totalPosts: posts?.length || 0,
          },
        };

        // Add role-specific stats
        if (options.role === 'ugc_creator') {
          // Get user ID
          let userId = options.userId;
          if (!userId) {
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!authUser) throw new Error('No authenticated user');
            userId = authUser.id;
          }

          // Fetch user's contract option and approved_at date
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('contract_option, approved_at')
            .eq('id', userId)
            .single();

          if (userError) {
            console.error('Error fetching user contract option:', userError);
          }

          const contractOption = (userData?.contract_option || null) as ContractOption;
          const userApprovedAt = userData?.approved_at ? new Date(userData.approved_at) : null;
          const isOption1 = contractOption === 'option1';

          // Get current month boundaries using UTC-safe utilities
          const now = new Date();
          const [monthStart, monthEnd] = getMonthBoundaries(now);
          const monthStartStr = toDateString(monthStart);

          // Calculate CPM from cpm_post_breakdown table (current month)
          const { data: cpmRecords, error: cpmError } = await supabase
            .from('cpm_post_breakdown')
            .select('cpm_earned')
            .eq('user_id', userId)
            .gte('date', monthStartStr);

          if (cpmError) {
            console.error('Error fetching CPM:', cpmError);
          }

          const totalCPM = cpmRecords?.reduce((sum, r) => sum + Number(r.cpm_earned), 0) || 0;

          // Safety cap from constants
          const cappedCPM = Math.min(totalCPM, UGC_OPTION_1.MONTHLY_CAP);

          console.log('🔥 Total CPM from breakdown table:', totalCPM);
          if (totalCPM > UGC_OPTION_1.MONTHLY_CAP) {
            console.warn(`⚠️ CPM exceeded display cap: $${totalCPM.toFixed(2)} capped to $${UGC_OPTION_1.MONTHLY_CAP}`);
          }

          // Get current week boundaries (Monday-Sunday) using UTC-safe utilities
          const [weekStart, weekEnd] = getCurrentWeekBoundaries('mon-sun');

          // OPTIMIZED: Fetch ALL posts for the ENTIRE MONTH in ONE query
          // Then aggregate client-side (fixes N+1 query issue)
          // Include platform to calculate cross-posting
          const { data: monthPosts, error: monthPostsError } = await supabase
            .from('posts')
            .select('id, created_at, platform')
            .eq('submitted_by', userId)
            .eq('status', 'approved')
            .gte('created_at', toISOString(monthStart))
            .lte('created_at', toISOString(monthEnd));

          if (monthPostsError) {
            console.error('Error fetching month posts:', monthPostsError);
          }

          // Count posts for current week by platform
          const weekPosts = (monthPosts || []).filter(post => {
            const postDate = new Date(post.created_at);
            return isDateInRange(postDate, weekStart, weekEnd);
          });

          const tiktokCount = weekPosts.filter(p => p.platform === 'tiktok').length;
          const instagramCount = weekPosts.filter(p => p.platform === 'instagram').length;

          // Cross-posted count = min of TT and IG (each video should be on both)
          const postsThisWeek = Math.min(tiktokCount, instagramCount);

          const targetPostsWeekly = getWeeklyPostTarget(contractOption);
          const leftToTarget = getPostsRemaining(postsThisWeek, contractOption);
          const currentWeekTargetMet = postsThisWeek >= targetPostsWeekly;

          // Calculate retainer payout for Option 1 creators
          let retainerPayout = 0;
          let weeksMet = 0;
          let weeksMissed = 0;

          if (isOption1) {
            // Get weeks in month using utility function
            const weeksInMonth = getWeeksInMonth(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              true // Include current week if quota met
            );

            // For each week, count cross-posted videos client-side (no additional queries!)
            for (const week of weeksInMonth) {
              // Skip weeks that started before the user was approved
              if (userApprovedAt && userApprovedAt > week.start) {
                continue;
              }

              // Only count complete weeks OR current week if quota already met
              if (!week.isComplete && !currentWeekTargetMet) {
                continue;
              }

              // Count posts in this week by platform
              const postsInWeek = (monthPosts || []).filter(post => {
                const postDate = new Date(post.created_at);
                return isDateInRange(postDate, week.start, week.end);
              });

              // Cross-posted count = min of TT and IG for this week
              const weekTiktok = postsInWeek.filter(p => p.platform === 'tiktok').length;
              const weekInstagram = postsInWeek.filter(p => p.platform === 'instagram').length;
              const crossPostedInWeek = Math.min(weekTiktok, weekInstagram);

              if (crossPostedInWeek >= targetPostsWeekly) {
                retainerPayout += UGC_OPTION_1.WEEKLY_RETAINER;
                weeksMet++;
              } else {
                weeksMissed++;
              }
            }

            baseStats.weeksMissed = weeksMissed;
            baseStats.weeksHit = weeksMet;

            console.log('💰 Option 1 Retainer Calculation:', {
              weeksChecked: weeksInMonth.length,
              weeksMet,
              weeksMissed,
              retainerPayout,
              currentWeekTargetMet
            });
          }

          // Calculate total payout (fixed fee + CPM)
          const totalPayout = retainerPayout + cappedCPM;

          baseStats.targetPostsWeekly = targetPostsWeekly;
          baseStats.postsThisWeek = postsThisWeek;
          baseStats.postsThisWeekTikTok = tiktokCount;
          baseStats.postsThisWeekInstagram = instagramCount;
          baseStats.leftToTarget = leftToTarget;
          baseStats.fixedFeePayout = formatCurrency(retainerPayout);
          baseStats.cpmPayout = formatCurrency(cappedCPM);
          baseStats.totalPayout = formatCurrency(totalPayout);
          baseStats.weeklyTargetMet = currentWeekTargetMet;
        }

        if (options.role === 'admin') {
          // Admin-specific metrics - Calculate REAL CPM from creator payouts
          const currentDate = new Date();

          // Determine date range for CPM query
          let cpmStartStr: string;
          let cpmEndStr: string;

          if (options.dateRange && options.dateRange.length === 2) {
            // Use the selected date range
            cpmStartStr = new Date(options.dateRange[0]).toISOString().split('T')[0];
            cpmEndStr = new Date(options.dateRange[1]).toISOString().split('T')[0];
            console.log('📅 Using date filter for CPM:', { cpmStartStr, cpmEndStr });
          } else {
            // Default to current month
            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            cpmStartStr = monthStart.toISOString().split('T')[0];
            cpmEndStr = currentDate.toISOString().split('T')[0];
            console.log('📅 Using current month for CPM:', { cpmStartStr, cpmEndStr });
          }

          // Get post IDs that match the filters (date range, account, platform, creator)
          // This ensures CPM is calculated only for posts that appear in the dashboard view
          let postIdsForCpm: string[] | null = null;

          // Always filter CPM by the posts shown in the dashboard (same date range for post creation)
          {
            let postsForCpmQuery = supabase.from('posts').select('id').eq('status', 'approved');

            // Apply date range filter to post creation date (not CPM record date)
            if (options.dateRange && options.dateRange.length === 2) {
              postsForCpmQuery = postsForCpmQuery
                .gte('created_at', options.dateRange[0])
                .lte('created_at', options.dateRange[1]);
            }

            if (options.accountIds && options.accountIds.length > 0) {
              postsForCpmQuery = postsForCpmQuery.in('account_id', options.accountIds);
            }

            if (options.platformFilter && options.platformFilter.length > 0) {
              postsForCpmQuery = postsForCpmQuery.in('platform', options.platformFilter as ('tiktok' | 'instagram' | 'facebook')[]);
            }

            if (options.creatorFilter) {
              postsForCpmQuery = postsForCpmQuery.eq('submitted_by', options.creatorFilter);
            }

            const { data: postsForCpm } = await postsForCpmQuery;
            postIdsForCpm = postsForCpm?.map(p => p.id) || [];
            console.log('📝 CPM filtered by posts created in date range:', postIdsForCpm.length);
          }

          // Query cpm_post_breakdown filtered by post IDs (which already match all filters)
          // We filter by post_id to ensure CPM matches the posts shown in the dashboard
          let allCpmRecords: { cpm_earned: number }[] = [];
          let cpmError: Error | null = null;

          if (postIdsForCpm.length === 0) {
            // No matching posts, CPM = 0
            console.log('📊 No posts match filters, CPM = 0');
            allCpmRecords = [];
          } else {
            // Get all CPM records for these specific posts (no date filter on CPM records)
            // The date filter was already applied to post creation dates
            const { data, error } = await supabase
              .from('cpm_post_breakdown')
              .select('cpm_earned')
              .in('post_id', postIdsForCpm);

            allCpmRecords = data || [];
            cpmError = error;
          }

          if (cpmError) {
            console.error('Error fetching admin CPM data:', cpmError);
          }

          // Sum up all CPM payouts (only UGC videos have CPM)
          const totalCpmPayout = allCpmRecords.reduce((sum, r) => sum + Number(r.cpm_earned), 0);

          // Calculate fixed fees for the period
          // Query posts with content_type to separate UGC vs slideshow
          const { data: periodPosts } = await supabase
            .from('posts')
            .select('id, platform, content_type')
            .eq('status', 'approved')
            .in('id', postIdsForCpm || []);

          const ugcPeriodPosts = periodPosts?.filter(p => p.content_type !== 'slideshow') || [];
          const slideshowPeriodPosts = periodPosts?.filter(p => p.content_type === 'slideshow') || [];

          // UGC fixed fees: cross-posts × $6.25
          const ugcByPlatform = { tiktok: 0, instagram: 0 };
          ugcPeriodPosts.forEach(p => {
            if (p.platform === 'tiktok') ugcByPlatform.tiktok++;
            if (p.platform === 'instagram') ugcByPlatform.instagram++;
          });
          const periodUgcCrossPosted = Math.min(ugcByPlatform.tiktok, ugcByPlatform.instagram);
          const periodUgcFixedFee = periodUgcCrossPosted * UGC_OPTION_1.FIXED_FEE_PER_POST;

          // Slideshow fixed fees: count × $1.00
          const periodSlideshowFixedFee = slideshowPeriodPosts.length * UGC_OPTION_1.FIXED_FEE_PER_SLIDESHOW;

          // Total fixed fees and CPM based on content type filter
          let periodFixedFee: number;
          let periodCpm: number;

          if (options.contentTypeFilter === 'slideshow') {
            periodFixedFee = periodSlideshowFixedFee;
            periodCpm = 0; // Slideshows have no CPM
          } else if (options.contentTypeFilter === 'ugc_video') {
            periodFixedFee = periodUgcFixedFee;
            periodCpm = totalCpmPayout;
          } else {
            // Combined: sum both
            periodFixedFee = periodUgcFixedFee + periodSlideshowFixedFee;
            periodCpm = totalCpmPayout;
          }

          console.log('💰 Admin Period Calculation:', {
            totalPosts: posts?.length || 0,
            ugcPosts: ugcPeriodPosts.length,
            slideshowPosts: slideshowPeriodPosts.length,
            ugcCrossPosted: periodUgcCrossPosted,
            ugcFixedFee: periodUgcFixedFee,
            slideshowFixedFee: periodSlideshowFixedFee,
            totalCpmPayout,
            periodFixedFee,
            periodCpm,
            filter: options.contentTypeFilter || 'combined',
            creatorFilter: options.creatorFilter || 'ALL'
          });

          // Calculate real CPM: (Total CPM Payout / Total Views) * 1000
          const realCpm = totalViews > 0 ? (periodCpm / totalViews) * 1000 : 0;

          // Revenue = Fixed Fees + CPM (total payout to creators)
          const revenue = periodFixedFee + periodCpm;

          // RPM = Revenue per 1000 views
          const rpm = totalViews > 0 ? (revenue / totalViews) * 1000 : 0;

          // RPI = Revenue per post
          const rpi = posts?.length ? revenue / posts.length : 0;

          const conversion = 0; // Placeholder for future

          console.log('📈 Final Admin Metrics:', {
            revenue: formatCurrency(revenue),
            fixedFee: formatCurrency(periodFixedFee),
            cpm: formatCurrency(periodCpm),
            realCpm: formatCurrency(realCpm),
            rpm: formatCurrency(rpm),
            rpi: formatCurrency(rpi)
          });

          baseStats.revenue = formatCurrency(revenue);
          baseStats.downloads = formatNumber(totalDownloads);
          baseStats.rpi = formatCurrency(rpi);
          baseStats.rpm = formatCurrency(rpm);
          baseStats.cpm = formatCurrency(realCpm);
          baseStats.conversion = `${conversion.toFixed(2)}%`;

          // ====== DAILY METRICS (Today's data) ======
          // Get today's date string for querying cpm_post_breakdown
          const todayDate = new Date();
          const todayDateStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
          const todayStartStr = todayDate.toISOString().split('T')[0] + 'T00:00:00.000Z';

          // Get post IDs that match current filters (for filtering daily views)
          let filteredPostIds: string[] | null = null;
          if (options.accountIds?.length || options.platformFilter?.length || options.creatorFilter || options.contentTypeFilter) {
            let filterQuery = supabase.from('posts').select('id').eq('status', 'approved');
            if (options.accountIds && options.accountIds.length > 0) {
              filterQuery = filterQuery.in('account_id', options.accountIds);
            }
            if (options.platformFilter && options.platformFilter.length > 0) {
              filterQuery = filterQuery.in('platform', options.platformFilter as ('tiktok' | 'instagram' | 'facebook')[]);
            }
            if (options.creatorFilter) {
              filterQuery = filterQuery.eq('submitted_by', options.creatorFilter);
            }
            if (options.contentTypeFilter) {
              filterQuery = filterQuery.eq('content_type', options.contentTypeFilter);
            }
            const { data: filteredPosts } = await filterQuery;
            filteredPostIds = filteredPosts?.map(p => p.id) || [];
          }

          // Query cpm_post_breakdown for today's views_delta (views gained today across ALL posts)
          let dailyCpmQuery = supabase
            .from('cpm_post_breakdown')
            .select('views_delta, post_id')
            .eq('date', todayDateStr);

          // Apply post filter if we have filtered post IDs
          if (filteredPostIds !== null) {
            if (filteredPostIds.length === 0) {
              // No matching posts, daily views = 0
              dailyCpmQuery = dailyCpmQuery.in('post_id', ['no-match']);
            } else {
              dailyCpmQuery = dailyCpmQuery.in('post_id', filteredPostIds);
            }
          }

          const { data: dailyCpmRecords, error: dailyCpmError } = await dailyCpmQuery;

          if (dailyCpmError) {
            console.error('Error fetching daily CPM records:', dailyCpmError);
          }

          // Sum views_delta for today = views gained today across all posts
          const dailyViews = (dailyCpmRecords || []).reduce((sum, r) => sum + (r.views_delta || 0), 0);

          // Query posts created today (for post count and spend calculation)
          // Include content_type to separate UGC videos from slideshows
          let dailyPostsQuery = supabase
            .from('posts')
            .select('id, platform, content_type')
            .eq('status', 'approved')
            .gte('created_at', todayStartStr);

          if (options.accountIds && options.accountIds.length > 0) {
            dailyPostsQuery = dailyPostsQuery.in('account_id', options.accountIds);
          }
          if (options.platformFilter && options.platformFilter.length > 0) {
            dailyPostsQuery = dailyPostsQuery.in('platform', options.platformFilter as ('tiktok' | 'instagram' | 'facebook')[]);
          }
          if (options.creatorFilter) {
            dailyPostsQuery = dailyPostsQuery.eq('submitted_by', options.creatorFilter);
          }
          if (options.contentTypeFilter) {
            dailyPostsQuery = dailyPostsQuery.eq('content_type', options.contentTypeFilter);
          }

          const { data: dailyPosts, error: dailyPostsError } = await dailyPostsQuery;

          if (dailyPostsError) {
            console.error('Error fetching daily posts:', dailyPostsError);
          }

          // Separate posts by content type for proper pricing calculation
          // UGC videos: $6.25 per cross-post + CPM
          // Slideshows: $1.00 per post, NO CPM
          const ugcPosts = dailyPosts?.filter(p => p.content_type !== 'slideshow') || [];
          const slideshowPosts = dailyPosts?.filter(p => p.content_type === 'slideshow') || [];

          // UGC calculation: cross-posts × $6.25
          const ugcTiktokCount = ugcPosts.filter(p => p.platform === 'tiktok').length;
          const ugcInstagramCount = ugcPosts.filter(p => p.platform === 'instagram').length;
          const ugcCrossPostedCount = Math.min(ugcTiktokCount, ugcInstagramCount);
          const ugcFixedFee = ugcCrossPostedCount * UGC_OPTION_1.FIXED_FEE_PER_POST;

          // UGC CPM: filter dailyCpmRecords to only UGC post IDs
          const ugcPostIds = ugcPosts.map(p => p.id);
          const ugcViews = (dailyCpmRecords || [])
            .filter(r => ugcPostIds.includes(r.post_id))
            .reduce((sum, r) => sum + (r.views_delta || 0), 0);
          const ugcCpmSpend = (ugcViews / 1000) * UGC_OPTION_1.CPM_RATE;

          // Slideshow calculation: count × $1.00, NO CPM
          const slideshowFixedFee = slideshowPosts.length * UGC_OPTION_1.FIXED_FEE_PER_SLIDESHOW;

          // Calculate totals based on filter
          let dailyFixedFeeSpend: number;
          let dailyCpmSpend: number;
          let dailyFixedFeeRate: number;
          let dailyFixedFeeCount: number;
          let dailyCrossPostedCount: number;

          if (options.contentTypeFilter === 'slideshow') {
            // Slideshow only
            dailyFixedFeeSpend = slideshowFixedFee;
            dailyCpmSpend = 0;
            dailyFixedFeeRate = UGC_OPTION_1.FIXED_FEE_PER_SLIDESHOW;
            dailyFixedFeeCount = slideshowPosts.length;
            dailyCrossPostedCount = 0;
          } else if (options.contentTypeFilter === 'ugc_video') {
            // UGC only
            dailyFixedFeeSpend = ugcFixedFee;
            dailyCpmSpend = ugcCpmSpend;
            dailyFixedFeeRate = UGC_OPTION_1.FIXED_FEE_PER_POST;
            dailyFixedFeeCount = ugcCrossPostedCount;
            dailyCrossPostedCount = ugcCrossPostedCount;
          } else {
            // Combined: sum both UGC and Slideshow
            dailyFixedFeeSpend = ugcFixedFee + slideshowFixedFee;
            dailyCpmSpend = ugcCpmSpend;
            // For combined view, show the UGC rate as it's the primary
            dailyFixedFeeRate = UGC_OPTION_1.FIXED_FEE_PER_POST;
            dailyFixedFeeCount = ugcCrossPostedCount + slideshowPosts.length;
            dailyCrossPostedCount = ugcCrossPostedCount;
          }

          const dailyTotalSpend = dailyFixedFeeSpend + dailyCpmSpend;

          // Platform counts for display (all posts regardless of content type)
          const dailyTiktokCount = dailyPosts?.filter(p => p.platform === 'tiktok').length || 0;
          const dailyInstagramCount = dailyPosts?.filter(p => p.platform === 'instagram').length || 0;

          console.log('📅 Daily Metrics:', {
            todayStart: todayStartStr,
            postsToday: dailyPosts?.length || 0,
            ugcPosts: ugcPosts.length,
            slideshowPosts: slideshowPosts.length,
            ugcCrossPosted: ugcCrossPostedCount,
            ugcFixedFee,
            slideshowFixedFee,
            ugcViews,
            ugcCpmSpend,
            totalFixedFee: dailyFixedFeeSpend,
            totalCpm: dailyCpmSpend,
            totalSpend: dailyTotalSpend,
            filter: options.contentTypeFilter || 'combined'
          });

          baseStats.dailyViews = formatNumber(dailyViews);
          baseStats.dailyPosts = dailyPosts?.length || 0;
          baseStats.dailySpend = formatCurrency(dailyTotalSpend);
          baseStats.dailyPostsTikTok = dailyTiktokCount;
          baseStats.dailyPostsInstagram = dailyInstagramCount;
          baseStats._rawDaily = {
            views: dailyViews,
            posts: dailyPosts?.length || 0,
            spend: dailyTotalSpend,
            crossPostedCount: dailyCrossPostedCount,
            cpmSpend: dailyCpmSpend,
            fixedFeeSpend: dailyFixedFeeSpend,
            fixedFeeRate: dailyFixedFeeRate,
            fixedFeeCount: dailyFixedFeeCount,
          };

          // If admin has selected a specific creator, also calculate their UGC metrics
          if (options.creatorFilter) {
            const creatorId = options.creatorFilter;

            // Fetch creator's contract option and approved_at date
            const { data: creatorData, error: creatorError } = await supabase
              .from('users')
              .select('contract_option, approved_at')
              .eq('id', creatorId)
              .single();

            if (creatorError) {
              console.error('Error fetching creator contract option:', creatorError);
            }

            const creatorContractOption = (creatorData?.contract_option || null) as ContractOption;

            // Get month boundaries using UTC-safe utilities
            const now = new Date();
            const [creatorMonthStart, creatorMonthEnd] = getMonthBoundaries(now);

            // Get posts for this creator that match the date filter (including platform for cross-post calculation)
            // This ensures CPM and Fixed Fee match the posts shown in the dashboard view
            let creatorPostIdsForCpm: string[] = [];
            let creatorFilteredTiktokCount = 0;
            let creatorFilteredInstagramCount = 0;

            {
              let creatorPostsQuery = supabase
                .from('posts')
                .select('id, platform')
                .eq('submitted_by', creatorId)
                .eq('status', 'approved');

              // Apply date range filter to post creation date
              if (options.dateRange && options.dateRange.length === 2) {
                creatorPostsQuery = creatorPostsQuery
                  .gte('created_at', options.dateRange[0])
                  .lte('created_at', options.dateRange[1]);
                console.log('📅 Admin Creator filtering posts by date range:', options.dateRange);
              }

              // Apply platform filter if set
              if (options.platformFilter && options.platformFilter.length > 0) {
                creatorPostsQuery = creatorPostsQuery.in('platform', options.platformFilter as ('tiktok' | 'instagram' | 'facebook')[]);
              }

              // Apply account filter if set
              if (options.accountIds && options.accountIds.length > 0) {
                creatorPostsQuery = creatorPostsQuery.in('account_id', options.accountIds);
              }

              const { data: creatorPostsForCpm } = await creatorPostsQuery;
              creatorPostIdsForCpm = creatorPostsForCpm?.map(p => p.id) || [];

              // Count by platform for cross-post calculation
              creatorFilteredTiktokCount = creatorPostsForCpm?.filter(p => p.platform === 'tiktok').length || 0;
              creatorFilteredInstagramCount = creatorPostsForCpm?.filter(p => p.platform === 'instagram').length || 0;

              console.log('📝 Admin Creator posts filtered:', {
                total: creatorPostIdsForCpm.length,
                tiktok: creatorFilteredTiktokCount,
                instagram: creatorFilteredInstagramCount
              });
            }

            // Get CPM for these specific posts
            let creatorCpmRecords: { cpm_earned: number }[] = [];
            let creatorCpmError: Error | null = null;

            if (creatorPostIdsForCpm.length === 0) {
              console.log('📊 No posts match filters for creator CPM, CPM = 0');
              creatorCpmRecords = [];
            } else {
              const { data, error } = await supabase
                .from('cpm_post_breakdown')
                .select('cpm_earned')
                .in('post_id', creatorPostIdsForCpm);

              creatorCpmRecords = data || [];
              creatorCpmError = error;
            }

            if (creatorCpmError) {
              console.error('Error fetching creator CPM:', creatorCpmError);
            }

            const creatorTotalCPM = creatorCpmRecords?.reduce((sum, r) => sum + Number(r.cpm_earned), 0) || 0;
            const creatorCappedCPM = Math.min(creatorTotalCPM, UGC_OPTION_1.MONTHLY_CAP);

            // Get week boundaries using UTC-safe utilities
            const [creatorWeekStart, creatorWeekEnd] = getCurrentWeekBoundaries('mon-sun');

            // OPTIMIZED: Fetch ALL posts for the ENTIRE MONTH in ONE query
            // Include platform to calculate cross-posting
            const { data: creatorMonthPosts, error: creatorMonthPostsError } = await supabase
              .from('posts')
              .select('id, created_at, platform')
              .eq('submitted_by', creatorId)
              .eq('status', 'approved')
              .gte('created_at', toISOString(creatorMonthStart))
              .lte('created_at', toISOString(creatorMonthEnd));

            if (creatorMonthPostsError) {
              console.error('Error fetching creator month posts:', creatorMonthPostsError);
            }

            // Count posts for current week by platform
            const creatorWeekPosts = (creatorMonthPosts || []).filter(post => {
              const postDate = new Date(post.created_at);
              return isDateInRange(postDate, creatorWeekStart, creatorWeekEnd);
            });

            const creatorTiktokCount = creatorWeekPosts.filter(p => p.platform === 'tiktok').length;
            const creatorInstagramCount = creatorWeekPosts.filter(p => p.platform === 'instagram').length;

            // Cross-posted count = min of TT and IG
            const creatorPostsThisWeek = Math.min(creatorTiktokCount, creatorInstagramCount);

            const creatorTargetPostsWeekly = getWeeklyPostTarget(creatorContractOption);
            const creatorLeftToTarget = getPostsRemaining(creatorPostsThisWeek, creatorContractOption);
            const creatorWeeklyTargetMet = creatorPostsThisWeek >= creatorTargetPostsWeekly;

            // Calculate fixed fee based on cross-posted videos (1 TT + 1 IG = 1 post = $6.25)
            // Use min(TikTok count, Instagram count) from the filtered date range
            const creatorCrossPostedCount = Math.min(creatorFilteredTiktokCount, creatorFilteredInstagramCount);
            const creatorFixedFeePayout = creatorCrossPostedCount * UGC_OPTION_1.FIXED_FEE_PER_POST;

            console.log('💰 Admin View - Creator Fixed Fee:', {
              creatorId,
              tiktokCount: creatorFilteredTiktokCount,
              instagramCount: creatorFilteredInstagramCount,
              crossPostedCount: creatorCrossPostedCount,
              fixedFeePerPost: UGC_OPTION_1.FIXED_FEE_PER_POST,
              totalFixedFee: creatorFixedFeePayout
            });

            // Calculate total payout for creator (fixed fee + CPM)
            const creatorTotalPayout = creatorFixedFeePayout + creatorCappedCPM;

            // Set creator-specific UGC stats for admin view
            baseStats.targetPostsWeekly = creatorTargetPostsWeekly;
            baseStats.postsThisWeek = creatorPostsThisWeek;
            baseStats.postsThisWeekTikTok = creatorTiktokCount;
            baseStats.postsThisWeekInstagram = creatorInstagramCount;
            baseStats.leftToTarget = creatorLeftToTarget;
            baseStats.fixedFeePayout = formatCurrency(creatorFixedFeePayout);
            baseStats.cpmPayout = formatCurrency(creatorCappedCPM);
            baseStats.totalPayout = formatCurrency(creatorTotalPayout);
            baseStats.weeklyTargetMet = creatorWeeklyTargetMet;

            // Add raw values for payout breakdown calculations
            baseStats._raw.cpmRate = UGC_OPTION_1.CPM_RATE;
            baseStats._raw.cpmViews = totalViews; // Views displayed in dashboard
            baseStats._raw.cpmAmount = creatorCappedCPM;
            baseStats._raw.fixedFeePerPost = UGC_OPTION_1.FIXED_FEE_PER_POST;
            baseStats._raw.crossPostedCount = creatorCrossPostedCount;
            baseStats._raw.fixedFeeAmount = creatorFixedFeePayout;
            baseStats._raw.totalPayoutAmount = creatorTotalPayout;

            console.log('📊 Admin View - Creator UGC Stats:', {
              creatorId,
              crossPostedCount: creatorCrossPostedCount,
              fixedFeePayout: formatCurrency(creatorFixedFeePayout),
              cpmPayout: formatCurrency(creatorCappedCPM),
              totalPayout: formatCurrency(creatorTotalPayout)
            });
          }
        }

        if (options.role === 'influencer') {
          // Influencer-specific metrics
          baseStats.targetViews = formatNumber(100000); // Placeholder
          baseStats.leftToTargetViews = formatNumber(Math.max(0, 100000 - totalViews));
          baseStats.totalPayout = formatCurrency(0); // Influencer payout placeholder
          baseStats.bonus = formatCurrency(0);
        }

        setStats(baseStats);
        setError(null);
        setHasLoadedOnce(true);
      } catch (err) {
        console.error('Error fetching dashboard analytics:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setStats(null);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    }

    fetchAnalytics();
  }, [
    options.role,
    options.userId,
    options.dateRange?.[0],
    options.dateRange?.[1],
    options.accountIds?.join(','),
    options.platformFilter?.join(','),
    options.creatorFilter,
    options.contentTypeFilter,
    options.refreshTrigger,
  ]);

  return { stats, loading, isRefreshing, error };
}
