import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface UGCContractRowProps {
  postsThisWeek: number;
  postsThisWeekTikTok?: number;
  postsThisWeekInstagram?: number;
  targetPostsWeekly: number;
  leftToTarget: number;
  weeklyTargetMet: boolean;
  fixedFeePayout: string;
  cpmPayout: string;
  totalPayout: string;
  weeksMissed?: number;
  weeksHit?: number;
}

const UGCContractRow = ({
  postsThisWeek,
  postsThisWeekTikTok = 0,
  postsThisWeekInstagram = 0,
  targetPostsWeekly,
  leftToTarget,
  weeklyTargetMet,
  fixedFeePayout,
  cpmPayout,
  totalPayout,
  weeksMissed = 0,
  weeksHit = 0,
}: UGCContractRowProps) => {
  const weeklyProgress = Math.min((postsThisWeek / targetPostsWeekly) * 100, 100);

  // Calculate missing posts per platform
  // If TT > IG, missing IG posts = TT - IG (they need to cross-post the TT videos to IG)
  // If IG > TT, missing TT posts = IG - TT
  const missingTikTok = Math.max(0, postsThisWeekInstagram - postsThisWeekTikTok);
  const missingInstagram = Math.max(0, postsThisWeekTikTok - postsThisWeekInstagram);
  const hasMissingPosts = missingTikTok > 0 || missingInstagram > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Weekly Target Progress Card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm font-medium">Weekly Target</span>
          {weeklyTargetMet && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className={cn(
            "text-4xl font-bold",
            weeklyTargetMet ? "text-green-500" : "text-foreground"
          )}>
            {postsThisWeek}
          </span>
          <span className="text-muted-foreground">/ {targetPostsWeekly} posts</span>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                weeklyTargetMet ? "bg-green-500" : "bg-primary"
              )}
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{weeklyTargetMet ? "Target complete!" : `${leftToTarget} more to go`}</span>
            <span>{weeklyTargetMet ? "Great job!" : `${leftToTarget} left`}</span>
          </div>
          {/* Missing cross-posts indicator */}
          {hasMissingPosts && (
            <div className="flex items-center gap-2 pt-1 text-xs text-amber-500/80">
              {missingTikTok > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                  -{missingTikTok}
                </span>
              )}
              {missingInstagram > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  -{missingInstagram}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payout Breakdown Card */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm font-medium">Payout Breakdown</span>
        </div>
        <div className="space-y-3">
          {/* Fixed Fee */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Fixed Fee</span>
                <span className="text-sm">💵</span>
              </div>
              <span className="text-xs text-muted-foreground">Weekly base pay</span>
            </div>
            <span className={cn(
              "text-xl font-bold",
              weeksMissed > 0 ? "text-red-400" : "text-foreground"
            )}>
              {fixedFeePayout}
            </span>
          </div>

          {/* CPM Payout */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">CPM Payout</span>
                <span className="text-sm">💸</span>
              </div>
              <span className="text-xs text-muted-foreground">From views earned</span>
            </div>
            <span className="text-xl font-bold text-primary">
              {cpmPayout}
            </span>
          </div>

          {/* Weeks Status */}
          {weeksMissed > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-1 text-xs text-red-400">
                <span>{weeksMissed} week{weeksMissed > 1 ? 's' : ''} missed this month</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total Payout Card */}
      <div className="glass-card p-5 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-sm font-medium">Total Payout</span>
          <span className="text-lg">💰</span>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-4xl font-bold text-green-500">
            {totalPayout}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          This month's earnings
        </div>

        {/* Weekly progress indicators */}
        <div className="mt-4 pt-3 border-t border-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Weeks completed</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((week) => (
              <div
                key={week}
                className={cn(
                  "flex-1 h-2 rounded-full flex items-center justify-center",
                  week <= weeksHit ? "bg-green-500" :
                  week <= weeksHit + weeksMissed ? "bg-red-400/50" : "bg-secondary"
                )}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{weeksHit} hit</span>
            {weeksMissed > 0 && <span className="text-red-400">{weeksMissed} missed</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UGCContractRow;
