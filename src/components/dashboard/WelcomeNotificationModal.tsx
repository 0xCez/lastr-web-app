import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, X, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NotificationData {
  id: string;
  title: string;
  message: string;
  metadata: {
    cta_text?: string;
    cta_url?: string;
    admin_sent?: boolean;
  } | null;
}

interface WelcomeNotificationModalProps {
  userId: string;
}

const WelcomeNotificationModal = ({ userId }: WelcomeNotificationModalProps) => {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      console.log('[WelcomeNotificationModal] Fetching notifications for user:', userId);

      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, metadata')
        .eq('user_id', userId)
        .eq('is_read', false)
        .eq('type', 'system')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[WelcomeNotificationModal] Error fetching notifications:', error);
        return;
      }

      console.log('[WelcomeNotificationModal] Notifications data:', data);

      if (data && data.length > 0) {
        const notif = data[0] as NotificationData;
        console.log('[WelcomeNotificationModal] Setting notification:', notif);
        setNotification(notif);
        setOpen(true);
      } else {
        console.log('[WelcomeNotificationModal] No unread notifications found');
      }
    };

    if (userId) {
      fetchUnreadNotifications();
    }
  }, [userId]);

  const handleClose = async () => {
    if (notification) {
      // Mark as read
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notification.id);
    }
    setOpen(false);
    setNotification(null);
  };

  const handleCTA = async () => {
    if (notification?.metadata?.cta_url) {
      window.open(notification.metadata.cta_url, '_blank');
    }
    await handleClose();
  };

  if (!notification) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-900/20 via-background to-pink-900/20 border-purple-500/30">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {notification.title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-foreground/90 pt-2">
            {notification.message}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-4">
          {notification.metadata?.cta_url && notification.metadata?.cta_text && (
            <Button
              onClick={handleCTA}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
            >
              {notification.metadata.cta_text}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          )}
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full"
          >
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeNotificationModal;
