import { useState } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Copy,
  Download,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// Platform icons as simple components
const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

interface CreateAccountsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userFullName: string;
}

// Safe emojis (sports/tech focused)
const SAFE_EMOJIS = ['📱', '🎯', '📊', '⚡', '🏆', '📈', '🔥', '💯', '🚀', '✨', '🏀', '🏈', '⚽', '🎾', '⚾', '🤖', '💡', '🧠'];

// TikTok-SAFE bio templates (NO betting language!)
const TT_BIO_TEMPLATES = [
  '{emoji} AI-powered sports analysis {emoji2}',
  '{emoji} Smart sports insights {emoji2} Try the app',
  '{emoji} Sports predictions made easy {emoji2}',
  '{emoji} Your AI sports companion {emoji2}',
  '{emoji} Next-gen sports analysis {emoji2}',
  '{emoji} Sports meets AI {emoji2} Check it out',
  '{emoji} Smarter sports decisions {emoji2}',
  '{emoji} AI sports tech {emoji2} Link below',
  '{emoji} Sports analysis app {emoji2}',
  '{emoji} Data-driven sports content {emoji2}',
];

// TikTok-SAFE username themes
const TT_THEMES = ['Sports', 'Games', 'Plays', 'Stats', 'Analysis', 'Insights', 'Trends', 'Data', 'Numbers', 'Scores', 'Updates', 'News', 'Takes', 'Views'];
const TT_ENDINGS = ['', 'HQ', 'Daily', 'Now', 'Live', 'Zone', 'Hub', 'Central', '24', '7', 'X', 'App', 'AI', 'Tech'];

// Instagram bio templates - highlight the KEY ACTION: 1 pic = instant analysis
const IG_BIO_TEMPLATES = [
  '{emoji} 1 pic = instant AI analysis\n{emoji2} Snap your slip & get predictions',
  '{emoji} Snap a pic → Get instant analysis\n{emoji2} Try it free below',
  '{emoji} 1 screenshot = AI breakdown in seconds\n{emoji2} Download the app',
  '{emoji} Snap. Analyze. Decide.\n{emoji2} Free AI analysis app below',
  '{emoji} Your bet slip + AI = instant insights\n{emoji2} Get the app',
  '{emoji} Screenshot any slip → instant AI analysis\n{emoji2} Link below',
  '{emoji} 1 tap analysis for any bet slip\n{emoji2} Try it free',
  '{emoji} Snap a pic, get AI predictions instantly\n{emoji2} Download free',
];

const BET_AI_APP_LINK = 'https://apps.apple.com/us/app/bet-ai-betting-assistant/id6743808717';

// Helper functions
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const extractFirstName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || 'User';
};

const generateBioWithEmojis = (templates: string[]): string => {
  const template = randomItem(templates);
  const emoji1 = randomItem(SAFE_EMOJIS);
  let emoji2 = randomItem(SAFE_EMOJIS);
  while (emoji2 === emoji1) {
    emoji2 = randomItem(SAFE_EMOJIS);
  }
  return template.replace('{emoji}', emoji1).replace('{emoji2}', emoji2);
};

interface InstagramProfile {
  username: string;
  bio: string;
  appLink: string;
  profilePicUrl: string;
}

interface TikTokProfile {
  username: string;
  bio: string;
  profilePicUrl: string;
}

