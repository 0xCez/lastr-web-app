import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Image, Zap, CheckCircle2, Lightbulb, ThumbsUp, ThumbsDown, Upload, Play, Smartphone } from "lucide-react";
import assets from "@/assets";

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
      className={`relative aspect-[9/16] rounded-xl overflow-hidden cursor-pointer bg-secondary/50 ${className || "w-[200px] md:w-[280px]"}`}
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

export default function SlideshowGuide() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={assets.logo} alt="Lastr Logo" className="w-10 h-10 drop-shadow-[0_0_16px_rgba(139,92,246,0.3)]" />
              <span className="text-lg text-foreground font-semibold">Lastr</span>
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border-b border-border/50">
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image className="w-10 h-10 text-emerald-500" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Slideshow Content Guide</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Create viral TikTok slideshows for Lastr in minutes
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl space-y-10">
        {/* Tutorial Video */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Play className="w-6 h-6 text-emerald-500" />
            Tutorial Video
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6">
            <p className="text-lg text-muted-foreground mb-6 text-center">
              Watch this video to learn how to edit a slideshow on TikTok:
            </p>
            <div className="flex justify-center">
              <VideoEmbed videoSrc="/videos/slideshow-tutorial.mp4" className="w-full max-w-[320px] mx-auto" />
            </div>
          </div>
        </section>

        {/* Quick Overview */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Zap className="w-6 h-6 text-primary" />
            Quick Overview
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
            <p className="text-lg leading-relaxed">
              The <span className="font-semibold text-foreground">Slideshow Generator</span> creates ready-to-post content for your Lastr accounts.
            </p>
            <div className="mt-6 p-5 bg-background/50 rounded-lg border border-primary/30">
              <p className="text-lg font-semibold text-center">
                Generate images + text → Edit in TikTok → Post to IG
              </p>
            </div>
          </div>
        </section>

        {/* Step by Step Process */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            Step-by-Step Process
          </div>
          <div className="bg-green-500/20 border-2 border-green-500/40 rounded-xl p-6 space-y-5">
            {/* Step 1 */}
            <div className="flex gap-4 items-start bg-background/50 rounded-lg p-5 border border-green-500/30">
              <span className="font-bold text-green-400 text-xl flex-shrink-0">1</span>
              <div>
                <p className="font-semibold text-lg text-foreground">Select the Route (Optional)</p>
                <p className="text-muted-foreground mt-2">
                  Choose a content style for your slideshow:
                </p>
                <ul className="text-muted-foreground mt-3 space-y-2">
                  <li>• <span className="text-blue-400 font-medium">Tips</span> — Instructive, educational content (5 proven tips...)</li>
                  <li>• <span className="text-purple-400 font-medium">Story</span> — Emotional, relatable content (personal journey...)</li>
                  <li>• <span className="text-foreground font-medium">Random</span> — Let the system choose for variety</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 items-start bg-background/50 rounded-lg p-5 border border-green-500/30">
              <span className="font-bold text-green-400 text-xl flex-shrink-0">2</span>
              <div>
                <p className="font-semibold text-lg text-foreground">Generate Content</p>
                <p className="text-muted-foreground mt-2">
                  Click <span className="text-primary font-medium">"Generate Post"</span> to create a 6-slide carousel with:
                </p>
                <ul className="text-muted-foreground mt-3 space-y-2">
                  <li>• Hook slide (attention grabber)</li>
                  <li>• 4 content slides (tips or story)</li>
                  <li>• CTA slide (call to action for Lastr app)</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start bg-background/50 rounded-lg p-5 border border-green-500/30">
              <span className="font-bold text-green-400 text-xl flex-shrink-0">3</span>
              <div>
                <p className="font-semibold text-lg text-foreground">Download Images</p>
                <p className="text-muted-foreground mt-2">
                  Download all 6 images to your iPhone Library or Computer
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 items-start bg-background/50 rounded-lg p-5 border border-green-500/30">
              <span className="font-bold text-green-400 text-xl flex-shrink-0">4</span>
              <div>
                <p className="font-semibold text-lg text-foreground">Copy Text & Assemble in TikTok</p>
                <p className="text-muted-foreground mt-2">
                  Copy the text overlay for each slide and add it in TikTok's slideshow editor
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-4 items-start bg-background/50 rounded-lg p-5 border border-green-500/30">
              <span className="font-bold text-green-400 text-xl flex-shrink-0">5</span>
              <div>
                <p className="font-semibold text-lg text-foreground">Copy Caption & Post</p>
                <p className="text-muted-foreground mt-2">
                  Copy the generated caption (with hashtags) and post to TikTok, then Instagram
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TikTok to Instagram Trick */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Smartphone className="w-6 h-6 text-blue-500" />
            TikTok → Instagram Trick
          </div>
          <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6 space-y-5">
            <p className="text-lg font-semibold text-blue-300">Save time by reusing your TikTok edits:</p>

            <div className="space-y-4">
              <div className="flex gap-4 items-start bg-background/50 rounded-lg p-4 border border-blue-500/20">
                <span className="font-bold text-blue-400 text-lg">1.</span>
                <div>
                  <p className="font-semibold text-foreground">Post to TikTok First</p>
                  <p className="text-muted-foreground mt-1">
                    Create and post your slideshow on TikTok with all your edits
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-background/50 rounded-lg p-4 border border-blue-500/20">
                <span className="font-bold text-blue-400 text-lg">2.</span>
                <div>
                  <p className="font-semibold text-foreground">Tap the "..." Button</p>
                  <p className="text-muted-foreground mt-1">
                    Once posted, tap the <span className="text-foreground font-medium">"..."</span> button below your post
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-background/50 rounded-lg p-4 border border-blue-500/20">
                <span className="font-bold text-blue-400 text-lg">3.</span>
                <div>
                  <p className="font-semibold text-foreground">Download All Slides</p>
                  <p className="text-muted-foreground mt-1">
                    Tap <span className="text-foreground font-medium">"Download"</span>, then tap <span className="text-foreground font-medium">"Select All"</span> — this downloads all slides with your edits!
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-background/50 rounded-lg p-4 border border-blue-500/20">
                <span className="font-bold text-blue-400 text-lg">4.</span>
                <div>
                  <p className="font-semibold text-foreground">Post to Instagram</p>
                  <p className="text-muted-foreground mt-1">
                    Upload the downloaded slides directly to IG — no need to redo edits!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/40">
              <p className="text-center text-blue-300">
                <span className="font-semibold">Pro tip:</span> This saves you from having to edit the same slideshow twice!
              </p>
            </div>
          </div>
        </section>

        {/* Important Tips */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Lightbulb className="w-6 h-6 text-amber-400" />
            Important Tips
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 space-y-5">
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="font-bold text-amber-400 text-xl">1.</span>
                <div>
                  <p className="font-semibold text-lg">Follow the Layout</p>
                  <p className="text-muted-foreground mt-2">
                    Follow the layout shown in the tutorial video as closely as possible to maximize impact and consistency across accounts
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-bold text-amber-400 text-xl">2.</span>
                <div>
                  <p className="font-semibold text-lg">Copy & Paste Text</p>
                  <p className="text-muted-foreground mt-2">
                    Copy and paste the provided text onto each image exactly as shown
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-bold text-amber-400 text-xl">3.</span>
                <div>
                  <p className="font-semibold text-lg">Mix Routes for Variety</p>
                  <p className="text-muted-foreground mt-2">
                    Alternate between Tips and Story routes to keep your content fresh and engaging
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-bold text-amber-400 text-xl">4.</span>
                <div>
                  <p className="font-semibold text-lg">Post Consistently</p>
                  <p className="text-muted-foreground mt-2">
                    Regular posting builds your audience and increases engagement
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Do's and Don'ts */}
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Do's */}
            <div className="border border-green-500/30 rounded-lg p-6 bg-green-500/5">
              <div className="flex items-center gap-2 text-xl font-semibold text-green-400 mb-5">
                <ThumbsUp className="w-6 h-6" />
                Do
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Match text placement to the tutorial</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Use the exact text from the generator</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Post TikTok first, then download for IG</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Keep a consistent posting schedule</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Submit your posts to the dashboard</span>
                </li>
              </ul>
            </div>

            {/* Don'ts */}
            <div className="border border-red-500/30 rounded-lg p-6 bg-red-500/5">
              <div className="flex items-center gap-2 text-xl font-semibold text-red-400 mb-5">
                <ThumbsDown className="w-6 h-6" />
                Don't
              </div>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't skip any slides</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't change the text content</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't post the same content twice</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't forget to submit your posts</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't use random images or text</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How to Submit */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Upload className="w-6 h-6 text-primary" />
            How to Submit
          </div>
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-6 space-y-5">
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="font-bold text-primary text-xl">1.</span>
                <div>
                  <p className="font-semibold text-lg">Post your slideshow on TikTok and Instagram</p>
                  <p className="text-muted-foreground">Both platforms count towards your daily posts</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-bold text-primary text-xl">2.</span>
                <div>
                  <p className="font-semibold text-lg">Click the "+" button on your dashboard</p>
                  <p className="text-muted-foreground">It's the floating button at the bottom of your screen</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-bold text-primary text-xl">3.</span>
                <div>
                  <p className="font-semibold text-lg">Paste your post URL and select your account</p>
                  <p className="text-muted-foreground">We'll automatically track your posts and earnings</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-primary/20 rounded-lg border border-primary/30">
              <p className="text-center">
                That's it! Your posts are tracked and you earn based on your posting consistency.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            THE AWESOME COMPANY © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
