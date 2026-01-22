import { motion } from "framer-motion";
import assets from "@/assets";
import { TrendingUp } from "lucide-react";
import MockupCarousel from "./MockupCarousel";

export default function HeroSection() {
  // TODO: Replace with actual Lastr app store links
  const getDownloadLink = () => {
    if (typeof navigator !== "undefined") {
      const isApple =
        navigator.userAgent.includes("iPhone") ||
        navigator.userAgent.includes("Mac");
      return isApple
        ? "#" // TODO: iOS App Store link
        : "#"; // TODO: Android Play Store link
    }
    return "#";
  };

  return (
    <section className="container mx-auto px-6 pt-12 pb-16 md:pt-10 md:pb-14">
      <div className="max-w-4xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Science-Backed Training</span>
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-6xl font-bold text-center mb-6 text-foreground leading-[1.15]"
        >
          Take Control of<br />
          Your Performance
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-lg md:text-xl text-muted-foreground text-center mb-6 max-w-2xl mx-auto leading-relaxed"
        >
          Personalized training programs designed for men who want to<br />
          improve their health and performance. <span className="text-foreground font-medium">Results in weeks, not months</span>.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center mb-10"
        >
          <button
            onClick={() => window.open(getDownloadLink(), "_blank")}
            className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 text-base font-semibold rounded-full bg-primary text-primary-foreground overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] active:scale-[0.98] whitespace-nowrap"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-primary via-violet-400 to-primary bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite] opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
            <svg className="relative w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="relative">Download Lastr</span>
          </button>
        </motion.div>

        {/* App Mockup Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.65, ease: "easeOut" }}
        >
          <MockupCarousel />
        </motion.div>
      </div>
    </section>
  );
}
