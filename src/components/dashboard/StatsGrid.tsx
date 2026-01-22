import { useState } from "react";
import StatsCard from "./StatsCard";
import CombinedStatsCard from "./CombinedStatsCard";
import DailyStatsCard from "./DailyStatsCard";
import MetricCard from "./MetricCard";
import MetricExplanationModal from "./MetricExplanationModal";
import UGCContractRow from "./UGCContractRow";
import PlatformPostsModal, { PlatformPost } from "./PlatformPostsModal";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

interface StatsGridProps {
  dateRange?: string[]; // [startDate, endDate]
  accountIds?: string[];
  platformFilter?: string[];
  creatorFilter?: string | null; // For admin: filter by specific creator
  onRefreshData?: () => void;
  refreshTrigger?: number; // Increment to force refetch
  contentTypeFilter?: 'ugc_video' | 'slideshow'; // For admin: filter by content type
}

interface CPMBreakdownItem {
  userId: string;
  userName: string;
  amount: number;
}

const StatsGrid = ({
  dateRange,
  accountIds,
  platformFilter,
  creatorFilter,
  onRefreshData,
  refreshTrigger,
  contentTypeFilter,
}: StatsGridProps) => {
  const { role, isAdmin, isUGCCreator, isInfluencer } = useUserRole();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedModalMetric, setSelectedModalMetric] = useState<string>("");
  const [selectedModalTitle, setSelectedModalTitle] = useState<string>("");
  const [cpmBreakdown, setCpmBreakdown] = useState<CPMBreakdownItem[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Platform posts modal state
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'instagram'>('tiktok');
  const [platformPosts, setPlatformPosts] = useState<PlatformPost[]>([]);
  const [platformPostsLoading, setPlatformPostsLoading] = useState(false);

  // Fetch real analytics data for ALL roles
  const { stats, loading, isRefreshing, error } = useDashboardAnalytics({
    role,
    dateRange,
    accountIds,
    platformFilter,
    creatorFilter: creatorFilter || undefined,
    refreshTrigger,
    contentTypeFilter,
  });

  // Fetch CPM breakdown for modal
  const fetchCPMBreakdown = async () => {
    setModalLoading(true);
    try {
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      console.log('🔍 Fetching CPM breakdown for modal...');
      console.log('Month start:', monthStartStr);
      console.log('Creator filter:', creatorFilter);

      // Step 1: Get all cpm_post_breakdown records for this month
      // Note: The table now has user_id directly (no payment_id)
      let breakdownQuery = supabase
        .from('cpm_post_breakdown')
        .select('cpm_earned, user_id')
        .gte('date', monthStartStr);

      // Apply creator filter if set
      if (creatorFilter) {
        breakdownQuery = breakdownQuery.eq('user_id', creatorFilter);
      }

      const { data: breakdownRecords, error: breakdownError } = await breakdownQuery;
      if (breakdownError) throw breakdownError;

      console.log('📊 Breakdown records fetched:', breakdownRecords?.length || 0);

      if (!breakdownRecords || breakdownRecords.length === 0) {
        console.log('No breakdown records found');
        setCpmBreakdown([]);
        return;
      }

      // Step 2: Get unique user IDs
      const userIds = [...new Set(breakdownRecords.map((r: any) => r.user_id))];
      console.log('👥 Fetching users:', userIds);

      // Step 3: Fetch user info
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      if (usersError) throw usersError;
      console.log('👤 Users fetched:', users?.length || 0);

      // Step 4: Create user map for quick lookup
      const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);

      // Step 5: Group by user and sum CPM earned
      const groupedData = breakdownRecords.reduce((acc: Record<string, CPMBreakdownItem>, record: any) => {
        const userId = record.user_id;
        const amount = Number(record.cpm_earned) || 0;
        const user = userMap.get(userId);
        const userName = user?.full_name || user?.email || 'Unknown User';

        if (acc[userId]) {
          acc[userId].amount += amount;
        } else {
          acc[userId] = {
            userId,
            userName,
            amount,
          };
        }

        return acc;
      }, {});

      const breakdown = Object.values(groupedData).sort((a, b) => b.amount - a.amount);
      console.log('✅ Breakdown created:', breakdown);
      setCpmBreakdown(breakdown);
    } catch (error) {
      console.error('❌ Error fetching CPM breakdown:', error);
      setCpmBreakdown([]);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle admin metric click
  const handleAdminMetricClick = async (metricKey: string, metricTitle: string) => {
    setSelectedModalMetric(metricKey);
    setSelectedModalTitle(metricTitle);
    setModalOpen(true);

    // Fetch CPM breakdown data if needed
    if (metricKey === 'totalCpmPay' || metricKey === 'cpm') {
      await fetchCPMBreakdown();
    }
  };

  // Handle platform click to show posts modal
  const handlePlatformClick = async (platform: 'tiktok' | 'instagram') => {
    setSelectedPlatform(platform);
    setPlatformModalOpen(true);
    setPlatformPostsLoading(true);
    setPlatformPosts([]);

    try {
      // Build query with same filters as dashboard
      // Include users table via submitted_by for creator info
      let query = supabase
        .from('posts')
        .select('id, url, platform, created_at, submitted_by, accounts(handle), analytics(views, likes, comments, fetched_at), users:submitted_by(full_name, gender, country)')
        .eq('status', 'approved')
        .eq('platform', platform)
        .order('created_at', { ascending: false });

      // Apply date range filter
      if (dateRange && dateRange.length === 2) {
        query = query.gte('created_at', dateRange[0]).lte('created_at', dateRange[1]);
      }

      // Apply creator filter (admin viewing specific creator)
      if (creatorFilter) {
        query = query.eq('submitted_by', creatorFilter);
      }

      // Apply account filter
      if (accountIds && accountIds.length > 0) {
        query = query.in('account_id', accountIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to PlatformPost format
      const posts: PlatformPost[] = (data || []).map((post: any) => {
        // Get latest analytics
        const sortedAnalytics = (post.analytics || []).sort((a: any, b: any) =>
          new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
        );
        const latestAnalytics = sortedAnalytics[0] || {};

        return {
          id: post.id,
          url: post.url,
          platform: post.platform,
          created_at: post.created_at,
          handle: post.accounts?.handle || 'Unknown',
          views: latestAnalytics.views || 0,
          likes: latestAnalytics.likes || 0,
          comments: latestAnalytics.comments || 0,
          creatorName: post.users?.full_name || undefined,
          creatorGender: post.users?.gender || undefined,
          creatorCountry: post.users?.country || undefined,
        };
      });

      setPlatformPosts(posts);
    } catch (error) {
      console.error('Error fetching platform posts:', error);
      setPlatformPosts([]);
    } finally {
      setPlatformPostsLoading(false);
    }
  };

  // Handle daily platform click to show today's posts modal
  const handleDailyPlatformClick = async (platform: 'tiktok' | 'instagram') => {
    setSelectedPlatform(platform);
    setPlatformModalOpen(true);
    setPlatformPostsLoading(true);
    setPlatformPosts([]);

    try {
      // Get today's midnight in UTC
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const todayStartStr = todayStart.toISOString();

      // Build query for today's posts only
      let query = supabase
        .from('posts')
        .select('id, url, platform, created_at, submitted_by, accounts(handle), analytics(views, likes, comments, fetched_at), users:submitted_by(full_name, gender, country)')
        .eq('status', 'approved')
        .eq('platform', platform)
        .gte('created_at', todayStartStr)
        .order('created_at', { ascending: false });

      // Apply creator filter (admin viewing specific creator)
      if (creatorFilter) {
        query = query.eq('submitted_by', creatorFilter);
      }

      // Apply account filter
      if (accountIds && accountIds.length > 0) {
        query = query.in('account_id', accountIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to PlatformPost format
      const posts: PlatformPost[] = (data || []).map((post: any) => {
        // Get latest analytics
        const sortedAnalytics = (post.analytics || []).sort((a: any, b: any) =>
          new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
        );
        const latestAnalytics = sortedAnalytics[0] || {};

        return {
          id: post.id,
          url: post.url,
          platform: post.platform,
          created_at: post.created_at,
          handle: post.accounts?.handle || 'Unknown',
          views: latestAnalytics.views || 0,
          likes: latestAnalytics.likes || 0,
          comments: latestAnalytics.comments || 0,
          creatorName: post.users?.full_name || undefined,
          creatorGender: post.users?.gender || undefined,
          creatorCountry: post.users?.country || undefined,
        };
      });

      setPlatformPosts(posts);
    } catch (error) {
      console.error('Error fetching daily platform posts:', error);
      setPlatformPosts([]);
    } finally {
      setPlatformPostsLoading(false);
    }
  };

  // Shimmer skeleton loaders
  const StatsGridSkeleton = () => (
    <div className="px-4 md:px-6 space-y-4">
      {/* Top Row - Large Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 h-[180px]">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-12 w-48" />
        </div>
        <div className="glass-card p-6 h-[180px]">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-12 w-48" />
        </div>
        <div className="glass-card p-6 h-[180px]">
          <Skeleton className="h-6 w-40 mb-6" />
          <Skeleton className="h-12 w-48" />
        </div>
      </div>

      {/* Second Row - Engagement Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass-card p-4 h-[100px]">
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </div>

      {/* Third Row - Role-specific Metrics (CPM Row - Skeleton for new layout) */}
      {isUGCCreator && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 h-[140px]">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-10 w-32 mb-4" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="glass-card p-5 h-[140px]">
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 h-[140px]">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-10 w-28 mb-4" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="flex-1 h-2 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      )}
      {isInfluencer && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card p-4 h-[100px]">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-10 w-24" />
            </div>
          ))}
        </div>
      )}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-4 h-[100px]">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-10 w-24" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Show loading state
  if (loading) {
    return <StatsGridSkeleton />;
  }

  // Show error state
  if (error || !stats) {
    return (
      <div className="px-4 md:px-6 py-8">
        <p className="text-destructive">
          {error?.message || 'Failed to load analytics. Please try again.'}
        </p>
      </div>
    );
  }

  // Common engagement metrics (shown to all roles)
  const engagementMetrics = [
    { title: "Engagement Rate", emoji: "🤝", value: stats.engagement, key: "engagement" },
    { title: "Likes", emoji: "❤️", value: stats.likes, key: "likes" },
    { title: "Comments", emoji: "💬", value: stats.comments, key: "comments" },
    { title: "Bookmarks", emoji: "🔖", value: stats.bookmarks, key: "bookmarks" },
    { title: "Shares", emoji: "📤", value: stats.shares, key: "shares" },
  ];

  // UGC Creator specific metrics
  // Order: Target Posts -> Left to Target -> Fixed Fee Payout -> CPM Payout -> Total Payout
  const ugcCreatorMetrics = [
    { title: "Target Posts", emoji: "🎯", value: `${stats.postsThisWeek ?? 0}/${stats.targetPostsWeekly ?? 12}`, key: "targetPosts", success: stats.weeklyTargetMet },
    { title: "Left to target", emoji: "🔍", value: String(stats.leftToTarget ?? 0), key: "leftToTarget" },
    { title: "Fixed Fee", emoji: "💵", value: stats.fixedFeePayout || "$0", key: "fixedFeePayout", warning: stats.weeksMissed && stats.weeksMissed > 0 ? (Math.min(stats.weeksMissed, 4) as 1 | 2 | 3 | 4) : undefined },
    { title: "CPM Payout", emoji: "💸", value: stats.cpmPayout || "$0", key: "cpmPayout" },
    { title: "Total Payout", emoji: "💰", value: stats.totalPayout || "$0", key: "totalPayout" },
  ];

  // Influencer specific metrics
  const influencerMetrics = [
    { title: "Target Views", emoji: "🎯", value: stats.targetViews || "0", key: "targetViews" },
    { title: "Left to target", emoji: "💬", value: stats.leftToTargetViews || "0", key: "leftToTargetViews" },
    { title: "Total Payout", emoji: "💵", value: stats.totalPayout || "$0", key: "totalPayout" },
    { title: "Bonus", emoji: "💸", value: stats.bonus || "$0", key: "bonus" },
  ];

  // Admin specific metrics (revenue/financial)
  // Revenue, Downloads, RPI, RPM are placeholders - no data source yet
  const adminMetrics = [
    { title: "Revenue", emoji: "💰", value: "$0", key: "revenue" },
    { title: "Downloads", emoji: "📊", value: "0", key: "downloads" },
    { title: "RPI", emoji: "📈", value: "$0", key: "rpi" },
    { title: "RPM", emoji: "📉", value: "$0", key: "rpm" },
    { title: "Total CPM Pay", emoji: "💸", value: stats.revenue || "$0", key: "totalCpmPay" },
    { title: "Real CPM", emoji: "🤑", value: stats.cpm || "$0", key: "cpm" },
  ];

  // Determine which role-specific metrics to show
  const getRoleSpecificMetrics = () => {
    if (isUGCCreator) return ugcCreatorMetrics;
    if (isInfluencer) return influencerMetrics;
    if (isAdmin) return adminMetrics;
    return []; // Account managers don't see role-specific metrics
  };

  const roleSpecificMetrics = getRoleSpecificMetrics();

  return (
    <div className={`px-4 md:px-6 space-y-3 md:space-y-4 transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
      {/* Top Row - Large Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Admin: Combined Views + Posts card */}
        {isAdmin ? (
          <>
            <CombinedStatsCard
              leftTitle="Total Views"
              leftEmoji="🖼️"
              leftValue={stats.totalViews}
              leftTrend={stats.viewsTrend}
              rightTitle="Total Posts"
              rightEmoji="💬"
              rightValue={stats.totalPosts}
              rightTrend={stats.postsTrend}
              platformBreakdown={{ tiktok: stats.totalPostsTikTok ?? 0, instagram: stats.totalPostsInstagram ?? 0 }}
              onPlatformClick={handlePlatformClick}
            />

            {/* Daily metrics card */}
            <DailyStatsCard
              views={stats.dailyViews || "0"}
              posts={stats.dailyPosts || 0}
              spend={stats.dailySpend || "$0"}
              postsTikTok={stats.dailyPostsTikTok}
              postsInstagram={stats.dailyPostsInstagram}
              onSpendClick={() => handleAdminMetricClick('dailySpend', 'Today\'s Spend')}
              onPlatformClick={(platform) => handleDailyPlatformClick(platform)}
            />
          </>
        ) : (
          <>
            {/* Non-admin: Original separate cards */}
            <StatsCard
              title="Total Views"
              emoji="🖼️"
              value={stats.totalViews}
              trend={stats.viewsTrend}
              showChart
              showInfo
            />

            <StatsCard
              title="Total Posts"
              emoji="💬"
              value={stats.totalPosts}
              trend={stats.postsTrend}
            />
          </>
        )}

        <StatsCard
          title="Virality Alerts"
          emoji="🌍"
          value=""
          alerts={stats.viralAlerts}
          onAlertDismiss={onRefreshData}
        />
      </div>

      {/* Second Row - Engagement Metrics (shown to all roles) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {engagementMetrics.map((metric) => (
          <MetricCard
            key={metric.key}
            title={metric.title}
            emoji={metric.emoji}
            value={metric.value}
          />
        ))}
      </div>

      {/* Third Row - Creator UGC Metrics (shown to admin when creator is selected) */}
      {isAdmin && creatorFilter && stats.targetPostsWeekly !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard
            title="Target Posts"
            emoji="🎯"
            value={`${stats.postsThisWeek ?? 0}/${stats.targetPostsWeekly ?? 12}`}
            success={stats.weeklyTargetMet}
          />
          <MetricCard
            title="Left to target"
            emoji="🔍"
            value={String(stats.leftToTarget ?? 0)}
          />
          <MetricCard
            title="Fixed Fee"
            emoji="💵"
            value={stats.fixedFeePayout || "$0"}
            warning={stats.weeksMissed && stats.weeksMissed > 0 ? (Math.min(stats.weeksMissed, 4) as 1 | 2 | 3 | 4) : undefined}
            onClick={() => handleAdminMetricClick('fixedFeePayout', 'Fixed Fee')}
          />
          <MetricCard
            title="CPM Payout"
            emoji="💸"
            value={stats.cpmPayout || "$0"}
            onClick={() => handleAdminMetricClick('cpmPayout', 'CPM Payout')}
          />
          <MetricCard
            title="Total Payout"
            emoji="💰"
            value={stats.totalPayout || "$0"}
            onClick={() => handleAdminMetricClick('totalPayout', 'Total Payout')}
          />
        </div>
      )}

      {/* Fourth Row (or Third if no creator selected) - Role-specific Metrics */}
      {/* UGC Creator: Use the new UGCContractRow component */}
      {isUGCCreator && (
        <UGCContractRow
          postsThisWeek={stats.postsThisWeek ?? 0}
          postsThisWeekTikTok={stats.postsThisWeekTikTok}
          postsThisWeekInstagram={stats.postsThisWeekInstagram}
          targetPostsWeekly={stats.targetPostsWeekly ?? 12}
          leftToTarget={stats.leftToTarget ?? 0}
          weeklyTargetMet={stats.weeklyTargetMet ?? false}
          fixedFeePayout={stats.fixedFeePayout || "$0"}
          cpmPayout={stats.cpmPayout || "$0"}
          totalPayout={stats.totalPayout || "$0"}
          weeksMissed={stats.weeksMissed ?? 0}
          weeksHit={stats.weeksHit ?? 0}
        />
      )}
      {/* Other roles: Use MetricCard grid */}
      {!isUGCCreator && roleSpecificMetrics.length > 0 && (
        <div className={`grid grid-cols-2 ${isAdmin ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-4`}>
          {roleSpecificMetrics.map((metric) => (
            <MetricCard
              key={metric.key}
              title={metric.title}
              emoji={metric.emoji}
              value={metric.value}
              onClick={
                // Only admin CPM metrics have click behavior (opens modal)
                isAdmin && (metric.key === 'totalCpmPay' || metric.key === 'cpm')
                  ? () => handleAdminMetricClick(metric.key, metric.title)
                  : undefined
              }
              success={'success' in metric ? (metric as { success?: boolean }).success : undefined}
              warning={'warning' in metric ? (metric as { warning?: 1 | 2 | 3 | 4 }).warning : undefined}
            />
          ))}
        </div>
      )}

      {/* Metric Explanation Modal */}
      {isAdmin && modalOpen && (() => {
        const totalCpmPayoutValue = stats?._raw.totalViews ? parseFloat(stats.revenue?.replace('$', '') || '0') : 0;
        const realCpmValue = parseFloat(stats?.cpm?.replace('$', '') || '0');

        console.log('📋 Modal Props:', {
          metricKey: selectedModalMetric,
          metricTitle: selectedModalTitle,
          breakdownLength: cpmBreakdown.length,
          breakdown: cpmBreakdown,
          totalCpmPayout: totalCpmPayoutValue,
          totalViews: stats?._raw.totalViews,
          realCpm: realCpmValue,
          loading: modalLoading,
          // Creator payout breakdown
          cpmRate: stats?._raw.cpmRate,
          cpmViews: stats?._raw.cpmViews,
          cpmAmount: stats?._raw.cpmAmount,
          fixedFeePerPost: stats?._raw.fixedFeePerPost,
          crossPostedCount: stats?._raw.crossPostedCount,
          fixedFeeAmount: stats?._raw.fixedFeeAmount,
          totalPayoutAmount: stats?._raw.totalPayoutAmount,
          // Daily spend breakdown
          dailyViews: stats?._rawDaily?.views,
          dailyPosts: stats?._rawDaily?.posts,
          dailySpend: stats?._rawDaily?.spend,
          dailyCrossPostedCount: stats?._rawDaily?.crossPostedCount,
          dailyCpmSpend: stats?._rawDaily?.cpmSpend,
          dailyFixedFeeSpend: stats?._rawDaily?.fixedFeeSpend,
        });

        return (
          <MetricExplanationModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            metricKey={selectedModalMetric}
            metricTitle={selectedModalTitle}
            cpmBreakdown={cpmBreakdown}
            totalCpmPayout={totalCpmPayoutValue}
            totalViews={stats?._raw.totalViews || 0}
            realCpm={realCpmValue}
            loading={modalLoading}
            // Creator payout breakdown
            cpmRate={stats?._raw.cpmRate}
            cpmViews={stats?._raw.cpmViews}
            cpmAmount={stats?._raw.cpmAmount}
            fixedFeePerPost={stats?._raw.fixedFeePerPost}
            crossPostedCount={stats?._raw.crossPostedCount}
            fixedFeeAmount={stats?._raw.fixedFeeAmount}
            totalPayoutAmount={stats?._raw.totalPayoutAmount}
            // Daily spend breakdown
            dailyViews={stats?._rawDaily?.views}
            dailyPosts={stats?._rawDaily?.posts}
            dailySpend={stats?._rawDaily?.spend}
            dailyCrossPostedCount={stats?._rawDaily?.crossPostedCount}
            dailyCpmSpend={stats?._rawDaily?.cpmSpend}
            dailyFixedFeeSpend={stats?._rawDaily?.fixedFeeSpend}
            dailyFixedFeeRate={stats?._rawDaily?.fixedFeeRate}
            dailyFixedFeeCount={stats?._rawDaily?.fixedFeeCount}
          />
        );
      })()}

      {/* Platform Posts Modal */}
      <PlatformPostsModal
        open={platformModalOpen}
        onOpenChange={setPlatformModalOpen}
        platform={selectedPlatform}
        posts={platformPosts}
        loading={platformPostsLoading}
      />
    </div>
  );
};

export default StatsGrid;
