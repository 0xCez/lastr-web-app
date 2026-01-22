import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useUserRole } from '@/contexts/UserRoleContext';

type Account = Database['public']['Tables']['accounts']['Row'];

interface AccountWithUser extends Account {
  user_id?: string;
  user_email?: string;
}

/**
 * Hook to fetch all accounts with their associated users.
 * For admin users: returns ALL accounts from all users
 * For non-admin users: returns only the logged-in user's accounts
 */
export function useAllAccounts() {
  const { role } = useUserRole();
  const [accounts, setAccounts] = useState<AccountWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!authUser) throw new Error('No authenticated user');

        console.log('[useAllAccounts] Fetching accounts for role:', role);

        if (role === 'admin') {
          // For admins: fetch ALL accounts with user linkage
          // Step 1: Get all user_accounts links
          const { data: userAccountsData, error: userAccountsError } = await supabase
            .from('user_accounts')
            .select('account_id, user_id');

          if (userAccountsError) {
            console.error('[useAllAccounts] Error fetching user_accounts:', {
              message: userAccountsError.message,
              details: userAccountsError.details,
              hint: userAccountsError.hint,
              code: userAccountsError.code
            });
            throw userAccountsError;
          }

          console.log('[useAllAccounts] Fetched user_accounts:', userAccountsData);

          // Get all account IDs
          const accountIds = userAccountsData?.map(ua => ua.account_id) || [];

          if (accountIds.length === 0) {
            console.log('[useAllAccounts] No account IDs found');
            setAccounts([]);
            setLoading(false);
            return;
          }

          // Step 2: Fetch all accounts
          const { data: accountsData, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .in('id', accountIds);

          if (accountsError) {
            console.error('[useAllAccounts] Error fetching accounts:', accountsError);
            throw accountsError;
          }

          console.log('[useAllAccounts] Fetched accounts:', accountsData);

          // Step 3: Fetch all users to get emails
          const userIds = [...new Set(userAccountsData?.map(ua => ua.user_id) || [])];
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email')
            .in('id', userIds);

          if (usersError) {
            console.error('[useAllAccounts] Error fetching users:', usersError);
            throw usersError;
          }

          console.log('[useAllAccounts] Fetched users:', usersData);

          // Merge accounts with user info
          const accountsWithUsers: AccountWithUser[] = (accountsData || []).map(account => {
            const userAccount = userAccountsData?.find(ua => ua.account_id === account.id);
            const user = usersData?.find(u => u.id === userAccount?.user_id);
            return {
              ...account,
              user_id: userAccount?.user_id,
              user_email: user?.email,
            };
          });

          console.log('[useAllAccounts] Final accounts with users:', accountsWithUsers);
          setAccounts(accountsWithUsers);
        } else {
          // For non-admins: fetch only their own accounts
          const { data: userAccounts, error: userAccountsError } = await supabase
            .from('user_accounts')
            .select('account_id')
            .eq('user_id', authUser.id);

          if (userAccountsError) {
            console.error('[useAllAccounts] Error fetching user_accounts for non-admin:', userAccountsError);
            throw userAccountsError;
          }

          console.log('[useAllAccounts] Fetched user_accounts for non-admin:', userAccounts);

          const accountIds = userAccounts?.map(ua => ua.account_id) || [];

          if (accountIds.length === 0) {
            console.log('[useAllAccounts] No account IDs found for non-admin');
            setAccounts([]);
            setLoading(false);
            return;
          }

          const { data: accountsData, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .in('id', accountIds);

          if (accountsError) {
            console.error('[useAllAccounts] Error fetching accounts for non-admin:', accountsError);
            throw accountsError;
          }

          console.log('[useAllAccounts] Final accounts for non-admin:', accountsData);
          setAccounts(accountsData || []);
        }
      } catch (err) {
        console.error('[useAllAccounts] Error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, [role]);

  return { accounts, loading, error };
}
