import { useAccountManagerStats } from "@/hooks/useAccountManagerStats";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Circle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AMStatsGridProps {
  selectedTeamId?: string | null;
}

const AMStatsGrid = ({ selectedTeamId }: AMStatsGridProps) => {
  const { stats, loading, error } = useAccountManagerStats(selectedTeamId);

  if (loading) {
    return (
      <div className="px-4 md:px-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 h-[180px]">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-12 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-4 h-[100px]">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="px-4 md:px-6 py-8">
        <p className="text-destructive">Failed to load stats. Please try again.</p>
      </div>
    );
  }

  const dailyProgress = Math.min((stats.postsToday / stats.dailyTarget) * 100, 100);

  return (
    <div className="px-4 md:px-6 space-y-4">
      {/* Row 1: Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Today's Progress */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm font-medium">Today's Progress</span>
              {stats.postsToday >= stats.dailyTarget && (
                <CheckCircle className="w-5 h-5 text-success" />
              )}
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold">{stats.postsToday}</span>
              <span className="text-muted-foreground">/ {stats.dailyTarget} posts</span>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    dailyProgress >= 100 ? "bg-success" : "bg-primary"
                  )}
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats.postsToday >= stats.dailyTarget ? "Daily target complete!" : `${stats.dailyTarget - stats.postsToday} more to go`}</span>
                <span>{stats.dailyTarget - stats.postsToday > 0 ? `${stats.dailyTarget - stats.postsToday} left` : "Target hit!"}</span>
              </div>
            </div>
          </div>

          {/* Weekly Progress */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm font-medium">Weekly Progress</span>
              {stats.daysHitThisWeek >= 6 && (
                <div className="flex items-center gap-1 text-success text-xs">
                  <TrendingUp className="w-4 h-4" />
                  Bonus unlocked!
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold">{stats.daysHitThisWeek}</span>
              <span className="text-muted-foreground">/ 6 days hit</span>
            </div>
            <div className="space-y-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    key={day}
                    className={cn(
                      "flex-1 h-2 rounded-full",
                      day <= stats.daysHitThisWeek ? "bg-success" : "bg-secondary"
                    )}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats.daysHitThisWeek >= 6 ? "Weekly bonus earned!" : `${6 - stats.daysHitThisWeek} more days for bonus`}</span>
              </div>
            </div>
          </div>

          {/* Monthly Progress */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm font-medium">Monthly Progress</span>
              {stats.weeksHitThisMonth >= 4 && (
                <div className="flex items-center gap-1 text-success text-xs">
                  <TrendingUp className="w-4 h-4" />
                  Max bonus!
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold">{stats.weeksHitThisMonth}</span>
              <span className="text-muted-foreground">/ 4 weeks hit</span>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((week) => (
                  <div
                    key={week}
                    className={cn(
                      "flex-1 h-3 rounded-full flex items-center justify-center",
                      week <= stats.weeksHitThisMonth ? "bg-success" : "bg-secondary"
                    )}
                  >
                    {week <= stats.weeksHitThisMonth ? (
                      <CheckCircle className="w-2 h-2 text-success-foreground" />
                    ) : (
                      <Circle className="w-2 h-2 text-muted-foreground/50" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats.weeksHitThisMonth >= 4 ? "Monthly bonus unlocked!" : `${4 - stats.weeksHitThisMonth} more weeks for bonus`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Earnings Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="text-xs text-muted-foreground mb-1">Account Pairs</div>
            <div className="text-2xl font-bold">{stats.accountPairs}</div>
            <div className="text-xs text-muted-foreground">TT/IG pairs</div>
          </div>

          <div className="glass-card p-4">
            <div className="text-xs text-muted-foreground mb-1">Posts This Month</div>
            <div className="text-2xl font-bold text-primary">{Math.floor(stats.monthlyBase / stats.accountPairs)}</div>
            <div className="text-xs text-muted-foreground">posts submitted</div>
          </div>

          <div className="glass-card p-4">
            <div className="text-xs text-muted-foreground mb-1">Bonuses Earned</div>
            <div className="text-2xl font-bold text-success">
              ${stats.weeklyBonus + stats.monthlyBonus}
            </div>
            <div className="text-xs text-muted-foreground">Weekly + Monthly</div>
          </div>

          <div className="glass-card p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Total Earnings</div>
            <div className="text-2xl font-bold text-primary">${stats.monthlyTotal}</div>
            <div className="text-xs text-muted-foreground">this month</div>
          </div>
        </div>
    </div>
  );
};

export default AMStatsGrid;
