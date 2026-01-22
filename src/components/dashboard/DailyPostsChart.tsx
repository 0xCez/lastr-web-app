import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2, AreaChartIcon, BarChart3, LineChartIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePostsChartAnalytics } from "@/hooks/usePostsChartAnalytics";

type ChartType = 'area' | 'bar' | 'line';
type DatePreset = 'last7' | 'last30';

// Format number for display
const formatNumber = (num: number): string => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return `${num}`;
};

// Custom tooltip component for posts
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-violet-500">
        {payload[0].value} {payload[0].value === 1 ? 'post' : 'posts'}
      </p>
    </div>
  );
};

interface DailyPostsChartProps {
  creatorFilter?: string | null;
  accountFilter?: string | null;
  platformFilter?: string[];
  contentTypeFilter?: 'ugc_video' | 'slideshow';
  refreshTrigger?: number;
}

const DailyPostsChart = ({
  creatorFilter,
  accountFilter,
  platformFilter,
  contentTypeFilter,
  refreshTrigger,
}: DailyPostsChartProps) => {
  const [chartType, setChartType] = useState<ChartType>('bar');  // Default to bar
  const [datePreset, setDatePreset] = useState<DatePreset>('last7');

  const {
    data: chartData,
    totalValue,
    loading,
    error,
  } = usePostsChartAnalytics({
    datePreset,
    creatorFilter,
    accountFilter,
    platformFilter,
    contentTypeFilter,
    refreshTrigger,
  });

  const hasData = chartData && chartData.length > 0;

  // Calculate Y-axis domain and ticks
  const calculateYAxisConfig = () => {
    const maxDataValue = Math.max(...(chartData || []).map(d => d.value), 0);

    if (maxDataValue === 0) {
      return { domain: [0, 10], ticks: [0, 2, 4, 6, 8, 10] };
    }

    // For posts, use nice integer ticks
    const niceMax = Math.ceil(maxDataValue * 1.2);
    const tickCount = Math.min(6, niceMax + 1);
    const tickInterval = Math.ceil(niceMax / (tickCount - 1));
    const ticks = Array.from({ length: tickCount }, (_, i) => i * tickInterval);

    return { domain: [0, niceMax], ticks };
  };

  const { domain: yDomain, ticks: yTicks } = calculateYAxisConfig();

  // Calculate tick interval for X-axis
  const getTickInterval = () => {
    const dataLength = chartData?.length || 0;
    if (dataLength <= 7) return 0;
    if (dataLength <= 15) return 1;
    return Math.floor(dataLength / 10);
  };

  // Violet color scheme for posts
  const chartColor = "hsl(263, 70%, 50%)"; // Violet

  return (
    <div className="px-4 md:px-6 pb-3 md:pb-4">
      <div className="glass-card p-4 md:p-6">
        {/* Header - stacked on mobile, inline on desktop */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-3 md:mb-4">
          {/* Title + Total */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <h3 className="text-foreground font-semibold text-sm md:text-base">Daily Posts</h3>
            {hasData && totalValue > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-lg md:text-xl font-bold text-violet-500">{formatNumber(totalValue)}</span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
            )}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4">
            {/* Date range toggle */}
            <ToggleGroup
              type="single"
              value={datePreset}
              onValueChange={(value) => value && setDatePreset(value as DatePreset)}
              size="sm"
            >
              <ToggleGroupItem value="last7" aria-label="Last 7 days" className="text-xs px-2">
                7D
              </ToggleGroupItem>
              <ToggleGroupItem value="last30" aria-label="Last 30 days" className="text-xs px-2">
                30D
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Chart type toggle */}
            <ToggleGroup
              type="single"
              value={chartType}
              onValueChange={(value) => value && setChartType(value as ChartType)}
              size="sm"
            >
              <ToggleGroupItem value="area" aria-label="Area chart" className="px-2 md:px-3">
                <AreaChartIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="bar" aria-label="Bar chart" className="px-2 md:px-3">
                <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="line" aria-label="Line chart" className="px-2 md:px-3">
                <LineChartIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Legend */}
            <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
              <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-violet-500"></span>
              <span>Posts</span>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="h-[160px] md:h-[200px] w-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-violet-500" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="h-[160px] md:h-[200px] w-full flex items-center justify-center">
            <p className="text-muted-foreground text-xs md:text-sm">Failed to load posts data</p>
          </div>
        )}

        {/* Chart */}
        {!loading && !error && (
          <div className="h-[160px] md:h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(225, 15%, 18%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                    interval={getTickInterval()}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                    domain={yDomain}
                    ticks={yTicks}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: chartColor, fillOpacity: 0.1 }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPosts)"
                  />
                </AreaChart>
              ) : chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(225, 15%, 18%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                    interval={getTickInterval()}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                    domain={yDomain}
                    ticks={yTicks}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: chartColor, fillOpacity: 0.1 }} />
                  <Bar
                    dataKey="value"
                    fill={chartColor}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(225, 15%, 18%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                    interval={getTickInterval()}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 12 }}
                    domain={yDomain}
                    ticks={yTicks}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: chartColor, strokeOpacity: 0.3 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    dot={{ fill: chartColor, strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: chartColor }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* No data indicator */}
        {!loading && !error && hasData && totalValue === 0 && (
          <div className="text-center text-muted-foreground text-xs mt-2">
            No posts data available for this period
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyPostsChart;
