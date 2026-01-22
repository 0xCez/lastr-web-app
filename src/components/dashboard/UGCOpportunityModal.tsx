import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, Video, Clock, Zap, TrendingUp, Users, Mail } from "lucide-react";

interface UGCOpportunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UGCOpportunityModal = ({ open, onOpenChange }: UGCOpportunityModalProps) => {
  const handleEmailContact = () => {
    window.location.href = "mailto:contact@betaiapp.com";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card border-border p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
          <DialogTitle className="text-3xl font-bold flex items-center gap-2">
            <Video className="w-7 h-7 text-primary" />
            Bet.AI App – UGC Creator Opportunity
          </DialogTitle>
          <p className="text-base text-muted-foreground mt-2">
            Join our growing creator community and earn $500–$5,000/month
          </p>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Introduction */}
            <section className="space-y-3">
              <p className="text-base text-muted-foreground leading-relaxed">
                Bet.AI allows users to get instant analysis from sports events with just a simple photo.
                We're growing our creator community and want you to join us.
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-5">
                <p className="text-base leading-relaxed">
                  We've built an <span className="font-semibold text-foreground">easy-to-follow content format</span> that's
                  designed to be fast and simple to create. Each video takes only <span className="font-semibold text-foreground">2-5 minutes</span> to make,
                  and with a bit of consistency, you can earn <span className="font-semibold text-primary">$500–$5,000/month</span>.
                </p>
              </div>
              <div className="bg-green-500/20 border-2 border-green-500/40 rounded-xl p-5">
                <p className="text-center text-xl font-bold text-foreground">
                  12 videos/week = just ~1 hour of work
                </p>
                <p className="text-center text-muted-foreground mt-2">
                  Our guideline to stay aligned — but flexible, post as much or little as you want
                </p>
              </div>
            </section>

