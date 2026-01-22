import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAMPayouts, AMPayout } from "@/hooks/useAMPayouts";
import { useUGCPayouts } from "@/hooks/useUGCPayouts";
import { CheckCircle, DollarSign, Clock, Calendar, Users, Briefcase, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/contexts/UserRoleContext";
import UGCPayouts from "./UGCPayouts";

type PayoutTab = 'ugc' | 'am';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AMPayouts = () => {
  const { isAdmin, isManager1 } = useUserRole();
  // manager_1 has full access like admin (not view-only)
  const viewOnly = false;
  const [activeTab, setActiveTab] = useState<PayoutTab>('ugc');
  const isMobile = useIsMobile();

  // AM tab filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('pending');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'weekly' | 'monthly'>('all');

  // UGC tab filters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [ugcStatusFilter, setUgcStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<number | 'all'>('all');
  const { payouts: allUgcPayouts, refetch: refetchUgc } = useUGCPayouts({ yearFilter: 'all', monthFilter: 'all' });

  // Calculate late payouts (from previous months, not yet paid)
  const isLatePayout = (payout: { status: string; period_year: number; period_month: number }) => {
    if (payout.status === 'paid') return false;
    if (payout.period_year < currentYear) return true;
    if (payout.period_year === currentYear && payout.period_month < currentMonth) return true;
    return false;
  };
  const latePayouts = allUgcPayouts.filter(isLatePayout);
  const lateCount = latePayouts.length;
  const totalLate = latePayouts.reduce((sum, p) => sum + p.total_amount, 0);

  const { payouts, loading, approvePayout, markAsPaid } = useAMPayouts({
    statusFilter,
    periodFilter,
  });

  const handleApprove = async (payout: AMPayout) => {
    try {
      await approvePayout(payout.id);
      toast.success(`Approved $${payout.total_amount.toFixed(2)} payout for ${payout.user_name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve payout');
    }
  };

  const handleMarkPaid = async (payout: AMPayout) => {
    try {
      await markAsPaid(payout.id);
      toast.success(`Marked $${payout.total_amount.toFixed(2)} as paid for ${payout.user_name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as paid');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
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

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.total_amount, 0);
  const totalApproved = payouts.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.total_amount, 0);

  return (
    <div className="p-4 md:p-4 space-y-4">
      {/* Header with Late Alert */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
            <DollarSign className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payouts</h1>
            <p className="text-sm text-muted-foreground">Manage creator and account manager payouts</p>
          </div>
        </div>
        {lateCount > 0 && (
          <div className="glass-card p-3 border-orange-500/40 bg-orange-500/5 flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-500/20">
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-orange-400">
                {lateCount} overdue {lateCount === 1 ? 'payout' : 'payouts'}
              </div>
              <div className="text-lg font-bold text-orange-500">${totalLate.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Switcher with Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-lg w-fit border border-border/50">
          <button
            onClick={() => setActiveTab('ugc')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === 'ugc'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Users className="w-4 h-4" />
            UGC Creators
          </button>
          <button
            onClick={() => setActiveTab('am')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
              activeTab === 'am'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Briefcase className="w-4 h-4" />
            Account Managers
          </button>
        </div>

        {/* Filters - only show for UGC tab */}
        {activeTab === 'ugc' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-none">
            <Select value={ugcStatusFilter} onValueChange={(v: any) => setUgcStatusFilter(v)}>
              <SelectTrigger className="w-[100px] sm:w-[120px] h-10 flex-shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(monthFilter)} onValueChange={(v) => setMonthFilter(v === 'all' ? 'all' : parseInt(v))}>
              <SelectTrigger className="w-[100px] sm:w-[120px] h-10 flex-shrink-0">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={String(index + 1)}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(yearFilter)} onValueChange={(v) => setYearFilter(v === 'all' ? 'all' : parseInt(v))}>
              <SelectTrigger className="w-[90px] sm:w-[100px] h-10 flex-shrink-0">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value={String(currentYear)}>{currentYear}</SelectItem>
                <SelectItem value={String(currentYear - 1)}>{currentYear - 1}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => refetchUgc()}
              className="h-10 w-10 flex-shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* UGC Payouts Tab */}
      {activeTab === 'ugc' && <UGCPayouts yearFilter={yearFilter} monthFilter={monthFilter} statusFilter={ugcStatusFilter} viewOnly={viewOnly} />}

      {/* AM Payouts Tab */}
      {activeTab === 'am' && (
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
            <Calendar className="w-4 h-4" />
            Weekly Payouts
          </div>
          <div className="text-2xl font-bold">{payouts.filter(p => p.period_type === 'weekly').length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Monthly Payouts
          </div>
          <div className="text-2xl font-bold">{payouts.filter(p => p.period_type === 'monthly').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>

        <Select value={periodFilter} onValueChange={(v: any) => setPeriodFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Periods</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payouts Table */}
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
                payout.status === 'pending' && "border-yellow-500/30"
              )}
            >
              {/* Mobile Layout */}
              {isMobile ? (
                <div className="space-y-3">
                  {/* Header: Name + Amount */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{payout.user_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(payout.period_start)} - {formatDate(payout.period_end)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold">${payout.total_amount.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {getStatusBadge(payout.status)}
                    <span className={cn(
                      "px-2 py-0.5 text-xs rounded",
                      payout.period_type === 'weekly' ? "bg-primary/20 text-primary" : "bg-purple-500/20 text-purple-400"
                    )}>
                      {payout.period_type}
                    </span>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{payout.posts_count} posts</span>
                    <span>
                      {payout.period_type === 'weekly'
                        ? `${payout.days_hit}/6 days`
                        : `${payout.weeks_hit}/4 weeks`}
                    </span>
                    <span className="text-xs">
                      ${payout.base_amount.toFixed(2)} + ${payout.bonus_amount.toFixed(2)}
                    </span>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkPaid(payout)}
                          className="gap-1 flex-1"
                        >
                          <DollarSign className="w-4 h-4" />
                          Mark Paid
                        </Button>
                      )}
                      {payout.status === 'paid' && (
                        <span className="text-xs text-muted-foreground">
                          Paid {payout.paid_at ? formatDate(payout.paid_at) : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop Layout */
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold truncate">{payout.user_name}</span>
                      {getStatusBadge(payout.status)}
                      <span className={cn(
                        "px-2 py-0.5 text-xs rounded",
                        payout.period_type === 'weekly' ? "bg-primary/20 text-primary" : "bg-purple-500/20 text-purple-400"
                      )}>
                        {payout.period_type}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(payout.period_start)} - {formatDate(payout.period_end)} ·
                      {payout.posts_count} posts ·
                      {payout.period_type === 'weekly'
                        ? `${payout.days_hit}/6 days`
                        : `${payout.weeks_hit}/4 weeks`}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold">${payout.total_amount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      ${payout.base_amount.toFixed(2)} base + ${payout.bonus_amount.toFixed(2)} bonus
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkPaid(payout)}
                          className="gap-1"
                        >
                          <DollarSign className="w-4 h-4" />
                          Mark Paid
                        </Button>
                      )}
                      {payout.status === 'paid' && (
                        <span className="text-xs text-muted-foreground">
                          Paid {payout.paid_at ? formatDate(payout.paid_at) : ''}
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
      )}
    </div>
  );
};

export default AMPayouts;
