import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useUserProfile } from "@/hooks/useUserProfile";

const DISCORD_CLIENT_ID = '1455546094594293913';
const SUPABASE_URL = 'https://kaapiqtezqydymmxsyrw.supabase.co';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AMOnboardingChecklistProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProgressUpdate?: () => void;
  onOpenSlideshowTutorial?: () => void;
}

const AMOnboardingChecklist = ({ userId, open, onOpenChange, onProgressUpdate, onOpenSlideshowTutorial }: AMOnboardingChecklistProps) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useUserProfile();

  // Check if Discord is already connected
  const isDiscordConnected = !!profile?.user?.discord_id;

  useEffect(() => {
    if (open) {
      loadChecklist();
    }
  }, [userId, open, isDiscordConnected]);

  const loadChecklist = async () => {
    try {
      // Fetch or create checklist
      let { data: checklist, error } = await supabase
        .from('am_onboarding_checklist')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Create checklist if it doesn't exist
      if (!checklist) {
        const { data: newChecklist, error: createError } = await supabase
          .from('am_onboarding_checklist')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) throw createError;
        checklist = newChecklist;
      }

      // Discord is auto-marked complete if user has connected their Discord account
      const discordCompleted = isDiscordConnected || !!checklist.joined_discord_at;

      const checklistItems: ChecklistItem[] = [
        {
          id: 'contract',
          label: 'Sign the contract you received on your email',
          description: 'Review and sign the Account Manager contract sent to your email address',
          completed: !!checklist.contract_signed_at,
          completedAt: checklist.contract_signed_at,
        },
        {
          id: 'discord',
          label: 'Connect Discord',
          description: isDiscordConnected
            ? `Connected as ${profile?.user?.discord_username || 'Unknown'}. Check your private channel for next steps!`
            : `Connect to Discord to get your private channel and communicate with the team`,
          completed: discordCompleted,
          completedAt: checklist.joined_discord_at || (isDiscordConnected ? profile?.user?.discord_linked_at : null),
          action: isDiscordConnected ? undefined : {
            label: 'Connect',
            onClick: () => handleConnectDiscord(),
          },
        },
        {
          id: 'tutorial',
          label: 'Watch Slideshow Tutorial',
          description: 'Learn how to create engaging slideshows with our generator',
          completed: !!checklist.watched_tutorial_at,
          completedAt: checklist.watched_tutorial_at,
          action: {
            label: 'Watch',
            onClick: () => handleViewSlideshowTutorial(),
          },
        },
        {
          id: 'first_post',
          label: 'Submit first slideshow',
          description: 'Create and submit your first slideshow post to the platform',
          completed: !!checklist.submitted_first_post_at,
          completedAt: checklist.submitted_first_post_at,
          action: {
            label: 'Go to Submit',
            onClick: () => handleSubmitPost(),
          },
        },
      ];

      setItems(checklistItems);
      setLoading(false);
    } catch (error) {
      console.error('Error loading AM checklist:', error);
      toast.error('Failed to load onboarding checklist');
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
        spread: 90,
        startVelocity: 55,
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleChecklistUpdate = async (field: string, currentValue: string | null) => {
    try {
      // Toggle: if already set, clear it; if not set, set it to now
      const newValue = currentValue ? null : new Date().toISOString();

      const { error } = await supabase
        .from('am_onboarding_checklist')
        .update({ [field]: newValue })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(newValue ? 'Marked complete!' : 'Marked incomplete');

      // Reload checklist to get fresh data
      await loadChecklist();

      // Check if all items are now complete
      const { data: updatedChecklist } = await supabase
        .from('am_onboarding_checklist')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (updatedChecklist && newValue) {
        const allComplete =
          updatedChecklist.contract_signed_at &&
          updatedChecklist.joined_discord_at &&
          updatedChecklist.watched_tutorial_at &&
          updatedChecklist.submitted_first_post_at;

        if (allComplete) {
          triggerConfetti();
          setTimeout(() => {
            toast.success('Congrats! You\'re all set to start earning!', {
              duration: 5000,
            });
          }, 500);
        }
      }

      onProgressUpdate?.();
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast.error('Failed to update progress');
    }
  };

  const handleConnectDiscord = () => {
    if (!userId) {
      toast.error('Please wait for your profile to load');
      return;
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/discord-callback`;
    const state = userId;

    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds.join',
      state,
    });

    window.location.href = `https://discord.com/oauth2/authorize?${params.toString()}`;
  };

  const handleViewSlideshowTutorial = () => {
    onOpenSlideshowTutorial?.();
  };

  const handleSubmitPost = () => {
    toast.success('Use the "+" button to submit your slideshow post');
    onOpenChange(false);
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getFieldName = (itemId: string): string => {
    const fieldMap: Record<string, string> = {
      'contract': 'contract_signed_at',
      'discord': 'joined_discord_at',
      'tutorial': 'watched_tutorial_at',
      'first_post': 'submitted_first_post_at',
    };
    return fieldMap[itemId] || '';
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-2xl bg-card border-border p-0 overflow-hidden max-h-[90vh]">
        <ResponsiveModalHeader className="p-3 sm:p-4 md:p-5 pb-3 sm:pb-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <ResponsiveModalTitle className="text-base sm:text-lg md:text-xl font-bold text-foreground">Getting Started</ResponsiveModalTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Complete these steps to start earning</p>
              </div>
            </div>
            {completedCount === totalCount && (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-green-500/10 px-2 md:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                <span className="text-[10px] sm:text-xs font-semibold text-green-500 hidden sm:inline">All Done!</span>
              </div>
            )}
          </div>
        </ResponsiveModalHeader>

        <div className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4 overflow-y-auto max-h-[calc(90vh-80px)] sm:max-h-[calc(85vh-100px)]">
          {loading ? (
            <div className="py-6 sm:py-8 text-center">
              <p className="text-sm text-muted-foreground">Loading your progress...</p>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                  <span className="font-medium text-foreground">
                    {completedCount} of {totalCount} completed
                  </span>
                  <span className="font-bold text-primary">{Math.round(progressPercentage)}%</span>
                </div>
                <div className="h-2 sm:h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  >
                    {progressPercentage > 0 && (
                      <div className="w-full h-full animate-pulse bg-white/20" />
                    )}
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2 sm:p-3 text-[11px] sm:text-sm">
                <p className="text-foreground">
                  <span className="font-semibold">Earnings:</span> $250/month per account pair.
                  Post 5 slideshows/day, 6 days/week to earn your full payout.
                </p>
              </div>

              {/* Checklist Items */}
              <div className="space-y-2 sm:space-y-2.5">
                {items.map((item) => {
                  const fieldName = getFieldName(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-lg border transition-all ${
                        item.completed
                          ? 'bg-green-500/5 border-green-500/30'
                          : 'bg-secondary/30 border-border/50 hover:border-primary/30'
                      }`}
                    >
                      {/* Checkbox - clickable to toggle */}
                      <button
                        onClick={() => handleChecklistUpdate(fieldName, item.completedAt)}
                        className="flex-shrink-0 hover:scale-110 transition-transform mt-0.5 sm:mt-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground hover:text-primary" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xs sm:text-sm font-semibold leading-tight ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {item.label}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">
                          {item.description}
                        </p>
                      </div>

                      {/* Action Button (if available) */}
                      {item.action && (
                        <Button
                          size="sm"
                          variant={item.id === 'discord' ? 'default' : 'ghost'}
                          onClick={item.action.onClick}
                          className={`flex-shrink-0 h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-sm ${
                            item.id === 'discord' ? 'bg-[#5865F2] hover:bg-[#4752C4] text-white' : ''
                          }`}
                        >
                          {item.action.label}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Motivational Message */}
              {completedCount < totalCount && (
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-2.5 sm:p-3.5 border border-primary/20">
                  <p className="text-[11px] sm:text-sm text-foreground">
                    <span className="font-semibold">Quick tip:</span> Most Account Managers complete setup within{' '}
                    <span className="text-primary font-bold">24 hours</span> and start posting the next day!
                  </p>
                </div>
              )}

              {completedCount === totalCount && (
                <div className="bg-gradient-to-r from-green-500/10 via-primary/10 to-green-500/10 rounded-lg p-3 sm:p-5 border-2 border-green-500/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                  <div className="relative text-center space-y-1.5 sm:space-y-2">
                    <div className="text-2xl sm:text-3xl font-bold text-green-500 flex items-center justify-center gap-2">
                      <Trophy className="w-5 h-5 sm:w-7 sm:h-7" />
                      <span>You're All Set!</span>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      Time to start posting slideshows!
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Remember: 5 posts/day, 6 days/week = full payout
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default AMOnboardingChecklist;
