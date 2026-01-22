import assets from "@/assets";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const getDownloadLink = () => {
    return "https://apps.apple.com/us/app/lastr-last-longer/id6742103368";
  };

  return (
    <>
      {/* Final CTA */}
      <section className="container mx-auto px-6 py-20 md:py-28">
        <motion.div
          initial={{ y: 15, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="max-w-4xl mx-auto text-center glass-card p-12 md:p-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Take Control?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Download Lastr and start your personalized training journey
          </p>

          {/* Slick CTA Button with Glow */}
          <a
            href={getDownloadLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center justify-center px-12 py-5 text-lg font-semibold text-primary-foreground bg-primary rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_50px_rgba(139,92,246,0.5)]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary opacity-100 group-hover:opacity-90 transition-opacity" />
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Lastr
            </span>
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 md:gap-8 mb-12">
            {/* Logo & Description */}
            <div className="flex-shrink-0 max-w-[200px]">
              <Link to="/" className="inline-block mb-4">
                <img src={assets.logo} alt="Lastr Logo" className="w-14 h-14 drop-shadow-[0_0_20px_rgba(139,92,246,0.35)]" />
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Science-backed training programs designed for men's health and performance.
              </p>
            </div>

            {/* Health Disclaimer */}
            <div className="max-w-[220px]">
              <h4 className="text-sm font-bold text-foreground mb-4">Health Disclaimer</h4>
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                DISCLAIMER: For informational purposes only. Not medical advice. Consult a healthcare professional before starting any training program.
              </p>
            </div>

            {/* About Links */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">About</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/?scrollTo=features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/?scrollTo=product" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Product
                  </Link>
                </li>
                <li>
                  <Link to="/account-managers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Account Managers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Follow Us */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">Follow us</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://www.instagram.com/lastrapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <img src={assets.icons.instagram} alt="Instagram" className="w-5 h-5" />
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.tiktok.com/@lastrapp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    <img src={assets.icons.tiktok} alt="TikTok" className="w-5 h-5" />
                    TikTok
                  </a>
                </li>
              </ul>
            </div>
          </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border/50">
          <div className="container mx-auto px-6 pt-8">
            <div className="max-w-6xl mx-auto">
              <p className="text-sm text-muted-foreground tracking-wide">
                LASTR {currentYear} ALL RIGHTS RESERVED
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
