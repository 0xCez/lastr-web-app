import { useState, useRef } from "react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image, Zap, CheckCircle2, Lightbulb, ThumbsUp, ThumbsDown, Upload, ExternalLink, Play, Smartphone, Download, Copy } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SlideshowGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Video player component
const VideoEmbed = ({ videoSrc, className }: { videoSrc: string; className?: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-secondary/50 ${className || "w-full max-w-[300px]"}`}
      onClick={handleVideoClick}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/80 z-10">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        onLoadedData={() => setIsLoading(false)}
      />
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
};

const SlideshowGuideModal = ({ open, onOpenChange }: SlideshowGuideModalProps) => {
  const isMobile = useIsMobile();

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-4xl bg-card border-border p-0 overflow-hidden max-h-[90vh]">
        <ResponsiveModalHeader className="p-4 md:p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5">
          <ResponsiveModalTitle className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Image className="w-6 h-6 md:w-7 md:h-7 text-emerald-500" />
            Slideshow Content Guide
          </ResponsiveModalTitle>
          <ResponsiveModalDescription className="text-sm md:text-base mt-2">
            Create viral TikTok slideshows in minutes
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <ScrollArea className={isMobile ? "h-[60vh]" : "h-[calc(90vh-140px)]"}>
          <div className="p-6 space-y-6">
            {/* Tutorial Video */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Play className="w-5 h-5 text-emerald-500" />
                Tutorial Video
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-5">
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Watch this video to learn how to edit a slideshow on TikTok:
                </p>
                <div className="flex justify-center">
                  <VideoEmbed videoSrc="/videos/slideshow-tutorial.mp4" className="w-full max-w-[280px] mx-auto" />
                </div>
              </div>
            </section>

            {/* Quick Overview */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Zap className="w-5 h-5 text-primary" />
                Quick Overview
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-5 space-y-3">
                <p className="text-base leading-relaxed">
                  The <span className="font-semibold text-foreground">Slideshow Generator</span> creates ready-to-post content for your team accounts.
                </p>
                <div className="mt-4 p-4 bg-background/50 rounded-lg border border-primary/30">
                  <p className="text-base font-semibold text-center">
                    Generate images + text → Edit in TikTok → Post to IG
                  </p>
                </div>
              </div>
            </section>

            {/* Step by Step Process */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Step-by-Step Process
              </div>
              <div className="bg-green-500/20 border-2 border-green-500/40 rounded-xl p-4 space-y-4">
                {/* Step 1 */}
                <div className="flex gap-3 items-start bg-background/50 rounded-lg p-4 border border-green-500/30">
                  <span className="font-bold text-green-400 text-lg flex-shrink-0">1</span>
                  <div>
                    <p className="font-semibold text-foreground">Select the Format</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Switch between formats one after another:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                      <li>• <span className="text-foreground font-medium">Target / Avoid</span></li>
                      <li>• <span className="text-foreground font-medium">Best Betting Apps</span></li>
                      <li>• <span className="text-foreground font-medium">Fraud Watch</span></li>
                      <li>• <span className="text-foreground font-medium">Most Overbet</span></li>
                      <li>• <span className="text-foreground font-medium">Player Props</span></li>
                    </ul>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3 items-start bg-background/50 rounded-lg p-4 border border-green-500/30">
                  <span className="font-bold text-green-400 text-lg flex-shrink-0">2</span>
                  <div>
                    <p className="font-semibold text-foreground">Select the Sport</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose based on the team of your account @
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3 items-start bg-background/50 rounded-lg p-4 border border-green-500/30">
                  <span className="font-bold text-green-400 text-lg flex-shrink-0">3</span>
                  <div>
                    <p className="font-semibold text-foreground">Select the Team</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose the team based on your account @
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3 items-start bg-background/50 rounded-lg p-4 border border-green-500/30">
                  <span className="font-bold text-green-400 text-lg flex-shrink-0">4</span>
                  <div>
                    <p className="font-semibold text-foreground">Generate & Download</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click <span className="text-primary font-medium">"Generate Content"</span> and download all images to your iPhone Library or Computer
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex gap-3 items-start bg-background/50 rounded-lg p-4 border border-green-500/30">
                  <span className="font-bold text-green-400 text-lg flex-shrink-0">5</span>
                  <div>
                    <p className="font-semibold text-foreground">Copy Text & Assemble</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Copy the text in the Slideshow Generator and assemble it with the images in TikTok, then IG
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* TikTok to Instagram Trick */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Smartphone className="w-5 h-5 text-blue-500" />
                TikTok → Instagram Trick
              </div>
              <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-4 space-y-4">
                <p className="text-sm font-semibold text-blue-300">Save time by reusing your TikTok edits:</p>

                <div className="space-y-3">
                  <div className="flex gap-3 items-start bg-background/50 rounded-lg p-3 border border-blue-500/20">
                    <span className="font-bold text-blue-400 text-base">1.</span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Post to TikTok First</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create and post your slideshow on TikTok with all your edits
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-background/50 rounded-lg p-3 border border-blue-500/20">
                    <span className="font-bold text-blue-400 text-base">2.</span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Tap the "..." Button</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Once posted, tap the <span className="text-foreground font-medium">"..."</span> button below your post
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-background/50 rounded-lg p-3 border border-blue-500/20">
                    <span className="font-bold text-blue-400 text-base">3.</span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Download All Slides</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tap <span className="text-foreground font-medium">"Download"</span>, then tap <span className="text-foreground font-medium">"Select All"</span> — this downloads all slides with your edits!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-background/50 rounded-lg p-3 border border-blue-500/20">
                    <span className="font-bold text-blue-400 text-base">4.</span>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Post to Instagram</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload the downloaded slides directly to IG — no need to redo edits!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/40">
                  <p className="text-xs text-center text-blue-300">
                    <span className="font-semibold">Pro tip:</span> This saves you from having to edit the same slideshow twice!
                  </p>
                </div>
              </div>
            </section>

            {/* Important Tips */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                Important Tips
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <span className="font-bold text-amber-400 text-lg">1.</span>
                    <div>
                      <p className="font-semibold text-base">Follow the Layout</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Follow the layout shown in the tutorial video as closely as possible to maximize impact and consistency across accounts
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="font-bold text-amber-400 text-lg">2.</span>
                    <div>
                      <p className="font-semibold text-base">Copy & Paste Text</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Copy and paste the provided text onto each image exactly as shown
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="font-bold text-amber-400 text-lg">3.</span>
                    <div>
                      <p className="font-semibold text-base">Post Consistently</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        5 slideshows per day, 6 days per week = full payout
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Do's and Don'ts */}
            <section className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Do's */}
                <div className="border border-green-500/30 rounded-lg p-5 bg-green-500/5">
                  <div className="flex items-center gap-2 text-lg font-semibold text-green-400 mb-4">
                    <ThumbsUp className="w-5 h-5" />
                    Do
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Match text placement to the tutorial</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Use the exact text from the generator</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Post TikTok first, then download for IG</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Keep a consistent posting schedule</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Submit your posts to the dashboard</span>
                    </li>
                  </ul>
                </div>

                {/* Don'ts */}
                <div className="border border-red-500/30 rounded-lg p-5 bg-red-500/5">
                  <div className="flex items-center gap-2 text-lg font-semibold text-red-400 mb-4">
                    <ThumbsDown className="w-5 h-5" />
                    Don't
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <span className="text-red-400">✗</span>
                      <span>Don't skip any slides</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-400">✗</span>
                      <span>Don't change the text content</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-400">✗</span>
                      <span>Don't post the same content twice</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-400">✗</span>
                      <span>Don't forget to submit your posts</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-400">✗</span>
                      <span>Don't use random images or text</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How to Submit */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Upload className="w-5 h-5 text-primary" />
                How to Submit
              </div>
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <span className="font-bold text-primary text-lg">1.</span>
                    <div>
                      <p className="font-semibold text-base">Post your slideshow on TikTok and Instagram</p>
                      <p className="text-sm text-muted-foreground">Both platforms count towards your daily posts</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="font-bold text-primary text-lg">2.</span>
                    <div>
                      <p className="font-semibold text-base">Click the "+" button on your dashboard</p>
                      <p className="text-sm text-muted-foreground">It's the floating button at the bottom of your screen</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="font-bold text-primary text-lg">3.</span>
                    <div>
                      <p className="font-semibold text-base">Paste your post URL and select your account</p>
                      <p className="text-sm text-muted-foreground">We'll automatically track your posts and earnings</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-primary/20 rounded-lg border border-primary/30">
                  <p className="text-sm text-center">
                    That's it! Your posts are tracked and you earn based on your posting consistency.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default SlideshowGuideModal;
