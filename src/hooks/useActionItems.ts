/**
 * Action Items Hook
 * Fetches pending admin action items for creator follow-ups
 * Supports filtering by type, viewing resolved items, and various actions
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type ActionItemType = 'no_discord_3d' | 'no_post_3d';
export type ActionItemFilter = 'all' | 'no_discord' | 'no_posts' | 'resolved';

export interface ActionItem {
  id: string;
  type: ActionItemType;
  userId: string;
  userName: string;
  userEmail: string;
  daysSince: number;
  createdAt: string;
  contactedAt: string | null;
  snoozedUntil: string | null;
  dismissedAt: string | null;
  resolvedAt: string | null;
  status: 'pending' | 'dismissed' | 'resolved';
  metadata: {
    approvedAt?: string;
    discordLinkedAt?: string;
    [key: string]: any;
  };
}

interface UseActionItemsOptions {
  filter?: ActionItemFilter;
}

interface UseActionItemsResult {
  items: ActionItem[];
  loading: boolean;
  error: string | null;
  dismissItem: (id: string) => Promise<boolean>;
  resolveItem: (id: string) => Promise<boolean>;
  markContacted: (id: string) => Promise<boolean>;
  snoozeItem: (id: string, days: number) => Promise<boolean>;
  undoDismiss: (id: string) => Promise<boolean>;
  refresh: () => void;
  totalCount: number;
  counts: {
    all: number;
    noDiscord: number;
    noPosts: number;
    resolved: number;
  };
}

// Calculate days since a date
const daysSince = (dateStr: string): number => {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

export function useActionItems(options: UseActionItemsOptions = {}): UseActionItemsResult {
  const { filter = 'all' } = options;

  const [items, setItems] = useState<ActionItem[]>([]);
  const [allItems, setAllItems] = useState<ActionItem[]>([]);
  const [resolvedItems, setResolvedItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchActionItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date().toISOString();

        // Fetch pending action items (excluding snoozed ones)
        const { data: pendingData, error: pendingError } = await supabase
          .from('admin_action_items')
          .select(`
            id,
            type,
            user_id,
            status,
            metadata,
            created_at,
            contacted_at,
            snoozed_until,
            dismissed_at,
            resolved_at,
            users!admin_action_items_user_id_fkey (
              full_name,
              email
            )
          `)
          .eq('status', 'pending')
          .or(`snoozed_until.is.null,snoozed_until.lt.${now}`)
          .order('created_at', { ascending: false });

        if (pendingError) {
          throw new Error(pendingError.message);
        }

        // Fetch resolved/dismissed items from last 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const { data: resolvedData, error: resolvedError } = await supabase
          .from('admin_action_items')
          .select(`
            id,
            type,
            user_id,
            status,
            metadata,
            created_at,
            contacted_at,
            snoozed_until,
            dismissed_at,
            resolved_at,
            users!admin_action_items_user_id_fkey (
              full_name,
              email
            )
          `)
          .in('status', ['dismissed', 'resolved'])
          .or(`dismissed_at.gte.${fourteenDaysAgo.toISOString()},resolved_at.gte.${fourteenDaysAgo.toISOString()}`)
          .order('dismissed_at', { ascending: false, nullsFirst: false });

        if (resolvedError) {
          throw new Error(resolvedError.message);
        }

        // Transform pending data
        const transformItem = (item: any): ActionItem => {
          const metadata = item.metadata || {};
          const referenceDate = item.type === 'no_discord_3d'
            ? metadata.approvedAt
            : metadata.discordLinkedAt;

          return {
            id: item.id,
            type: item.type,
            userId: item.user_id,
            userName: metadata.userName || item.users?.full_name || 'Unknown',
            userEmail: metadata.userEmail || item.users?.email || '',
            daysSince: referenceDate ? daysSince(referenceDate) : metadata.daysSince || 0,
            createdAt: item.created_at,
            contactedAt: item.contacted_at,
            snoozedUntil: item.snoozed_until,
            dismissedAt: item.dismissed_at,
            resolvedAt: item.resolved_at,
            status: item.status,
            metadata
          };
        };

        const pendingItems: ActionItem[] = (pendingData || []).map(transformItem);
        const resolved: ActionItem[] = (resolvedData || []).map(transformItem);

        // Sort pending items by daysSince (most urgent first)
        pendingItems.sort((a, b) => b.daysSince - a.daysSince);

        console.log('📋 Action items fetched:', pendingItems.length, 'pending,', resolved.length, 'resolved');

        setAllItems(pendingItems);
        setResolvedItems(resolved);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch action items';
        console.error('❌ Action items error:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchActionItems();
  }, [refreshTrigger]);

  // Apply filter to items
  useEffect(() => {
    if (filter === 'resolved') {
      setItems(resolvedItems);
    } else if (filter === 'no_discord') {
      setItems(allItems.filter(item => item.type === 'no_discord_3d'));
    } else if (filter === 'no_posts') {
      setItems(allItems.filter(item => item.type === 'no_post_3d'));
    } else {
      setItems(allItems);
    }
  }, [filter, allItems, resolvedItems]);

  // Calculate counts
  const counts = {
    all: allItems.length,
    noDiscord: allItems.filter(item => item.type === 'no_discord_3d').length,
    noPosts: allItems.filter(item => item.type === 'no_post_3d').length,
    resolved: resolvedItems.length
  };

  // Dismiss an action item
  const dismissItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('admin_action_items')
        .update({
          status: 'dismissed',
          dismissed_at: new Date().toISOString(),
          dismissed_by: user?.id
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setAllItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to dismiss action item:', err);
      return false;
    }
  }, []);

  // Resolve an action item (issue has been addressed)
  const resolveItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('admin_action_items')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setAllItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to resolve action item:', err);
      return false;
    }
  }, []);

  // Mark an item as contacted
  const markContacted = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('admin_action_items')
        .update({
          contacted_at: new Date().toISOString(),
          contacted_by: user?.id
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state
      setAllItems(prev => prev.map(item =>
        item.id === id
          ? { ...item, contactedAt: new Date().toISOString() }
          : item
      ));
      return true;
    } catch (err) {
      console.error('Failed to mark as contacted:', err);
      return false;
    }
  }, []);

  // Snooze an item for X days
  const snoozeItem = useCallback(async (id: string, days: number): Promise<boolean> => {
    try {
      const snoozeUntil = new Date();
      snoozeUntil.setDate(snoozeUntil.getDate() + days);

      const { error: updateError } = await supabase
        .from('admin_action_items')
        .update({
          snoozed_until: snoozeUntil.toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Remove from local state (it's now snoozed)
      setAllItems(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to snooze action item:', err);
      return false;
    }
  }, []);

  // Undo dismiss - restore item to pending
  const undoDismiss = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('admin_action_items')
        .update({
          status: 'pending',
          dismissed_at: null,
          dismissed_by: null,
          resolved_at: null,
          resolved_by: null
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Refresh to get updated lists
      refresh();
      return true;
    } catch (err) {
      console.error('Failed to undo dismiss:', err);
      return false;
    }
  }, [refresh]);

  return {
    items,
    loading,
    error,
    dismissItem,
    resolveItem,
    markContacted,
    snoozeItem,
    undoDismiss,
    refresh,
    totalCount: allItems.length,
    counts
  };
}
