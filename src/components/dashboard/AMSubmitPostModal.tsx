import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Loader2 } from "lucide-react";

type SlideshowFormat = 'tips' | 'story' | 'reasons' | 'myth' | 'killing' | 'pov';

interface AMSubmitPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitSuccess?: () => void;
}

const AMSubmitPostModal = ({ open, onOpenChange, onSubmitSuccess }: AMSubmitPostModalProps) => {
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [slideshowFormat, setSlideshowFormat] = useState<SlideshowFormat>('tips');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile } = useUserProfile();

  const validateTikTokUrl = (url: string): boolean => {
    return url.includes('tiktok.com') || url.includes('vm.tiktok.com');
  };

  const handleSubmit = async () => {
    // Validation
    if (!tiktokUrl.trim()) {
      toast.error("Please enter a TikTok URL");
      return;
    }

    if (!validateTikTokUrl(tiktokUrl)) {
      toast.error("Invalid TikTok URL");
      return;
    }

    if (!profile) {
      toast.error("User profile not loaded");
      return;
    }

    // Get user's TikTok account
    const tiktokAccount = profile.accounts.find(acc => acc.platform === 'tiktok');

    if (!tiktokAccount) {
      toast.error("Please add your TikTok account first");
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert TikTok post
      const { error } = await supabase
        .from('posts')
        .insert({
          account_id: tiktokAccount.id,
          submitted_by: profile.user.id,
          url: tiktokUrl,
          platform: 'tiktok',
          status: 'approved',
          content_type: 'slideshow',
          slideshow_format: slideshowFormat,
        });

      if (error) throw error;

      toast.success("Post submitted successfully!");

      // Reset form
      setTiktokUrl("");
      setSlideshowFormat('tips');
      onOpenChange(false);

      // Trigger data refresh without full page reload
      onSubmitSuccess?.();
    } catch (error: any) {
      console.error('Error submitting slideshow:', error);
      toast.error(error.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Submit Post</h2>
          <p className="text-muted-foreground text-sm">
            Enter your TikTok URL for your slideshow post.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground text-sm">
              Slideshow Format
            </Label>
            <Select value={slideshowFormat} onValueChange={(v: SlideshowFormat) => setSlideshowFormat(v)}>
              <SelectTrigger className="bg-secondary border-border h-12">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tips">Tips (Instructive)</SelectItem>
                <SelectItem value="story">Story (Emotional)</SelectItem>
                <SelectItem value="reasons">Reasons (Reflective)</SelectItem>
                <SelectItem value="myth">Myth Buster (Educational)</SelectItem>
                <SelectItem value="killing">Killing You (Wake-up)</SelectItem>
                <SelectItem value="pov">POV (Aspirational)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktokUrl" className="text-foreground text-sm">
              TikTok URL
            </Label>
            <Input
              id="tiktokUrl"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              className="bg-secondary border-border h-12"
              placeholder="https://www.tiktok.com/@username/video/..."
            />
          </div>


          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Slideshow"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AMSubmitPostModal;
