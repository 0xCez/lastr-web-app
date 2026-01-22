import { useState, useEffect } from "react";
import { Flame, Trophy, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface StreakTrackerProps {
  userId: string;
}

// Define milestone levels
const MILESTONE_LEVELS = {
  1: {
    name: "Starter",
    color: "from-blue-500 to-cyan-500",
  },
  2: {
    name: "Pro Creator",
    color: "from-purple-500 to-pink-500",
  },
};

const StreakTracker = ({ userId }: StreakTrackerProps) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [achievedInLevel, setAchievedInLevel] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      // Load streak data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('current_streak, longest_streak')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      setCurrentStreak(user?.current_streak || 0);
      setLongestStreak(user?.longest_streak || 0);

      // Load milestone data for level calculation
      const { data: achievedMilestones } = await supabase
        .from('user_milestones')
        .select('milestone_type')
        .eq('user_id', userId);

      const { data: posts } = await supabase
        .from('posts')
        .select('id, viral_alert_message')
        .eq('submitted_by', userId)
        .eq('status', 'approved');

      const totalPosts = posts?.length || 0;
      const viralPostsCount = posts?.filter(p => p.viral_alert_message).length || 0;

      const { data: cpmRecords } = await supabase
        .from('cpm_post_breakdown')
        .select('cpm_earned')
        .eq('user_id', userId);

      const totalEarnings = cpmRecords?.reduce((sum, r) => sum + Number(r.cpm_earned), 0) || 0;

      // Calculate level 1 achievements
      const level1Achieved = [
        achievedMilestones?.some(m => m.milestone_type === 'first_100_cpm') || totalEarnings >= 100,
        achievedMilestones?.some(m => m.milestone_type === 'first_viral_post') || viralPostsCount >= 1,
        achievedMilestones?.some(m => m.milestone_type === '10_posts_approved') || totalPosts >= 10,
        achievedMilestones?.some(m => m.milestone_type === '1k_club') || totalEarnings >= 1000,
      ].filter(Boolean).length;

      // Calculate level 2 achievements
      const level2Achieved = [
        achievedMilestones?.some(m => m.milestone_type === '5k_club') || totalEarnings >= 5000,
        achievedMilestones?.some(m => m.milestone_type === '3_viral_posts') || viralPostsCount >= 3,
        achievedMilestones?.some(m => m.milestone_type === '50_posts_approved') || totalPosts >= 50,
        achievedMilestones?.some(m => m.milestone_type === '10k_club') || totalEarnings >= 10000,
      ].filter(Boolean).length;

      const level1Complete = level1Achieved === 4;
      const activeLevel = level1Complete ? 2 : 1;

      setCurrentLevel(activeLevel);
      setAchievedInLevel(activeLevel === 1 ? level1Achieved : level2Achieved);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  const currentLevelConfig = MILESTONE_LEVELS[currentLevel as keyof typeof MILESTONE_LEVELS];
  const percentage = Math.round((achievedInLevel / 4) * 100);

  return (
    <div className="glass-card p-2 h-full flex flex-col">
      {/* Level Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentLevelConfig.color} flex items-center justify-center`}>
            {currentLevel === 1 ? (
              <Trophy className="w-4 h-4 text-white" />
            ) : (
              <Crown className="w-4 h-4 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-foreground">Level {currentLevel}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                {currentLevelConfig.name}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">{achievedInLevel}/4 milestones</p>
          </div>
        </div>
        {/* Progress Ring */}
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90">
            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-secondary" />
            <circle
              cx="20" cy="20" r="16"
              stroke="url(#streakLevelGradient)"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray={`${(achievedInLevel / 4) * 100.5} 100.5`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="streakLevelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={currentLevel === 1 ? "#3b82f6" : "#a855f7"} />
                <stop offset="100%" stopColor={currentLevel === 1 ? "#06b6d4" : "#ec4899"} />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/30 my-1.5" />

      {/* Streak Section */}
      <div className="flex items-center justify-between flex-1">
        {/* Current Streak */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            currentStreak > 0 ? 'bg-orange-500/20' : 'bg-secondary'
          }`}>
            <Flame className={`w-4 h-4 ${
              currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'
            }`} />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-foreground">{currentStreak}</span>
              {currentStreak > 0 && <Flame className="w-3 h-3 text-orange-500 animate-pulse" />}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {currentStreak === 0 ? 'Start streak' : 'Day streak'}
            </p>
          </div>
        </div>

        {/* Longest Streak */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
          <Trophy className="w-3.5 h-3.5 text-primary" />
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground">Best</p>
            <p className="text-sm font-bold text-primary">{longestStreak}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakTracker;
