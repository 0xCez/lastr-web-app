import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TeamAssignment {
  id: string;
  user_id: string;
  team_name: string;
  team_code: string;
  league: string;
  tiktok_handle: string | null;
  instagram_handle: string | null;
  tiktok_account_id: string | null;
  instagram_account_id: string | null;
  assigned_at: string;
  assigned_by: string | null;
}

interface UseAMTeamAssignmentsResult {
  assignments: TeamAssignment[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  updateHandle: (
    assignmentId: string,
    platform: 'tiktok' | 'instagram',
    handle: string
  ) => Promise<void>;
}

export function useAMTeamAssignments(userId?: string): UseAMTeamAssignmentsResult {
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('am_team_assignments')
        .select('*')
        .eq('user_id', targetUserId)
        .order('team_name');

      if (fetchError) throw fetchError;
      setAssignments((data as TeamAssignment[]) || []);
    } catch (err) {
      console.error('Error fetching team assignments:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const updateHandle = async (
    assignmentId: string,
    platform: 'tiktok' | 'instagram',
    handle: string
  ) => {
    const field = platform === 'tiktok' ? 'tiktok_handle' : 'instagram_handle';

    const { error: updateError } = await supabase
      .from('am_team_assignments')
      .update({ [field]: handle })
      .eq('id', assignmentId);

    if (updateError) {
      console.error('Error updating handle:', updateError);
      throw updateError;
    }

    // Refresh to get linked account IDs (trigger creates accounts)
    await fetchAssignments();
  };

  return {
    assignments,
    loading,
    error,
    refetch: fetchAssignments,
    updateHandle,
  };
}

// Hook for admins to fetch all team assignments
export function useAllTeamAssignments() {
  const [assignments, setAssignments] = useState<(TeamAssignment & { user_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllAssignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('am_team_assignments')
        .select(`
          *,
          users!am_team_assignments_user_id_fkey (
            full_name
          )
        `)
        .order('assigned_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped = (data || []).map((item: any) => ({
        ...item,
        user_name: item.users?.full_name,
      }));

      setAssignments(mapped);
    } catch (err) {
      console.error('Error fetching all team assignments:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAssignments();
  }, [fetchAllAssignments]);

  return {
    assignments,
    loading,
    error,
    refetch: fetchAllAssignments,
  };
}
