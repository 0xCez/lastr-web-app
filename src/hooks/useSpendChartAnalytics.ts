/**
 * Spend Chart Analytics Hook
 * Fetches daily spend data for time-series charts
 *
 * Strategy:
 * - Uses cpm_post_breakdown for daily CPM spend (cpm_earned)
 * - Calculates fixed fee based on cross-posted count per day
 * - Total daily spend = CPM + Fixed Fee
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UGC_OPTION_1 } from '@/constants/contracts';

interface ChartDataPoint {
  date: string;      // Formatted for display (e.g., "16/12")
  rawDate: string;   // ISO date for comparison (e.g., "2025-12-16")
  value: number;     // Spend for this date in dollars
}

interface UseSpendChartAnalyticsOptions {
  datePreset: 'last7' | 'last30';  // Only support 7 and 30 days for spend
  creatorFilter?: string | null;   // Filter by specific creator (admin only)
  accountFilter?: string | null;   // Filter by specific account ID
  platformFilter?: string[];       // Filter by platform(s) ['instagram', 'tiktok']
  contentTypeFilter?: 'ugc_video' | 'slideshow'; // Filter by content type (admin only)
  refreshTrigger?: number;         // Increment to force refetch
}

interface UseSpendChartAnalyticsResult {
  data: ChartDataPoint[];
  totalValue: number;              // Total spend for the period
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

interface CpmBreakdownRecord {
  date: string;
  cpm_earned: number;
  post_id: string;
}

interface PostRecord {
  id: string;
  platform: string;
  created_at: string;
  content_type: 'ugc_video' | 'slideshow' | 'other' | null;
}

export function useSpendChartAnalytics(options: UseSpendChartAnalyticsOptions): UseSpendChartAnalyticsResult {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpendData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { startStr, endStr, dates } = generateDateRange(options.datePreset);

        console.log('💰 Fetching spend chart data:', {
          preset: options.datePreset,
          startStr,
          endStr,
          creatorFilter: options.creatorFilter,
          accountFilter: options.accountFilter,
          platformFilter: options.platformFilter
        });

        // Step 1: Get post IDs that match filters (include content_type for pricing)
        let postsQuery = supabase
          .from('posts')
          .select('id, platform, created_at, content_type')
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

        const postIds = (posts as PostRecord[] | null)?.map(p => p.id) || [];

        console.log('📝 Posts for spend chart:', postIds.length);

        if (postIds.length === 0) {
          setData(dates.map(dateStr => ({
            date: formatDateLabel(dateStr),
            rawDate: dateStr,
            value: 0,
          })));
          setTotalValue(0);
          setLoading(false);
          return;
        }

        // Step 2: Get CPM spend from cpm_post_breakdown
        let cpmQuery = supabase
          .from('cpm_post_breakdown')
          .select('date, cpm_earned, post_id')
          .in('post_id', postIds)
          .gte('date', startStr)
          .lte('date', endStr)
          .order('date', { ascending: true });

        if (options.creatorFilter) {
          cpmQuery = cpmQuery.eq('user_id', options.creatorFilter);
        }

        const { data: cpmRecords, error: cpmError } = await cpmQuery;
        if (cpmError) {
          console.warn('⚠️ CPM breakdown query failed:', cpmError.message);
        }

        console.log('📅 CPM spend records:', cpmRecords?.length || 0);

        // Step 3: Aggregate CPM spend by date
        const cpmByDate: Record<string, number> = {};
        if (cpmRecords && cpmRecords.length > 0) {
          (cpmRecords as CpmBreakdownRecord[]).forEach(record => {
            const date = record.date;
            if (!cpmByDate[date]) {
              cpmByDate[date] = 0;
            }
            cpmByDate[date] += Number(record.cpm_earned) || 0;
          });
        }

        // Step 4: Calculate fixed fee per day based on content type
        // Group posts by date AND content type for proper pricing
        // UGC videos: $6.25 per cross-posted pair + CPM
        // Slideshows: $1.00 per post, NO CPM
        const postsByDate: Record<string, {
          ugc: { tiktok: number; instagram: number };
          slideshow: number;
        }> = {};

        (posts as PostRecord[] | null)?.forEach(post => {
          const createdDate = post.created_at.split('T')[0];
          if (!postsByDate[createdDate]) {
            postsByDate[createdDate] = { ugc: { tiktok: 0, instagram: 0 }, slideshow: 0 };
          }

          if (post.content_type === 'slideshow') {
            postsByDate[createdDate].slideshow++;
          } else {
            // UGC videos (or any non-slideshow content)
            if (post.platform === 'tiktok') {
              postsByDate[createdDate].ugc.tiktok++;
            } else if (post.platform === 'instagram') {
              postsByDate[createdDate].ugc.instagram++;
            }
          }
        });

        // Calculate fixed fee per day based on content type filter
        const fixedFeeByDate: Record<string, number> = {};
        Object.entries(postsByDate).forEach(([date, counts]) => {
          const ugcCrossPosted = Math.min(counts.ugc.tiktok, counts.ugc.instagram);
          const ugcFee = ugcCrossPosted * UGC_OPTION_1.FIXED_FEE_PER_POST;
          const slideshowFee = counts.slideshow * UGC_OPTION_1.FIXED_FEE_PER_SLIDESHOW;

          if (options.contentTypeFilter === 'slideshow') {
            fixedFeeByDate[date] = slideshowFee;
          } else if (options.contentTypeFilter === 'ugc_video') {
            fixedFeeByDate[date] = ugcFee;
          } else {
            // Combined: sum both UGC and Slideshow fixed fees
            fixedFeeByDate[date] = ugcFee + slideshowFee;
          }
        });

        console.log('💵 Spend chart breakdown:', {
          filter: options.contentTypeFilter || 'combined',
          dailyCpm: cpmByDate,
          dailyFixedFee: fixedFeeByDate
        });

        // Step 5: Build chart data
        // Slideshows: Fixed fee only (no CPM)
        // UGC videos: Fixed fee + CPM
        // Combined: UGC fixed fee + slideshow fixed fee + UGC CPM (slideshows have no CPM)
        const isSlideshow = options.contentTypeFilter === 'slideshow';
        const chartData: ChartDataPoint[] = dates.map(dateStr => {
          // CPM only applies to UGC videos, not slideshows
          // In combined view, CPM records only exist for UGC posts
          const cpm = isSlideshow ? 0 : (cpmByDate[dateStr] || 0);
          const fixedFee = fixedFeeByDate[dateStr] || 0;
          return {
            date: formatDateLabel(dateStr),
            rawDate: dateStr,
            value: Number((cpm + fixedFee).toFixed(2)),
          };
        });

        // Calculate total spend
        const totalSpend = chartData.reduce((sum, d) => sum + d.value, 0);

        console.log('✅ Spend chart data ready:', {
          points: chartData.length,
          total: totalSpend.toFixed(2),
          firstValue: chartData[0]?.value,
          lastValue: chartData[chartData.length - 1]?.value
        });

        setData(chartData);
        setTotalValue(Number(totalSpend.toFixed(2)));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch spend data';
        console.error('❌ Spend chart error:', errorMessage);
        setError(errorMessage);
        setData([]);
        setTotalValue(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSpendData();
  }, [options.datePreset, options.creatorFilter, options.accountFilter, options.platformFilter, options.contentTypeFilter, options.refreshTrigger]);

  return { data, totalValue, loading, error };
}
