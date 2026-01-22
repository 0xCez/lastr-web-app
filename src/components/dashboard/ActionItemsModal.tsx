/**
 * Action Items Modal Component
 * Shows pending admin follow-ups for creators in a modal
 * Features: tabs, quick actions (copy email, snooze, mark contacted), resolved view
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  X,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Bell,
  Copy,
  Phone,
  Clock,
  Check,
  Undo2,
  MessageSquare,
  UserX
} from 'lucide-react';
import { useActionItems, ActionItem, ActionItemType, ActionItemFilter } from '@/hooks/useActionItems';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ActionItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Get label and description for item type
const getItemTypeInfo = (type: ActionItemType): { label: string; description: string; icon: string } => {
  switch (type) {
    case 'no_discord_3d':
      return {
        label: 'No Discord',
        description: 'No Discord linked after approval',
        icon: '📵'
      };
    case 'no_post_3d':
      return {
        label: 'No Posts',
        description: 'No posts since joining Discord',
        icon: '📝'
      };
    default:
      return {
        label: 'Follow-up',
        description: 'Creator needs attention',
        icon: '⚠️'
      };
  }
};

// Get severity color based on days
const getSeverityClass = (days: number): string => {
  if (days >= 10) return 'border-red-500/50 bg-red-500/10';
  if (days >= 7) return 'border-orange-500/50 bg-orange-500/10';
  return 'border-amber-500/50 bg-amber-500/10';
};

const getSeverityIconClass = (days: number): string => {
  if (days >= 10) return 'text-red-400';
  if (days >= 7) return 'text-orange-400';
  return 'text-amber-400';
};

const getSeverityBadgeClass = (days: number): string => {
  if (days >= 10) return 'bg-red-500/20 text-red-400';
  if (days >= 7) return 'bg-orange-500/20 text-orange-400';
  return 'bg-amber-500/20 text-amber-400';
};

// Tab button component
const TabButton = ({
  active,
  onClick,
  children,
  count
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    )}
  >
    {children}
    {count !== undefined && count > 0 && (
      <span className={cn(
        "ml-1.5 px-1.5 py-0.5 text-xs rounded-full",
        active ? "bg-primary-foreground/20" : "bg-muted"
      )}>
        {count}
      </span>
    )}
  </button>
);

const ActionItemsModal = ({ open, onOpenChange }: ActionItemsModalProps) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ActionItemFilter>('all');
  const {
    items,
    loading,
    error,
    dismissItem,
    resolveItem,
    markContacted,
    snoozeItem,
    undoDismiss,
    counts
  } = useActionItems({ filter: activeFilter });

  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [snoozeOpenFor, setSnoozeOpenFor] = useState<string | null>(null);

  // Handle clicking an item - navigate to applications with search
  const handleItemClick = (item: ActionItem) => {
    onOpenChange(false);
    navigate(`/admin/applications?search=${encodeURIComponent(item.userName)}`);
  };

  // Copy email to clipboard
  const handleCopyEmail = async (e: React.MouseEvent, email: string, name: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      toast.success(`Copied ${name}'s email`, {
        description: email
      });
    } catch {
      toast.error('Failed to copy email');
    }
  };

  // Handle mark as contacted
  const handleMarkContacted = async (e: React.MouseEvent, item: ActionItem) => {
    e.stopPropagation();
    if (item.contactedAt) return; // Already contacted

    setActionInProgress(item.id);
    const success = await markContacted(item.id);

    if (success) {
      toast.success(`Marked ${item.userName} as contacted`);
    } else {
      toast.error('Failed to mark as contacted');
    }
    setActionInProgress(null);
  };

  // Handle snooze
  const handleSnooze = async (e: React.MouseEvent, item: ActionItem, days: number) => {
    e.stopPropagation();
    setSnoozeOpenFor(null);
    setActionInProgress(item.id);

    const success = await snoozeItem(item.id, days);

    if (success) {
      toast.success(`Snoozed ${item.userName} for ${days} day${days > 1 ? 's' : ''}`, {
        description: 'Will reappear after snooze period'
      });
    } else {
      toast.error('Failed to snooze item');
    }
    setActionInProgress(null);
  };

  // Handle resolve
  const handleResolve = async (e: React.MouseEvent, item: ActionItem) => {
    e.stopPropagation();
    setActionInProgress(item.id);

    const success = await resolveItem(item.id);

    if (success) {
      toast.success(`Resolved reminder for ${item.userName}`, {
        description: 'Moved to resolved tab'
      });
    } else {
      toast.error('Failed to resolve item');
    }
    setActionInProgress(null);
  };

  // Handle dismiss
  const handleDismiss = async (e: React.MouseEvent, item: ActionItem) => {
    e.stopPropagation();
    setActionInProgress(item.id);

    const success = await dismissItem(item.id);

    if (success) {
      toast.success(`Dismissed reminder for ${item.userName}`, {
        description: 'You can undo this from the Resolved tab'
      });
    } else {
      toast.error('Failed to dismiss item');
    }
    setActionInProgress(null);
  };

  // Handle undo dismiss
  const handleUndoDismiss = async (e: React.MouseEvent, item: ActionItem) => {
    e.stopPropagation();
    setActionInProgress(item.id);

    const success = await undoDismiss(item.id);

    if (success) {
      toast.success(`Restored reminder for ${item.userName}`, {
        description: 'Back in the pending list'
      });
    } else {
      toast.error('Failed to restore item');
    }
    setActionInProgress(null);
  };

  const isResolved = activeFilter === 'resolved';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-foreground">
            <span className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Action Items
            </span>
            {counts.all > 0 ? (
              <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-medium">
                {counts.all} pending
              </span>
            ) : (
              <span className="bg-success/20 text-success text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                All clear
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
          <TabButton
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            count={counts.all}
          >
            All
          </TabButton>
          <TabButton
            active={activeFilter === 'no_discord'}
            onClick={() => setActiveFilter('no_discord')}
            count={counts.noDiscord}
          >
            <span className="hidden sm:inline">No Discord</span>
            <span className="sm:hidden">📵</span>
          </TabButton>
          <TabButton
            active={activeFilter === 'no_posts'}
            onClick={() => setActiveFilter('no_posts')}
            count={counts.noPosts}
          >
            <span className="hidden sm:inline">No Posts</span>
            <span className="sm:hidden">📝</span>
          </TabButton>
          <TabButton
            active={activeFilter === 'resolved'}
            onClick={() => setActiveFilter('resolved')}
            count={counts.resolved}
          >
            <span className="hidden sm:inline">Resolved</span>
            <span className="sm:hidden">✓</span>
          </TabButton>
        </div>

        {error ? (
          <div className="text-destructive text-sm py-4">Failed to load action items</div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            {isResolved ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">No resolved items</p>
                <p className="text-sm text-muted-foreground">Resolved items from the last 14 days will appear here</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="text-foreground font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">No creators need follow-up right now</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {items.map((item) => {
              const typeInfo = getItemTypeInfo(item.type);
              const severityClass = isResolved ? 'border-border/50 bg-muted/30' : getSeverityClass(item.daysSince);
              const iconClass = isResolved ? 'text-muted-foreground' : getSeverityIconClass(item.daysSince);
              const badgeClass = isResolved ? 'bg-muted text-muted-foreground' : getSeverityBadgeClass(item.daysSince);
              const isLoading = actionInProgress === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => !isResolved && handleItemClick(item)}
                  className={cn(
                    "px-3 py-2 rounded-lg border transition-all",
                    !isResolved && "cursor-pointer hover:scale-[1.005] active:scale-[0.995]",
                    severityClass
                  )}
                >
                  {/* Single row layout: Icon | Name + Email + Type | Actions | Days */}
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={cn("w-4 h-4 flex-shrink-0", iconClass)} />

                    {/* Name, email, type - all inline */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-medium text-foreground truncate">
                        {item.userName}
                      </span>
                      {item.contactedAt && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-400 flex-shrink-0">
                          <Phone className="w-2.5 h-2.5" />
                          Contacted
                        </span>
                      )}
                      <span className="text-muted-foreground hidden sm:inline">·</span>
                      <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                        {item.userEmail}
                      </span>
                      <button
                        onClick={(e) => handleCopyEmail(e, item.userEmail, item.userName)}
                        className="p-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        title="Copy email"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <span className="text-muted-foreground hidden md:inline">·</span>
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : isResolved ? (
                      // Resolved view: only show Undo button
                      <button
                        onClick={(e) => handleUndoDismiss(e, item)}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                        title="Restore to pending"
                      >
                        <Undo2 className="w-3 h-3" />
                        Undo
                      </button>
                    ) : (
                      // Pending view: show all action buttons
                      <>
                        {/* Mark Contacted */}
                        {!item.contactedAt && (
                          <button
                            onClick={(e) => handleMarkContacted(e, item)}
                            className="p-1 rounded hover:bg-blue-500/20 text-muted-foreground hover:text-blue-400 transition-colors"
                            title="Mark as contacted"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Snooze */}
                        <Popover open={snoozeOpenFor === item.id} onOpenChange={(open) => setSnoozeOpenFor(open ? item.id : null)}>
                          <PopoverTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded hover:bg-amber-500/20 text-muted-foreground hover:text-amber-400 transition-colors"
                              title="Snooze"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-32 p-1 bg-card border-border" align="end">
                            <div className="space-y-0.5">
                              <button
                                onClick={(e) => handleSnooze(e, item, 1)}
                                className="w-full px-2 py-1 text-xs text-left rounded hover:bg-muted transition-colors"
                              >
                                1 day
                              </button>
                              <button
                                onClick={(e) => handleSnooze(e, item, 3)}
                                className="w-full px-2 py-1 text-xs text-left rounded hover:bg-muted transition-colors"
                              >
                                3 days
                              </button>
                              <button
                                onClick={(e) => handleSnooze(e, item, 7)}
                                className="w-full px-2 py-1 text-xs text-left rounded hover:bg-muted transition-colors"
                              >
                                7 days
                              </button>
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* Resolve */}
                        <button
                          onClick={(e) => handleResolve(e, item)}
                          className="p-1 rounded hover:bg-success/20 text-muted-foreground hover:text-success transition-colors"
                          title="Mark as resolved"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        {/* Dismiss */}
                        <button
                          onClick={(e) => handleDismiss(e, item)}
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* View profile */}
                        <button
                          onClick={() => handleItemClick(item)}
                          className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="View in Applications"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    </div>

                    {/* Days badge */}
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ml-2", badgeClass)}>
                      {item.daysSince}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActionItemsModal;
