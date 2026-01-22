import { useEffect, useState } from "react";
import { Trophy, Star, Sparkles, ChevronRight } from "lucide-react";
import confetti from "canvas-confetti";

interface LevelCompletionModalProps {
  isOpen: boolean;
  level: number;
  onClose: () => void;
  nextLevelPreview?: string[];
}

const LevelCompletionModal = ({ isOpen, level, onClose, nextLevelPreview }: LevelCompletionModalProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay content appearance for dramatic effect
      setTimeout(() => setShowContent(true), 300);

      // Epic confetti celebration
      const duration = 4000;
      const end = Date.now() + duration;

      const colors = ['#FFD700', '#FFA500', '#FF6347', '#9333EA', '#3B82F6'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      // Big burst in the middle
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5, x: 0.5 },
          colors: colors
        });
      }, 500);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative z-10 max-w-md w-full mx-4 transition-all duration-500 ${
        showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}>
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-2xl blur-xl animate-pulse" />

        <div className="relative glass-card p-8 rounded-2xl border-2 border-primary/50 overflow-hidden">
          {/* Animated sparkles background */}
          <div className="absolute inset-0 overflow-hidden">
            <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute top-8 right-8 w-4 h-4 text-yellow-300 animate-pulse delay-100" />
            <Sparkles className="absolute bottom-12 left-8 w-5 h-5 text-orange-400 animate-pulse delay-200" />
            <Sparkles className="absolute bottom-8 right-4 w-6 h-6 text-yellow-400 animate-pulse delay-300" />
            <Star className="absolute top-16 left-1/4 w-4 h-4 text-primary/50 animate-spin-slow" />
            <Star className="absolute bottom-20 right-1/4 w-3 h-3 text-purple-400/50 animate-spin-slow" />
          </div>

          {/* Content */}
          <div className="relative text-center">
            {/* Trophy Icon with glow */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
                <Trophy className="w-12 h-12 text-white drop-shadow-lg" />
              </div>
            </div>

            {/* Level Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 rounded-full border border-primary/40 mb-4">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-primary">LEVEL {level}</span>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>

            {/* Main Text */}
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              COMPLETE!
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              You've unlocked all Level {level} milestones!
            </p>

            {/* Stats or next level preview */}
            {nextLevelPreview && nextLevelPreview.length > 0 && (
              <div className="bg-secondary/30 rounded-xl p-4 mb-6 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Next up: Level {level + 1}
                </p>
                <div className="space-y-1">
                  {nextLevelPreview.map((milestone, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-foreground/80">
                      <ChevronRight className="w-3 h-3 text-primary" />
                      {milestone}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-gradient-to-r from-primary to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              {nextLevelPreview && nextLevelPreview.length > 0 ? "Let's Go!" : "Amazing!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelCompletionModal;