            {/* Content Format */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Video className="w-6 h-6 text-primary" />
                Content Format
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-base">Type</span>
                  </div>
                  <p className="text-base text-muted-foreground">Faceless – Just capture a screen/TV showing the game</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-base">Length</span>
                  </div>
                  <p className="text-base text-muted-foreground">10–20 seconds</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-base">Time to Shoot</span>
                  </div>
                  <p className="text-base text-muted-foreground">Under 5 minutes per video</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-base">Editing</span>
                  </div>
                  <p className="text-base text-muted-foreground">1-2 minutes of editing per video</p>
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <p className="text-base font-semibold">Example Content:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <a href="https://www.tiktok.com/@perecastorai/video/7498099238081957142?lang=en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">New Format Example #1</a>
                  <a href="https://www.tiktok.com/@perecastorai/video/7498847942623628566?lang=en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">New Format Example #2</a>
                  <a href="https://www.tiktok.com/@betaiapp/video/7505061609094532398?lang=en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TikTok Example #1</a>
                  <a href="https://www.tiktok.com/@betaiapp/video/7504344368926600491?lang=en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TikTok Example #2</a>
                  <a href="https://www.tiktok.com/@betaiapp/video/7504320074316459310?lang=en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TikTok Example #3</a>
                  <a href="https://www.tiktok.com/@betaiapp/video/7497561878815501610?lang=en" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TikTok Example #4</a>
                </div>
              </div>
            </section>

            {/* Contract Options */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                Our Two Contract Options
              </h3>

              {/* Option 1 */}
              <div className="border border-primary/30 rounded-lg p-6 space-y-3 bg-gradient-to-br from-primary/5 to-transparent">
                <h4 className="font-semibold text-lg text-primary">
                  Option 1: $300 Fixed + $1.50 CPM
                </h4>
                <p className="text-base text-muted-foreground">North America or EU-based creators</p>
                <ul className="space-y-2 text-base">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>$300 fixed monthly payment + $1.50 CPM on views</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>12 videos/week guideline (~1 hour) — flexible</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Capped at $5,000 total monthly earnings</span>
                  </li>
                  <li className="flex gap-2 text-muted-foreground">
                    <span className="text-primary/60">•</span>
                    <span className="text-sm">Payment processed between the 28th and 4th of each calendar month</span>
                  </li>
                </ul>
              </div>

              {/* Option 2 */}
              <div className="border border-border rounded-lg p-6 space-y-3 bg-secondary/30">
                <h4 className="font-semibold text-lg">
                  Option 2: Fixed Rate of $500 for 100 Videos
                </h4>
                <ul className="space-y-2 text-base">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>No CPM – guaranteed $500 for 100 videos/month</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Paid weekly for meeting your video quota</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>Simple and guaranteed rate</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* What You'll Get */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                What You'll Get
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-base">Creator Platform Access</p>
                    <p className="text-sm text-muted-foreground">Track videos, views, earnings, and calendar events in real time</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-base">Easy Process</p>
                    <p className="text-sm text-muted-foreground">Simple upload, tracking, and earning system</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-base">Support</p>
                    <p className="text-sm text-muted-foreground">Shooting guide and assistance available</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Why It's Great */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Why It's a Great Opportunity
              </h3>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-5 space-y-3">
                <p className="text-base"><span className="font-semibold text-foreground">Minimal time:</span> ~1 hour/week of filming = ~4 hours/month total</p>
                <p className="text-base"><span className="font-semibold text-foreground">Maximum earnings:</span> Up to $5,000/month for those 4 hours of work</p>
                <p className="text-base"><span className="font-semibold text-foreground">Proven format:</span> Already viral – follow the guide and you WILL earn money</p>
                <p className="text-base"><span className="font-semibold text-foreground">No editing needed:</span> Just shoot raw video, we handle audio/captions/everything</p>
                <p className="text-base"><span className="font-semibold text-foreground">Flexibility:</span> Faceless content, create on your platform or a new page</p>
              </div>
            </section>

            {/* How to Get Started */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                How to Get Started
              </h3>
              <div className="space-y-4">
                <div className="bg-secondary/30 rounded-lg p-5 flex gap-4">
                  <span className="font-bold text-primary text-xl">1.</span>
                  <div className="flex-1">
                    <p className="font-semibold text-base mb-2">Register on the platform</p>
                    <p className="text-sm text-muted-foreground">Complete the onboarding process and create your account</p>
                  </div>
                </div>
                <div className="bg-secondary/30 rounded-lg p-5 flex gap-4">
                  <span className="font-bold text-primary text-xl">2.</span>
                  <div className="flex-1">
                    <p className="font-semibold text-base mb-2">Email us to get started</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Send an email to <a href="mailto:contact@betaiapp.com" className="text-primary hover:underline font-semibold">contact@betaiapp.com</a> saying
                      hi and letting us know which contract option you've decided to go with.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We'll send you access to our <span className="font-semibold text-foreground">Discord server</span>, where we offer continuous
                      support and guidance to make the videos right. We'll coach you to get the format right in just a few shots!
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ Preview */}
            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Frequently Asked Questions</h3>
              <div className="space-y-3">
                <details className="bg-secondary/30 rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-base">Who owns the videos I create?</summary>
                  <p className="text-sm text-muted-foreground mt-2">
                    You retain the rights to the videos for your portfolio and accounts. Bet.AI also retains the right to
                    repost and use the videos for our channels and ads.
                  </p>
                </details>
                <details className="bg-secondary/30 rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-base">How does the payment schedule work?</summary>
                  <p className="text-sm text-muted-foreground mt-2">
                    Fixed payments are paid weekly once you hit your content quota. CPM payouts are calculated monthly,
                    based on views, and processed between the 28th and 4th of each calendar month.
                  </p>
                </details>
                <details className="bg-secondary/30 rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-base">How are views counted for CPM?</summary>
                  <p className="text-sm text-muted-foreground mt-2">
                    Only your views on your account count towards CPM payouts. Views are counted for 4 weeks following the publication of each post.
                  </p>
                </details>
                <details className="bg-secondary/30 rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-base">Will I be able to see my stats?</summary>
                  <p className="text-sm text-muted-foreground mt-2">
                    Yes! You'll have access to the Creator Platform where you can track views per video, total views,
                    number of videos posted, and your live CPM earnings.
                  </p>
                </details>
                <details className="bg-secondary/30 rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-base">How many videos should I post?</summary>
                  <p className="text-sm text-muted-foreground mt-2">
                    We ask creators to aim for 12 videos/week — that's only ~1 hour of work (1.5 hrs if you're slow).
                    It's not a hard requirement though, you can post as much or little as you want. This guideline keeps us aligned so you're stacking views and $$!
                  </p>
                </details>
                <details className="bg-secondary/30 rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-base">What do you expect from the creative videos each week?</summary>
                  <p className="text-sm text-muted-foreground mt-2">
                    The 4 creative videos allow you to experiment with new ideas: test new hooks, try different angles,
                    and experiment with trends. We'll share examples of trending content to help you brainstorm.
                  </p>
                </details>
              </div>
            </section>

            {/* Creator Success */}
            <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-6 space-y-2">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Our Creator Success
              </h3>
              <p className="text-base text-muted-foreground">
                Many creators from the US, Canada, UK, and France are already onboard and are successfully earning through Bet.AI.
                They love the simple format and easy execution. <span className="font-semibold text-foreground">You could be the next success story!</span>
              </p>
            </section>
          </div>
        </ScrollArea>

        {/* Footer CTA */}
        <div className="p-6 pt-4 border-t border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <Button
            onClick={handleEmailContact}
            className="w-full gap-2"
            size="lg"
          >
            <Mail className="w-4 h-4" />
            Contact Us to Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UGCOpportunityModal;