const CreateAccountsModal = ({ open, onOpenChange, userFullName }: CreateAccountsModalProps) => {
  const isMobile = useIsMobile();
  const [instagramProfile, setInstagramProfile] = useState<InstagramProfile | null>(null);
  const [tiktokProfile, setTiktokProfile] = useState<TikTokProfile | null>(null);
  const [isGeneratingIG, setIsGeneratingIG] = useState(false);
  const [isGeneratingTT, setIsGeneratingTT] = useState(false);

  const firstName = extractFirstName(userFullName);

  const generateInstagramProfile = () => {
    setIsGeneratingIG(true);

    // Small delay for UX
    setTimeout(() => {
      const cleanName = firstName.toLowerCase().replace(/[^a-z]/g, '');
      const useNumber = Math.random() > 0.5;
      const number = useNumber ? randomNumber(1, 99).toString() : '';

      const profile: InstagramProfile = {
        username: `@${cleanName}${number}.betai`,
        bio: generateBioWithEmojis(IG_BIO_TEMPLATES),
        appLink: BET_AI_APP_LINK,
        profilePicUrl: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${randomNumber(1, 99)}.jpg`,
      };

      setInstagramProfile(profile);
      setIsGeneratingIG(false);
      toast.success("Instagram profile generated!");
    }, 300);
  };

  const generateTikTokProfile = () => {
    setIsGeneratingTT(true);

    // Small delay for UX
    setTimeout(() => {
      const cleanName = firstName.replace(/[^a-zA-Z]/g, '');
      const theme = randomItem(TT_THEMES);
      const ending = Math.random() > 0.5 ? randomItem(TT_ENDINGS) : '';
      const useNumber = Math.random() > 0.5;
      const number = useNumber ? randomNumber(1, 99).toString() : '';

      // Generate safe username patterns
      const patterns = [
        `${cleanName}${theme}${ending}${number}`,
        `${cleanName}${theme}${number}`,
        `${theme}${cleanName}${number}`,
        `${cleanName}${randomNumber(10, 99)}${theme}`,
      ];

      const username = randomItem(patterns).replace(/\s+/g, '').toLowerCase();

      const profile: TikTokProfile = {
        username: `@${username}`,
        bio: generateBioWithEmojis(TT_BIO_TEMPLATES),
        profilePicUrl: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${randomNumber(1, 99)}.jpg`,
      };

      setTiktokProfile(profile);
      setIsGeneratingTT(false);
      toast.success("TikTok profile generated!");
    }, 300);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleDownloadProfilePic = (url: string) => {
    window.open(url, "_blank");
    toast.success("Opening profile picture...");
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-3xl bg-card border-border p-0 overflow-hidden max-h-[90vh]">
        <ResponsiveModalHeader className="p-4 md:p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
          <ResponsiveModalTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            Create Your Accounts
          </ResponsiveModalTitle>
          <ResponsiveModalDescription className="text-sm mt-2">
            Generate separate profile info for TikTok (safe mode) and Instagram
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <ScrollArea className={isMobile ? "h-[70vh]" : "h-[calc(90vh-120px)]"}>
          <div className="p-4 md:p-6 space-y-6">

            {/* Important Notice */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-amber-500">Important: Platform Rules</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li><strong>TikTok:</strong> NEVER use "betting", "bets", "gambling", "wager" - accounts get flagged!</li>
                    <li><strong>Instagram:</strong> More flexible - can mention betting</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Instagram Section */}
              <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-pink-400">
                    <InstagramIcon className="w-6 h-6" />
                    <span className="font-bold text-lg">Instagram</span>
                  </div>
                  <Button
                    onClick={generateInstagramProfile}
                    disabled={isGeneratingIG}
                    size="sm"
                    className="gap-2 bg-pink-500 hover:bg-pink-600"
                  >
                    {isGeneratingIG ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {instagramProfile ? 'Regenerate' : 'Generate'}
                  </Button>
                </div>

                {instagramProfile ? (
                  <div className="space-y-3">
                    {/* Profile Pic */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-14 h-14 border-2 border-pink-500/30">
                        <AvatarImage src={instagramProfile.profilePicUrl} />
                        <AvatarFallback>{firstName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => handleDownloadProfilePic(instagramProfile.profilePicUrl)}
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>

                    {/* Username */}
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground block">Username</span>
                          <span className="text-foreground font-semibold">{instagramProfile.username}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(instagramProfile.username.replace('@', ''), "Username")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-xs text-muted-foreground block mb-1">Bio</span>
                          <span className="text-foreground text-sm whitespace-pre-line">{instagramProfile.bio}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyToClipboard(instagramProfile.bio, "Bio")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* App Link */}
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground block">App Store Link (for bio)</span>
                          <span className="text-foreground text-xs truncate block">{instagramProfile.appLink}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyToClipboard(instagramProfile.appLink, "App link")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 mt-2"
                      onClick={() => window.open('https://www.instagram.com/accounts/emailsignup/', '_blank')}
                    >
                      <InstagramIcon className="w-4 h-4" />
                      Create Instagram Account
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <InstagramIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Click Generate to create your Instagram profile</p>
                  </div>
                )}
              </div>

              {/* TikTok Section */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-pink-500/10 border border-cyan-500/30 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <TikTokIcon className="w-6 h-6" />
                    <span className="font-bold text-lg">TikTok</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Safe Mode</span>
                  </div>
                  <Button
                    onClick={generateTikTokProfile}
                    disabled={isGeneratingTT}
                    size="sm"
                    className="gap-2 bg-cyan-500 hover:bg-cyan-600"
                  >
                    {isGeneratingTT ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {tiktokProfile ? 'Regenerate' : 'Generate'}
                  </Button>
                </div>

                {tiktokProfile ? (
                  <div className="space-y-3">
                    {/* Profile Pic */}
                    <div className="flex items-center gap-3">
                      <Avatar className="w-14 h-14 border-2 border-cyan-500/30">
                        <AvatarImage src={tiktokProfile.profilePicUrl} />
                        <AvatarFallback>{firstName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() => handleDownloadProfilePic(tiktokProfile.profilePicUrl)}
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                    </div>

                    {/* Username */}
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground block">Username</span>
                          <span className="text-foreground font-semibold">{tiktokProfile.username}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(tiktokProfile.username.replace('@', ''), "Username")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="bg-background/50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="text-xs text-muted-foreground block mb-1">Bio</span>
                          <span className="text-foreground text-sm">{tiktokProfile.bio}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyToClipboard(tiktokProfile.bio, "Bio")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Safety Notice */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-xs text-green-400">
                        <strong>Safe:</strong> This profile avoids all betting-related words that could get your account flagged.
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 mt-2"
                      onClick={() => window.open('https://www.tiktok.com/signup', '_blank')}
                    >
                      <TikTokIcon className="w-4 h-4" />
                      Create TikTok Account
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TikTokIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Click Generate to create your TikTok profile</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-center text-muted-foreground text-xs">
              If a username is taken, click Regenerate for new options. Use different profile pics for each platform.
            </p>
          </div>
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default CreateAccountsModal;
