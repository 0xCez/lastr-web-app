import { cn } from "@/lib/utils";
import { Eye, TrendingUp, Heart, MessageCircle, Share2, Bookmark, BarChart3 } from "lucide-react";

interface VideoCardProps {
  rank: number;
  username: string;
  platform: "tiktok" | "instagram";
  caption: string;
  date: string;
  stats: {
    views: string;
    engagement: string;
    likes: string;
    comments: string;
    shares: string;
    bookmarks: string;
    engRate: string;
  };
  className?: string;
}

const VideoCard = ({ rank, username, platform, caption, date, stats, className }: VideoCardProps) => {
  const platformIcon = platform === "tiktok" ? "♪" : "📷";
  const platformColor = platform === "tiktok" ? "text-foreground" : "text-pink-400";
  
  return (
    <div className={cn(
      "glass-card overflow-hidden group transition-all duration-300 hover:border-primary/50",
      className
    )}>
      {/* Video Thumbnail Area */}
      <div className="relative h-48 bg-gradient-to-br from-card to-secondary">
        {/* Rank Badge */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-secondary/80 backdrop-blur flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">#{rank}</span>
        </div>
        
        {/* Video placeholder - would be actual video thumbnail */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[20px] border-l-primary border-y-[12px] border-y-transparent ml-1" />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* User Info */}
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("font-medium text-sm", platformColor)}>@{username}</span>
          <span className="text-xs">{platformIcon}</span>
        </div>
        
        {/* Caption */}
        <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
          {caption}
        </p>
        
        <p className="text-xs text-muted-foreground mb-4">
          Uploaded on {date}
        </p>
        
        {/* Stats */}
        <div className="space-y-2">
          <StatRow icon={<Eye className="w-3 h-3" />} label="Views" value={stats.views} />
          <StatRow icon={<BarChart3 className="w-3 h-3" />} label="Engagement" value={stats.engagement} />
          <StatRow icon={<Heart className="w-3 h-3" />} label="Likes" value={stats.likes} color="text-red-400" />
          <StatRow icon={<MessageCircle className="w-3 h-3" />} label="Comments" value={stats.comments} color="text-yellow-400" />
          <StatRow icon={<Share2 className="w-3 h-3" />} label="Shares" value={stats.shares} color="text-blue-400" />
          <StatRow icon={<Bookmark className="w-3 h-3" />} label="Bookmarks" value={stats.bookmarks} />
          <StatRow icon={<TrendingUp className="w-3 h-3" />} label="Eng. Rate" value={stats.engRate} color="text-primary" />
        </div>
      </div>
    </div>
  );
};

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}

const StatRow = ({ icon, label, value, color }: StatRowProps) => (
  <div className="flex items-center justify-between text-xs">
    <div className={cn("flex items-center gap-2", color || "text-muted-foreground")}>
      {icon}
      <span>{label}</span>
    </div>
    <span className="text-foreground font-medium">{value}</span>
  </div>
);

export default VideoCard;
