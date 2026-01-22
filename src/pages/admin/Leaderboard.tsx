import { useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Eye, FileText, DollarSign, Heart, ArrowUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { useIsMobile } from "@/hooks/use-mobile";

type SortField = 'rank' | 'totalViews' | 'totalPosts' | 'avgViewsPerPost' | 'cpm' | 'engagementRate' | 'earnings';
type SortDirection = 'asc' | 'desc';

const Leaderboard = () => {
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const isMobile = useIsMobile();

  // Fetch real data from the hook
  const { creators, stats, loading, error } = useLeaderboardData();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCreators = [...creators].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;

    if (a[sortField] < b[sortField]) return -1 * multiplier;
    if (a[sortField] > b[sortField]) return 1 * multiplier;
    return 0;
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  // Loading skeleton for the table
  const TableSkeleton = () => (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[60px]" />
        </div>
      ))}
    </div>
  );

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium">Failed to load leaderboard</p>
          <p className="text-muted-foreground text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Creator Leaderboard</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Top performing creators ranked by performance
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="glass-card p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Total Views</p>
                {loading ? (
                  <Skeleton className="h-6 md:h-8 w-16 md:w-24" />
                ) : (
                  <p className="text-lg md:text-2xl font-bold text-foreground">{formatNumber(stats.totalViews)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Total Posts</p>
                {loading ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
                ) : (
                  <p className="text-lg md:text-2xl font-bold text-foreground">{stats.totalPosts}</p>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Total Earnings</p>
                <p className="text-lg md:text-2xl font-bold text-foreground">$0</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-pink-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground truncate">Avg Engagement</p>
                {loading ? (
                  <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
                ) : (
                  <p className="text-lg md:text-2xl font-bold text-foreground">{stats.avgEngagement.toFixed(1)}%</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        {isMobile && (
          <div className="space-y-3 md:hidden">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedCreators.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground">No approved creators found</p>
              </div>
            ) : (
              sortedCreators.map((creator) => (
                <div key={creator.id} className="glass-card p-4 space-y-3">
                  {/* Header: Rank + Creator */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">{getRankBadge(creator.rank)}</span>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={creator.avatar || undefined} alt={creator.name} />
                      <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{creator.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{creator.email}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        creator.status === 'active'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        creator.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                      }`} />
                      {creator.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-secondary/30 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Views</p>
                      <p className="font-semibold text-sm">{formatNumber(creator.totalViews)}</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Posts</p>
                      <p className="font-semibold text-sm">{creator.totalPosts}</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2">
                      <p className="text-xs text-muted-foreground">Avg/Post</p>
                      <p className="font-semibold text-sm">{formatNumber(creator.avgViewsPerPost)}</p>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">CPM: <span className="font-semibold text-foreground">${creator.cpm.toFixed(2)}</span></span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        creator.engagementRate >= 15
                          ? 'bg-green-500/10 text-green-500'
                          : creator.engagementRate >= 10
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {creator.engagementRate.toFixed(1)}%
                      </span>
                    </div>
                    <p className="font-bold text-green-500">${creator.earnings.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Desktop Leaderboard Table */}
        <div className="glass-card overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort('rank')}
                      className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      Rank
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-sm font-semibold text-foreground">Creator</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-sm font-semibold text-foreground">Status</span>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('totalViews')}
                      className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors ml-auto"
                    >
                      Total Views
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('totalPosts')}
                      className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors ml-auto"
                    >
                      Posts
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('avgViewsPerPost')}
                      className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors ml-auto"
                    >
                      Avg Views/Post
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('cpm')}
                      className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors ml-auto"
                    >
                      Real CPM
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('engagementRate')}
                      className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors ml-auto"
                    >
                      Engagement
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleSort('earnings')}
                      className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors ml-auto"
                    >
                      Earnings
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <TableSkeleton />
                ) : sortedCreators.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <p className="text-muted-foreground">No approved creators found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Creators will appear here once they are approved
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedCreators.map((creator) => {
                    return (
                      <tr
                        key={creator.id}
                        className="hover:bg-secondary/30 transition-colors group"
                      >
                        {/* Rank */}
                        <td className="px-4 py-4">
                          <span className="text-2xl font-bold">
                            {getRankBadge(creator.rank)}
                          </span>
                        </td>

                        {/* Creator - Name and email */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={creator.avatar || undefined} alt={creator.name} />
                              <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-foreground">{creator.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {creator.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              creator.status === 'active'
                                ? 'bg-green-500/10 text-green-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              creator.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                            }`} />
                            {creator.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Total Views */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <p className="font-semibold text-foreground">
                              {formatNumber(creator.totalViews)}
                            </p>
                            {creator.viewsTrend === 'up' && (
                              <TrendingUp className="w-4 h-4 text-green-500" />
                            )}
                            {creator.viewsTrend === 'down' && (
                              <TrendingDown className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </td>

                        {/* Total Posts */}
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-foreground">{creator.totalPosts}</p>
                        </td>

                        {/* Avg Views/Post */}
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-foreground">
                            {formatNumber(creator.avgViewsPerPost)}
                          </p>
                        </td>

                        {/* CPM */}
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-foreground">${creator.cpm.toFixed(2)}</p>
                        </td>

                        {/* Engagement Rate */}
                        <td className="px-4 py-4 text-right">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-sm font-semibold ${
                              creator.engagementRate >= 15
                                ? 'bg-green-500/10 text-green-500'
                                : creator.engagementRate >= 10
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {creator.engagementRate.toFixed(1)}%
                          </span>
                        </td>

                        {/* Earnings */}
                        <td className="px-4 py-4 text-right">
                          <p className="font-bold text-green-500">
                            ${creator.earnings.toLocaleString()}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Showing {sortedCreators.length} creators · Data updates in real-time
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
