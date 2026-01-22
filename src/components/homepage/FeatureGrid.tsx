import assets from "@/assets";
import { motion } from "framer-motion";

const features = [
  {
    icon: assets.icons.camera,
    title: "Personalized Training",
    description: "Science-backed exercise programs tailored to your goals and current level.",
  },
  {
    icon: assets.icons.brain,
    title: "AI-Powered Guidance",
    description: "Smart recommendations that adapt to your progress and feedback in real-time.",
  },
  {
    icon: assets.icons.barChart,
    title: "Track Your Progress",
    description: "Visual progress tracking with detailed metrics to see your improvements over time.",
  },
  {
    icon: assets.icons.magnifying,
    title: "Expert Insights",
    description: "Access research-backed techniques and tips from men's health professionals.",
  },
  {
    icon: assets.icons.robot,
    title: "24/7 Support",
    description: "Get answers to your questions anytime with our AI-powered health assistant.",
  },
  {
    icon: assets.icons.tools,
    title: "Advanced Features",
    description: "Custom reminders, detailed analytics, and personalized workout plans.",
    comingSoon: true,
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-16 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your Performance Journey Starts Here
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Lastr gives you the tools to take control of your health
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 15, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
                transition={{ duration: 0.6, ease: "easeInOut", delay: index * 0.05 }}
                viewport={{ once: true, amount: 0.4 }}
                className="glass-card p-7 hover:border-primary/30 hover:shadow-[0_10px_40px_rgba(139,92,246,0.1)] transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <img src={feature.icon} alt={feature.title} className="w-8 h-8" />
                  </div>
                </div>
                <h3 className="text-[1.125rem] font-semibold text-foreground mb-2 text-center flex items-center justify-center gap-2">
                  {feature.title}
                  {feature.comingSoon && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Soon
                    </span>
                  )}
                </h3>
                <p className="text-muted-foreground text-[0.9375rem] text-center leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
