import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  UGC_OPTION_1,
  UGC_OPTION_2,
  ContractOption,
} from '@/constants/contracts';

/**
 * Helper to extract UTC year and month from a date.
 * Using UTC ensures consistency regardless of user's timezone.
 */
function getUTCYearMonth(date: Date): { year: number; month: number } {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1, // 1-indexed month
  };
}

export interface UGCPayout {
  id: string; // Format: `${user_id}_${year}_${month}` for aggregated data
  user_id: string;
  user_name: string;
  user_email: string;
  period_month: number;
  period_year: number;
  contract_option: 'option1' | 'option2' | null;
  posts_count: number; // Posts with CPM data
  approved_posts_count: number; // Total approved posts this month
  posts_missing: number; // Posts missing to reach 48 target
  can_claim: boolean; // Has 48+ approved posts
  total_views: number;
  base_amount: number;
  cpm_amount: number;
  total_amount: number;
  paypal_info: string | null;
  status: 'pending' | 'approved' | 'paid';
  approved_at: string | null;
  paid_at: string | null;
}

interface UseUGCPayoutsOptions {
  statusFilter?: 'all' | 'pending' | 'approved' | 'paid';
  yearFilter?: number | 'all';
  monthFilter?: number | 'all';
}

export const useUGCPayouts = (options: UseUGCPayoutsOptions = {}) => {
  const [payouts, setPayouts] = useState<UGCPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      // First, get aggregated CPM data by user and month
      let cpmQuery = supabase
        .from('cpm_post_breakdown')
        .select('user_id, date, views_delta, cpm_earned, post_id');

      if (options.yearFilter && options.yearFilter !== 'all') {
        // Filter by year using date range
        const startDate = `${options.yearFilter}-01-01`;
        const endDate = `${options.yearFilter}-12-31`;
        cpmQuery = cpmQuery.gte('date', startDate).lte('date', endDate);
      }

      const { data: cpmData, error: cpmError } = await cpmQuery;
      if (cpmError) throw cpmError;

      // Get all users with their info
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, paypal_info, contract_option')
        .eq('role', 'ugc_creator');

      if (usersError) throw usersError;

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // Get all approved posts to count per user per month (including platform and content_type)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('submitted_by, created_at, platform, content_type')
        .eq('status', 'approved');

      if (postsError) throw postsError;

      // Aggregate approved posts by user and month - separate UGC videos from slideshows
      const approvedPostsMap = new Map<string, { ugcVideos: number; slideshows: number }>();
      (postsData || []).forEach((post: any) => {
        const { year, month } = getUTCYearMonth(new Date(post.created_at));
        const key = `${post.submitted_by}_${year}_${month}`;
        if (!approvedPostsMap.has(key)) {
          approvedPostsMap.set(key, { ugcVideos: 0, slideshows: 0 });
        }
        const counts = approvedPostsMap.get(key)!;
        if (post.content_type === 'slideshow') {
          counts.slideshows++;
        } else {
          counts.ugcVideos++;
        }
      });

      // Get existing payout statuses from ugc_creator_payouts table
      // Using type assertion since table may not be in generated types yet
      const { data: statusData, error: statusError } = await (supabase
        .from('ugc_creator_payouts' as any)
        .select('user_id, period_month, period_year, status, approved_at, paid_at') as any);

      if (statusError) throw statusError;

      // Create status lookup map
      const statusMap = new Map<string, { status: string; approved_at: string | null; paid_at: string | null }>();
      (statusData || []).forEach((s: any) => {
        const key = `${s.user_id}_${s.period_year}_${s.period_month}`;
        statusMap.set(key, { status: s.status, approved_at: s.approved_at, paid_at: s.paid_at });
      });

      // Aggregate CPM data by user and month
      const aggregated = new Map<string, {
        user_id: string;
        period_month: number;
        period_year: number;
        total_views: number;
        cpm_amount: number;
        posts: Set<string>;
      }>();

      (cpmData || []).forEach((row: any) => {
        const { year, month } = getUTCYearMonth(new Date(row.date));
        const key = `${row.user_id}_${year}_${month}`;

        if (!aggregated.has(key)) {
          aggregated.set(key, {
            user_id: row.user_id,
            period_month: month,
            period_year: year,
            total_views: 0,
            cpm_amount: 0,
            posts: new Set(),
          });
        }

        const agg = aggregated.get(key)!;
        agg.total_views += row.views_delta || 0;
        agg.cpm_amount += parseFloat(row.cpm_earned) || 0;
        agg.posts.add(row.post_id);
      });

      // Convert to payout objects
      const payoutsList: UGCPayout[] = [];

      aggregated.forEach((agg, key) => {
        const user = usersMap.get(agg.user_id);
        if (!user) return; // Skip if user not found

        const statusInfo = statusMap.get(key);
        const status = (statusInfo?.status as 'pending' | 'approved' | 'paid') || 'pending';

        // Get approved posts count for this user/month (split by content type)
        const postCounts = approvedPostsMap.get(key) || { ugcVideos: 0, slideshows: 0 };
        const approvedPostsCount = postCounts.ugcVideos + postCounts.slideshows;

        // Calculate base amount based on contract option
        const contractOption = user.contract_option as ContractOption;
        let baseAmount = 0;
        let cpmAmount = agg.cpm_amount;

        if (contractOption === 'option1') {
          // Calculate base amount with different rates for UGC videos vs slideshows
          // UGC videos: $3.125 per unit post
          // Slideshows: $1.00 per slideshow
          const ugcVideoFee = postCounts.ugcVideos * UGC_OPTION_1.FIXED_FEE_PER_UNIT_POST;
          const slideshowFee = postCounts.slideshows * UGC_OPTION_1.FIXED_FEE_PER_SLIDESHOW;
          baseAmount = ugcVideoFee + slideshowFee;
        } else if (contractOption === 'option2') {
          baseAmount = UGC_OPTION_2.MONTHLY_FIXED;
          cpmAmount = 0; // Option 2 doesn't get CPM
        }
        const postsMissing = Math.max(0, UGC_OPTION_1.MONTHLY_UNIT_POST_TARGET - approvedPostsCount);
        const canClaim = approvedPostsCount >= UGC_OPTION_1.MONTHLY_UNIT_POST_TARGET;

        // Only include if there's actual CPM earnings or if already tracked
        if (agg.cpm_amount > 0 || statusInfo) {
          payoutsList.push({
            id: key,
            user_id: agg.user_id,
            user_name: user.full_name || 'Unknown',
            user_email: user.email || '',
            period_month: agg.period_month,
            period_year: agg.period_year,
            contract_option: contractOption,
            posts_count: agg.posts.size,
            approved_posts_count: approvedPostsCount,
            posts_missing: postsMissing,
            can_claim: canClaim,
            total_views: agg.total_views,
            base_amount: baseAmount,
            cpm_amount: cpmAmount,
            total_amount: baseAmount + cpmAmount,
            paypal_info: user.paypal_info,
            status,
            approved_at: statusInfo?.approved_at || null,
            paid_at: statusInfo?.paid_at || null,
          });
        }
      });

      // Sort by year desc, month desc
      payoutsList.sort((a, b) => {
        if (a.period_year !== b.period_year) return b.period_year - a.period_year;
        return b.period_month - a.period_month;
      });

      // Apply status filter
      let filtered = payoutsList;
      if (options.statusFilter && options.statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === options.statusFilter);
      }

      // Apply month filter
      if (options.monthFilter && options.monthFilter !== 'all') {
        filtered = filtered.filter(p => p.period_month === options.monthFilter);
      }

      setPayouts(filtered);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.statusFilter, options.yearFilter, options.monthFilter]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const approvePayout = async (payoutId: string) => {
    // Parse the composite ID
    const [userId, yearStr, monthStr] = payoutId.split('_');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the payout data
    const payout = payouts.find(p => p.id === payoutId);
    if (!payout) throw new Error('Payout not found');

    // Upsert the status record
    const { error } = await (supabase
      .from('ugc_creator_payouts' as any)
      .upsert({
        user_id: userId,
        period_month: month,
        period_year: year,
        contract_option: payout.contract_option,
        posts_count: payout.posts_count,
        total_views: payout.total_views,
        base_amount: payout.base_amount,
        cpm_amount: payout.cpm_amount,
        total_amount: payout.total_amount,
        paypal_info: payout.paypal_info,
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,period_year,period_month',
      }) as any);

    if (error) throw error;
    await fetchPayouts();
  };

  const markAsPaid = async (payoutId: string) => {
    const [userId, yearStr, monthStr] = payoutId.split('_');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const payout = payouts.find(p => p.id === payoutId);
    if (!payout) throw new Error('Payout not found');

    const { error } = await (supabase
      .from('ugc_creator_payouts' as any)
      .upsert({
        user_id: userId,
        period_month: month,
        period_year: year,
        contract_option: payout.contract_option,
        posts_count: payout.posts_count,
        total_views: payout.total_views,
        base_amount: payout.base_amount,
        cpm_amount: payout.cpm_amount,
        total_amount: payout.total_amount,
        paypal_info: payout.paypal_info,
        status: 'paid',
        paid_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,period_year,period_month',
      }) as any);

    if (error) throw error;
    await fetchPayouts();
  };

  const revertToPending = async (payoutId: string) => {
    const [userId, yearStr, monthStr] = payoutId.split('_');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    const payout = payouts.find(p => p.id === payoutId);
    if (!payout) throw new Error('Payout not found');

    const { error } = await (supabase
      .from('ugc_creator_payouts' as any)
      .upsert({
        user_id: userId,
        period_month: month,
        period_year: year,
        contract_option: payout.contract_option,
        posts_count: payout.posts_count,
        total_views: payout.total_views,
        base_amount: payout.base_amount,
        cpm_amount: payout.cpm_amount,
        total_amount: payout.total_amount,
        paypal_info: payout.paypal_info,
        status: 'pending',
        approved_at: null,
        approved_by: null,
      }, {
        onConflict: 'user_id,period_year,period_month',
      }) as any);

    if (error) throw error;
    await fetchPayouts();
  };

  return {
    payouts,
    loading,
    error,
    refetch: fetchPayouts,
    approvePayout,
    markAsPaid,
    revertToPending,
  };
};
