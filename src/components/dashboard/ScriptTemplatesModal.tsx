import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Check, Lightbulb, ArrowRight, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface ScriptTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenEditingTutorial?: () => void;
}

interface CopyButtonProps {
  text: string;
}

const CopyButton = ({ text }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleCopy}
      className="h-7 px-2 text-xs gap-1 hover:bg-primary/20"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-500" />
          <span className="text-green-500">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </Button>
  );
};

interface ScriptOptionProps {
  text: string;
  variant?: "primary" | "secondary";
}

const ScriptOption = ({ text, variant = "secondary" }: ScriptOptionProps) => (
  <div className={`flex items-center justify-between gap-2 p-3 rounded-lg ${
    variant === "primary"
      ? "bg-primary/20 border border-primary/30"
      : "bg-secondary/50"
  }`}>
    <span className="text-sm font-medium">{text}</span>
    <CopyButton text={text} />
  </div>
);

const ScriptTemplatesModal = ({ open, onOpenChange, onOpenEditingTutorial }: ScriptTemplatesModalProps) => {
  const isMobile = useIsMobile();

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-2xl bg-card border-border p-0 overflow-hidden max-h-[90vh]">
        <ResponsiveModalHeader className="p-4 md:p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
          <ResponsiveModalTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            Script Templates
          </ResponsiveModalTitle>
          <ResponsiveModalDescription className="text-sm mt-1">
            Copy-paste captions for your videos. Just tap to copy!
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <ScrollArea className={isMobile ? "h-[60vh]" : "h-[calc(90vh-140px)]"}>
          <div className="p-6 space-y-6">
            {/* Watch Tutorial CTA */}
            {onOpenEditingTutorial && (
              <button
                onClick={onOpenEditingTutorial}
                className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-2 border-primary/40 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-500 p-4 hover:scale-[1.02]"
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                {/* Pulse glow effect */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
                <div className="relative flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300 shadow-inner">
                    <Play className="w-6 h-6 text-primary fill-primary/40 group-hover:fill-primary/60 transition-all duration-300 group-hover:scale-110" />
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-primary group-hover:text-primary transition-colors">Watch Editing Tutorial</p>
                    <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors">Learn how to edit viral videos in CapCut</p>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </button>
            )}

            {/* How It Works */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">How to use these scripts:</p>
                  <p className="text-sm text-muted-foreground">
                    Add these as <span className="font-semibold text-foreground">on-screen text captions</span> in CapCut.
                    Each scene gets its own caption that appears at the right moment.
                  </p>
                  <p className="text-xs text-amber-400">
                    See examples in the <span className="font-semibold">Most Viral Videos</span> section on Dashboard or in the <span className="font-semibold">Content Guide</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Scene Breakdown */}
            <div className="space-y-5">
              {/* HOOK */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">HOOK</h3>
                    <p className="text-xs text-muted-foreground">First 1-2 seconds — grabs attention</p>
                  </div>
                </div>
                <div className="ml-10 space-y-2">
                  <ScriptOption text="My BF a genius 😭" variant="primary" />
                  <ScriptOption text="Bro a genius 😭" variant="primary" />
                  <ScriptOption text="Bro Living in 2099 😭" />
                  <ScriptOption text="My BF living in 2099 😭" />
                </div>
              </div>

              {/* Divider Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              {/* SCENE 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">SCENE 1: Snapping the Game</h3>
                    <p className="text-xs text-muted-foreground">Person points phone at TV/screen to scan</p>
                  </div>
                </div>
                <div className="ml-10 space-y-2">
                  <ScriptOption text="tf he doing?? 🧐" variant="primary" />
                  <ScriptOption text="tf she doing?? 🧐" variant="primary" />
                  <ScriptOption text="tf bro doing?? 🧐" />
                </div>
              </div>

              {/* Divider Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              {/* SCENE 2 (Optional) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">SCENE 2: Loading <span className="text-xs font-normal text-muted-foreground ml-1">(Optional)</span></h3>
                    <p className="text-xs text-muted-foreground">While AI analysis is loading on screen</p>
                  </div>
                </div>
                <div className="ml-10 space-y-2">
                  <ScriptOption text="wait a secc 😳" variant="primary" />
                  <ScriptOption text="No f way 😳" />
                </div>
              </div>

              {/* Divider Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
              </div>

              {/* SCENE 3 (Final) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-sm font-bold text-green-500">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">SCENE 3: The Reveal</h3>
                    <p className="text-xs text-muted-foreground">AI shows the prediction — this is the money shot!</p>
                  </div>
                </div>
                <div className="ml-10 space-y-2">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Replace <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-primary">XX</span> with the actual team and percentage from the app:
                    </p>
                    <ScriptOption text="App gave the Jaguars winning at 76%... 🤯" variant="primary" />
                    <ScriptOption text="AI gave the Lakers winning at 82%... 🤯" />
                    <ScriptOption text="App gave the Chiefs winning at 71%... 🤯" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="text-primary">💡</span> Pro Tips
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Keep captions BIG and readable on mobile</li>
                <li>• Time each caption to match the action</li>
                <li>• Scene 2 is optional — skip if your video is short</li>
              </ul>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50 pt-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                <span className="text-xl">📝</span> Post Captions
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Copy-paste these as your video description when posting to TikTok or Instagram.
              </p>
            </div>

            {/* Post Captions */}
            <div className="space-y-2">
              <ScriptOption text="My bf needs to be stopped 😭" variant="primary" />
              <ScriptOption text="He's actually cooked 💀" variant="primary" />
              <ScriptOption text="Why is he like this 😭😭" />
              <ScriptOption text="No way this actually works" />
              <ScriptOption text="I can't believe he found this 🤯" />
              <ScriptOption text="He's onto something fr" />
              <ScriptOption text="Bro thinks he's a genius 😭" />
              <ScriptOption text="Not him using AI for this 💀" />
              <ScriptOption text="The way he got so excited 😭" />
              <ScriptOption text="I'm actually impressed ngl" />
              <ScriptOption text="He won't stop talking about this app" />
              <ScriptOption text="Living with a sports guy be like" />
              <ScriptOption text="He said trust the process 😭" />
              <ScriptOption text="This can't be real" />
              <ScriptOption text="My bf is unhinged 💀" />
              <ScriptOption text="that's mad" />
              <ScriptOption text="how tf is this allowed" />
              <ScriptOption text="nah this shee can't be fr" />
            </div>

            {/* Caption Tips */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <span className="text-blue-500">✍️</span> Caption Tips
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Keep it short and relatable</li>
                <li>• Use 3-5 relevant hashtags</li>
                <li>• Add emojis to catch attention</li>
                <li>• Don't mention the app name directly</li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default ScriptTemplatesModal;
