/**
 * Chart Analytics Hook
 * Fetches daily view data for time-series charts
 *
 * Strategy:
 * - Uses cpm_post_breakdown for daily view deltas (populated by daily cron job)
 * - Also fetches total current views from analytics table (same as cards)
 * - Shows view growth over time using actual daily data
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ChartDataPoint {
  date: string;      // Formatted for display (e.g., "16/12")
  rawDate: string;   // ISO date for comparison (e.g., "2025-12-16")
  value: number;     // Views for this date (delta or cumulative depending on context)
}

interface UseChartAnalyticsOptions {
  datePreset: string;           // 'today' | 'last7' | 'last30' | 'last3months' | 'alltime'
  dateRange?: string[];         // [startDate, endDate] ISO strings
  creatorFilter?: string | null; // Filter by specific creator (admin only)
  accountFilter?: string | null; // Filter by specific account ID
  platformFilter?: string[];    // Filter by platform(s) ['instagram', 'tiktok']
  contentTypeFilter?: 'ugc_video' | 'slideshow'; // Filter by content type (admin only)
  metric?: string;              // 'views' for now, extensible later
  refreshTrigger?: number;      // Increment to force refetch
}

interface UseChartAnalyticsResult {
  data: ChartDataPoint[];
  totalValue: number;           // Current total views (from analytics table - same as cards)
  loading: boolean;
  error: string | null;
}

// Generate all dates in range for filling gaps
// Uses UTC dates to avoid timezone issues
const generateDateRange = (preset: string): { start: Date; end: Date; startStr: string; endStr: string; dates: string[] } => {
  // Get today's date in YYYY-MM-DD format (local timezone)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Calculate start date based on preset
  let startStr: string;

  switch (preset) {
    case 'today':
      startStr = todayStr;
      break;
    case 'last7': {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      break;
    }
    case 'last30': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      break;
    }
    case 'last3months': {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      break;
    }
    case 'alltime':
      startStr = '2020-01-01';
      break;
    default: {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    }
  }

  const endStr = todayStr;

  // Generate array of all dates in range using string comparison
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

  // Create Date objects for return (used for comparison elsewhere)
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(endStr + 'T23:59:59');

  return { start, end, startStr, endStr, dates };
};

// Format date for chart display
const formatDateLabel = (dateStr: string, preset: string): string => {
  const date = new Date(dateStr + 'T00:00:00');

  if (preset === 'today') {
    return 'Today';
  }

  if (preset === 'alltime') {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`;
  }

  return `${date.getDate()}/${date.getMonth() + 1}`;
};

interface PostWithAnalytics {
  id: string;
  created_at: string;
  analytics: { views: number; fetched_at: string }[];
}

interface CpmBreakdownRecord {
  date: string;
  views_delta: number;
  cumulative_views: number;
  post_id: string;
}

export function useChartAnalytics(options: UseChartAnalyticsOptions): UseChartAnalyticsResult {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { startStr, endStr, dates } = generateDateRange(options.datePreset);

        console.log('📊 Fetching chart data:', {
          preset: options.datePreset,
          startStr,
          endStr,
          creatorFilter: options.creatorFilter,
          accountFilter: options.accountFilter,
          platformFilter: options.platformFilter
        });

        // Step 1: Get total views from analytics table (SAME as cards for consistency)
        let postsQuery = supabase
          .from('posts')
          .select('id, analytics(views, fetched_at)')
          .eq('status', 'approved');

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

        // Calculate total views (same as useDashboardAnalytics)
        let totalViews = 0;
        const postIds: string[] = [];

        (posts as PostWithAnalytics[] | null)?.forEach(post => {
          postIds.push(post.id);
          if (post.analytics && post.analytics.length > 0) {
            const sortedAnalytics = [...post.analytics].sort((a, b) =>
              new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
            );
            totalViews += sortedAnalytics[0].views || 0;
          }
        });

        console.log('📈 Total views (same as card):', totalViews);
        console.log('📝 Post IDs for chart:', postIds.length);

        if (postIds.length === 0) {
          setData([]);
          setTotalValue(0);
          setLoading(false);
          return;
        }

        // Step 2: Get daily data from cpm_post_breakdown for time-series
        // This table has daily view deltas and cumulative views per post
        let cpmQuery = supabase
          .from('cpm_post_breakdown')
          .select('date, views_delta, cumulative_views, post_id')
          .in('post_id', postIds)
          .gte('date', startStr)
          .lte('date', endStr)
          .order('date', { ascending: true });

        // Apply creator filter if set
        if (options.creatorFilter) {
          cpmQuery = cpmQuery.eq('user_id', options.creatorFilter);
        }

        const { data: cpmRecords, error: cpmError } = await cpmQuery;
        if (cpmError) {
          console.warn('⚠️ CPM breakdown query failed:', cpmError.message);
          // Continue without time-series data
        }

        console.log('📅 CPM breakdown records:', cpmRecords?.length || 0);

        // Step 3: Aggregate daily data
        // Sum views_delta per day - this shows how many NEW views were gained each day
        const viewsDeltaByDate: Record<string, number> = {};

        if (cpmRecords && cpmRecords.length > 0) {
          (cpmRecords as CpmBreakdownRecord[]).forEach(record => {
            const date = record.date;
            if (!viewsDeltaByDate[date]) {
              viewsDeltaByDate[date] = 0;
            }
            // Sum the view deltas (new views gained that day) across all posts
            viewsDeltaByDate[date] += record.views_delta || 0;
          });

          console.log('📊 Daily view deltas from CPM breakdown:', viewsDeltaByDate);
        }

        // Step 4: Build chart data
        // Show daily view gains (delta), not cumulative
        const hasCpmData = Object.keys(viewsDeltaByDate).length > 0;

        let chartData: ChartDataPoint[];

        if (hasCpmData) {
          // Show daily deltas - 0 for days with no data
          chartData = dates.map(dateStr => ({
            date: formatDateLabel(dateStr, options.datePreset),
            rawDate: dateStr,
            value: viewsDeltaByDate[dateStr] || 0,
          }));
        } else {
          // No CPM data yet - show zeros (no daily data available)
          console.log('ℹ️ No CPM breakdown data, showing zeros');
          chartData = dates.map(dateStr => ({
            date: formatDateLabel(dateStr, options.datePreset),
            rawDate: dateStr,
            value: 0,
          }));
        }

        // Step 5: Aggregate for longer time periods
        let finalData = chartData;

        if (options.datePreset === 'last3months') {
          // Show weekly data points for 3 months
          const weeklyData: ChartDataPoint[] = [];
          for (let i = 6; i < chartData.length; i += 7) {
            weeklyData.push(chartData[i]);
          }
          // Always include the last point
          if (chartData.length > 0 && (chartData.length - 1) % 7 !== 6) {
            weeklyData.push(chartData[chartData.length - 1]);
          }
          finalData = weeklyData.length > 0 ? weeklyData : chartData;
        } else if (options.datePreset === 'alltime') {
          // Show monthly data points for all time
          const monthlyData: Record<string, ChartDataPoint> = {};
          chartData.forEach(d => {
            const monthKey = d.rawDate.slice(0, 7);
            // Keep the last (highest) value for each month
            if (!monthlyData[monthKey] || d.value >= monthlyData[monthKey].value) {
              monthlyData[monthKey] = d;
            }
          });
          finalData = Object.values(monthlyData);
        }

        console.log('✅ Chart data ready:', {
          points: finalData.length,
          total: totalViews,
          hasCpmData,
          firstValue: finalData[0]?.value,
          lastValue: finalData[finalData.length - 1]?.value
        });

        setData(finalData);
        setTotalValue(totalViews);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chart data';
        console.error('❌ Chart data error:', errorMessage);
        setError(errorMessage);
        setData([]);
        setTotalValue(0);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [options.datePreset, options.creatorFilter, options.accountFilter, options.platformFilter, options.contentTypeFilter, options.metric, options.refreshTrigger]);

  return { data, totalValue, loading, error };
}
