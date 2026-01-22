import { CheckCircle2, Smartphone, AtSign, FileCheck, Send, Mic } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Discord logo SVG component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

// Step configuration matching AdminOnboardingChecklist
const STEPS = [
  {
    id: 'discord_joined',
    field: 'discord_scheduled_at',
    label: 'Discord',
    fullLabel: 'Joined Discord',
    icon: DiscordIcon,
    color: 'violet',
  },
  {
    id: 'voice_note_sent',
    field: 'voice_note_sent_at',
    label: 'Voice',
    fullLabel: 'Voice Note Sent',
    icon: Mic,
    color: 'pink',
  },
  {
    id: 'accounts_created',
    field: 'handles_verified_at',
    label: 'Accounts',
    fullLabel: 'TT & IG Created',
    icon: AtSign,
    color: 'cyan',
  },
  {
    id: 'app_access_sent',
    field: 'app_access_at',
    label: 'App',
    fullLabel: 'TestFlight Sent',
    icon: Smartphone,
    color: 'emerald',
  },
  {
    id: 'content_feedback',
    field: 'content_validated_at',
    label: 'Feedback',
    fullLabel: 'Content Feedback',
    icon: FileCheck,
    color: 'amber',
  },
  {
    id: 'first_post',
    field: 'first_post_submitted_at',
    label: 'Post',
    fullLabel: 'First Post',
    icon: Send,
    color: 'green',
  },
];

const colorMap: Record<string, { completed: string; current: string; pending: string }> = {
  violet: {
    completed: 'bg-violet-500 text-white',
    current: 'bg-violet-500/30 text-violet-400 ring-2 ring-violet-500/50 animate-pulse',
    pending: 'bg-secondary/50 text-muted-foreground/40',
  },
  pink: {
    completed: 'bg-pink-500 text-white',
    current: 'bg-pink-500/30 text-pink-400 ring-2 ring-pink-500/50 animate-pulse',
    pending: 'bg-secondary/50 text-muted-foreground/40',
  },
  cyan: {
    completed: 'bg-cyan-500 text-white',
    current: 'bg-cyan-500/30 text-cyan-400 ring-2 ring-cyan-500/50 animate-pulse',
    pending: 'bg-secondary/50 text-muted-foreground/40',
  },
  emerald: {
    completed: 'bg-emerald-500 text-white',
    current: 'bg-emerald-500/30 text-emerald-400 ring-2 ring-emerald-500/50 animate-pulse',
    pending: 'bg-secondary/50 text-muted-foreground/40',
  },
  amber: {
    completed: 'bg-amber-500 text-white',
    current: 'bg-amber-500/30 text-amber-400 ring-2 ring-amber-500/50 animate-pulse',
    pending: 'bg-secondary/50 text-muted-foreground/40',
  },
  green: {
    completed: 'bg-green-500 text-white',
    current: 'bg-green-500/30 text-green-400 ring-2 ring-green-500/50 animate-pulse',
    pending: 'bg-secondary/50 text-muted-foreground/40',
  },
};

interface ChecklistData {
  discord_scheduled_at?: string | null;
  voice_note_sent_at?: string | null;
  handles_verified_at?: string | null;
  app_access_at?: string | null;
  content_validated_at?: string | null;
  first_post_submitted_at?: string | null;
}

interface OnboardingStepDotsProps {
  checklist: ChecklistData | null;
  onClick?: () => void;
}

export const OnboardingStepDots = ({ checklist, onClick }: OnboardingStepDotsProps) => {
  // Determine completion status for each step
  const stepStatuses = STEPS.map((step, index) => {
    const isCompleted = checklist && (checklist as any)[step.field];

    // Find first incomplete step (current step)
    const firstIncompleteIndex = STEPS.findIndex(
      (s) => !checklist || !(checklist as any)[s.field]
    );
    const isCurrent = index === firstIncompleteIndex;

    return {
      ...step,
      isCompleted: !!isCompleted,
      isCurrent,
    };
  });

  const completedCount = stepStatuses.filter(s => s.isCompleted).length;
  const allComplete = completedCount === STEPS.length;

  return (
    <TooltipProvider delayDuration={200}>
      <button
        onClick={onClick}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
          allComplete
            ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/30'
            : 'bg-secondary/30 hover:bg-secondary/50 border border-border/30'
        }`}
      >
        {stepStatuses.map((step) => {
          const Icon = step.icon;
          const colors = colorMap[step.color];
          const statusClass = step.isCompleted
            ? colors.completed
            : step.isCurrent
            ? colors.current
            : colors.pending;

          return (
            <Tooltip key={step.id}>
              <TooltipTrigger asChild>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${statusClass}`}
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">{step.fullLabel}</p>
                <p className="text-muted-foreground">
                  {step.isCompleted ? '✓ Complete' : step.isCurrent ? '→ Current step' : 'Pending'}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Completion indicator */}
        {allComplete && (
          <span className="ml-1 text-xs font-medium text-green-400">✓</span>
        )}
      </button>
    </TooltipProvider>
  );
};

export default OnboardingStepDots;
