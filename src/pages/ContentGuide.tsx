import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Video, Zap, AlertTriangle, Camera, CheckCircle2, Lightbulb, ThumbsUp, ThumbsDown, Upload, ExternalLink, Play, Sparkles } from "lucide-react";
import assets from "@/assets";
import Marquee from "react-fast-marquee";

// Video files from /public/videos/
const videoFiles = [
  "/videos/video1.mp4",
  "/videos/video2.mp4",
  "/videos/video3.mp4",
  "/videos/video4.mp4",
  "/videos/video5.mp4",
];

// Inline VideoEmbed component for the guide
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

const examples = [
  { label: "New Format Example #1", url: "https://www.tiktok.com/@perecastorai/video/7498099238081957142?lang=en", highlight: true },
  { label: "New Format Example #2", url: "https://www.tiktok.com/@perecastorai/video/7498847942623628566?lang=en", highlight: true },
  { label: "Example #1", url: "https://www.tiktok.com/@betaiapp/video/7505061609094532398?lang=en" },
  { label: "Example #2", url: "https://www.tiktok.com/@chart.ai/video/7474234624554667270" },
  { label: "Example #3", url: "https://www.tiktok.com/@chart.ai/video/7448986973286501640" },
  { label: "Example #4", url: "https://www.tiktok.com/@chart.ai/video/7472004949757529362" },
  { label: "Example #5", url: "https://www.tiktok.com/@chart.ai/video/7432611535123467527" },
  { label: "Example #6", url: "https://www.tiktok.com/@chart.ai/video/7482389192819887367" },
  { label: "Example #7", url: "https://www.tiktok.com/@chart.ai/video/7477567751670762760" },
  { label: "Example #8", url: "https://www.tiktok.com/@chart.ai/video/7435987504152595719" },
  { label: "Example #9", url: "https://www.tiktok.com/@chart.ai/video/7440425061594582280" },
  { label: "Example #10 (Live setting)", url: "https://www.tiktok.com/@bet.ai.app/video/7495382540178492715?lang=en", note: "live" },
];

