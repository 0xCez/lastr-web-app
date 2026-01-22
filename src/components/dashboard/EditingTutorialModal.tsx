import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import { Video } from "lucide-react";
import { useState, useEffect } from "react";

interface EditingTutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Base Loom embed URL - we add ?hide_share=true to hide share button
const LOOM_VIDEO_ID = "1c686478681341039294ffb0ea4bc564";

const EditingTutorialModal = ({ open, onOpenChange }: EditingTutorialModalProps) => {
  // Use a key to force iframe remount when modal opens/closes
  // This ensures video stops when modal closes and doesn't autoplay
  const [iframeKey, setIframeKey] = useState(0);

  // Reset iframe when modal opens to ensure fresh load
  useEffect(() => {
    if (open) {
      setIframeKey(prev => prev + 1);
    }
  }, [open]);

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-3xl bg-card border-border p-0 overflow-hidden">
        <ResponsiveModalHeader className="p-4 md:p-5 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
          <ResponsiveModalTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            How to Edit Bet.AI Videos
          </ResponsiveModalTitle>
          <ResponsiveModalDescription className="text-sm">
            Quick tutorial on editing engaging videos in under 20 seconds
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="p-4 md:p-5">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            {/* Only render iframe when modal is open - this stops video when closed */}
            {open && (
              <iframe
                key={iframeKey}
                src={`https://www.loom.com/embed/${LOOM_VIDEO_ID}?hide_share=true&hideEmbedTopBar=true`}
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-lg border-0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
          </div>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default EditingTutorialModal;
