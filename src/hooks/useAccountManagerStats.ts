import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  getCurrentWeekBoundaries,
  getMonthBoundaries,
  getWeeksInMonth,
  toUTCMidnight,
  toUTCEndOfDay,
  addDays,
  toISOString,
  toDateString,
} from '@/utils/dateUtils';

interface AMStats {
  // Today
  postsToday: number;
  dailyTarget: number;
  dailyEarnings: number;

  // This week
  daysHitThisWeek: number;
  weeklyBase: number;
  weeklyBonus: number;
  weeklyTotal: number;

  // This month
  weeksHitThisMonth: number;
  monthlyBase: number;
  monthlyBonus: number;
  monthlyTotal: number;

  // Account pairs
  accountPairs: number;
}

export const useAccountManagerStats = (selectedTeamId?: string | null) => {
  const [stats, setStats] = useState<AMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Get user's account_pairs setting
        const { data: userData } = await supabase
          .from('users')
          .select('account_pairs')
          .eq('id', user.id)
          .single();

        // If filtering by team, set accountPairs to 1 for that team
        // Otherwise use the user's total account_pairs
        let accountPairs = userData?.account_pairs || 1;
        let accountFilter: string[] | null = null;

        // If a specific team is selected, get its account IDs
        if (selectedTeamId) {
          const { data: assignment } = await supabase
            .from('am_team_assignments')
            .select('tiktok_account_id, instagram_account_id')
            .eq('id', selectedTeamId)
            .single();

          if (assignment) {
            accountFilter = [
              assignment.tiktok_account_id,
              assignment.instagram_account_id,
            ].filter(Boolean) as string[];
          }
          // When filtering by team, treat as 1 account pair
          accountPairs = 1;
        }

        const dailyTarget = 10; // 10 posts per day per pair (5 TT + 5 IG)

        // Get today's date boundaries (UTC-safe)
        const now = new Date();
        const todayStart = toUTCMidnight(now);
        const todayEnd = toUTCEndOfDay(now);

        // Get week boundaries (Monday to Sunday) using UTC-safe utilities
        const [weekStart] = getCurrentWeekBoundaries('mon-sun');

        // Get month boundaries (UTC-safe)
        const [monthStart, monthEnd] = getMonthBoundaries(now);

        // Build base query for today's posts
        let todayQuery = supabase
          .from('posts')
          .select('id, created_at')
          .eq('submitted_by', user.id)
          .eq('content_type', 'slideshow')
          .eq('status', 'approved')
          .gte('created_at', toISOString(todayStart))
          .lte('created_at', toISOString(todayEnd));

        // Filter by account IDs if team is selected
        if (accountFilter && accountFilter.length > 0) {
          todayQuery = todayQuery.in('account_id', accountFilter);
        }

        const { data: todayPosts } = await todayQuery;

        // Count raw posts (target is 10: 5 TT + 5 IG)
        const postsToday = todayPosts?.length || 0;

        // Build base query for month posts
        let monthQuery = supabase
          .from('posts')
          .select('id, created_at')
          .eq('submitted_by', user.id)
          .eq('content_type', 'slideshow')
          .eq('status', 'approved')
          .gte('created_at', toISOString(monthStart))
          .lte('created_at', toISOString(monthEnd));

        // Filter by account IDs if team is selected
        if (accountFilter && accountFilter.length > 0) {
          monthQuery = monthQuery.in('account_id', accountFilter);
        }

        const { data: monthPosts } = await monthQuery;

        // Group posts by day (using UTC date string) - raw count, no division
        const postsByDay: Record<string, number> = {};
        monthPosts?.forEach(post => {
          const day = toDateString(new Date(post.created_at));
          postsByDay[day] = (postsByDay[day] || 0) + 1;
        });

        // Calculate days hit this week (days with 5+ slideshows)
        let daysHitThisWeek = 0;
        for (let i = 0; i < 7; i++) {
          const checkDate = addDays(weekStart, i);
          if (checkDate > now) break; // Don't count future days

          const dayStr = toDateString(checkDate);
          if ((postsByDay[dayStr] || 0) >= dailyTarget) {
            daysHitThisWeek++;
          }
        }

        // Calculate weekly earnings
        // Base: $1 per slideshow
        let weeklyBase = 0;
        for (let i = 0; i < 7; i++) {
          const checkDate = addDays(weekStart, i);
          if (checkDate > now) break;

          const dayStr = toDateString(checkDate);
          weeklyBase += (postsByDay[dayStr] || 0);
        }
        weeklyBase = weeklyBase * accountPairs; // Multiply by account pairs

        // Weekly bonus: $10 if 6/7 days hit
        const weeklyBonus = daysHitThisWeek >= 6 ? 10 * accountPairs : 0;
        const weeklyTotal = weeklyBase + weeklyBonus;

        // Calculate weeks hit this month using UTC-safe utilities
        // A week is "hit" if 6/7 days met the daily target
        let weeksHitThisMonth = 0;
        const weeksInMonth = getWeeksInMonth(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          false // Only count complete weeks for monthly bonus
        );

        for (const week of weeksInMonth) {
          let daysHit = 0;
          for (let i = 0; i < 7; i++) {
            const checkDate = addDays(week.start, i);
            if (checkDate > now || checkDate > monthEnd) break;

            const dayStr = toDateString(checkDate);
            if ((postsByDay[dayStr] || 0) >= dailyTarget) {
              daysHit++;
            }
          }

          // Only count complete weeks
          if (week.isComplete && daysHit >= 6) {
            weeksHitThisMonth++;
          }
        }

        // Calculate monthly earnings
        const totalSlideshowsThisMonth = Object.values(postsByDay).reduce((a, b) => a + b, 0);
        const monthlyBase = totalSlideshowsThisMonth * accountPairs;
        const monthlyBonus = weeksHitThisMonth >= 4 ? 20 * accountPairs : 0;
        const monthlyTotal = monthlyBase + monthlyBonus;

        setStats({
          postsToday,
          dailyTarget,
          dailyEarnings: postsToday * accountPairs,
          daysHitThisWeek,
          weeklyBase,
          weeklyBonus,
          weeklyTotal,
          weeksHitThisMonth,
          monthlyBase,
          monthlyBonus,
          monthlyTotal,
          accountPairs,
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedTeamId]);

  return { stats, loading, error };
};