export default function ContentGuide() {
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
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50">
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Content Guide</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Create IG/TikTok-ready videos in {"<"}5 mins
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl space-y-10">
        {/* What You're Making */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Zap className="w-6 h-6 text-primary" />
            What You're Making
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
            <p className="text-lg leading-relaxed">
              You're creating <span className="font-semibold text-foreground">TikTok/IG videos featuring Bet.AI</span>.
            </p>
            <p className="text-lg leading-relaxed">
              We want fun, creative, trend-ready content that fits your style:
            </p>
            <ul className="space-y-3 text-lg">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Use your face, voice, humor, POV, or stay faceless — it's your call.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Make it feel natural, scroll-stopping, and shareable.</span>
              </li>
            </ul>
            <div className="mt-6 p-5 bg-background/50 rounded-lg border border-primary/30">
              <p className="text-lg font-semibold text-center">
                The magic moment = <span className="text-primary">phone takes a photo → AI gives prediction</span>
              </p>
            </div>
          </div>
        </section>

        {/* The Format - What Makes This Easy */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            The Format (Super Easy)
          </div>
          <div className="bg-green-500/20 border-2 border-green-500/40 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background/60 rounded-lg p-5 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl font-bold mt-0.5">✓</span>
                  <p className="text-lg">
                    We provide <span className="font-semibold text-foreground">video templates</span> for you to recreate
                  </p>
                </div>
              </div>
              <div className="bg-background/60 rounded-lg p-5 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl font-bold mt-0.5">✓</span>
                  <p className="text-lg">
                    Faceless content, <span className="font-semibold text-foreground">10–20 seconds</span> long max
                  </p>
                </div>
              </div>
              <div className="bg-background/60 rounded-lg p-5 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl font-bold mt-0.5">✓</span>
                  <p className="text-lg">
                    Takes <span className="font-semibold text-foreground">under 5 minutes</span> to shoot
                  </p>
                </div>
              </div>
              <div className="bg-background/60 rounded-lg p-5 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-xl font-bold mt-0.5">✓</span>
                  <p className="text-lg">
                    <span className="font-semibold text-foreground">No editing needed</span> — just shoot raw video, we handle audio/captions/everything
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-green-500/30 rounded-lg border border-green-500/50 mt-4">
              <p className="text-center text-2xl font-bold text-foreground">
                12 videos/week = just ~1 hour of work
              </p>
              <p className="text-center text-muted-foreground mt-2">
                Our guideline to stay aligned — flexible, post as you like
              </p>
            </div>
          </div>
        </section>

        {/* Video Templates - Marquee */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Sparkles className="w-6 h-6 text-primary" />
            Video Templates
          </div>
          <p className="text-lg text-muted-foreground">
            Simple formats that get millions of views. Click to play:
          </p>
          <div className="bg-secondary/30 rounded-xl py-6 -mx-6 px-0 overflow-hidden">
            <Marquee
              pauseOnHover={true}
              speed={40}
              gradient={false}
            >
              {videoFiles.map((videoSrc, index) => (
                <div key={index} className="mx-3">
                  <VideoEmbed videoSrc={videoSrc} className="w-[180px] md:w-[220px]" />
                </div>
              ))}
              {videoFiles.map((videoSrc, index) => (
                <div key={`dup-${index}`} className="mx-3">
                  <VideoEmbed videoSrc={videoSrc} className="w-[180px] md:w-[220px]" />
                </div>
              ))}
            </Marquee>
          </div>
        </section>

        {/* Examples */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Video className="w-6 h-6 text-primary" />
            Examples
          </div>
          <p className="text-lg text-muted-foreground">
            We're copying this high-performing format:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {examples.map((example, index) => (
              <a
                key={index}
                href={example.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 p-4 rounded-lg transition-all hover:scale-[1.02] ${
                  example.highlight
                    ? "bg-primary/20 border border-primary/30 hover:bg-primary/30"
                    : "bg-secondary/50 hover:bg-secondary/70"
                }`}
              >
                <ExternalLink className={`w-4 h-4 flex-shrink-0 ${example.highlight ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-sm ${example.highlight ? "font-semibold text-primary" : ""}`}>
                  {example.label}
                </span>
              </a>
            ))}
          </div>
          <p className="text-muted-foreground italic">
            Tip: Videos filmed in live settings (stadiums, bars, watch parties) tend to get a lot more views!
          </p>
        </section>

        {/* 3 Critical Moments */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            3 Critical Moments (in every video)
          </div>
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6 space-y-4">
            <p className="text-lg font-semibold text-red-300">Following these will seriously boost your views:</p>

            <div className="space-y-4">
              <div className="flex gap-4 items-start bg-background/50 rounded-lg p-4 border border-red-500/20">
                <span className="font-bold text-red-400 text-xl">1.</span>
                <div>
                  <p className="font-semibold text-lg text-foreground">The Snap</p>
                  <ul className="text-muted-foreground mt-2 space-y-1">
                    <li>• The Bet.AI app should be clearly visible while snapping the TV, bet slip, or bookmaker screen</li>
                    <li>• Make sure we can see the app screen on the phone being filmed</li>
                    <li>• Camera person should be close enough for clear shots</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-background/50 rounded-lg p-4 border border-red-500/20">
                <span className="font-bold text-red-400 text-xl">2.</span>
                <div>
                  <p className="font-semibold text-lg text-foreground">The Loading</p>
                  <ul className="text-muted-foreground mt-2 space-y-1">
                    <li>• Analysis can take a few seconds to load</li>
                    <li>• Best to cut this part out or speed it up (10x)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-background/50 rounded-lg p-4 border border-red-500/20">
                <span className="font-bold text-red-400 text-xl">3.</span>
                <div>
                  <p className="font-semibold text-lg text-foreground">The Reveal</p>
                  <ul className="text-muted-foreground mt-2 space-y-1">
                    <li>• When analysis appears, <span className="text-green-400 font-semibold">zoom in</span> on the phone screen</li>
                    <li>• We should clearly see the analytics, metrics, team logos, percentages</li>
                    <li>• The person using the app should <span className="text-foreground font-semibold">scroll down</span> the analysis page</li>
                    <li>• Even better: open other pages like Market Intel, Team Stats, Player Stats!</li>
                    <li>• This is a huge engagement driver - don't skip it!</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">The vibe:</span> The video should feel like someone got caught using a cheat code. The person filming "discovers" someone secretly using Bet.AI - voyeuristic, unexpected, futuristic.
              </p>
            </div>
          </div>
        </section>

        {/* Text-on-Screen Structure */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Zap className="w-6 h-6 text-primary" />
            Text-on-Screen Structure
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-5">
            <p className="text-lg text-muted-foreground text-center">
              Check the <span className="font-semibold text-primary">Scripts</span> button on your dashboard for copy-paste templates!
            </p>

            <div className="space-y-4 mt-4">
              <div className="bg-background/50 rounded-lg p-4 border border-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-primary/30 rounded text-xs font-bold text-primary">HOOK</span>
                  <span className="text-sm text-muted-foreground">First 1-4 seconds — most important!</span>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">"Bro a genius"</p>
                  <p className="font-semibold text-foreground">"My BF living in 2099"</p>
                </div>
              </div>

              <div className="bg-background/50 rounded-lg p-4 border border-secondary">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-secondary rounded text-xs font-bold text-muted-foreground">MIDDLE</span>
                  <span className="text-sm text-muted-foreground">1-2 "narration" sentences</span>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground">"tf he doing??"</p>
                  <p className="text-muted-foreground">"wait a sec..."</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2 italic">Add more for longer videos. Check Scripts for options!</p>
              </div>

              <div className="bg-background/50 rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-green-500/30 rounded text-xs font-bold text-green-400">REVEAL</span>
                  <span className="text-sm text-muted-foreground">When analysis appears — most important!</span>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground">"AI gave the Lakers winning at 82%..."</p>
                  <p className="font-semibold text-foreground">"App gave the Chiefs winning at 71%..."</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2 italic">Always include team name + percentage from the actual analysis!</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-300">
                <span className="font-semibold">Pro tip:</span> The hook and reveal are the most critical. Add 1-2 narration sentences in between depending on video length.
              </p>
            </div>
          </div>
        </section>

        {/* Checklist */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <CheckCircle2 className="w-6 h-6 text-orange-400" />
            Checklist
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6 space-y-5">
            <p className="text-lg font-semibold">Every video should include:</p>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="font-bold text-primary text-xl">1.</span>
                <div>
                  <p className="font-semibold text-lg">Bet.AI app assets clearly shown</p>
                  <ul className="text-muted-foreground mt-2 space-y-1">
                    <li>• Screen showing analysis / confidence score</li>
                    <li>• Or Bet.AI logo (on phone, overlay, or cutaway)</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-bold text-primary text-xl">2.</span>
                <div>
                  <p className="font-semibold text-lg">Official tag</p>
                  <p className="text-muted-foreground mt-2">
                    Always tag Bet.AI official page in your post. We will give you the @ depending on TT or IG.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-bold text-primary text-xl">3.</span>
                <div>
                  <p className="font-semibold text-lg">Real analysis only</p>
                  <p className="text-muted-foreground mt-2">
                    Use actual game analysis from the app. Demo/fake analysis won't drive engagement or conversions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What You're Filming */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Camera className="w-6 h-6 text-primary" />
            What You're Filming
          </div>
          <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
            <ul className="space-y-3 text-lg">
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>A phone pointing at a <span className="font-semibold text-foreground">live sports game or replay</span> (TV, laptop, Tesla screen, computer...)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>User taps or snaps a photo, as long as <span className="font-semibold text-foreground">2 team names or logos</span> are visible</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary">•</span>
                <span>Bet.AI instantly shows prediction or confidence analysis</span>
              </li>
            </ul>
            <div className="mt-5 p-5 bg-primary/10 rounded-lg border border-primary/20">
              <p className="italic text-muted-foreground">
                Think: Over-the-shoulder shot of someone using Bet.AI like a cheat code
              </p>
            </div>
          </div>
        </section>

        {/* What It Should Look Like */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            What It Should Look Like
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-lg p-5">
              <p><span className="font-semibold text-foreground">Background:</span> Clean (table, desk, bar top, car interior... anything aesthetic)</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-5">
              <p><span className="font-semibold text-foreground">Lighting:</span> Neutral (no shadows or glare)</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-5">
              <p><span className="font-semibold text-foreground">Style:</span> No faces or voices shown</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-5">
              <p><span className="font-semibold text-foreground">Vibe:</span> Make the app look futuristic / powerful</p>
            </div>
          </div>
        </section>

        {/* Visual Concepts */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-2xl font-semibold">
            <Lightbulb className="w-6 h-6 text-primary" />
            Visual Concepts
          </div>

          {/* Format A */}
          <div className="border border-primary/30 rounded-lg p-6 space-y-4 bg-gradient-to-br from-primary/5 to-transparent">
            <h4 className="font-semibold text-lg text-primary">
              Format A: "Open Door Reveal / He living in 2099"
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Open a door or walk into a room where someone is secretly using Bet.AI</li>
              <li>• Phone snaps a game on TV or Computer screen</li>
              <li>• App instantly highlights <span className="text-foreground font-medium">Confidence Score: High</span></li>
              <li>• On-screen text: <span className="text-foreground font-medium">"Bro living in 2099"</span></li>
            </ul>
            <p className="text-sm text-primary italic">→ Feels voyeuristic, futuristic, and highly saveable.</p>
          </div>

          {/* Format B */}
          <div className="border border-border rounded-lg p-6 space-y-4 bg-secondary/30">
            <h4 className="font-semibold text-lg">
              Format B: "Outside POV / Where did she find this..."
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Record someone from outside a window, doorway, or from the side</li>
              <li>• Zoom in on the phone scanning a live game or replay</li>
              <li>• Hand hovers → Bet.AI breakdown shows win chance</li>
              <li>• Swipe to reveal underdog confidence</li>
            </ul>
            <p className="text-sm text-muted-foreground italic">→ Caught-in-action vibe. Super shareable.</p>
          </div>

          {/* Format C */}
          <div className="border border-border rounded-lg p-6 space-y-4 bg-secondary/30">
            <h4 className="font-semibold text-lg">
              Format C: "Hack Note / 4 years betting and I just found this..."
            </h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Film a sticky note on laptop/desk that reads: <span className="text-foreground font-medium">"4y betting and I just found this app... BRUH"</span></li>
              <li>• Cut to Bet.AI scanning and showing analysis on a game screen</li>
              <li>• OR film someone in a Tesla watching a game → Bet.AI gives smart picks</li>
              <li>• End with zoom into <span className="text-foreground font-medium">AI Confidence: XXX</span></li>
            </ul>
            <p className="text-sm text-muted-foreground italic">→ Simple, raw, and works ridiculously well.</p>
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
                  <span>Always film vertically (TikTok/Reels format)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Show the app assets clearly (UI screen or logo)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Keep clips short (10–25 sec) and snappy</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Use trending sounds/captions for extra virality</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Tag our official page</span>
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
                  <span>No raw screen recordings</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't skip showing the app screen/logo</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't show the loading time - cut it or 10x speed</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't use demo/fake analysis - real games only</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't forget to zoom in on the analysis reveal</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't make text-on-screen too big or hard to read</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-red-400">✗</span>
                  <span>Don't have only 1 text caption - minimum 2-3</span>
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
                  <p className="font-semibold text-lg">Post your video on TikTok or Instagram</p>
                  <p className="text-muted-foreground">Make sure to tag our official page</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-bold text-primary text-xl">2.</span>
                <div>
                  <p className="font-semibold text-lg">Click the "Submit Post" button on your dashboard</p>
                  <p className="text-muted-foreground">It's the big button at the bottom of your screen</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="font-bold text-primary text-xl">3.</span>
                <div>
                  <p className="font-semibold text-lg">Paste your post URL and select your account</p>
                  <p className="text-muted-foreground">We'll automatically track all the metrics from there</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-primary/20 rounded-lg border border-primary/30">
              <p className="text-center">
                That's it! Analytics are fetched automatically and you get paid based on views.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            THE AWESOME COMPANY S.A. © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
