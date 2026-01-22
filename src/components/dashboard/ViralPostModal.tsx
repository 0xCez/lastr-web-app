import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, MessageCircle, Share2, Bookmark, BarChart3, Eye } from "lucide-react";

interface ViralPostData {
  handle: string;
  caption: string;
  uploadDate: string;
  views: string;
  engagement: string;
  likes: string;
  comments: string;
  shares: string;
  bookmarks: string;
  engagementRate: string;
}

interface ViralPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postUrl?: string;
  postData?: ViralPostData;
}

const ViralPostModal = ({ open, onOpenChange, postUrl, postData }: ViralPostModalProps) => {
  // Use real data if provided, otherwise use defaults
  const stats = [
    { icon: Eye, label: "Views", value: postData?.views || "0" },
    { icon: BarChart3, label: "Engagement", value: postData?.engagement || "0" },
    { icon: Heart, label: "Likes", value: postData?.likes || "0" },
    { icon: MessageCircle, label: "Comments", value: postData?.comments || "0" },
    { icon: Share2, label: "Shares", value: postData?.shares || "0" },
    { icon: Bookmark, label: "Bookmarks", value: postData?.bookmarks || "0" },
    { icon: BarChart3, label: "Eng. Rate", value: postData?.engagementRate || "0%" },
  ];

  const handleGoToPost = () => {
    if (postUrl) {
      window.open(postUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            Viral Post <span>🎾</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 pt-2">
          <div className="flex gap-4">
            {/* Phone mockup */}
            <div className="flex-shrink-0">
              <div className="w-32 h-56 bg-secondary rounded-2xl border-4 border-muted flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-b from-muted to-secondary flex items-center justify-center">
                  <div className="text-4xl">📱</div>
                </div>
              </div>
            </div>
            
            {/* Post details */}
            <div className="flex-1 space-y-3">
              {/* Creator info */}
              <div className="flex items-center gap-2">
                <span className="text-primary font-medium">@{postData?.handle || "unknown"}</span>
                <span className="text-muted-foreground">♪</span>
              </div>

              {/* Caption */}
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {postData?.caption || "No caption available"}
              </p>

              <p className="text-xs text-muted-foreground">
                Uploaded on {postData?.uploadDate || "Unknown date"}
              </p>
              
              {/* Stats */}
              <div className="space-y-2 pt-2">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <span className="text-sm text-foreground font-medium">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Go to post button */}
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              className="gap-2 border-border hover:bg-muted"
              onClick={handleGoToPost}
              disabled={!postUrl}
            >
              Go to post <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViralPostModal;
