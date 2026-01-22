import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getWeekBoundaries,
  getWeekBoundariesAgo,
  formatDateRange,
  isRecapDay as checkIsRecapDay,
} from '@/utils/dateUtils';

export interface WeeklyRecapData {
  weekStart: Date;
  weekEnd: Date;
  totalPosts: number;
  totalViews: number;
  totalViewsGrowth: number;
  viralPosts: {
    id: string;
    url: string;
    views: number;
    platform: string;
    creator_name: string;
  }[];
  topCreators: {
    id: string;
    name: string;
    posts_count: number;
    total_views: number;
    avatar_url?: string;
  }[];
  platformBreakdown: {
    platform: string;
    posts: number;
    views: number;
  }[];
  postsGrowth: number;
}

interface UseWeeklyRecapOptions {
  enabled?: boolean;
  selectedDate?: Date; // Optional date to fetch recap for a specific week
}

// Get the Friday-to-Thursday week range containing a given date
// Uses shared UTC-safe date utilities
export const getWeekRangeForDate = (date: Date): [Date, Date] => {
  return getWeekBoundaries(date, 'fri-thu');
};

// Get the Friday-to-Thursday week range for N weeks ago
const getWeekRange = (weeksAgo: number = 0): [Date, Date] => {
  return getWeekBoundariesAgo(weeksAgo, 'fri-thu');
};

// Get list of available weeks (last 12 weeks)
export const getAvailableWeeks = (): { start: Date; end: Date; label: string }[] => {
  const weeks: { start: Date; end: Date; label: string }[] = [];
  for (let i = 1; i <= 12; i++) {
    const [start, end] = getWeekRange(i);
    const label = formatDateRange(start, end);
    weeks.push({ start, end, label });
  }
  return weeks;
};

// Check if today is Friday, Saturday, or Sunday (recap visible on weekends)
// Re-export from shared utilities for backwards compatibility
export const isRecapDay = checkIsRecapDay;

export const useWeeklyRecap = (options: UseWeeklyRecapOptions = {}) => {
  const { enabled = true, selectedDate } = options;
  const [data, setData] = useState<WeeklyRecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [shouldShow, setShouldShow] = useState(false);

  const fetchRecap = useCallback(async (dateOverride?: Date) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Show on Friday, Saturday, Sunday
    const showRecap = isRecapDay();
    setShouldShow(showRecap);

    // If we have a date override or selectedDate, fetch for that week
    // Otherwise only fetch on Fridays
    const dateToUse = dateOverride || selectedDate;
    if (!showRecap && !dateToUse) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get week range based on selected date or default to last week
      let weekStart: Date, weekEnd: Date, prevWeekStart: Date, prevWeekEnd: Date;

      if (dateToUse) {
        [weekStart, weekEnd] = getWeekRangeForDate(dateToUse);
        // Previous week is 7 days before the start of selected week
        const prevDate = new Date(weekStart);
        prevDate.setDate(prevDate.getDate() - 1);
        [prevWeekStart, prevWeekEnd] = getWeekRangeForDate(prevDate);
      } else {
        // Default: last week and week before that
        [weekStart, weekEnd] = getWeekRange(1);
        [prevWeekStart, prevWeekEnd] = getWeekRange(2);
      }

      // Fetch posts from last week with latest analytics
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          url,
          platform,
          created_at,
          submitted_by,
          users!posts_submitted_by_fkey (full_name, avatar_url),
          latest_analytics (views)
        `)
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .eq('status', 'approved');

      if (postsError) throw postsError;

      // Fetch posts from previous week for comparison
      const { data: prevWeekPosts, error: prevError } = await supabase
        .from('posts')
        .select(`
          id,
          latest_analytics (views)
        `)
        .gte('created_at', prevWeekStart.toISOString())
        .lte('created_at', prevWeekEnd.toISOString())
        .eq('status', 'approved');

      if (prevError) throw prevError;

      const posts = (postsData || []) as any[];
      const prevPosts = (prevWeekPosts || []) as any[];

      // Helper to get views from latest_analytics
      const getViews = (post: any): number => {
        const analytics = post.latest_analytics;
        if (Array.isArray(analytics) && analytics.length > 0) {
          return analytics[0]?.views || 0;
        }
        return analytics?.views || 0;
      };

      // Calculate totals
      const totalPosts = posts.length;
      const totalViews = posts.reduce((sum, p) => sum + getViews(p), 0);
      const prevTotalPosts = prevPosts.length;
      const prevTotalViews = prevPosts.reduce((sum, p) => sum + getViews(p), 0);

      // Calculate growth percentages
      const postsGrowth = prevTotalPosts > 0
        ? ((totalPosts - prevTotalPosts) / prevTotalPosts) * 100
        : totalPosts > 0 ? 100 : 0;
      const totalViewsGrowth = prevTotalViews > 0
        ? ((totalViews - prevTotalViews) / prevTotalViews) * 100
        : totalViews > 0 ? 100 : 0;

      // Get viral posts (top 15 by views, minimum 10k views)
      const viralPosts = posts
        .map(p => ({ ...p, views: getViews(p) }))
        .filter(p => p.views >= 10000)
        .sort((a, b) => b.views - a.views)
        .slice(0, 15)
        .map(p => ({
          id: p.id,
          url: p.url,
          views: p.views,
          platform: p.platform,
          creator_name: p.users?.full_name || 'Unknown',
        }));

      // Aggregate by creator
      const creatorStats = new Map<string, {
        id: string;
        name: string;
        posts_count: number;
        total_views: number;
        avatar_url?: string;
      }>();

      posts.forEach(p => {
        const creatorId = p.submitted_by;
        const existing = creatorStats.get(creatorId);
        const views = getViews(p);

        if (existing) {
          existing.posts_count += 1;
          existing.total_views += views;
        } else {
          creatorStats.set(creatorId, {
            id: creatorId,
            name: p.users?.full_name || 'Unknown',
            posts_count: 1,
            total_views: views,
            avatar_url: p.users?.avatar_url,
          });
        }
      });

      // Top 5 creators by views
      const topCreators = Array.from(creatorStats.values())
        .sort((a, b) => b.total_views - a.total_views)
        .slice(0, 5);

      // Platform breakdown
      const platformMap = new Map<string, { posts: number; views: number }>();
      posts.forEach(p => {
        const platform = p.platform || 'unknown';
        const views = getViews(p);
        const existing = platformMap.get(platform);
        if (existing) {
          existing.posts += 1;
          existing.views += views;
        } else {
          platformMap.set(platform, { posts: 1, views });
        }
      });

      const platformBreakdown = Array.from(platformMap.entries())
        .map(([platform, stats]) => ({ platform, ...stats }))
        .sort((a, b) => b.views - a.views);

      setData({
        weekStart,
        weekEnd,
        totalPosts,
        totalViews,
        totalViewsGrowth,
        viralPosts,
        topCreators,
        platformBreakdown,
        postsGrowth,
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [enabled, selectedDate]);

  useEffect(() => {
    fetchRecap();
  }, [fetchRecap]);

  const dismiss = useCallback(() => {
    setShouldShow(false);
  }, []);

  // Fetch for a specific date (used by modal calendar)
  const fetchForDate = useCallback(async (date: Date) => {
    return fetchRecap(date);
  }, [fetchRecap]);

  return {
    data,
    loading,
    error,
    shouldShow,
    refetch: fetchRecap,
    fetchForDate,
    dismiss,
  };
};
