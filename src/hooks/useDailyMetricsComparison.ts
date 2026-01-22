/**
 * Daily Metrics Comparison Hook
 * Fetches and calculates daily averages for admin dashboard
 *
 * Metrics tracked:
 * - Views (from cpm_post_breakdown.views_delta)
 * - Posts Submitted (from posts table)
 * - Creators Onboarded (users.approved_at)
 * - Discord Joins (users.discord_linked_at)
 * - Spend (CPM + Fixed Fee from cpm_post_breakdown)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UGC_OPTION_1 } from '@/constants/contracts';

export interface DailyMetric {
  key: string;
  label: string;
  emoji: string;
  today: number;
  yesterday: number;
  avg7Day: number;
  avg30Day: number;
  trend: { value: string; positive: boolean } | null;
  format: 'number' | 'currency' | 'views';
}

interface UseDailyMetricsComparisonResult {
  metrics: DailyMetric[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Helper to get date string in YYYY-MM-DD format
const getDateString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Helper to get date N days ago
const getDaysAgo = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

// Calculate trend percentage
const calculateTrend = (current: number, previous: number): { value: string; positive: boolean } | null => {
  if (previous === 0) {
    if (current === 0) return null;
    return { value: '+100%', positive: true };
  }
  const percentChange = ((current - previous) / previous) * 100;
  const sign = percentChange >= 0 ? '+' : '';
  return {
    value: `${sign}${percentChange.toFixed(1)}%`,
    positive: percentChange >= 0
  };
};

export function useDailyMetricsComparison(refreshTrigger?: number): UseDailyMetricsComparisonResult {
  const [metrics, setMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [internalRefresh, setInternalRefresh] = useState<number>(0);

  const refresh = useCallback(() => {
    setInternalRefresh(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date();
        const todayStr = getDateString(today);
        const yesterdayStr = getDateString(getDaysAgo(1));
        const sevenDaysAgoStr = getDateString(getDaysAgo(7));
        const thirtyDaysAgoStr = getDateString(getDaysAgo(30));

        console.log('📊 Fetching daily metrics:', { todayStr, yesterdayStr, sevenDaysAgoStr, thirtyDaysAgoStr });

        // Parallel fetch all data
        const [
          viewsData,
          postsData,
          onboardedData,
          discordData,
          spendData
        ] = await Promise.all([
          // 1. Views from cpm_post_breakdown
          fetchViewsMetrics(todayStr, thirtyDaysAgoStr),
          // 2. Posts submitted
          fetchPostsMetrics(todayStr, thirtyDaysAgoStr),
          // 3. Creators onboarded (approved)
          fetchOnboardedMetrics(todayStr, thirtyDaysAgoStr),
          // 4. Discord joins
          fetchDiscordMetrics(todayStr, thirtyDaysAgoStr),
          // 5. Spend (CPM + Fixed Fee)
          fetchSpendMetrics(todayStr, thirtyDaysAgoStr)
        ]);

        // Build metrics array
        const metricsResult: DailyMetric[] = [
          {
            key: 'views',
            label: 'Views',
            emoji: '👁',
            today: viewsData.today,
            yesterday: viewsData.yesterday,
            avg7Day: viewsData.avg7Day,
            avg30Day: viewsData.avg30Day,
            trend: calculateTrend(viewsData.today, viewsData.yesterday),
            format: 'views'
          },
          {
            key: 'posts',
            label: 'Posts',
            emoji: '📝',
            today: postsData.today,
            yesterday: postsData.yesterday,
            avg7Day: postsData.avg7Day,
            avg30Day: postsData.avg30Day,
            trend: calculateTrend(postsData.today, postsData.yesterday),
            format: 'number'
          },
          {
            key: 'onboarded',
            label: 'Joined',
            emoji: '👤',
            today: onboardedData.today,
            yesterday: onboardedData.yesterday,
            avg7Day: onboardedData.avg7Day,
            avg30Day: onboardedData.avg30Day,
            trend: calculateTrend(onboardedData.today, onboardedData.yesterday),
            format: 'number'
          },
          {
            key: 'discord',
            label: 'Discord',
            emoji: '💬',
            today: discordData.today,
            yesterday: discordData.yesterday,
            avg7Day: discordData.avg7Day,
            avg30Day: discordData.avg30Day,
            trend: calculateTrend(discordData.today, discordData.yesterday),
            format: 'number'
          },
          {
            key: 'spend',
            label: 'Spend',
            emoji: '💰',
            today: spendData.today,
            yesterday: spendData.yesterday,
            avg7Day: spendData.avg7Day,
            avg30Day: spendData.avg30Day,
            trend: calculateTrend(spendData.today, spendData.yesterday),
            format: 'currency'
          }
        ];

        console.log('✅ Daily metrics ready:', metricsResult);
        setMetrics(metricsResult);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch daily metrics';
        console.error('❌ Daily metrics error:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [refreshTrigger, internalRefresh]);

  return { metrics, loading, error, refresh };
}

// Fetch views from cpm_post_breakdown
async function fetchViewsMetrics(todayStr: string, thirtyDaysAgoStr: string) {
  const yesterdayStr = getDateString(getDaysAgo(1));
  const sevenDaysAgoStr = getDateString(getDaysAgo(7));

  // Get all views data for the last 30 days
  const { data, error } = await supabase
    .from('cpm_post_breakdown')
    .select('date, views_delta')
    .gte('date', thirtyDaysAgoStr)
    .lte('date', todayStr);

  if (error) throw new Error(error.message);

  // Aggregate by date
  const viewsByDate: Record<string, number> = {};
  (data || []).forEach((record: { date: string; views_delta: number }) => {
    const date = record.date;
    viewsByDate[date] = (viewsByDate[date] || 0) + (record.views_delta || 0);
  });

  const today = viewsByDate[todayStr] || 0;
  const yesterday = viewsByDate[yesterdayStr] || 0;

  // Calculate 7-day and 30-day averages
  let sum7 = 0, count7 = 0;
  let sum30 = 0, count30 = 0;

  Object.entries(viewsByDate).forEach(([date, views]) => {
    sum30 += views;
    count30++;
    if (date >= sevenDaysAgoStr) {
      sum7 += views;
      count7++;
    }
  });

  return {
    today,
    yesterday,
    avg7Day: count7 > 0 ? Math.round(sum7 / count7) : 0,
    avg30Day: count30 > 0 ? Math.round(sum30 / count30) : 0
  };
}

// Fetch posts submitted
async function fetchPostsMetrics(todayStr: string, thirtyDaysAgoStr: string) {
  const yesterdayStr = getDateString(getDaysAgo(1));
  const sevenDaysAgoStr = getDateString(getDaysAgo(7));

  // Get all posts for the last 30 days
  const { data, error } = await supabase
    .from('posts')
    .select('created_at')
    .eq('status', 'approved')
    .gte('created_at', `${thirtyDaysAgoStr}T00:00:00`)
    .lte('created_at', `${todayStr}T23:59:59`);

  if (error) throw new Error(error.message);

  // Count by date
  const postsByDate: Record<string, number> = {};
  (data || []).forEach((record: { created_at: string }) => {
    const date = record.created_at.split('T')[0];
    postsByDate[date] = (postsByDate[date] || 0) + 1;
  });

  const today = postsByDate[todayStr] || 0;
  const yesterday = postsByDate[yesterdayStr] || 0;

  // Calculate averages
  let sum7 = 0, count7 = 0;
  let sum30 = 0, count30 = 0;

  Object.entries(postsByDate).forEach(([date, count]) => {
    sum30 += count;
    count30++;
    if (date >= sevenDaysAgoStr) {
      sum7 += count;
      count7++;
    }
  });

  return {
    today,
    yesterday,
    avg7Day: count7 > 0 ? Number((sum7 / count7).toFixed(1)) : 0,
    avg30Day: count30 > 0 ? Number((sum30 / count30).toFixed(1)) : 0
  };
}

// Fetch creators onboarded (approved_at)
async function fetchOnboardedMetrics(todayStr: string, thirtyDaysAgoStr: string) {
  const yesterdayStr = getDateString(getDaysAgo(1));
  const sevenDaysAgoStr = getDateString(getDaysAgo(7));

  // Get all approved users for the last 30 days
  const { data, error } = await supabase
    .from('users')
    .select('approved_at')
    .not('approved_at', 'is', null)
    .gte('approved_at', `${thirtyDaysAgoStr}T00:00:00`)
    .lte('approved_at', `${todayStr}T23:59:59`);

  if (error) throw new Error(error.message);

  // Count by date
  const onboardedByDate: Record<string, number> = {};
  (data || []).forEach((record: { approved_at: string }) => {
    const date = record.approved_at.split('T')[0];
    onboardedByDate[date] = (onboardedByDate[date] || 0) + 1;
  });

  const today = onboardedByDate[todayStr] || 0;
  const yesterday = onboardedByDate[yesterdayStr] || 0;

  // Calculate averages
  let sum7 = 0, count7 = 0;
  let sum30 = 0, count30 = 0;

  Object.entries(onboardedByDate).forEach(([date, count]) => {
    sum30 += count;
    count30++;
    if (date >= sevenDaysAgoStr) {
      sum7 += count;
      count7++;
    }
  });

  return {
    today,
    yesterday,
    avg7Day: count7 > 0 ? Number((sum7 / count7).toFixed(1)) : 0,
    avg30Day: count30 > 0 ? Number((sum30 / count30).toFixed(1)) : 0
  };
}

// Fetch Discord joins
async function fetchDiscordMetrics(todayStr: string, thirtyDaysAgoStr: string) {
  const yesterdayStr = getDateString(getDaysAgo(1));
  const sevenDaysAgoStr = getDateString(getDaysAgo(7));

  // Get all users who joined Discord in the last 30 days
  const { data, error } = await supabase
    .from('users')
    .select('discord_linked_at')
    .not('discord_linked_at', 'is', null)
    .gte('discord_linked_at', `${thirtyDaysAgoStr}T00:00:00`)
    .lte('discord_linked_at', `${todayStr}T23:59:59`);

  if (error) throw new Error(error.message);

  // Count by date
  const discordByDate: Record<string, number> = {};
  (data || []).forEach((record: { discord_linked_at: string }) => {
    const date = record.discord_linked_at.split('T')[0];
    discordByDate[date] = (discordByDate[date] || 0) + 1;
  });

  const today = discordByDate[todayStr] || 0;
  const yesterday = discordByDate[yesterdayStr] || 0;

  // Calculate averages
  let sum7 = 0, count7 = 0;
  let sum30 = 0, count30 = 0;

  Object.entries(discordByDate).forEach(([date, count]) => {
    sum30 += count;
    count30++;
    if (date >= sevenDaysAgoStr) {
      sum7 += count;
      count7++;
    }
  });

  return {
    today,
    yesterday,
    avg7Day: count7 > 0 ? Number((sum7 / count7).toFixed(1)) : 0,
    avg30Day: count30 > 0 ? Number((sum30 / count30).toFixed(1)) : 0
  };
}

// Fetch spend (CPM + Fixed Fee)
async function fetchSpendMetrics(todayStr: string, thirtyDaysAgoStr: string) {
  const yesterdayStr = getDateString(getDaysAgo(1));
  const sevenDaysAgoStr = getDateString(getDaysAgo(7));

  // Get CPM data
  const { data: cpmData, error: cpmError } = await supabase
    .from('cpm_post_breakdown')
    .select('date, cpm_earned')
    .gte('date', thirtyDaysAgoStr)
    .lte('date', todayStr);

  if (cpmError) throw new Error(cpmError.message);

  // Get posts for fixed fee calculation
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('created_at, platform')
    .eq('status', 'approved')
    .gte('created_at', `${thirtyDaysAgoStr}T00:00:00`)
    .lte('created_at', `${todayStr}T23:59:59`);

  if (postsError) throw new Error(postsError.message);

  // Aggregate CPM by date
  const cpmByDate: Record<string, number> = {};
  (cpmData || []).forEach((record: { date: string; cpm_earned: number }) => {
    const date = record.date;
    cpmByDate[date] = (cpmByDate[date] || 0) + (Number(record.cpm_earned) || 0);
  });

  // Calculate fixed fee by date (based on cross-posted count)
  const postsByDate: Record<string, { tiktok: number; instagram: number }> = {};
  (postsData || []).forEach((record: { created_at: string; platform: string }) => {
    const date = record.created_at.split('T')[0];
    if (!postsByDate[date]) {
      postsByDate[date] = { tiktok: 0, instagram: 0 };
    }
    if (record.platform === 'tiktok') {
      postsByDate[date].tiktok++;
    } else if (record.platform === 'instagram') {
      postsByDate[date].instagram++;
    }
  });

  const fixedFeeByDate: Record<string, number> = {};
  Object.entries(postsByDate).forEach(([date, counts]) => {
    const crossPosted = Math.min(counts.tiktok, counts.instagram);
    fixedFeeByDate[date] = crossPosted * UGC_OPTION_1.FIXED_FEE_PER_POST;
  });

  // Combine CPM + Fixed Fee
  const allDates = new Set([...Object.keys(cpmByDate), ...Object.keys(fixedFeeByDate)]);
  const spendByDate: Record<string, number> = {};
  allDates.forEach(date => {
    spendByDate[date] = (cpmByDate[date] || 0) + (fixedFeeByDate[date] || 0);
  });

  const today = spendByDate[todayStr] || 0;
  const yesterday = spendByDate[yesterdayStr] || 0;

  // Calculate averages
  let sum7 = 0, count7 = 0;
  let sum30 = 0, count30 = 0;

  Object.entries(spendByDate).forEach(([date, spend]) => {
    sum30 += spend;
    count30++;
    if (date >= sevenDaysAgoStr) {
      sum7 += spend;
      count7++;
    }
  });

  return {
    today: Number(today.toFixed(2)),
    yesterday: Number(yesterday.toFixed(2)),
    avg7Day: count7 > 0 ? Number((sum7 / count7).toFixed(2)) : 0,
    avg30Day: count30 > 0 ? Number((sum30 / count30).toFixed(2)) : 0
  };
}
