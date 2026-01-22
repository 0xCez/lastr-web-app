import assets from "@/assets";
import { motion } from "framer-motion";

const products = [
  {
    image: assets.card1,
    title: "Personalized Training Programs",
    description: "Get customized exercise routines tailored to your specific goals. Lastr creates a training plan that fits your lifestyle and progresses with you.",
  },
  {
    image: assets.card2,
    title: "Science-Backed Methods",
    description: "Every exercise and technique in Lastr is based on peer-reviewed research and expert recommendations for men's health.",
  },
  {
    image: assets.card3,
    title: "Track Every Improvement",
    description: "Visual progress tracking helps you see your gains over time. Celebrate milestones and stay motivated on your journey.",
  },
  {
    image: assets.card4,
    title: "Expert Guidance On Demand",
    description: "Access a library of educational content covering technique, lifestyle factors, and expert tips to maximize your results.",
  },
  {
    image: assets.card5,
    title: "Your AI Health Coach",
    description: "Ask questions anytime about your training, techniques, or health concerns. Get personalized, research-backed answers instantly.",
  },
];

export default function ProductFeatures() {
  return (
    <section id="product" className="container mx-auto px-6 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See why men are choosing Lastr for their health journey
          </p>
        </motion.div>

        <div className="space-y-24">
          {products.map((product, index) => (
            <motion.article
              key={product.title}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className={`flex flex-col ${index % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-12 md:gap-16`}
            >
              <div className="w-full md:w-1/2">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-auto"
                />
              </div>
              <div className="w-full md:w-1/2 flex flex-col justify-center">
                <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  {product.title}
                </h3>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
