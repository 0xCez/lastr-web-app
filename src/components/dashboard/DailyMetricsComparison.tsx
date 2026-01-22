/**
 * Daily Metrics Comparison Component
 * Shows daily averages with trend cards and expandable comparison table
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useDailyMetricsComparison, DailyMetric } from '@/hooks/useDailyMetricsComparison';

interface DailyMetricsComparisonProps {
  refreshTrigger?: number;
  className?: string;
}

// Format number for display
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

const DailyMetricsComparison = ({ refreshTrigger, className }: DailyMetricsComparisonProps) => {
  const [expanded, setExpanded] = useState(false);
  const { metrics, loading, error } = useDailyMetricsComparison(refreshTrigger);

  if (error) {
    return (
      <div className={cn("glass-card p-4 md:p-6", className)}>
        <div className="text-destructive text-sm">Failed to load metrics: {error}</div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card p-4 md:p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-foreground font-medium">Daily Averages</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? (
            <>
              Collapse <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Expand <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Metric Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {metrics.map((metric) => (
              <MetricMiniCard key={metric.key} metric={metric} />
            ))}
          </div>

          {/* Expandable Comparison Table */}
          {expanded && (
            <div className="mt-6 pt-4 border-t border-border/30">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border/30">
                      <th className="text-left py-2 pr-4 font-medium">Metric</th>
                      <th className="text-right py-2 px-2 font-medium">Today</th>
                      <th className="text-right py-2 px-2 font-medium">Yesterday</th>
                      <th className="text-right py-2 px-2 font-medium">7D Avg</th>
                      <th className="text-right py-2 pl-2 font-medium">30D Avg</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground">
                    {metrics.map((metric) => (
                      <tr key={metric.key} className="border-b border-border/20 last:border-b-0">
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-2">
                            <span>{metric.emoji}</span>
                            <span>{metric.label}</span>
                          </span>
                        </td>
                        <td className="text-right py-3 px-2 font-medium">
                          {formatTableValue(metric.today, metric.format)}
                        </td>
                        <td className="text-right py-3 px-2 text-muted-foreground">
                          {formatTableValue(metric.yesterday, metric.format)}
                        </td>
                        <td className="text-right py-3 px-2 text-muted-foreground">
                          {formatTableValue(metric.avg7Day, metric.format)}
                        </td>
                        <td className="text-right py-3 pl-2 text-muted-foreground">
                          {formatTableValue(metric.avg30Day, metric.format)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Mini card for each metric
const MetricMiniCard = ({ metric }: { metric: DailyMetric }) => {
  return (
    <div className="bg-muted/30 rounded-lg p-3 md:p-4">
      {/* Label with emoji */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs text-muted-foreground">{metric.label}</span>
        <span className="text-sm">{metric.emoji}</span>
      </div>

      {/* Value */}
      <div className="text-xl md:text-2xl font-bold text-foreground mb-1">
        {formatValue(metric.today, metric.format)}
      </div>

      {/* Trend badge */}
      {metric.trend && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full",
            metric.trend.positive
              ? "bg-success/20 text-success"
              : "bg-destructive/20 text-destructive"
          )}
        >
          {metric.trend.positive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {metric.trend.value}
        </span>
      )}
    </div>
  );
};

export default DailyMetricsComparison;
