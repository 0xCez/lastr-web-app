import { cn } from "@/lib/utils";

interface DailyStatsCardProps {
  views: string;
  posts: number;
  spend: string;
  postsTikTok?: number;
  postsInstagram?: number;
  onSpendClick?: () => void;
  onPlatformClick?: (platform: 'tiktok' | 'instagram') => void;
  className?: string;
}

const DailyStatsCard = ({
  views,
  posts,
  spend,
  postsTikTok,
  postsInstagram,
  onSpendClick,
  onPlatformClick,
  className,
}: DailyStatsCardProps) => {
  return (
    <div
      className={cn(
        "glass-card p-4 md:p-6 relative overflow-hidden",
        className
      )}
    >
      <div className="grid grid-cols-3 h-full gap-3 md:gap-6">
        {/* Views Section */}
        <div className="border-r border-border/30 pr-3 md:pr-6">
          {/* Header */}
          <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
            <span className="text-foreground font-medium text-sm md:text-base">Today</span>
            <span className="text-sm">📅</span>
          </div>

          {/* Value */}
          <div className="flex items-baseline">
            <span className="text-2xl md:text-4xl font-bold text-foreground">{views}</span>
          </div>
          <div className="text-xs md:text-sm text-muted-foreground mt-0.5">views</div>
        </div>

        {/* Posts Section */}
        <div className="border-r border-border/30 px-2 md:px-0">
          {/* Header spacer to align with left */}
          <div className="h-[22px] md:h-[28px]" />

          {/* Value */}
          <div className="flex items-baseline">
            <span className="text-2xl md:text-4xl font-bold text-foreground">{posts}</span>
          </div>
          <div className="text-xs md:text-sm text-muted-foreground mt-0.5">posts</div>

          {/* Platform breakdown */}
          {(postsTikTok !== undefined || postsInstagram !== undefined) && (
            <div className="flex items-center gap-2 md:gap-3 mt-1">
              {postsTikTok !== undefined && (
                <button
                  onClick={() => onPlatformClick?.('tiktok')}
                  className="flex items-center gap-0.5 md:gap-1 hover:opacity-70 transition-opacity cursor-pointer"
                  disabled={!onPlatformClick}
                >
                  <img src="/svg/tiktok.svg" alt="TikTok" className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm text-muted-foreground">{postsTikTok}</span>
                </button>
              )}
              {postsInstagram !== undefined && (
                <button
                  onClick={() => onPlatformClick?.('instagram')}
                  className="flex items-center gap-0.5 md:gap-1 hover:opacity-70 transition-opacity cursor-pointer"
                  disabled={!onPlatformClick}
                >
                  <img src="/svg/instagram.svg" alt="Instagram" className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm text-muted-foreground">{postsInstagram}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Spend Section */}
        <div
          className={cn(
            "pl-2 md:pl-0",
            onSpendClick && "cursor-pointer hover:opacity-70 transition-opacity"
          )}
          onClick={onSpendClick}
        >
          {/* Header spacer to align with left */}
          <div className="h-[22px] md:h-[28px]" />

          {/* Value */}
          <div className="flex items-baseline">
            <span className="text-2xl md:text-4xl font-bold text-foreground">{spend}</span>
          </div>
          <div className="text-xs md:text-sm text-muted-foreground mt-0.5">spend</div>
        </div>
      </div>
    </div>
  );
};

export default DailyStatsCard;
