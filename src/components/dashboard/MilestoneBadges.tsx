import { useState, useEffect } from "react";
import { DollarSign, Video, Zap, Award, Lock, Target, Crown, Gem, Flame } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import LevelCompletionModal from "./LevelCompletionModal";

interface Milestone {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  achieved: boolean;
  achievedAt?: string;
  type: string;
  targetValue: number;
  currentValue: number;
  level: number;
}

interface MilestoneBadgesProps {
  userId: string;
}

// Define milestone levels
const MILESTONE_LEVELS = {
  1: {
    name: "Starter",
    color: "from-blue-500 to-cyan-500",
    milestones: ['first_100_cpm', 'first_viral_post', '10_posts_approved', '1k_club'],
  },
  2: {
    name: "Pro Creator",
    color: "from-purple-500 to-pink-500",
    milestones: ['5k_club', '3_viral_posts', '50_posts_approved', '10k_club'],
  },
};

const MilestoneBadges = ({ userId }: MilestoneBadgesProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setCompletedLevels] = useState<number[]>([]);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [completedLevel, setCompletedLevel] = useState<number>(0);

  useEffect(() => {
    loadMilestones();
  }, [userId]);

  const loadMilestones = async () => {
    try {
      // Fetch user's achieved milestones
      const { data: achievedMilestones, error: milestonesError } = await supabase
        .from('user_milestones')
        .select('*')
        .eq('user_id', userId);

      if (milestonesError) throw milestonesError;

      // Fetch user's posts (correct column: submitted_by)
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, viral_alert_message, analytics(views)')
        .eq('submitted_by', userId)
        .eq('status', 'approved');

      if (postsError) throw postsError;

      const totalPosts = posts?.length || 0;

      // Count viral posts (posts with viral alerts)
      const viralPostsCount = posts?.filter(p => p.viral_alert_message).length || 0;

      // Fetch actual CPM earnings from cpm_post_breakdown
      const { data: cpmRecords, error: cpmError } = await supabase
        .from('cpm_post_breakdown')
        .select('cpm_earned')
        .eq('user_id', userId);

      if (cpmError) throw cpmError;

      const totalEarnings = cpmRecords?.reduce((sum, r) => sum + Number(r.cpm_earned), 0) || 0;

      // Fetch completed levels
      const { data: levelData } = await supabase
        .from('user_milestones')
        .select('milestone_type')
        .eq('user_id', userId)
        .like('milestone_type', 'level_%_complete');

      const completedLevelsList = levelData?.map(l =>
        parseInt(l.milestone_type.replace('level_', '').replace('_complete', ''))
      ) || [];
      setCompletedLevels(completedLevelsList);

      // Define all possible milestones with levels
      const allMilestones: Milestone[] = [
        // Level 1 - Starter milestones
        {
          id: 'first_100_cpm',
          icon: <DollarSign className="w-5 h-5" />,
          label: 'First $100',
          description: 'Earned $100 in CPM',
          achieved: achievedMilestones?.some(m => m.milestone_type === 'first_100_cpm') || totalEarnings >= 100,
          achievedAt: achievedMilestones?.find(m => m.milestone_type === 'first_100_cpm')?.achieved_at,
          type: 'first_100_cpm',
          targetValue: 100,
          currentValue: totalEarnings,
          level: 1,
        },
        {
          id: 'first_viral_post',
          icon: <Zap className="w-5 h-5" />,
          label: 'First Viral',
          description: 'Got your first viral post',
          achieved: achievedMilestones?.some(m => m.milestone_type === 'first_viral_post') || viralPostsCount >= 1,
          achievedAt: achievedMilestones?.find(m => m.milestone_type === 'first_viral_post')?.achieved_at,
          type: 'first_viral_post',
          targetValue: 1,
          currentValue: viralPostsCount,
          level: 1,
        },
        {
          id: '10_posts_approved',
          icon: <Video className="w-5 h-5" />,
          label: '10 Posts',
          description: 'Got 10 posts approved',
          achieved: achievedMilestones?.some(m => m.milestone_type === '10_posts_approved') || totalPosts >= 10,
          achievedAt: achievedMilestones?.find(m => m.milestone_type === '10_posts_approved')?.achieved_at,
          type: '10_posts_approved',
          targetValue: 10,
          currentValue: totalPosts,
          level: 1,
        },
        {
          id: '1k_club',
          icon: <Award className="w-5 h-5" />,
          label: '$1K Club',
          description: 'Earned $1,000 in CPM',
          achieved: achievedMilestones?.some(m => m.milestone_type === '1k_club') || totalEarnings >= 1000,
          achievedAt: achievedMilestones?.find(m => m.milestone_type === '1k_club')?.achieved_at,
          type: '1k_club',
          targetValue: 1000,
          currentValue: totalEarnings,
          level: 1,
        },

        // Level 2 - Pro Creator milestones
        {
          id: '5k_club',
          icon: <Gem className="w-5 h-5" />,
          label: '$5K Club',
          description: 'Earned $5,000 in CPM',
          achieved: achievedMilestones?.some(m => m.milestone_type === '5k_club') || totalEarnings >= 5000,
          achievedAt: achievedMilestones?.find(m => m.milestone_type === '5k_club')?.achieved_at,
          type: '5k_club',
          targetValue: 5000,
          currentValue: totalEarnings,
          level: 2,
        },
        {
          id: '3_viral_posts',
          icon: <Flame className="w-5 h-5" />,
          label: '3x Viral',
          description: 'Got 3 viral posts',
          achieved: achievedMilestones?.some(m => m.milestone_type === '3_viral_posts') || viralPostsCount >= 3,
          achievedAt: achievedMilestones?.find(m => m.milestone_type === '3_viral_posts')?.achieved_at,
          type: '3_viral_posts',
          targetValue: 3,
          currentValue: viralPostsCount,
          level: 2,
        },
        {
          id: '50_posts_approved',
          icon: <Target className="w-5 h-5" />,
          label: '50 Posts',
          description: 'Got 50 posts approved',
          achieved: achievedMilestones?.some(m => m.milestone_type === '50_posts_approved') || totalPosts >= 50,
          achievedAt: achievedMilestones?.find(m => m.milestone_type === '50_posts_approved')?.achieved_at,
          type: '50_posts_approved',
          targetValue: 50,
          currentValue: totalPosts,
          level: 2,
        },
        {
          id: '10k_club',
          icon: <Crown className="w-5 h-5" />,
          label: '$10K Club',
          description: 'Earned $10,000 in CPM',
          achieved: achievedMilestones?.some(m => m.milestone_type === '10k_club') || totalEarnings >= 10000,
          achievedAt: achievedMilestones?.find(m => m.milestone_type === '10k_club')?.achieved_at,
          type: '10k_club',
          targetValue: 10000,
          currentValue: totalEarnings,
          level: 2,
        },
      ];

      setMilestones(allMilestones);
      setLoading(false);

      // Check for newly achieved milestones and create them
      for (const milestone of allMilestones) {
        const alreadyRecorded = achievedMilestones?.some(m => m.milestone_type === milestone.type);
        if (milestone.achieved && !alreadyRecorded && milestone.currentValue >= milestone.targetValue) {
          await createMilestone(milestone.type, milestone.targetValue);
        }
      }

      // Check for level completions
      for (const [levelNum] of Object.entries(MILESTONE_LEVELS)) {
        const level = parseInt(levelNum);
        const levelMilestones = allMilestones.filter(m => m.level === level);
        const allLevelAchieved = levelMilestones.every(m => m.achieved);
        const levelAlreadyComplete = completedLevelsList.includes(level);

        if (allLevelAchieved && !levelAlreadyComplete) {
          // Record level completion
          await createLevelCompletion(level);
          // Show celebration modal
          setCompletedLevel(level);
          setShowLevelComplete(true);
        }
      }
    } catch (error) {
      console.error('Error loading milestones:', error);
      setLoading(false);
    }
  };

  const createMilestone = async (milestoneType: string, value: number) => {
    try {
      const { error } = await supabase
        .from('user_milestones')
        .insert({
          user_id: userId,
          milestone_type: milestoneType,
          milestone_value: value,
        });

      if (error) throw error;

      // Trigger small celebration for individual milestone
      triggerMilestoneConfetti();
      toast.success('New milestone unlocked!', {
        duration: 3000,
      });

    } catch (error: any) {
      // Ignore duplicate key errors (milestone already exists)
      if (!error.message?.includes('duplicate key')) {
        console.error('Error creating milestone:', error);
      }
    }
  };

  const createLevelCompletion = async (level: number) => {
    try {
      const { error } = await supabase
        .from('user_milestones')
        .insert({
          user_id: userId,
          milestone_type: `level_${level}_complete`,
          milestone_value: level,
        });

      if (error) throw error;
      setCompletedLevels(prev => [...prev, level]);
    } catch (error: any) {
      if (!error.message?.includes('duplicate key')) {
        console.error('Error creating level completion:', error);
      }
    }
  };

  const triggerMilestoneConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347'],
    });
  };

  const getNextLevelPreview = (currentLevel: number): string[] => {
    const nextLevel = currentLevel + 1;
    const nextLevelMilestones = milestones.filter(m => m.level === nextLevel);
    return nextLevelMilestones.map(m => m.label);
  };

  if (loading) {
    return null;
  }

  // Get current active level (first incomplete level)
  const level1Milestones = milestones.filter(m => m.level === 1);
  const level2Milestones = milestones.filter(m => m.level === 2);
  const level1Complete = level1Milestones.every(m => m.achieved);
  const currentLevel = level1Complete ? 2 : 1;

  const currentLevelMilestones = currentLevel === 1 ? level1Milestones : level2Milestones;

  return (
    <>
      <div className="glass-card p-3 h-full flex flex-col justify-center">
        {/* Milestone Badges Only */}
        <div className="grid grid-cols-4 gap-2">
          {currentLevelMilestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`relative p-2.5 rounded-xl border transition-all ${
                milestone.achieved
                  ? 'bg-primary/10 border-primary/30 hover:bg-primary/15'
                  : 'bg-secondary/30 border-border/50 opacity-70'
              }`}
              title={milestone.description}
            >
              {/* Badge Icon */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-1.5 ${
                milestone.achieved
                  ? 'bg-primary/20 text-primary'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {milestone.achieved ? (
                  <span className="[&>svg]:w-4 [&>svg]:h-4">{milestone.icon}</span>
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>

              {/* Label */}
              <p className={`text-xs font-semibold text-center ${
                milestone.achieved ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {milestone.label}
              </p>

              {/* Progress hint for locked milestones */}
              {!milestone.achieved && milestone.currentValue > 0 && (
                <p className="text-[10px] text-muted-foreground text-center mt-0.5">
                  {milestone.type.includes('cpm') || milestone.type.includes('club')
                    ? `$${Math.round(milestone.currentValue)}/$${milestone.targetValue}`
                    : `${Math.round(milestone.currentValue)}/${milestone.targetValue}`
                  }
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Level Completion Modal */}
      <LevelCompletionModal
        isOpen={showLevelComplete}
        level={completedLevel}
        onClose={() => setShowLevelComplete(false)}
        nextLevelPreview={completedLevel < Object.keys(MILESTONE_LEVELS).length ? getNextLevelPreview(completedLevel) : undefined}
      />
    </>
  );
};

export default MilestoneBadges;
