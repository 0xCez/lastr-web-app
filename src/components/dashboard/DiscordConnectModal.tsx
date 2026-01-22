import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

const DISCORD_CLIENT_ID = '1463876904695238656';
const SUPABASE_URL = 'https://kaapiqtezqydymmxsyrw.supabase.co';

// Discord logo SVG component
const DiscordLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

interface DiscordConnectModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DiscordConnectModal = ({ userId, open, onOpenChange }: DiscordConnectModalProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConnectDiscord = () => {
    if (!userId) {
      toast.error('Please wait for your profile to load');
      return;
    }

    setIsConnecting(true);

    const redirectUri = `${SUPABASE_URL}/functions/v1/discord-callback`;
    const state = userId; // Pass user ID as state for verification

    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds.join',
      state,
    });

    // Redirect to Discord OAuth
    window.location.href = `https://discord.com/oauth2/authorize?${params.toString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#5865F2]/10 via-background to-[#5865F2]/5 border-[#5865F2]/30">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#5865F2] rounded-lg">
              <DiscordLogo className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              Join Our Discord
            </DialogTitle>
          </div>
          <DialogDescription className="text-base text-foreground/90 pt-2 space-y-3">
            <p>
              Connect your Discord account to join our creator community and get access to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Your private support channel</li>
              <li>The TestFlight app access</li>
              <li>Your personal promo code</li>
              <li>Direct communication with the team</li>
            </ul>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleConnectDiscord}
            disabled={isConnecting}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold h-11"
          >
            <DiscordLogo className="w-5 h-5 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect Discord'}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Already connected? Close this and refresh the page.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscordConnectModal;
