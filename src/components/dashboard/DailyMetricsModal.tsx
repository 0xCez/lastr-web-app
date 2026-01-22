/**
 * Daily Metrics Modal Component
 * Shows daily averages with trend comparisons in a modal
 */

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Loader2, X, BarChart3 } from 'lucide-react';
import { useDailyMetricsComparison, DailyMetric } from '@/hooks/useDailyMetricsComparison';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DailyMetricsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refreshTrigger?: number;
}

// Format number for display in cards
const formatValue = (value: number, format: DailyMetric['format']): string => {
  if (format === 'currency') {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  }
  if (format === 'views') {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }
  // number format
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Format table value (more precise)
const formatTableValue = (value: number, format: DailyMetric['format']): string => {
  if (format === 'currency') {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  }
  if (format === 'views') {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }
  // number format - show decimal for averages
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(1);
};

const DailyMetricsModal = ({ open, onOpenChange, refreshTrigger }: DailyMetricsModalProps) => {
  const { metrics, loading, error } = useDailyMetricsComparison(refreshTrigger);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Daily Metrics
          </DialogTitle>
        </DialogHeader>

        {error ? (
          <div className="text-destructive text-sm py-4">Failed to load metrics: {error}</div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {metrics.map((metric) => (
                <MetricCard key={metric.key} metric={metric} />
              ))}
            </div>

            {/* Comparison Table */}
            <div className="border border-border/50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Metric</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">Today</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">Yesterday</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">7D Avg</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">30D Avg</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {metrics.map((metric, index) => (
                    <tr
                      key={metric.key}
                      className={cn(
                        "border-b border-border/30 last:border-b-0 transition-colors hover:bg-muted/20",
                        index % 2 === 0 && "bg-muted/10"
                      )}
                    >
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{metric.emoji}</span>
                          <span className="font-medium">{metric.label}</span>
                        </span>
                      </td>
                      <td className="text-right py-3 px-3">
                        <span className="font-semibold text-foreground">
                          {formatTableValue(metric.today, metric.format)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-3 text-muted-foreground">
                        {formatTableValue(metric.yesterday, metric.format)}
                      </td>
                      <td className="text-right py-3 px-3 text-muted-foreground">
                        {formatTableValue(metric.avg7Day, metric.format)}
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground">
                        {formatTableValue(metric.avg30Day, metric.format)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Improved Metric Card
const MetricCard = ({ metric }: { metric: DailyMetric }) => {
  const isPositive = metric.trend?.positive;

  return (
    <div className="relative bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl p-4 border border-border/50 hover:border-border transition-colors">
      {/* Emoji badge */}
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-sm shadow-sm">
        {metric.emoji}
      </div>

      {/* Label */}
      <p className="text-xs text-muted-foreground font-medium mb-1">{metric.label}</p>

      {/* Value */}
      <p className="text-2xl font-bold text-foreground mb-2">
        {formatValue(metric.today, metric.format)}
      </p>

      {/* Trend badge */}
      {metric.trend && (
        <div
          className={cn(
            "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium",
            isPositive
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              : "bg-red-500/15 text-red-400 border border-red-500/30"
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{metric.trend.value}</span>
        </div>
      )}
    </div>
  );
};

export default DailyMetricsModal;
