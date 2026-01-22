import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface AMPayout {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  period_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  posts_count: number;
  days_hit: number;
  weeks_hit: number;
  base_amount: number;
  bonus_amount: number;
  total_amount: number;
  status: 'pending' | 'approved' | 'paid';
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
}

interface UseAMPayoutsOptions {
  statusFilter?: 'all' | 'pending' | 'approved' | 'paid';
  periodFilter?: 'all' | 'weekly' | 'monthly';
}

export const useAMPayouts = (options: UseAMPayoutsOptions = {}) => {
  const [payouts, setPayouts] = useState<AMPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('account_manager_payouts')
        .select(`
          *,
          users:user_id (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (options.statusFilter && options.statusFilter !== 'all') {
        query = query.eq('status', options.statusFilter);
      }

      if (options.periodFilter && options.periodFilter !== 'all') {
        query = query.eq('period_type', options.periodFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedPayouts: AMPayout[] = (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        user_name: p.users?.full_name || 'Unknown',
        user_email: p.users?.email || '',
        period_type: p.period_type,
        period_start: p.period_start,
        period_end: p.period_end,
        posts_count: p.posts_count,
        days_hit: p.days_hit,
        weeks_hit: p.weeks_hit,
        base_amount: parseFloat(p.base_amount),
        bonus_amount: parseFloat(p.bonus_amount),
        total_amount: parseFloat(p.total_amount),
        status: p.status,
        approved_by: p.approved_by,
        approved_at: p.approved_at,
        paid_at: p.paid_at,
        created_at: p.created_at,
      }));

      setPayouts(formattedPayouts);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.statusFilter, options.periodFilter]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const approvePayout = async (payoutId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('account_manager_payouts')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', payoutId);

    if (error) throw error;
    await fetchPayouts();
  };

  const markAsPaid = async (payoutId: string) => {
    const { error } = await supabase
      .from('account_manager_payouts')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payoutId);

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
  };
};
