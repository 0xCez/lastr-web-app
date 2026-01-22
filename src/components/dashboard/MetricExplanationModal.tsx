import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface CPMBreakdownItem {
  userId: string;
  userName: string;
  amount: number;
}

interface MetricExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricKey: string;
  metricTitle: string;
  // Data for calculations
  cpmBreakdown?: CPMBreakdownItem[];
  totalCpmPayout?: number;
  totalViews?: number;
  realCpm?: number;
  loading?: boolean;
  // Creator payout breakdown data
  cpmRate?: number; // e.g., 1.5
  cpmViews?: number; // views used for CPM calculation
  cpmAmount?: number; // actual CPM payout
  fixedFeePerPost?: number; // e.g., 6.25
  crossPostedCount?: number; // min(TT, IG)
  fixedFeeAmount?: number; // actual fixed fee payout
  totalPayoutAmount?: number; // total payout
  // Daily spend breakdown
  dailyViews?: number;
  dailyPosts?: number;
  dailySpend?: number;
  dailyCrossPostedCount?: number;
  dailyCpmSpend?: number;
  dailyFixedFeeSpend?: number;
  dailyFixedFeeRate?: number; // $6.25 for UGC, $1.00 for slideshows
  dailyFixedFeeCount?: number; // cross-posted count or slideshow count
}

const MetricExplanationModal = ({
  isOpen,
  onClose,
  metricKey,
  metricTitle,
  cpmBreakdown = [],
  totalCpmPayout = 0,
  totalViews = 0,
  realCpm = 0,
  loading = false,
  cpmRate = 1.5,
  cpmViews = 0,
  cpmAmount = 0,
  fixedFeePerPost = 6.25,
  crossPostedCount = 0,
  fixedFeeAmount = 0,
  totalPayoutAmount = 0,
  dailyViews = 0,
  dailyPosts = 0,
  dailySpend = 0,
  dailyCrossPostedCount = 0,
  dailyCpmSpend = 0,
  dailyFixedFeeSpend = 0,
  dailyFixedFeeRate = 6.25,
  dailyFixedFeeCount = 0,
}: MetricExplanationModalProps) => {
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    switch (metricKey) {
      case "totalCpmPay":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Total CPM payout is the sum of all CPM earnings paid to creators this month.
            </p>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Breakdown by Creator:</h4>
              {cpmBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No CPM payouts this month</p>
              ) : (
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {cpmBreakdown.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 px-3 bg-secondary/50 rounded-md"
                    >
                      <span className="text-sm">{item.userName}</span>
                      <span className="text-sm font-semibold">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center py-2 px-3 bg-primary/10 rounded-md border-t-2 border-primary mt-4">
                <span className="font-bold">Total</span>
                <span className="font-bold">${totalCpmPayout.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );

      case "cpm":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Real CPM (Cost Per Mille) shows how much you pay per 1,000 views across all content.
            </p>

            <div className="space-y-3 bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-semibold text-sm">Calculation:</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total CPM Payout:</span>
                  <span className="font-mono">${totalCpmPayout.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Views:</span>
                  <span className="font-mono">{totalViews.toLocaleString()}</span>
                </div>

                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Formula:</span>
                    <span className="font-mono text-xs">
                      (${totalCpmPayout.toFixed(2)} / {totalViews.toLocaleString()}) × 1,000
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-primary/10 p-2 rounded mt-2">
                  <span className="font-bold">Real CPM:</span>
                  <span className="font-bold font-mono">${realCpm.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "cpmPayout":
        // Calculate what CPM would be using frontend data
        const calculatedCpm = (cpmViews / 1000) * cpmRate;
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              CPM Payout is calculated based on views from approved posts.
            </p>

            <div className="space-y-3 bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-semibold text-sm">Calculation:</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Views:</span>
                  <span className="font-mono">{cpmViews.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPM Rate:</span>
                  <span className="font-mono">${cpmRate.toFixed(2)} per 1,000 views</span>
                </div>

                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Formula:</span>
                    <span className="font-mono text-xs">
                      ({cpmViews.toLocaleString()} / 1,000) × ${cpmRate.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-primary/10 p-2 rounded mt-2">
                  <span className="font-bold">CPM Payout:</span>
                  <span className="font-bold font-mono">${cpmAmount.toFixed(2)}</span>
                </div>

                {Math.abs(calculatedCpm - cpmAmount) > 0.01 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: CPM is calculated from view deltas over the past 28 days,
                    which may differ from the total views shown.
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case "fixedFeePayout":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Fixed Fee is paid per cross-posted video (1 TikTok + 1 Instagram = 1 post).
            </p>

            <div className="space-y-3 bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-semibold text-sm">Calculation:</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cross-posted Videos:</span>
                  <span className="font-mono">{crossPostedCount}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee per Post:</span>
                  <span className="font-mono">${fixedFeePerPost.toFixed(2)}</span>
                </div>

                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Formula:</span>
                    <span className="font-mono text-xs">
                      {crossPostedCount} × ${fixedFeePerPost.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-primary/10 p-2 rounded mt-2">
                  <span className="font-bold">Fixed Fee:</span>
                  <span className="font-bold font-mono">${fixedFeeAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "totalPayout":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Total Payout is the sum of Fixed Fee and CPM Payout.
            </p>

            <div className="space-y-3 bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-semibold text-sm">Breakdown:</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fixed Fee:</span>
                  <span className="font-mono">${fixedFeeAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPM Payout:</span>
                  <span className="font-mono">${cpmAmount.toFixed(2)}</span>
                </div>

                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Formula:</span>
                    <span className="font-mono text-xs">
                      ${fixedFeeAmount.toFixed(2)} + ${cpmAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-primary/10 p-2 rounded mt-2">
                  <span className="font-bold">Total Payout:</span>
                  <span className="font-bold font-mono">${totalPayoutAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "dailySpend":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Today's spend is the estimated payout for posts created today.
            </p>

            <div className="space-y-3 bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-semibold text-sm">Today's Activity:</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posts Today:</span>
                  <span className="font-mono">{dailyPosts}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views:</span>
                  <span className="font-mono">{dailyViews.toLocaleString()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cross-posted:</span>
                  <span className="font-mono">{dailyCrossPostedCount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-semibold text-sm">Spend Breakdown:</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fixed Fee ({dailyFixedFeeCount} × ${dailyFixedFeeRate.toFixed(2)}):</span>
                  <span className="font-mono">${dailyFixedFeeSpend.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPM ({dailyViews.toLocaleString()} × ${cpmRate.toFixed(2)}/1K):</span>
                  <span className="font-mono">${dailyCpmSpend.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center bg-primary/10 p-2 rounded mt-2">
                  <span className="font-bold">Total Spend:</span>
                  <span className="font-bold font-mono">${dailySpend.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">
            No explanation available for this metric.
          </p>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{metricTitle} Explanation</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default MetricExplanationModal;
