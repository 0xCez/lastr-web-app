import { useMemo, useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2, AreaChartIcon, BarChart3, LineChartIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ChartType = 'area' | 'bar' | 'line';

const metricLabels: Record<string, string> = {
  views: "Total Views",
  downloads: "Downloads",
  engagement: "Engagement",
  likes: "Likes",
  comments: "Comments",
  shares: "Shares",
  revenue: "Revenue",
};

// Generate date labels based on the preset (fallback for mock data)
const generateDateLabels = (preset: string): string[] => {
  const now = new Date();
  const labels: string[] = [];

  switch (preset) {
    case "today": {
      return ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
    }
    case "last7": {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
      }
      return labels;
    }
    case "last30": {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
      }
      return labels;
    }
    case "last3months": {
      const weeks = 12;
      for (let i = weeks; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
      }
      return labels;
    }
    case "alltime": {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        labels.push(`${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(2)}`);
      }
      return labels;
    }
    default: {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
      }
      return labels;
    }
  }
};

// Generate mock values (fallback when no real data)
const generateMockValues = (count: number): number[] => {
  const values: number[] = [];
  let baseValue = 30 + Math.random() * 20;

  for (let i = 0; i < count; i++) {
    const trend = (i / count) * 30;
    const variation = (Math.random() - 0.5) * 20;
    const value = Math.min(100, Math.max(0, baseValue + trend + variation));
    values.push(Math.round(value));
    baseValue = value - trend;
  }

  return values;
};

// Format large numbers for display
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-primary">
        {payload[0].value.toLocaleString()} views
      </p>
    </div>
  );
};

interface ChartDataPoint {
  date: string;
  value: number;
}

interface AnalyticsChartProps {
  selectedMetric?: string;
  selectedDateRange?: string[];
  datePreset?: string;
  // Real data from useChartAnalytics hook
  chartData?: ChartDataPoint[];
  totalValue?: number;
  loading?: boolean;
  error?: string | null;
}

const AnalyticsChart = ({
  selectedMetric = "views",
  selectedDateRange = [],
  datePreset = "last30",
  chartData: realData,
  totalValue = 0,
  loading = false,
  error = null,
}: AnalyticsChartProps) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  // Use real data if provided, otherwise show empty chart with zero values
  const chartData = useMemo(() => {
    // If real data was provided (even if empty array), use it
    if (realData !== undefined) {
      // If we have actual data points, use them
      if (realData.length > 0) {
        return realData;
      }
      // If data was fetched but is empty, show zeros for the date range
      const labels = generateDateLabels(datePreset);
      return labels.map((date) => ({
        date,
        value: 0,
      }));
    }

    // Only fall back to mock data if realData is undefined (data not yet loaded)
    const labels = generateDateLabels(datePreset);
    const values = generateMockValues(labels.length);

    return labels.map((date, index) => ({
      date,
      value: values[index],
    }));
  }, [realData, datePreset]);

  // Has real data means data was fetched (realData is defined), even if empty
  const hasRealData = realData !== undefined;
  const displayLabel = metricLabels[selectedMetric] || "Total Views";

  // Calculate Y-axis domain and ticks with regular intervals
  const calculateYAxisConfig = () => {
    const maxDataValue = Math.max(...chartData.map(d => d.value), 0);

    console.log('📊 Chart Y-axis calculation:', {
      chartDataLength: chartData.length,
      maxDataValue,
      sampleValues: chartData.slice(0, 5).map(d => d.value)
    });

    if (maxDataValue === 0) {
      // No data - show simple 0-100 scale
      return { domain: [0, 100], ticks: [0, 25, 50, 75, 100] };
    }

    // Find a nice round number for the max
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxDataValue)));
    const normalized = maxDataValue / magnitude;

    let niceMax: number;
    if (normalized <= 1) niceMax = magnitude;
    else if (normalized <= 2) niceMax = 2 * magnitude;
    else if (normalized <= 5) niceMax = 5 * magnitude;
    else niceMax = 10 * magnitude;

    // Add 10% buffer and round up
    niceMax = Math.ceil(maxDataValue * 1.1 / magnitude) * magnitude;

    // Generate 5 evenly spaced ticks (including 0)
    const tickCount = 5;
    const tickInterval = niceMax / (tickCount - 1);
    const ticks = Array.from({ length: tickCount }, (_, i) => Math.round(i * tickInterval));

    console.log('📊 Y-axis config:', { niceMax, ticks });

    return { domain: [0, niceMax], ticks };
  };

  const { domain: yDomain, ticks: yTicks } = calculateYAxisConfig();

  // Calculate tick interval based on data points to prevent label overlap
  const getTickInterval = () => {
    const dataLength = chartData.length;
    if (dataLength <= 30) return 0;
    return Math.floor(dataLength / 12);
  };

  // Format Y-axis ticks for large numbers
  const formatYAxisTick = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <div className="px-4 md:px-6 py-3 md:py-4">
      <div className="glass-card p-4 md:p-6">
        {/* Header - stacked on mobile, inline on desktop */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-3 md:mb-4">
          {/* Title + Total */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <h3 className="text-foreground font-semibold text-sm md:text-base">Daily Views</h3>
            {hasRealData && totalValue > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-lg md:text-xl font-bold text-primary">{formatNumber(totalValue)}</span>
                <span className="text-xs text-muted-foreground">total</span>
              </div>
            )}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4">
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
              <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-primary"></span>
              <span>Views</span>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="h-[160px] md:h-[200px] w-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="h-[160px] md:h-[200px] w-full flex items-center justify-center">
            <p className="text-muted-foreground text-xs md:text-sm">Failed to load chart data</p>
          </div>
        )}

        {/* Today's Summary View - Special display for single day */}
        {!loading && !error && datePreset === 'today' && (
          <div className="h-[160px] md:h-[200px] w-full flex items-center justify-center">
            <div className="text-center">
              {/* Glowing ring effect */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                {/* Outer glow */}
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                {/* Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                {/* Inner gradient circle */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary">{formatNumber(totalValue)}</span>
                </div>
              </div>
              <p className="text-foreground font-medium">Views collected today</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        {/* Chart - For multi-day periods */}
        {!loading && !error && datePreset !== 'today' && (
          <div className="h-[160px] md:h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(187, 100%, 42%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(187, 100%, 42%)" stopOpacity={0} />
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
                    tickFormatter={formatYAxisTick}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(187, 100%, 42%)', fillOpacity: 0.1 }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(187, 100%, 42%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
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
                    tickFormatter={formatYAxisTick}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(187, 100%, 42%)', fillOpacity: 0.1 }} />
                  <Bar
                    dataKey="value"
                    fill="hsl(187, 100%, 42%)"
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
                    tickFormatter={formatYAxisTick}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(187, 100%, 42%)', strokeOpacity: 0.3 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(187, 100%, 42%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(187, 100%, 42%)', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: 'hsl(187, 100%, 42%)' }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* No data indicator */}
        {!loading && !error && hasRealData && totalValue === 0 && (
          <div className="text-center text-muted-foreground text-xs mt-2">
            No view data available for this period
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsChart;
