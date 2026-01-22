import { ExternalLink, Eye, Heart, MessageCircle, User, MapPin } from "lucide-react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import assets from "@/assets";

export interface PlatformPost {
  id: string;
  url: string;
  platform: 'tiktok' | 'instagram';
  created_at: string;
  handle: string;
  views: number;
  likes: number;
  comments: number;
  // Creator info
  creatorName?: string;
  creatorGender?: string;
  creatorCountry?: string;
}

interface PlatformPostsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: 'tiktok' | 'instagram';
  posts: PlatformPost[];
  loading: boolean;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const PlatformIcon = ({ platform }: { platform: 'tiktok' | 'instagram' }) => {
  if (platform === 'tiktok') {
    return <img src={assets.icons.tiktok} alt="TikTok" className="w-5 h-5" />;
  }
  return <img src={assets.icons.instagram} alt="Instagram" className="w-5 h-5" />;
};

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    ))}
  </div>
);

const PlatformPostsModal = ({
  open,
  onOpenChange,
  platform,
  posts,
  loading,
}: PlatformPostsModalProps) => {
  const platformName = platform === 'tiktok' ? 'TikTok' : 'Instagram';

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-[900px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <PlatformIcon platform={platform} />
            {platformName} Posts
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {loading ? 'Loading...' : `${posts.length} posts`}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <LoadingSkeleton />
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No {platformName} posts found
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header row */}
              <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border">
                <div className="w-24">Date</div>
                <div className="w-28">Handle</div>
                <div className="w-32 flex items-center gap-1">
                  <User className="w-3 h-3" /> Creator
                </div>
                <div className="w-20 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </div>
                <div className="flex-1" />
                <div className="w-16 text-right flex items-center justify-end gap-1">
                  <Eye className="w-3 h-3" /> Views
                </div>
                <div className="w-14 text-right flex items-center justify-end gap-1">
                  <Heart className="w-3 h-3" /> Likes
                </div>
                <div className="w-14 text-right flex items-center justify-end gap-1">
                  <MessageCircle className="w-3 h-3" />
                </div>
                <div className="w-10" />
              </div>

              {/* Post rows */}
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-24 text-sm text-muted-foreground">
                    {formatDate(post.created_at)}
                  </div>
                  <div className="w-28 text-sm font-medium truncate" title={post.handle}>
                    {post.handle}
                  </div>
                  <div className="w-32 text-sm truncate" title={post.creatorName}>
                    <span className="text-foreground">{post.creatorName || '-'}</span>
                    {post.creatorGender && (
                      <span className="text-muted-foreground text-xs ml-1">
                        ({post.creatorGender === 'male' ? 'M' : post.creatorGender === 'female' ? 'F' : post.creatorGender.charAt(0).toUpperCase()})
                      </span>
                    )}
                  </div>
                  <div className="w-20 text-sm text-muted-foreground truncate" title={post.creatorCountry}>
                    {post.creatorCountry || '-'}
                  </div>
                  <div className="flex-1" />
                  <div className="w-16 text-right text-sm font-semibold text-green-400">
                    {formatNumber(post.views)}
                  </div>
                  <div className="w-14 text-right text-sm text-muted-foreground">
                    {formatNumber(post.likes)}
                  </div>
                  <div className="w-14 text-right text-sm text-muted-foreground">
                    {formatNumber(post.comments)}
                  </div>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 flex items-center justify-center p-2 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    title="Open post"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default PlatformPostsModal;
