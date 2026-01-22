/**
 * Action Items Widget Component
 * Shows pending admin follow-ups for creators
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AlertTriangle, X, ExternalLink, Loader2, CheckCircle2, Bell } from 'lucide-react';
import { useActionItems, ActionItem, ActionItemType } from '@/hooks/useActionItems';
import { toast } from 'sonner';

interface ActionItemsWidgetProps {
  maxItems?: number;
  className?: string;
}

// Get label and description for item type
const getItemTypeInfo = (type: ActionItemType): { label: string; description: string } => {
  switch (type) {
    case 'no_discord_3d':
      return {
        label: 'No Discord',
        description: 'No Discord linked after approval'
      };
    case 'no_post_3d':
      return {
        label: 'No Posts',
        description: 'No posts since joining Discord'
      };
    default:
      return {
        label: 'Follow-up',
        description: 'Creator needs attention'
      };
  }
};

// Get severity color based on days
const getSeverityClass = (days: number): string => {
  if (days >= 8) return 'text-red-400 bg-red-500/10 border-red-500/30';
  if (days >= 6) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
};

const ActionItemsWidget = ({ maxItems = 5, className }: ActionItemsWidgetProps) => {
  const navigate = useNavigate();
  const { items, loading, error, dismissItem, totalCount } = useActionItems();
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const displayedItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  // Handle clicking an item - navigate to applications with search
  const handleItemClick = (item: ActionItem) => {
    navigate(`/admin/applications?search=${encodeURIComponent(item.userName)}`);
  };

  // Handle dismissing an item
  const handleDismiss = async (e: React.MouseEvent, item: ActionItem) => {
    e.stopPropagation();
    setDismissingId(item.id);

    const success = await dismissItem(item.id);

    if (success) {
      toast.success(`Dismissed reminder for ${item.userName}`, {
        description: 'Item removed from action list'
      });
    } else {
      toast.error('Failed to dismiss item');
    }

    setDismissingId(null);
  };

  // Handle viewing all items
  const handleViewAll = () => {
    navigate('/admin/applications');
  };

  if (error) {
    return (
      <div className={cn("glass-card p-4 md:p-6", className)}>
        <div className="text-destructive text-sm">Failed to load action items</div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card p-4 md:p-6 h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-foreground font-medium">Action Items</h3>
        </div>
        {totalCount > 0 ? (
          <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-1 rounded-full font-medium">
            {totalCount}
          </span>
        ) : (
          <span className="bg-success/20 text-success text-xs px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3 inline mr-1" />0
          </span>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">All caught up!</p>
          <p className="text-xs text-muted-foreground/70">No pending items</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedItems.map((item) => {
            const typeInfo = getItemTypeInfo(item.type);
            const severityClass = getSeverityClass(item.daysSince);

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg cursor-pointer",
                  "border transition-all hover:bg-muted/50",
                  severityClass
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.userName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {typeInfo.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {item.daysSince}d
                  </span>

                  <button
                    onClick={(e) => handleDismiss(e, item)}
                    disabled={dismissingId === item.id}
                    className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    title="Dismiss"
                  >
                    {dismissingId === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>

                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}

          {/* View All button */}
          {hasMore && (
            <button
              onClick={handleViewAll}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-center border border-border/30 rounded-lg hover:bg-muted/30"
            >
              View All ({items.length} items)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionItemsWidget;
