import { motion } from "framer-motion";
import assets from "@/assets";
import { Star } from "lucide-react";

const reviews = [
  {
    text: "I've tried other apps before but Lastr actually explains the science behind each exercise. The personalized programs adapt to my schedule and I've seen real improvements in just a few weeks. Game changer.",
    name: "Thomas L.",
    handle: "@tom263",
    image: assets.profile1,
  },
  {
    text: "The progress tracking keeps me motivated. I can see exactly how far I've come and the daily reminders help me stay consistent. Best investment I've made for my health.",
    name: "Mike S.",
    handle: "@mikefit",
    image: assets.profile2,
  },
  {
    text: "Having an AI coach available 24/7 is incredible. I can ask questions about technique or lifestyle factors anytime and get real, science-backed answers. No judgment, just helpful guidance.",
    name: "Chris M.",
    handle: "@chrism",
    image: assets.profile3,
  },
];

export default function ReviewSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
              User feedback
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Join thousands of men taking control<br />
              of their health, <span className="text-primary">start today.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Lastr isn't just another fitness app. It's a complete training system designed specifically for men's health, backed by science and personalized to your goals.
            </p>
          </motion.div>

          {/* Review Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <motion.article
                key={review.name}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6 flex flex-col justify-between hover:border-primary/30 hover:shadow-[0_10px_40px_rgba(139,92,246,0.1)] transition-all duration-300 cursor-pointer"
              >
                <blockquote className="mb-6">
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {review.text}
                  </p>
                </blockquote>
                <footer>
                  <div className="flex items-center gap-3">
                    <img
                      src={review.image}
                      alt={review.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-foreground font-semibold text-sm">
                        {review.name}
                      </p>
                      <p className="text-muted-foreground text-xs">{review.handle}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </footer>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
