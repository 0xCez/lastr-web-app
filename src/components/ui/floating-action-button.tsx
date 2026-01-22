import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FloatingAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

interface FloatingActionButtonProps {
  actions: FloatingAction[];
  mainIcon?: React.ReactNode;
  className?: string;
}

/**
 * FloatingActionButton - Mobile-friendly FAB with expandable actions
 *
 * Usage:
 * ```tsx
 * <FloatingActionButton
 *   actions={[
 *     { icon: <Plus />, label: "Submit Post", onClick: () => setOpen(true) },
 *     { icon: <FileText />, label: "Scripts", onClick: () => setScriptsOpen(true) },
 *   ]}
 * />
 * ```
 */
const FloatingActionButton = ({
  actions,
  mainIcon,
  className,
}: FloatingActionButtonProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Close on scroll
  React.useEffect(() => {
    const handleScroll = () => {
      if (isExpanded) setIsExpanded(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isExpanded]);

  // If only one action, make it a direct click
  const isSingleAction = actions.length === 1;

  const handleMainClick = () => {
    if (isSingleAction) {
      actions[0].onClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <>
      {/* Backdrop overlay when expanded */}
      <AnimatePresence>
        {isExpanded && !isSingleAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div
        className={cn(
          "fixed bottom-safe right-safe z-50 flex flex-col-reverse items-end gap-3 md:hidden",
          className
        )}
      >
        {/* Expanded Actions */}
        <AnimatePresence>
          {isExpanded && !isSingleAction && (
            <>
              {actions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { delay: index * 0.05 },
                  }}
                  exit={{
                    opacity: 0,
                    y: 20,
                    scale: 0.8,
                    transition: { delay: (actions.length - index - 1) * 0.03 },
                  }}
                  className="flex items-center gap-3"
                >
                  {/* Label */}
                  <span className="bg-card border border-border px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap">
                    {action.label}
                  </span>

                  {/* Mini FAB */}
                  <Button
                    size="icon"
                    onClick={() => {
                      action.onClick();
                      setIsExpanded(false);
                    }}
                    className={cn(
                      "h-12 w-12 rounded-full shadow-lg",
                      action.className || "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {action.icon}
                  </Button>
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            onClick={handleMainClick}
            className={cn(
              "h-14 w-14 rounded-full shadow-xl",
              isExpanded
                ? "bg-secondary hover:bg-secondary/80"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {mainIcon || <Plus className="h-6 w-6" />}
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export { FloatingActionButton };
export type { FloatingAction };
