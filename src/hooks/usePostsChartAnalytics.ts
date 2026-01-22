/**
 * Posts Chart Analytics Hook
 * Fetches daily post count data for time-series charts
 *
 * Strategy:
 * - Counts approved posts created per day
 * - Supports filtering by creator, account, platform
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ChartDataPoint {
  date: string;      // Formatted for display (e.g., "16/12")
  rawDate: string;   // ISO date for comparison (e.g., "2025-12-16")
  value: number;     // Post count for this date
}

interface UsePostsChartAnalyticsOptions {
  datePreset: 'last7' | 'last30';  // Only support 7 and 30 days
  creatorFilter?: string | null;   // Filter by specific creator (admin only)
  accountFilter?: string | null;   // Filter by specific account ID
  platformFilter?: string[];       // Filter by platform(s) ['instagram', 'tiktok']
  contentTypeFilter?: 'ugc_video' | 'slideshow'; // Filter by content type (admin only)
  refreshTrigger?: number;         // Increment to force refetch
}

interface UsePostsChartAnalyticsResult {
  data: ChartDataPoint[];
  totalValue: number;              // Total posts for the period
  loading: boolean;
  error: string | null;
}

// Generate all dates in range for filling gaps
const generateDateRange = (preset: 'last7' | 'last30'): { startStr: string; endStr: string; dates: string[] } => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let startStr: string;
  const daysBack = preset === 'last7' ? 6 : 29;

  const start = new Date(now);
  start.setDate(start.getDate() - daysBack);
  startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;

  const endStr = todayStr;

  // Generate array of all dates in range
  const dates: string[] = [];
  const [startYear, startMonth, startDay] = startStr.split('-').map(Number);
  const current = new Date(startYear, startMonth - 1, startDay);
  const [endYear, endMonth, endDay] = endStr.split('-').map(Number);
  const endDate = new Date(endYear, endMonth - 1, endDay);

  while (current <= endDate) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    dates.push(dateStr);
    current.setDate(current.getDate() + 1);
  }

  return { startStr, endStr, dates };
};

// Format date for chart display
const formatDateLabel = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

interface PostRecord {
  id: string;
  platform: string;
  created_at: string;
}

export function usePostsChartAnalytics(options: UsePostsChartAnalyticsOptions): UsePostsChartAnalyticsResult {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostsData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { startStr, endStr, dates } = generateDateRange(options.datePreset);

        console.log('📊 Fetching posts chart data:', {
          preset: options.datePreset,
          startStr,
          endStr,
          creatorFilter: options.creatorFilter,
          accountFilter: options.accountFilter,
          platformFilter: options.platformFilter
        });

        // Get posts that match filters within date range
        let postsQuery = supabase
          .from('posts')
          .select('id, platform, created_at')
          .eq('status', 'approved')
          .gte('created_at', startStr + 'T00:00:00')
          .lte('created_at', endStr + 'T23:59:59');

        if (options.creatorFilter) {
          postsQuery = postsQuery.eq('submitted_by', options.creatorFilter);
        }
        if (options.accountFilter) {
          postsQuery = postsQuery.eq('account_id', options.accountFilter);
        }
        if (options.platformFilter && options.platformFilter.length > 0 && options.platformFilter.length < 2) {
          postsQuery = postsQuery.eq('platform', options.platformFilter[0] as 'instagram' | 'tiktok');
        }
        if (options.contentTypeFilter) {
          postsQuery = postsQuery.eq('content_type', options.contentTypeFilter);
        }

        const { data: posts, error: postsError } = await postsQuery;
        if (postsError) throw new Error(postsError.message);

        console.log('📝 Posts found:', posts?.length || 0);

        // Count posts by creation date
        const postsByDate: Record<string, number> = {};
        (posts as PostRecord[] | null)?.forEach(post => {
          // Extract date from created_at
          const createdDate = post.created_at.split('T')[0];
          if (!postsByDate[createdDate]) {
            postsByDate[createdDate] = 0;
          }
          postsByDate[createdDate]++;
        });

        console.log('📅 Posts by date:', postsByDate);

        // Build chart data with all dates (fill gaps with zeros)
        const chartData: ChartDataPoint[] = dates.map(dateStr => ({
          date: formatDateLabel(dateStr),
          rawDate: dateStr,
          value: postsByDate[dateStr] || 0,
        }));

        // Calculate total posts
        const totalPosts = chartData.reduce((sum, d) => sum + d.value, 0);

        console.log('✅ Posts chart data ready:', {
          points: chartData.length,
          total: totalPosts,
          firstValue: chartData[0]?.value,
          lastValue: chartData[chartData.length - 1]?.value
        });

        setData(chartData);
        setTotalValue(totalPosts);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch posts data';
        console.error('❌ Posts chart error:', errorMessage);
        setError(errorMessage);
        setData([]);
        setTotalValue(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPostsData();
  }, [options.datePreset, options.creatorFilter, options.accountFilter, options.platformFilter, options.contentTypeFilter, options.refreshTrigger]);

  return { data, totalValue, loading, error };
}
