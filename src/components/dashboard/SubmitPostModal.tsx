import { useState, useEffect } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";

interface SubmitPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitSuccess?: () => void;
}

interface UserAccount {
  id: string;
  handle: string;
  platform: 'tiktok' | 'instagram';
}

const SubmitPostModal = ({ open, onOpenChange, onSubmitSuccess }: SubmitPostModalProps) => {
  const [postUrl, setPostUrl] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const { profile } = useUserProfile();

  // Load user's accounts
  useEffect(() => {
    if (profile) {
      const accounts: UserAccount[] = profile.accounts.map(acc => ({
        id: acc.id,
        handle: acc.handle,
        platform: acc.platform as 'tiktok' | 'instagram',
      }));
      setUserAccounts(accounts);
    }
  }, [profile]);

  // Auto-detect account from TikTok URL
  useEffect(() => {
    if (postUrl.includes('tiktok.com/@')) {
      // Extract handle from URL: https://www.tiktok.com/@username/video/123
      const match = postUrl.match(/tiktok\.com\/@([^\/\?]+)/);
      if (match && match[1]) {
        const handle = match[1];
        // Find matching TikTok account
        const matchingAccount = userAccounts.find(
          acc => acc.platform === 'tiktok' && acc.handle.toLowerCase() === handle.toLowerCase()
        );
        if (matchingAccount) {
          setSelectedAccountId(matchingAccount.id);
        }
      }
    }
  }, [postUrl, userAccounts]);

  const detectPlatform = (url: string): 'tiktok' | 'instagram' | null => {
    // TikTok URL patterns (including short links: vm.tiktok.com, vt.tiktok.com)
    if (url.includes('tiktok.com')) return 'tiktok';

    // Instagram URL patterns (reels, posts, etc)
    if (url.includes('instagram.com')) return 'instagram';

    return null;
  };

  const handleSubmit = async () => {
    if (!postUrl.trim()) {
      toast.error("Please enter a post URL");
      return;
    }

    if (!selectedAccountId) {
      toast.error("Please select an account");
      return;
    }

    if (!profile) {
      toast.error("User profile not loaded");
      return;
    }

    setIsSubmitting(true);

    try {
      // Detect platform from URL
      const platform = detectPlatform(postUrl);
      if (!platform) {
        toast.error("Invalid URL. Please enter a TikTok or Instagram URL");
        setIsSubmitting(false);
        return;
      }

      // Get selected account details
      const selectedAccount = userAccounts.find(acc => acc.id === selectedAccountId);
      if (!selectedAccount) {
        toast.error("Selected account not found");
        setIsSubmitting(false);
        return;
      }

      // Verify platform matches between URL and selected account
      if (platform !== selectedAccount.platform) {
        toast.error(`Platform mismatch: You selected a ${selectedAccount.platform === 'tiktok' ? 'TikTok' : 'Instagram'} account but submitted a ${platform === 'tiktok' ? 'TikTok' : 'Instagram'} URL`);
        setIsSubmitting(false);
        return;
      }

      // Validate TikTok URL is a video post (not a profile)
      if (platform === 'tiktok') {
        // Accept: full video URL OR short links (vm.tiktok.com, vt.tiktok.com)
        const isVideoPost = /tiktok\.com\/@[^\/]+\/video\/\d+/.test(postUrl);
        const isShortLink = /^(https?:\/\/)?(vm|vt)\.tiktok\.com\/[A-Za-z0-9]+\/?/.test(postUrl);
        if (!isVideoPost && !isShortLink) {
          toast.error("Please submit a TikTok video URL, not a profile. Accepted formats: https://www.tiktok.com/@username/video/123 or https://vt.tiktok.com/ABC123");
          setIsSubmitting(false);
          return;
        }
      }

      // Validate Instagram URL is a post/reel (not a profile)
      if (platform === 'instagram') {
        // Must have /p/, /reel/, or /reels/ in the URL to be a post
        const isPost = /instagram\.com\/(p|reel|reels)\/[A-Za-z0-9_-]+/.test(postUrl);
        if (!isPost) {
          toast.error("Please submit an Instagram post/reel URL, not a profile. Expected format: https://www.instagram.com/reel/ABC123 or /p/ABC123");
          setIsSubmitting(false);
          return;
        }
      }

      // All posts are auto-approved after validation
      const isVerified = true;

      // Create post entry with auto-approval
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          account_id: selectedAccountId,
          submitted_by: profile.user.id,
          url: postUrl,
          platform: platform,
          status: isVerified ? 'approved' : 'pending',
          content_type: 'ugc_video',
          notes: notes || null,
        });

      if (postError) throw postError;

      toast.success("Post submitted successfully! Analytics will be fetched at midnight or use 'Fetch Analytics' button.");

      // Send Discord congrats message (fire and forget - don't block on this)
      // Also notifies the admin posts channel with the post URL and Make.com webhook for Notion
      supabase.functions.invoke('discord-send-dm', {
        body: {
          userId: profile.user.id,
          type: 'post_submitted',
          data: {
            postUrl,
            accountHandle: selectedAccount.handle,
            platform,
            notes: notes || '',
          },
        },
      }).catch(err => console.log('Discord DM skipped:', err));

      // Reset form
      setPostUrl("");
      setSelectedAccountId("");
      setNotes("");
      onOpenChange(false);

      // Trigger data refresh without full page reload
      onSubmitSuccess?.();
    } catch (error: any) {
      console.error('Error submitting post:', error);
      toast.error(error.message || "Failed to submit post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-lg bg-card border-border">
        <ResponsiveModalHeader className="text-center">
          <ResponsiveModalTitle className="text-2xl font-bold">Submit your post</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            This will allow us to track all the metrics from this post.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="space-y-5 px-2">
          <div className="space-y-2">
            <Label htmlFor="postUrl" className="text-foreground text-sm">
              Post URL (Required)
            </Label>
            <Input
              id="postUrl"
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              className="bg-secondary border-border h-12"
              placeholder="https://www.instagram.com/p/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHandle" className="text-foreground text-sm">
              Select Account (Required)
            </Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="bg-secondary border-border h-12">
                <SelectValue placeholder="Choose your account" />
              </SelectTrigger>
              <SelectContent>
                {userAccounts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No accounts found. Add accounts in the Account tab.
                  </div>
                ) : (
                  userAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      @{account.handle} ({account.platform === 'tiktok' ? 'TikTok' : 'Instagram'})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              * Account will be auto-selected from TikTok URLs
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-foreground text-sm">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary border-border min-h-[80px] resize-none"
              placeholder=""
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 bg-secondary hover:bg-muted text-foreground font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Next"}
          </Button>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default SubmitPostModal;
