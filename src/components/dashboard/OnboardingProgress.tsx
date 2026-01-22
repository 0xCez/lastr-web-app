import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  userId: string;
  onClick?: () => void;
  refreshTrigger?: number;
}

const OnboardingProgress = ({ userId, onClick, refreshTrigger }: OnboardingProgressProps) => {
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [userId, refreshTrigger]);

  const loadProgress = async () => {
    try {
      const { data: checklist } = await supabase
        .from('onboarding_checklist')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!checklist) {
        setProgress(0);
        setCompletedCount(0);
        setLoading(false);
        return;
      }

      // Count completed items
      const completedItems = [
        (checklist as any).contract_signed_at,
        checklist.watched_examples_at,
        checklist.joined_discord_at,
        (checklist as any).accounts_created_at,
        checklist.warmup_started_at,
        checklist.watched_tutorial_at,
        checklist.posted_first_video_at,
        checklist.submitted_first_link_at,
      ].filter(Boolean).length;

      const totalItems = 8;
      const progressPercentage = (completedItems / totalItems) * 100;

      setCompletedCount(completedItems);
      setProgress(progressPercentage);
      setLoading(false);
    } catch (error) {
      console.error('Error loading progress:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  const isCompleted = progress === 100;

  return (
    <div
      className={`glass-card p-3 h-full cursor-pointer hover:border-primary/40 transition-all ${
        isCompleted
          ? 'bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30'
          : 'bg-gradient-to-br from-primary/10 to-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isCompleted ? 'bg-green-500/20' : 'bg-primary/20'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              {isCompleted ? 'Onboarding Complete' : 'Onboarding'}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {isCompleted ? 'All set!' : 'Get started'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-lg font-bold ${isCompleted ? 'text-green-500' : 'text-primary'}`}>
            {completedCount}
          </span>
          <span className="text-sm text-muted-foreground">/8</span>
        </div>
      </div>

      <Progress value={progress} className="h-2 mb-2" />

      <p className="text-xs text-muted-foreground">
        Click to view checklist
      </p>
    </div>
  );
};

export default OnboardingProgress;
