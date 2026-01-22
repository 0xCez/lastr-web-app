/**
 * useLeaderboardData Hook
 *
 * Fetches and aggregates real data for the Creator Leaderboard.
 *
 * Data Sources:
 * - users: full_name, avatar_url, application_status
 * - posts: count of approved posts per creator (via submitted_by)
 * - analytics: views, engagement_rate (latest per post)
 * - cpm_post_breakdown: cpm_earned per creator
 *
 * Aggregation is done per creator (user_id), not per account/handle.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface LeaderboardCreator {
  id: string;
  rank: number;
  name: string;
  email: string;
  avatar: string | null;
  status: 'active' | 'inactive';
  totalViews: number;
  totalPosts: number;
  avgViewsPerPost: number;
  cpm: number;              // Real CPM: (total paid / total views) * 1000
  engagementRate: number;   // Average engagement rate across all posts
  // Dummy fields (to be implemented later)
  earnings: number;
  viewsTrend: 'up' | 'down' | 'stable';
}

export interface LeaderboardStats {
  totalViews: number;
  totalPosts: number;
  totalEarnings: number;    // Dummy for now
  avgEngagement: number;
}

interface UseLeaderboardDataReturn {
  creators: LeaderboardCreator[];
  stats: LeaderboardStats;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLeaderboardData(): UseLeaderboardDataReturn {
  const [creators, setCreators] = useState<LeaderboardCreator[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({
    totalViews: 0,
    totalPosts: 0,
    totalEarnings: 0,
    avgEngagement: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // ============================================
        // STEP 1: Get all approved UGC creators
        // ============================================
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email, avatar_url, application_status')
          .eq('role', 'ugc_creator')
          .eq('application_status', 'approved');

        if (usersError) {
          throw new Error(`Failed to fetch users: ${usersError.message}`);
        }

        if (!users || users.length === 0) {
          // No approved creators yet
          setCreators([]);
          setStats({ totalViews: 0, totalPosts: 0, totalEarnings: 0, avgEngagement: 0 });
          setLoading(false);
          return;
        }

        const userIds = users.map(u => u.id);
        const userMap = new Map(users.map(u => [u.id, u]));

        // ============================================
        // STEP 2: Get all approved posts with latest analytics
        // We need to get the latest analytics record per post
        // ============================================
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            submitted_by,
            status,
            created_at
          `)
          .eq('status', 'approved')
          .in('submitted_by', userIds);

        if (postsError) {
          throw new Error(`Failed to fetch posts: ${postsError.message}`);
        }

        // Get post IDs for analytics lookup
        const postIds = posts?.map(p => p.id) || [];

        // Calculate last post date per creator (for status determination)
        const lastPostByCreator = new Map<string, Date>();
        (posts || []).forEach(post => {
          const postDate = new Date(post.created_at);
          const existing = lastPostByCreator.get(post.submitted_by);
          if (!existing || postDate > existing) {
            lastPostByCreator.set(post.submitted_by, postDate);
          }
        });

        // ============================================
        // STEP 3: Get latest analytics for each post
        // Using the latest_analytics view for efficiency
        // ============================================
        let analyticsData: any[] = [];

        if (postIds.length > 0) {
          const { data: analytics, error: analyticsError } = await supabase
            .from('latest_analytics')
            .select('post_id, views, engagement_rate')
            .in('post_id', postIds);

          if (analyticsError) {
            console.warn('Failed to fetch from latest_analytics view, falling back to analytics table:', analyticsError.message);

            // Fallback: query analytics table directly and get latest per post
            const { data: fallbackAnalytics, error: fallbackError } = await supabase
              .from('analytics')
              .select('post_id, views, engagement_rate, fetched_at')
              .in('post_id', postIds)
              .order('fetched_at', { ascending: false });

            if (fallbackError) {
              throw new Error(`Failed to fetch analytics: ${fallbackError.message}`);
            }

            // Dedupe to get latest per post
            const seenPosts = new Set<string>();
            analyticsData = (fallbackAnalytics || []).filter(a => {
              if (seenPosts.has(a.post_id)) return false;
              seenPosts.add(a.post_id);
              return true;
            });
          } else {
            analyticsData = analytics || [];
          }
        }

        // Create analytics map: post_id -> { views, engagement_rate }
        const analyticsMap = new Map(
          analyticsData.map(a => [a.post_id, { views: a.views || 0, engagementRate: a.engagement_rate || 0 }])
        );

        // ============================================
        // STEP 4: Get CPM data per user
        // ============================================
        const { data: cpmData, error: cpmError } = await supabase
          .from('cpm_post_breakdown')
          .select('user_id, cpm_earned')
          .in('user_id', userIds);

        if (cpmError) {
          console.warn('Failed to fetch CPM data:', cpmError.message);
          // Continue without CPM data - it's not critical
        }

        // Aggregate CPM per user
        const cpmByUser = new Map<string, number>();
        (cpmData || []).forEach(record => {
          const current = cpmByUser.get(record.user_id) || 0;
          cpmByUser.set(record.user_id, current + (record.cpm_earned || 0));
        });

        // ============================================
        // STEP 5: Aggregate data per creator
        // ============================================
        const creatorAggregates = new Map<string, {
          totalViews: number;
          totalPosts: number;
          engagementRates: number[];
        }>();

        // Initialize aggregates for all users
        userIds.forEach(userId => {
          creatorAggregates.set(userId, {
            totalViews: 0,
            totalPosts: 0,
            engagementRates: [],
          });
        });

        // Process posts and aggregate
        (posts || []).forEach(post => {
          const aggregate = creatorAggregates.get(post.submitted_by);
          if (!aggregate) return;

          aggregate.totalPosts += 1;

          const analytics = analyticsMap.get(post.id);
          if (analytics) {
            aggregate.totalViews += analytics.views;
            if (analytics.engagementRate > 0) {
              aggregate.engagementRates.push(analytics.engagementRate);
            }
          }
        });

        // ============================================
        // STEP 6: Build final creator objects
        // ============================================
        const leaderboardCreators: LeaderboardCreator[] = userIds.map(userId => {
          const user = userMap.get(userId)!;
          const aggregate = creatorAggregates.get(userId)!;
          const cpmEarned = cpmByUser.get(userId) || 0;

          // Calculate averages
          const avgViewsPerPost = aggregate.totalPosts > 0
            ? Math.round(aggregate.totalViews / aggregate.totalPosts)
            : 0;

          const avgEngagement = aggregate.engagementRates.length > 0
            ? aggregate.engagementRates.reduce((a, b) => a + b, 0) / aggregate.engagementRates.length
            : 0;

          // Real CPM = (total amount paid / total views) * 1000
          const realCpm = aggregate.totalViews > 0
            ? (cpmEarned / aggregate.totalViews) * 1000
            : 0;

          // Determine status based on last post date (active if posted in last 20 days)
          const lastPostDate = lastPostByCreator.get(userId);
          const daysSinceLastPost = lastPostDate
            ? Math.floor((Date.now() - lastPostDate.getTime()) / (1000 * 60 * 60 * 24))
            : Infinity;
          const status: 'active' | 'inactive' = daysSinceLastPost <= 20 ? 'active' : 'inactive';

          return {
            id: userId,
            rank: 0, // Will be assigned after sorting
            name: user.full_name || 'Unknown',
            email: user.email || '',
            avatar: user.avatar_url,
            status,
            totalViews: aggregate.totalViews,
            totalPosts: aggregate.totalPosts,
            avgViewsPerPost,
            cpm: realCpm,
            engagementRate: Math.round(avgEngagement * 100) / 100, // Round to 2 decimals
            // Dummy fields
            earnings: 0, // TODO: Implement when earnings data is available
            viewsTrend: 'stable' as const, // TODO: Implement trend calculation
          };
        });

        // ============================================
        // STEP 7: Sort by total views and assign ranks
        // ============================================
        leaderboardCreators.sort((a, b) => b.totalViews - a.totalViews);
        leaderboardCreators.forEach((creator, index) => {
          creator.rank = index + 1;
        });

        // ============================================
        // STEP 8: Calculate aggregate stats
        // ============================================
        const aggregateStats: LeaderboardStats = {
          totalViews: leaderboardCreators.reduce((sum, c) => sum + c.totalViews, 0),
          totalPosts: leaderboardCreators.reduce((sum, c) => sum + c.totalPosts, 0),
          totalEarnings: 0, // Dummy
          avgEngagement: leaderboardCreators.length > 0
            ? leaderboardCreators.reduce((sum, c) => sum + c.engagementRate, 0) / leaderboardCreators.length
            : 0,
        };

        setCreators(leaderboardCreators);
        setStats(aggregateStats);

      } catch (err) {
        console.error('Leaderboard data fetch error:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch leaderboard data'));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [refreshTrigger]);

  return { creators, stats, loading, error, refetch };
}
