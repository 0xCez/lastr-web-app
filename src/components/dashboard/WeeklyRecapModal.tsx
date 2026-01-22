import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WeeklyRecapData, getAvailableWeeks } from "@/hooks/useWeeklyRecap";
import { TrendingUp, TrendingDown, Eye, FileText, Trophy, Sparkles, ExternalLink, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import assets from "@/assets";

interface WeeklyRecapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: WeeklyRecapData | null;
  loading?: boolean;
  onDismiss: () => void;
  onWeekChange?: (date: Date) => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const GrowthBadge = ({ value }: { value: number }) => {
  const isPositive = value >= 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded",
      isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
    )}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value).toFixed(0)}%
    </span>
  );
};

const PlatformIcon = ({ platform }: { platform: string }) => {
  const platformLower = platform.toLowerCase();

  if (platformLower === 'tiktok') {
    return (
      <img
        src={assets.icons.tiktok}
        alt="TikTok"
        className="w-5 h-5"
      />
    );
  }

  if (platformLower === 'instagram') {
    return (
      <img
        src={assets.icons.instagram}
        alt="Instagram"
        className="w-5 h-5"
      />
    );
  }

  // Fallback for other platforms
  return <span className="text-lg">📱</span>;
};

const WeeklyRecapModal = ({ open, onOpenChange, data, loading, onDismiss, onWeekChange }: WeeklyRecapModalProps) => {
  const availableWeeks = getAvailableWeeks();
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<string>("0");

  // Reset to first week when modal opens
  useEffect(() => {
    if (open) {
      setSelectedWeekIndex("0");
    }
  }, [open]);

  const handleWeekChange = (value: string) => {
    setSelectedWeekIndex(value);
    const weekIndex = parseInt(value);
    const week = availableWeeks[weekIndex];
    if (week && onWeekChange) {
      onWeekChange(week.start);
    }
  };

  const handleClose = () => {
    onDismiss();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Weekly Recap
          </DialogTitle>
        </DialogHeader>

        {/* Week Selector */}
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedWeekIndex} onValueChange={handleWeekChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              {availableWeeks.map((week, index) => (
                <SelectItem key={index} value={String(index)}>
                  {week.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <div className="text-center py-12 text-muted-foreground">
            No data available for this week
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Week Date Range Display */}
            <div className="text-sm text-muted-foreground text-center">
              {formatDate(data.weekStart)} - {formatDate(data.weekEnd)}, {data.weekEnd.getFullYear()}
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Total Posts
                  </span>
                  <GrowthBadge value={data.postsGrowth} />
                </div>
                <div className="text-3xl font-bold">{data.totalPosts}</div>
              </div>
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    Total Views
                  </span>
                  <GrowthBadge value={data.totalViewsGrowth} />
                </div>
                <div className="text-3xl font-bold">{formatNumber(data.totalViews)}</div>
              </div>
            </div>

            {/* Top Creators */}
            {data.topCreators.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Top Creators This Week
                </h3>
                <div className="space-y-2">
                  {data.topCreators.map((creator, index) => (
                    <div
                      key={creator.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg",
                        index === 0 ? "bg-yellow-500/10 border border-yellow-500/20" :
                        index === 1 ? "bg-gray-500/10 border border-gray-500/20" :
                        index === 2 ? "bg-orange-500/10 border border-orange-500/20" :
                        "bg-secondary/50"
                      )}
                    >
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0 ? "bg-yellow-500 text-black" :
                        index === 1 ? "bg-gray-400 text-black" :
                        index === 2 ? "bg-orange-500 text-black" :
                        "bg-secondary text-muted-foreground"
                      )}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{creator.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {creator.posts_count} posts
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatNumber(creator.total_views)}</div>
                        <div className="text-xs text-muted-foreground">views</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Viral Posts */}
            {data.viralPosts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Viral Posts (10K+ views)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {data.viralPosts.map((post, index) => (
                    <a
                      key={post.id}
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                    >
                      <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <PlatformIcon platform={post.platform} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {post.creator_name}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-sm font-semibold text-green-400">{formatNumber(post.views)}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Breakdown */}
            {data.platformBreakdown.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Platform Breakdown
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {data.platformBreakdown.map((platform) => (
                    <div key={platform.platform} className="glass-card p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <PlatformIcon platform={platform.platform} />
                        <span className="font-medium capitalize text-sm">{platform.platform}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {platform.posts} posts · {formatNumber(platform.views)} views
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button onClick={handleClose}>
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WeeklyRecapModal;
