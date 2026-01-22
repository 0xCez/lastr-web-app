import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Target, TrendingUp, Sparkles, Smartphone, Zap, DollarSign, Play } from "lucide-react";

interface AccountManagerOpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountManagerOpportunityModal = ({ open, onOpenChange }: AccountManagerOpportunityModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card border-border p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Account Manager Opportunity
          </DialogTitle>
          <p className="text-base text-muted-foreground mt-2">
            The easiest $50-100/hour you'll ever make
          </p>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Hero - The Hook */}
            <section className="bg-gradient-to-br from-green-500/20 to-primary/10 rounded-lg p-6 border border-green-500/30">
              <div className="text-center space-y-3">
                <p className="text-4xl font-bold text-green-500">$50-100/hour</p>
                <p className="text-lg text-muted-foreground">
                  <span className="font-semibold text-foreground">10-15 min/day</span> = <span className="font-semibold text-foreground">$200-250/month</span>
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mt-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Double it with 2 account pairs = $400-500/month</span>
                </div>
              </div>
            </section>

            {/* What's The Job - Crystal Clear */}
            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                What's The Job?
              </h3>
              <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-lg p-4 space-y-3 border border-purple-500/20">
                <p className="text-sm text-muted-foreground">
                  You post <span className="font-semibold text-foreground">men's health & wellness slideshows</span> to TikTok and Instagram.
                </p>
                <p className="text-sm text-muted-foreground">
                  Think "5 Tips to Last Longer" or "Top Men's Health Myths" - simple image carousels showing health tips for our app <span className="font-semibold text-primary">Lastr</span>.
                </p>
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 text-center">
                    <span className="text-lg">💪</span>
                    <p className="text-xs text-purple-400 font-medium">Performance</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-center">
                    <span className="text-lg">🧠</span>
                    <p className="text-xs text-green-400 font-medium">Mental</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-center">
                    <span className="text-lg">🏃</span>
                    <p className="text-xs text-red-400 font-medium">Fitness</p>
                  </div>
                  <div className="bg-pink-500/10 border border-pink-500/20 rounded p-2 text-center">
                    <span className="text-lg">❤️</span>
                    <p className="text-xs text-pink-400 font-medium">Wellness</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Daily Workflow */}
            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Your Daily Workflow (2-3 min per post)
              </h3>
              <div className="space-y-2">
                <div className="flex gap-3 items-center p-3 bg-gradient-to-r from-primary/10 to-transparent rounded-lg border-l-4 border-primary">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground">1</div>
                  <p className="text-sm"><span className="font-semibold text-foreground">Click "Generate"</span> - our tool creates the slideshow (images, text, caption, audio)</p>
                </div>
                <div className="flex gap-3 items-center p-3 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg border-l-4 border-blue-500">
                  <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">2</div>
                  <p className="text-sm"><span className="font-semibold text-foreground">Download images</span> - one tap to save to your phone</p>
                </div>
                <div className="flex gap-3 items-center p-3 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border-l-4 border-purple-500">
                  <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">3</div>
                  <p className="text-sm"><span className="font-semibold text-foreground">Post to TikTok & Instagram</span> - upload images, paste caption we give you</p>
                </div>
                <div className="flex gap-3 items-center p-3 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg border-l-4 border-green-500">
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">4</div>
                  <p className="text-sm"><span className="font-semibold text-foreground">Done.</span> - repeat as many times as you want</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">
                No creativity. No editing. No thinking. Just copy-paste. No posting requirements - post as much as you want.
              </p>
            </section>

            {/* The Math */}
            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                The Math
              </h3>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 space-y-3 border border-green-500/20">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Daily</p>
                    <p className="text-xl font-bold text-foreground">10-15 min</p>
                  </div>
                  <div className="text-center p-3 bg-background/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                    <p className="text-xl font-bold text-foreground">~5-6 hrs</p>
                  </div>
                  <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                    <p className="text-xs text-muted-foreground mb-1">Earnings</p>
                    <p className="text-xl font-bold text-green-500">$200-250</p>
                  </div>
                </div>
                <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                  <p className="text-xs text-muted-foreground mb-1">Your effective hourly rate</p>
                  <p className="text-2xl font-bold text-green-500">$50-100/hour</p>
                  <p className="text-xs text-muted-foreground">depending on bonuses</p>
                </div>
              </div>
            </section>

            {/* Time Commitment */}
            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Time Commitment
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-500">No requirements</p>
                  <p className="text-xs text-muted-foreground">post as much as you want</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-primary">10-15 min</p>
                  <p className="text-xs text-muted-foreground">per day for 1 pair</p>
                </div>
              </div>
            </section>

            {/* Choose Your Setup */}
            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                Choose Your Earnings
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/30 rounded-lg p-4 text-center border border-border">
                  <p className="text-lg font-bold text-foreground">1 Account Pair</p>
                  <p className="text-xs text-muted-foreground">1 TikTok + 1 Instagram</p>
                  <p className="text-xl font-bold text-green-500 mt-2">$200-250/mo</p>
                  <p className="text-xs text-muted-foreground mt-2">~10-15 min/day</p>
                </div>
                <div className="bg-gradient-to-br from-primary/10 to-green-500/10 rounded-lg p-4 text-center border border-primary/30 relative">
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    2X
                  </div>
                  <p className="text-lg font-bold text-foreground">2 Account Pairs</p>
                  <p className="text-xs text-muted-foreground">2 TikTok + 2 Instagram</p>
                  <p className="text-xl font-bold text-green-500 mt-2">$400-500/mo</p>
                  <p className="text-xs text-muted-foreground mt-2">~20-25 min/day</p>
                </div>
              </div>
            </section>

            {/* Bonuses */}
            <section className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                Bonuses
              </h3>
              <div className="space-y-2">
                <div className="border border-yellow-500/30 rounded-lg p-3 bg-yellow-500/5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Weekly Consistency</span>
                    <span className="text-yellow-500 font-semibold text-sm">+bonus</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Hit daily target 6/7 days = extra cash</p>
                </div>
                <div className="border border-orange-500/30 rounded-lg p-3 bg-orange-500/5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Monthly Bonus</span>
                    <span className="text-orange-500 font-semibold text-sm">+bigger bonus</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Stay consistent all month = stacking bonuses</p>
                </div>
              </div>
            </section>

            {/* TL;DR */}
            <section className="bg-gradient-to-br from-green-500/20 to-primary/10 rounded-lg p-5 border border-green-500/30 text-center">
              <p className="text-lg font-semibold text-foreground mb-2">
                TL;DR
              </p>
              <p className="text-sm text-muted-foreground">
                Post men's health slideshows we generate for you.<br />
                <span className="text-green-500 font-semibold">10-15 min/day = $200-250/month per pair. Up to $1,000/month with 2 phones.</span>
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AccountManagerOpportunityModal;
