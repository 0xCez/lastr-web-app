import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock, DollarSign, CheckCircle2, Sparkles, Zap, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import AccountManagerOpportunityModal from "@/components/dashboard/AccountManagerOpportunityModal";
import Navbar from "@/components/homepage/Navbar";
import { GridBackground } from "@/components/ui/GridBackground";

const AMLanding = () => {
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleGetStarted = () => {
    navigate("/onboarding?role=account_manager");
  };

  return (
    <>
      <AccountManagerOpportunityModal open={showDetailsModal} onOpenChange={setShowDetailsModal} />

      <GridBackground className="bg-background" gridSize={120} gridOpacity={0.04}>
        {/* Header */}
        <Navbar activePage="creators" />

        {/* Already have an account CTA */}
        <div className="container mx-auto px-4 md:px-6 pt-4">
          <div className="flex justify-end">
            <Link
              to="/login"
              className="text-sm text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Already have an account?
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <section className="container mx-auto px-4 md:px-6 py-12 md:py-10">
          <div className="max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex justify-center mb-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Now Hiring Account Managers</span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-center mb-6 text-foreground leading-[1.15]"
            >
              Simple Side Income<br />
              Just Minutes a Day
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-lg md:text-xl text-muted-foreground text-center mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Post men's health slideshows to TikTok & Instagram using our automated slideshow generator. You just click a button and it generates everything - then you download and post. <span className="text-foreground font-semibold">10-15 min/day = $200-250/month.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Button
                size="lg"
                className="text-lg px-8 py-6"
                onClick={handleGetStarted}
              >
                Get Started Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6"
                onClick={() => setShowDetailsModal(true)}
              >
                See Full Details
              </Button>
            </motion.div>

            {/* The Math - Immediate Hook */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="glass-card p-6 md:p-8 border-primary/30 mb-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-foreground">10-15 min/day</div>
                  <div className="text-sm text-muted-foreground mt-1">Your daily commitment</div>
                </div>
                <div className="text-center flex items-center justify-center">
                  <div className="text-4xl text-primary">=</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">$200-250/mo</div>
                  <div className="text-sm text-muted-foreground mt-1">Per account pair</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border/50 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">That's $50-100/hour effective rate</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* What's The Job - Crystal Clear */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">What's The Job?</h2>
                <p className="text-lg text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
                  You'll post <span className="text-foreground font-semibold">men's health & wellness slideshows</span> to TikTok and Instagram. That's it.
                </p>
              </motion.div>

              {/* The Actual Task Explained */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glass-card p-6 md:p-8 mb-8"
              >
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  What You're Posting
                </h3>
                <p className="text-muted-foreground mb-4">
                  Slideshows with men's health tips and advice. Think "5 Tips to Last Longer" or "Top Men's Health Myths" - simple image carousels that educate and engage.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">💪</div>
                    <div className="text-sm font-medium">Performance Tips</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🧠</div>
                    <div className="text-sm font-medium">Mental Health</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">🏃</div>
                    <div className="text-sm font-medium">Fitness</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">❤️</div>
                    <div className="text-sm font-medium">Wellness</div>
                  </div>
                </div>
              </motion.div>

              {/* 4 Steps */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { num: 1, title: "Click Generate", desc: "Our tool creates the slideshow - images, text, caption, everything", icon: "🖱️" },
                  { num: 2, title: "Download", desc: "Download the images to your phone (one tap)", icon: "📥" },
                  { num: 3, title: "Post", desc: "Upload to TikTok & Instagram, paste the caption we give you", icon: "📱" },
                  { num: 4, title: "Get Paid", desc: "Track earnings in real-time, get paid monthly", icon: "💰" }
                ].map((step, index) => (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-card p-6 text-center"
                  >
                    <div className="text-3xl mb-3">{step.icon}</div>
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mx-auto mb-3">
                      {step.num}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </motion.div>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-center text-muted-foreground mt-8"
              >
                Each post takes <span className="text-foreground font-semibold">2-3 minutes</span>. Do 5 posts = done in 15 minutes.
              </motion.p>
            </div>
          </div>
        </section>

        {/* What We Generate For You */}
        <section className="container mx-auto px-4 md:px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">We Do All The Hard Work</h2>
              <p className="text-muted-foreground text-center mb-12">
                You don't create anything. You don't think. You just copy-paste what we give you.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: "🖼️", title: "Images", desc: "Auto-generated slideshow images" },
                { icon: "✍️", title: "Text", desc: "All text on screen ready" },
                { icon: "📝", title: "Caption", desc: "Copy-paste caption provided" },
                { icon: "🔊", title: "Audio", desc: "Trending sound pre-selected" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="glass-card p-5 text-center hover:border-primary/30 transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div className="text-base font-semibold text-foreground mb-1">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-base font-medium text-primary">Even your TikTok/IG profile info is generated for you!</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Choose Your Earnings */}
        <section className="py-16 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Choose Your Earnings</h2>
                <p className="text-muted-foreground text-center mb-12">
                  More accounts = more money. Same simple work.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1 Account Pair */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="glass-card p-8 hover:border-primary/30 transition-all duration-300 cursor-pointer"
                >
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-primary mb-2">$200-250/mo</div>
                    <div className="text-sm text-muted-foreground">with bonuses</div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-center">1 Account Pair</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>1 TikTok + 1 Instagram account</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>No posting requirements - post as much as you want</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">~10-15 min/day</span>
                    </li>
                  </ul>
                  <div className="text-center pt-4 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">Perfect for trying it out</span>
                  </div>
                </motion.div>

                {/* 2 Account Pairs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="glass-card p-8 border-primary/30 hover:border-primary/50 transition-all duration-300 cursor-pointer relative"
                >
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                    2X Earnings
                  </div>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-primary mb-2">$400-500/mo</div>
                    <div className="text-sm text-muted-foreground">with bonuses</div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-center">2 Account Pairs</h3>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>2 TikTok + 2 Instagram accounts</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>No posting requirements - post as much as you want</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Clock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">~20-25 min/day</span>
                    </li>
                  </ul>
                  <div className="text-center pt-4 border-t border-primary/30">
                    <span className="text-sm text-primary font-medium">Maximize your earnings</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Why It's Worth It */}
        <section className="container mx-auto px-4 md:px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why This Is A No-Brainer</h2>
              <p className="text-muted-foreground text-center mb-12">
                Seriously, where else can you make $50-100/hour copy-pasting?
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "No creativity needed - everything is generated",
                "No editing skills - just download and upload",
                "No experience required - we teach you everything",
                "No fixed schedule - post whenever you want",
                "Weekly bonuses for consistency",
                "Monthly bonuses that stack",
                "Real-time earnings tracking",
                "Support whenever you need it"
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 md:px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center glass-card p-8 md:p-12 border-primary/30"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">10-15 Minutes a Day.<br />$200-250 a Month.</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Stop scrolling TikTok. Start getting paid to post on it.
            </p>
            <Button
              size="lg"
              className="text-lg px-12 py-6"
              onClick={handleGetStarted}
            >
              Start Earning Now
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Questions? <button onClick={() => setShowDetailsModal(true)} className="text-primary hover:underline">See full details</button>
            </p>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8">
          <div className="container mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
            <p>© 2025 Lastr. All rights reserved.</p>
          </div>
        </footer>
      </GridBackground>
    </>
  );
};

export default AMLanding;
