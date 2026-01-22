import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CombinedStatsCardProps {
  // Left metric (Views)
  leftTitle: string;
  leftEmoji: string;
  leftValue: string;
  leftTrend?: { value: string; positive: boolean };

  // Right metric (Posts)
  rightTitle: string;
  rightEmoji: string;
  rightValue: string;
  rightTrend?: { value: string; positive: boolean };
  platformBreakdown?: { tiktok: number; instagram: number };
  onPlatformClick?: (platform: 'tiktok' | 'instagram') => void;

  className?: string;
}

const CombinedStatsCard = ({
  leftTitle,
  leftEmoji,
  leftValue,
  leftTrend,
  rightTitle,
  rightEmoji,
  rightValue,
  rightTrend,
  platformBreakdown,
  onPlatformClick,
  className,
}: CombinedStatsCardProps) => {
  return (
    <div
      className={cn(
        "glass-card p-4 md:p-6 relative overflow-hidden",
        className
      )}
    >
      <div className="grid grid-cols-2 h-full gap-3 md:gap-6">
        {/* Left Section - Views */}
        <div className="border-r border-border/30 pr-3 md:pr-6">
          {/* Header */}
          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
            <span className="text-foreground font-medium text-sm md:text-base">{leftTitle}</span>
            <span className="text-sm">{leftEmoji}</span>
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="text-2xl md:text-4xl font-bold text-foreground">{leftValue}</span>
            {leftTrend && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full",
                  leftTrend.positive
                    ? "bg-success/20 text-success"
                    : "bg-destructive/20 text-destructive"
                )}
              >
                {leftTrend.positive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {leftTrend.value}
              </span>
            )}
          </div>
        </div>

        {/* Right Section - Posts */}
        <div className="pl-1 md:pl-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
            <span className="text-foreground font-medium text-sm md:text-base">{rightTitle}</span>
            <span className="text-sm">{rightEmoji}</span>
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2 md:gap-3">
            <span className="text-2xl md:text-4xl font-bold text-foreground">{rightValue}</span>
            {rightTrend && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full",
                  rightTrend.positive
                    ? "bg-success/20 text-success"
                    : "bg-destructive/20 text-destructive"
                )}
              >
                {rightTrend.positive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {rightTrend.value}
              </span>
            )}
          </div>

          {/* Platform breakdown */}
          {platformBreakdown && (
            <div className="flex items-center gap-2 md:gap-3 mt-1">
              <button
                onClick={() => onPlatformClick?.('tiktok')}
                className="flex items-center gap-0.5 md:gap-1 hover:opacity-70 transition-opacity cursor-pointer"
                disabled={!onPlatformClick}
              >
                <img src="/svg/tiktok.svg" alt="TikTok" className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm text-muted-foreground">
                  {platformBreakdown.tiktok}
                </span>
              </button>
              <button
                onClick={() => onPlatformClick?.('instagram')}
                className="flex items-center gap-0.5 md:gap-1 hover:opacity-70 transition-opacity cursor-pointer"
                disabled={!onPlatformClick}
              >
                <img src="/svg/instagram.svg" alt="Instagram" className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm text-muted-foreground">
                  {platformBreakdown.instagram}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CombinedStatsCard;
