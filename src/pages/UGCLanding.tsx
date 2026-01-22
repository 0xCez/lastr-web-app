import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Video, DollarSign, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import UGCOpportunityModal from "@/components/dashboard/UGCOpportunityModal";
import Navbar from "@/components/homepage/Navbar";
import ViralVideosBand from "@/components/dashboard/ViralVideosBand";
import { GridBackground } from "@/components/ui/GridBackground";

const UGCLanding = () => {
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleGetStarted = () => {
    navigate("/onboarding?role=ugc_creator");
  };

  const stats = [
    {
      icon: DollarSign,
      value: "$500-$5,000",
      label: "Monthly Earnings",
      description: "For just a few videos per week"
    },
    {
      icon: Clock,
      value: "2-5 min",
      label: "Per Video",
      description: "Quick filming, minimal editing"
    },
    {
      icon: Video,
      value: "10-20 sec",
      label: "Video Length",
      description: "Short, engaging content"
    }
  ];

  const benefits = [
    "No experience required – we'll coach you",
    "Faceless videos – no need to show your face",
    "Flexible schedule – create on your own time",
    "Proven viral format – high engagement guaranteed",
    "Discord community support & guidance",
    "Real-time earnings tracking on our platform"
  ];

  return (
    <>
      <UGCOpportunityModal open={showDetailsModal} onOpenChange={setShowDetailsModal} />

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
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Now Hiring UGC Creators</span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-6xl font-bold text-center mb-6 text-foreground leading-[1.15]"
            >
              Create Viral Sports Content<br />
              Earn Up to $5,000/Month
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-lg md:text-xl text-muted-foreground text-center mb-6 max-w-2xl mx-auto leading-relaxed"
            >
              Join our growing community of creators making easy money with simple, faceless sports videos.
              No experience needed – we'll teach you everything.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
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
                View Full Details
              </Button>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{
                    y: -8,
                    transition: { duration: 0.2, ease: "easeOut" }
                  }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  className="glass-card p-6 text-center hover:border-primary/30 hover:shadow-[0_10px_40px_rgba(0,200,255,0.1)] transition-all duration-300 cursor-pointer"
                >
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm font-semibold text-foreground mb-1">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.description}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
              <p className="text-muted-foreground text-center mb-12">
                Start earning in 3 simple steps
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: 1, title: "Sign Up", desc: "Complete our quick onboarding and choose your contract option" },
                { num: 2, title: "Learn & Create", desc: "Join our Discord, learn the format, and start creating viral sports content" },
                { num: 3, title: "Post & Earn", desc: "Upload your videos and track your earnings in real-time on our platform" }
              ].map((step, index) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.desc}</p>
                </motion.div>
              ))}
            </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 md:px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Join Bet.AI?</h2>
              <p className="text-muted-foreground text-center mb-12">
                Everything you need to succeed as a content creator
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
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

        {/* Contract Options Preview */}
        <section className="py-16 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Choose Your Contract</h2>
              <p className="text-muted-foreground text-center mb-12">
                Two flexible options to fit your goals
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="glass-card p-8 border-primary/30 hover:border-primary/50 hover:shadow-[0_10px_40px_rgba(0,200,255,0.1)] transition-all duration-300 cursor-pointer"
              >
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-primary mb-2">$300-$5,000</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">Performance-Based</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>$300 fixed monthly + $1.50 CPM</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>12 videos/week guideline (~1hr) — flexible</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Capped at $5,000 total earnings</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>Max $350 per individual post</span>
                  </li>
                </ul>
                <div className="text-xs text-muted-foreground text-center">
                  North America or EU-based creators • Payouts monthly (28th–3rd)
                </div>
              </motion.div>

              {/* Option 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="glass-card p-8 opacity-60 relative"
              >
                {/* Unavailable overlay badge */}
                <div className="absolute top-4 right-4 bg-muted/80 text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                  Currently unavailable
                </div>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-muted-foreground mb-2">$500</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center text-muted-foreground">Fixed Rate</h3>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Guaranteed $500 monthly</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>100 videos per month</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Paid weekly for meeting quota</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Simple and predictable</span>
                  </li>
                </ul>
                <div className="text-xs text-muted-foreground text-center">
                  Not currently onboarding new creators for this option
                </div>
              </motion.div>
            </div>
            </div>
          </div>
        </section>

        {/* Viral Videos Band */}
        <ViralVideosBand />

        {/* Final CTA */}
        <section className="container mx-auto px-4 md:px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center glass-card p-6 md:p-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Earning?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join hundreds of creators already making money with Bet.AI
            </p>
            <Button
              size="lg"
              className="text-lg px-12 py-6"
              onClick={handleGetStarted}
            >
              Create Your Account Now
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Questions? <button onClick={() => setShowDetailsModal(true)} className="text-primary hover:underline">View full details and FAQs</button>
            </p>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-8">
          <div className="container mx-auto px-4 md:px-6 text-center text-sm text-muted-foreground">
            <p>© 2025 Bet.AI Creator Platform. All rights reserved.</p>
          </div>
        </footer>
      </GridBackground>
    </>
  );
};

export default UGCLanding;
