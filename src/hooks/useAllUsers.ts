import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useUserRole } from '@/contexts/UserRoleContext';

type User = Database['public']['Tables']['users']['Row'];

/**
 * Hook to fetch all users.
 * Only works for admin users - returns empty array for non-admins
 */
export function useAllUsers() {
  const { role } = useUserRole();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        // Only fetch users if current user is admin
        if (role !== 'admin') {
          setUsers([]);
          setLoading(false);
          return;
        }

        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('email', { ascending: true });

        if (usersError) throw usersError;

        setUsers(usersData || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [role]);

  return { users, loading, error };
}
