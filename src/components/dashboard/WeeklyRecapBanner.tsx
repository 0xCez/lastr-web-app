import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WeeklyRecapBannerProps {
  visible: boolean;
  onView: () => void;
  onDismiss: () => void;
}

const WeeklyRecapBanner = ({ visible, onView, onDismiss }: WeeklyRecapBannerProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="mx-3 md:mx-6 mt-3 md:mt-4"
        >
          {/* Mobile: Compact inline notification bar */}
          <div className="md:hidden">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-primary/15 to-purple-500/15 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-foreground flex-1">Weekly Recap Ready</span>
              <Button
                onClick={onView}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
              >
                View
              </Button>
              <button
                onClick={onDismiss}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Desktop: Full banner with description */}
          <div className="hidden md:block">
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border border-primary/30 p-4">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/20">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Weekly Recap is Ready!</h3>
                    <p className="text-sm text-muted-foreground">
                      See how your team performed last week
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={onView} size="sm" className="gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    View Recap
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDismiss}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WeeklyRecapBanner;
