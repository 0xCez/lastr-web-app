import { useState, useEffect } from "react";
import { CheckCircle2, ClipboardList, Smartphone, AtSign, FileCheck, Send, Sparkles, Mic } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// Discord logo SVG component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

interface ChecklistItem {
  id: string;
  field: string;
  label: string;
  description: string;
  completedAt: string | null;
  icon: React.ReactNode;
  color: string;
}

interface AdminOnboardingChecklistProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHECKLIST_CONFIG = [
  {
    id: 'discord_joined',
    field: 'discord_scheduled_at',
    label: 'Joined Discord',
    description: 'Creator joined Discord and has private channel',
    icon: <DiscordIcon className="w-4 h-4" />,
    color: 'violet',
  },
  {
    id: 'voice_note_sent',
    field: 'voice_note_sent_at',
    label: 'Voice Note Sent',
    description: 'Sent voice note welcome on their private channel',
    icon: <Mic className="w-4 h-4" />,
    color: 'pink',
  },
  {
    id: 'accounts_created',
    field: 'handles_verified_at',
    label: 'TT & IG Accounts Created',
    description: 'Verified TikTok & Instagram accounts are set up',
    icon: <AtSign className="w-4 h-4" />,
    color: 'cyan',
  },
  {
    id: 'app_access_sent',
    field: 'app_access_at',
    label: 'TestFlight / Promo Sent',
    description: 'Sent TestFlight invite or App Store promo code',
    icon: <Smartphone className="w-4 h-4" />,
    color: 'emerald',
  },
  {
    id: 'content_feedback',
    field: 'content_validated_at',
    label: 'Content Feedback Given',
    description: 'Received sample content and provided feedback',
    icon: <FileCheck className="w-4 h-4" />,
    color: 'amber',
  },
  {
    id: 'first_post',
    field: 'first_post_submitted_at',
    label: 'First Post Submitted',
    description: 'Creator submitted their first post on platform',
    icon: <Send className="w-4 h-4" />,
    color: 'green',
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: 'bg-green-500/20' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', icon: 'bg-violet-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'bg-emerald-500/20' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', icon: 'bg-pink-500/20' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'bg-amber-500/20' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: 'bg-cyan-500/20' },
};

const AdminOnboardingChecklist = ({ userId, userName, open, onOpenChange }: AdminOnboardingChecklistProps) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadChecklist();
    }
  }, [userId, open]);

  const loadChecklist = async () => {
    try {
      let { data: checklist, error } = await supabase
        .from('admin_onboarding_checklist')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!checklist) {
        const { data: newChecklist, error: createError } = await supabase
          .from('admin_onboarding_checklist')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) throw createError;
        checklist = newChecklist;
      }

      const mappedItems: ChecklistItem[] = CHECKLIST_CONFIG.map(item => ({
        ...item,
        completedAt: checklist[item.field] || null,
      }));

      setItems(mappedItems);
      setLoading(false);
    } catch (error) {
      console.error('Error loading admin checklist:', error);
      toast.error('Failed to load checklist');
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'],
    });
  };

  const handleToggle = async (field: string, currentValue: string | null, itemId: string) => {
    try {
      const newValue = currentValue ? null : new Date().toISOString();
      const isCompleting = !currentValue;

      const { error } = await supabase
        .from('admin_onboarding_checklist')
        .update({ [field]: newValue, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      // Animate completion
      if (isCompleting) {
        setJustCompleted(itemId);
        setTimeout(() => setJustCompleted(null), 600);
      }

      // Update local state
      const updatedItems = items.map(item =>
        item.field === field ? { ...item, completedAt: newValue } : item
      );
      setItems(updatedItems);

      // Check if all complete
      const allComplete = updatedItems.every(item => item.completedAt);
      if (allComplete && isCompleting) {
        setTimeout(() => {
          triggerConfetti();
          toast.success('🎉 Onboarding complete!');
        }, 300);
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast.error('Failed to update');
    }
  };

  const completedCount = items.filter(item => item.completedAt).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b border-border/50 bg-gradient-to-r from-blue-500/10 via-violet-500/5 to-pink-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/30 to-violet-500/30 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-foreground">
                {userName}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{completedCount}/{totalCount} tasks completed</p>
            </div>
            {completedCount === totalCount && totalCount > 0 && (
              <div className="flex items-center gap-1.5 bg-green-500/20 px-2.5 py-1 rounded-full animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400">Done!</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="py-8 text-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-green-500 transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* Checklist items */}
              <div className="space-y-2">
                {items.map((item, index) => {
                  const colors = colorClasses[item.color];
                  const isJustCompleted = justCompleted === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleToggle(item.field, item.completedAt, item.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200 group ${
                        item.completedAt
                          ? `${colors.bg} ${colors.border} border`
                          : 'bg-secondary/20 hover:bg-secondary/40 border border-transparent hover:border-border/50'
                      } ${isJustCompleted ? 'scale-[1.02]' : ''}`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        transform: isJustCompleted ? 'scale(1.02)' : undefined,
                      }}
                    >
                      {/* Icon container */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        item.completedAt
                          ? `${colors.icon} ${colors.text}`
                          : 'bg-secondary/50 text-muted-foreground group-hover:bg-secondary'
                      }`}>
                        {item.completedAt ? (
                          <CheckCircle2 className={`w-5 h-5 ${isJustCompleted ? 'animate-bounce' : ''}`} />
                        ) : (
                          item.icon
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-base font-medium transition-all ${
                          item.completedAt
                            ? `${colors.text} line-through opacity-80`
                            : 'text-foreground'
                        }`}>
                          {item.label}
                        </p>
                        <p className="text-sm text-muted-foreground/80 mt-0.5">{item.description}</p>
                      </div>

                      {/* Step number */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium ${
                        item.completedAt
                          ? `${colors.bg} ${colors.text}`
                          : 'bg-secondary/50 text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminOnboardingChecklist;
