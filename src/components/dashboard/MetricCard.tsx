import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  emoji: string;
  value: string;
  className?: string;
  isSelected?: boolean;
  onClick?: () => void;
  success?: boolean; // Green styling when target is met
  warning?: 1 | 2 | 3 | 4; // Red intensity levels (1-4 weeks missed)
}

// Warning styles: 4 levels of red intensity (using ! for importance to override glass-card)
const warningStyles: Record<1 | 2 | 3 | 4, string> = {
  1: "!border-red-400/40 !bg-red-500/5",
  2: "!border-red-400/60 !bg-red-500/10",
  3: "!border-red-500/70 !bg-red-500/15",
  4: "!border-red-500/80 !bg-red-500/20",
};

const MetricCard = ({ title, emoji, value, className, isSelected, onClick, success, warning }: MetricCardProps) => {
  return (
    <div
      className={cn(
        "glass-card p-5 transition-all duration-300 hover:border-primary/30 cursor-pointer",
        isSelected && "border-primary/50 bg-primary/5",
        success && "border-green-500/50 bg-green-500/10",
        warning && warningStyles[warning],
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-foreground font-medium">{title}</span>
        <span>{emoji}</span>
        {warning && (
          <span className="text-xs text-red-400 font-medium">
            {warning === 1 ? "1 week missed" : `${warning} weeks missed`}
          </span>
        )}
      </div>
      <span className="text-3xl font-bold text-foreground">{value}</span>
    </div>
  );
};

export default MetricCard;
