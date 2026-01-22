import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type User = Database['public']['Tables']['users']['Row'];
type Contract = Database['public']['Tables']['contracts']['Row'];
type Account = Database['public']['Tables']['accounts']['Row'];

interface UserProfile {
  user: User;
  contract: Contract | null;
  accounts: Account[];
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false); // Track if initial auth check is done

  // Listen for auth state changes (sign in/sign out)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id ?? null;

      // If user changed (sign out, sign in, or different user), reset and refetch
      if (newUserId !== authUserId) {
        setAuthUserId(newUserId);
        if (!newUserId) {
          // User signed out - clear profile
          setProfile(null);
          setLoading(false);
        } else {
          // New user signed in - trigger refetch
          setLoading(true);
        }
      }
    });

    // Get initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUserId(user?.id ?? null);
      setAuthChecked(true); // Mark auth as checked
    });

    return () => subscription.unsubscribe();
  }, [authUserId]);

  // Fetch profile when authUserId changes and is not null
  useEffect(() => {
    // Don't do anything until auth is checked
    if (!authChecked) return;

    if (!authUserId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        setLoading(true);

        // Fetch user profile
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUserId)
          .single();

        if (userError) throw userError;

        // Fetch user's contract
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .select('*')
          .eq('user_id', authUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (contractError) throw contractError;

        // Fetch user's social accounts
        const { data: userAccounts, error: userAccountsError } = await supabase
          .from('user_accounts')
          .select('account_id')
          .eq('user_id', authUserId);

        if (userAccountsError) throw userAccountsError;

        let accounts: Account[] = [];
        if (userAccounts && userAccounts.length > 0) {
          const accountIds = userAccounts.map(ua => ua.account_id);
          const { data: accountsData, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .in('id', accountIds);

          if (accountsError) throw accountsError;
          accounts = accountsData || [];
        }

        setProfile({
          user,
          contract,
          accounts,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [authUserId, authChecked]);

  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => {
    if (authUserId) {
      setRefetchTrigger(prev => prev + 1);
    }
  };

  // Refetch when trigger changes
  useEffect(() => {
    if (refetchTrigger > 0 && authUserId) {
      async function fetchProfile() {
        try {
          setLoading(true);

          // Fetch user profile
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUserId)
            .single();

          if (userError) throw userError;

          // Fetch user's contract
          const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .select('*')
            .eq('user_id', authUserId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (contractError) throw contractError;

          // Fetch user's social accounts
          const { data: userAccounts, error: userAccountsError } = await supabase
            .from('user_accounts')
            .select('account_id')
            .eq('user_id', authUserId);

          if (userAccountsError) throw userAccountsError;

          let accounts: Account[] = [];
          if (userAccounts && userAccounts.length > 0) {
            const accountIds = userAccounts.map(ua => ua.account_id);
            const { data: accountsData, error: accountsError } = await supabase
              .from('accounts')
              .select('*')
              .in('id', accountIds);

            if (accountsError) throw accountsError;
            accounts = accountsData || [];
          }

          setProfile({
            user,
            contract,
            accounts,
          });
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setProfile(null);
        } finally {
          setLoading(false);
        }
      }

      fetchProfile();
    }
  }, [refetchTrigger, authUserId]);

  return { profile, loading, error, refetch };
}
