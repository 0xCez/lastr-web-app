import { Button } from "@/components/ui/button";
import { useUGCPayouts, UGCPayout } from "@/hooks/useUGCPayouts";
import { CheckCircle, DollarSign, Clock, Eye, FileText, Users, AlertTriangle, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { UGC_OPTION_1 } from "@/constants/contracts";

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface UGCPayoutsProps {
  yearFilter: number | 'all';
  monthFilter: number | 'all';
  statusFilter: 'all' | 'pending' | 'approved' | 'paid';
  viewOnly?: boolean;
}

const UGCPayouts = ({ yearFilter, monthFilter, statusFilter, viewOnly = false }: UGCPayoutsProps) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const isMobile = useIsMobile();

  const { payouts, loading, approvePayout, markAsPaid, revertToPending } = useUGCPayouts({
    statusFilter,
    yearFilter,
    monthFilter,
  });

  const handleApprove = async (payout: UGCPayout) => {
    try {
      await approvePayout(payout.id);
      toast.success(`Approved $${payout.total_amount.toFixed(2)} payout for ${payout.user_name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve payout');
    }
  };

  const handleMarkPaid = async (payout: UGCPayout) => {
    try {
      await markAsPaid(payout.id);
      toast.success(`Marked $${payout.total_amount.toFixed(2)} as paid for ${payout.user_name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as paid');
    }
  };

  const handleRevertToPending = async (payout: UGCPayout) => {
    try {
      await revertToPending(payout.id);
      toast.success(`Reverted payout for ${payout.user_name} back to pending`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to revert payout');
    }
  };

  const formatPeriod = (month: number, year: number) => {
    return `${MONTHS[month - 1]} ${year}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">Approved</span>;
      case 'paid':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-500">Paid</span>;
      default:
        return null;
    }
  };

  const getContractBadge = (option: string | null) => {
    if (!option) return null;
    if (option === 'option1') {
      return <span className="px-2 py-0.5 text-xs rounded bg-primary/20 text-primary">$300 + CPM</span>;
    }
    return <span className="px-2 py-0.5 text-xs rounded bg-purple-500/20 text-purple-400">$500 Fixed</span>;
  };

  // Check if payout is from a previous month and still not paid
  const isLatePayout = (payout: UGCPayout) => {
    if (payout.status === 'paid') return false;
    // Compare payout period with current month/year
    if (payout.period_year < currentYear) return true;
    if (payout.period_year === currentYear && payout.period_month < currentMonth) return true;
    return false;
  };

  const getMonthsLate = (payout: UGCPayout) => {
    const payoutDate = new Date(payout.period_year, payout.period_month - 1);
    const currentDate = new Date(currentYear, currentMonth - 1);
    const diffMonths = (currentDate.getFullYear() - payoutDate.getFullYear()) * 12
      + (currentDate.getMonth() - payoutDate.getMonth());
    return diffMonths;
  };

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.total_amount, 0);
  const totalApproved = payouts.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.total_amount, 0);
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Clock className="w-4 h-4" />
            Pending Approval
          </div>
          <div className="text-2xl font-bold text-yellow-500">${totalPending.toFixed(2)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            Approved (Unpaid)
          </div>
          <div className="text-2xl font-bold text-blue-500">${totalApproved.toFixed(2)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Total Paid
          </div>
          <div className="text-2xl font-bold text-green-500">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="w-4 h-4" />
            Creators
          </div>
          <div className="text-2xl font-bold">{new Set(payouts.map(p => p.user_id)).size}</div>
        </div>
      </div>

      {/* Payouts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      ) : payouts.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted-foreground">
          No payouts found matching your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className={cn(
                "glass-card p-4",
                payout.status === 'pending' && "border-yellow-500/30",
                !payout.can_claim && payout.status === 'pending' && "border-red-500/30"
              )}
            >
              {/* Mobile Layout */}
              {isMobile ? (
                <div className="space-y-3">
                  {/* Header: Name + Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{payout.user_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{payout.user_email}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold">${payout.total_amount.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatPeriod(payout.period_month, payout.period_year)}
                      </div>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {getStatusBadge(payout.status)}
                    {getContractBadge(payout.contract_option)}
                    {isLatePayout(payout) && (
                      <span className="px-2 py-0.5 text-xs rounded bg-orange-500/20 text-orange-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getMonthsLate(payout)}mo late
                      </span>
                    )}
                    {!payout.can_claim && payout.status === 'pending' && (
                      <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Can't claim
                      </span>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className={cn(payout.can_claim ? "text-green-500" : "text-orange-400")}>
                      <FileText className="w-3 h-3 inline mr-1" />
                      {payout.approved_posts_count}/{UGC_OPTION_1.MONTHLY_UNIT_POST_TARGET}
                    </div>
                    <div>
                      <Eye className="w-3 h-3 inline mr-1" />
                      {formatViews(payout.total_views)}
                    </div>
                    <div className="text-xs">
                      ${payout.base_amount.toFixed(2)} base
                      {payout.cpm_amount > 0 && ` + $${payout.cpm_amount.toFixed(2)} CPM`}
                    </div>
                  </div>

                  {/* Actions - Hidden for view-only users */}
                  {!viewOnly && (
                    <div className="flex gap-2 pt-1">
                      {payout.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(payout)}
                          className="gap-1 flex-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                      )}
                      {payout.status === 'approved' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkPaid(payout)}
                            className="gap-1 flex-1"
                          >
                            <DollarSign className="w-4 h-4" />
                            Mark Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRevertToPending(payout)}
                            className="gap-1"
                          >
                            <Undo2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {payout.status === 'paid' && payout.paid_at && (
                        <span className="text-xs text-muted-foreground">
                          Paid {new Date(payout.paid_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop Layout */
                <div className="flex items-center justify-between gap-6">
                  {/* Creator Info */}
                  <div className="min-w-0 flex-shrink-0" style={{ width: '200px' }}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold truncate">{payout.user_name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{payout.user_email}</div>
                    {payout.paypal_info && (
                      <div className="text-xs text-muted-foreground truncate">PayPal: {payout.paypal_info}</div>
                    )}
                  </div>

                  {/* Period */}
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatPeriod(payout.period_month, payout.period_year)}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(payout.status)}
                    {getContractBadge(payout.contract_option)}
                    {isLatePayout(payout) && (
                      <span className="px-2 py-0.5 text-xs rounded bg-orange-500/20 text-orange-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getMonthsLate(payout) === 1 ? '1 month late' : `${getMonthsLate(payout)} months late`}
                      </span>
                    )}
                    {!payout.can_claim && payout.status === 'pending' && (
                      <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Can't claim
                      </span>
                    )}
                  </div>

                  {/* Posts Progress */}
                  <div className={cn(
                    "text-sm whitespace-nowrap",
                    payout.can_claim ? "text-green-500" : "text-orange-400"
                  )}>
                    <FileText className="w-3 h-3 inline mr-1" />
                    {payout.approved_posts_count}/{UGC_OPTION_1.MONTHLY_UNIT_POST_TARGET}
                    {!payout.can_claim && <span className="text-xs ml-1">(-{payout.posts_missing})</span>}
                  </div>

                  {/* Views */}
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    <Eye className="w-3 h-3 inline mr-1" />
                    {formatViews(payout.total_views)}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">${payout.total_amount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      ${payout.base_amount.toFixed(2)} base
                      {payout.cpm_amount > 0 && ` + $${payout.cpm_amount.toFixed(2)} CPM`}
                    </div>
                  </div>

                  {/* Actions - Hidden for view-only users */}
                  {!viewOnly && (
                    <div className="flex gap-2">
                      {payout.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(payout)}
                          className="gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                      )}
                      {payout.status === 'approved' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkPaid(payout)}
                            className="gap-1"
                          >
                            <DollarSign className="w-4 h-4" />
                            Mark Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRevertToPending(payout)}
                            className="gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Undo2 className="w-4 h-4" />
                            Revert
                          </Button>
                        </>
                      )}
                      {payout.status === 'paid' && payout.paid_at && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Paid {new Date(payout.paid_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UGCPayouts;
