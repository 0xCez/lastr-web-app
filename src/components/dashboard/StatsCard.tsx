import { useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, Info, ExternalLink } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import ViralPostModal from "./ViralPostModal";

interface AlertData {
  postId: string;
  message: string;
  views: string;
  action: string;
  postUrl?: string;
  accountHandle?: string;
  likes?: string;
  comments?: string;
  shares?: string;
  bookmarks?: string;
  engagementRate?: string;
  createdAt?: string;
}

interface StatsCardProps {
  title: string;
  emoji: string;
  value: string;
  trend?: { value: string; positive: boolean };
  subtitle?: string; // Small text below the value (e.g., "TT: 12 / IG: 11")
  platformBreakdown?: { tiktok: number; instagram: number }; // Platform split with icons
  onPlatformClick?: (platform: 'tiktok' | 'instagram') => void; // Callback when platform count is clicked
  showChart?: boolean;
  showInfo?: boolean;
  alerts?: AlertData[];
  className?: string;
  isSelected?: boolean;
  onClick?: () => void;
  onAlertDismiss?: () => void;
}

const chartData = [
  { value: 30 },
  { value: 45 },
  { value: 35 },
  { value: 55 },
  { value: 40 },
  { value: 60 },
  { value: 50 },
  { value: 70 },
  { value: 65 },
  { value: 80 },
  { value: 75 },
  { value: 85 },
];

const StatsCard = ({
  title,
  emoji,
  value,
  trend,
  subtitle,
  platformBreakdown,
  onPlatformClick,
  showChart,
  showInfo,
  alerts,
  className,
  isSelected,
  onClick,
  onAlertDismiss
}: StatsCardProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPostUrl, setSelectedPostUrl] = useState<string | undefined>(undefined);
  const [selectedPostData, setSelectedPostData] = useState<any>(undefined);

  return (
    <>
      <div 
        className={cn(
          "glass-card p-6 h-[180px] relative overflow-hidden group transition-all duration-300",
          onClick && "cursor-pointer hover:border-primary/30",
          isSelected && "border-primary/50 bg-primary/5",
          className
        )}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-medium">{title}</span>
            <span>{emoji}</span>
          </div>
          {showInfo && (
            <Info className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        {/* Value */}
        {value && (
          <div className="flex items-end gap-3 mb-4">
            <span className="text-4xl font-bold text-foreground">{value}</span>
            {trend && (
              <span className={cn(
                "flex items-center gap-1 text-sm px-2 py-1 rounded-full mb-1",
                trend.positive ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}>
                <TrendingUp className="w-3 h-3" />
                {trend.value}
              </span>
            )}
          </div>
        )}

        {/* Subtitle (e.g., platform breakdown) */}
        {subtitle && (
          <p className="text-sm text-muted-foreground -mt-2 mb-2">{subtitle}</p>
        )}

        {/* Platform breakdown with icons */}
        {platformBreakdown && (
          <div className="flex items-center gap-4 -mt-2 mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlatformClick?.('tiktok');
              }}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity cursor-pointer"
              disabled={!onPlatformClick}
            >
              <img src="/svg/tiktok.svg" alt="TikTok" className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">{platformBreakdown.tiktok}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlatformClick?.('instagram');
              }}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity cursor-pointer"
              disabled={!onPlatformClick}
            >
              <img src="/svg/instagram.svg" alt="Instagram" className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">{platformBreakdown.instagram}</span>
            </button>
          </div>
        )}

        {/* Chart */}
        {showChart && (
          <div className="h-20 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValueStats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorValueStats)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* Alerts - Scrollable if more than 2 */}
        {alerts && alerts.length > 0 && (
          <div className={cn(
            "space-y-0",
            alerts.length > 2 && "max-h-[120px] overflow-y-auto"
          )}>
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start justify-between py-3 border-b border-border/50 last:border-b-0">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {alert.message} <span className="text-xs text-muted-foreground">@{alert.accountHandle}</span>
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Acknowledge the alert
                      const { supabase } = await import('@/lib/supabase');
                      await supabase
                        .from('posts')
                        .update({ viral_alert_acknowledged: true })
                        .eq('id', alert.postId);
                      // Trigger data refresh without full page reload
                      onAlertDismiss?.();
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors whitespace-nowrap"
                  >
                    ✓ Engaged
                  </button>
                  {alert.postUrl && (
                    <a
                      href={alert.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded transition-colors whitespace-nowrap"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ViralPostModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        postUrl={selectedPostUrl}
        postData={selectedPostData}
      />
    </>
  );
};

export default StatsCard;
