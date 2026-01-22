import { motion, AnimatePresence } from "framer-motion";
import assets from "@/assets";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User, LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface NavbarProps {
  activePage?: "home" | "creators" | "dashboard";
  userName?: string;
}

export default function Navbar({ activePage = "home", userName }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isCreatorsPage = activePage === "creators" || location.pathname === "/creators";
  const isDashboard = activePage === "dashboard";

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error: any) {
      toast.error("Failed to sign out: " + error.message);
    }
  };
  const [activeSection, setActiveSection] = useState<"none" | "features" | "product">("none");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track scroll position to update active section
  useEffect(() => {
    if (isCreatorsPage) return;

    const handleScroll = () => {
      const featuresSection = document.getElementById("features");
      const productSection = document.getElementById("product");
      const scrollY = window.scrollY + 150; // Offset for header height

      if (productSection && scrollY >= productSection.offsetTop) {
        setActiveSection("product");
      } else if (featuresSection && scrollY >= featuresSection.offsetTop) {
        setActiveSection("features");
      } else {
        setActiveSection("none");
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isCreatorsPage]);

  const scrollToSection = (id: string) => {
    // If not on homepage, navigate to home first then scroll
    if (location.pathname !== "/") {
      navigate("/?scrollTo=" + id);
      return;
    }

    const section = document.getElementById(id);
    if (section) {
      const headerOffset = 40; // Offset to show heading at top
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const handleCreatorsClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="border-b border-border/50 sticky top-0 z-50"
    >
      <div className="container mx-auto px-6 py-3">
        <div className="grid grid-cols-3 items-center">
          {/* Logo - Left */}
          <div className="flex justify-start">
            <Link to="/" className="block">
              <img
                src={assets.logo}
                alt="Lastr Logo"
                className="w-14 h-14 hover:opacity-80 transition-opacity drop-shadow-[0_0_20px_rgba(139,92,246,0.35)]"
              />
            </Link>
          </div>

          {/* Desktop Nav - Center */}
          <nav className="hidden md:flex items-center justify-center">
            <div className="flex items-center bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-full p-1">
              <button
                onClick={() => scrollToSection("features")}
                className={`relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  !isCreatorsPage && activeSection === "features"
                    ? "text-foreground bg-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                }`}
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("product")}
                className={`relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  !isCreatorsPage && activeSection === "product"
                    ? "text-foreground bg-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                }`}
              >
                Product
              </button>
              <Link
                to="/account-managers"
                onClick={handleCreatorsClick}
                className={`relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                  isCreatorsPage
                    ? "text-foreground bg-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                }`}
              >
                Account Managers
              </Link>
            </div>
          </nav>

          {/* Right Side - Download Buttons, User Info, or Mobile Menu */}
          <div className="flex items-center gap-3 justify-end">
            {/* Mobile Menu Toggle - visible only on mobile when not dashboard */}
            {!isDashboard && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}
            {isDashboard ? (
              <>
                {userName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="hidden md:inline">{userName}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <a
                  href="https://apps.apple.com/us/app/lastr-last-longer/id6742103368"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group hidden sm:flex items-center justify-center gap-2 px-7 py-3 bg-primary/20 border border-primary/30 text-foreground rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:bg-primary/30 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] min-w-[126px]"
                >
                  <img src={assets.icons.apple} alt="Apple" className="w-4 h-4" />
                  <span>iOS</span>
                </a>
                <a
                  href="https://apps.apple.com/us/app/lastr-last-longer/id6742103368"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group hidden sm:flex items-center justify-center gap-2 px-7 py-3 bg-transparent border border-white/30 text-foreground rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:border-white/50 hover:bg-white/5 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] min-w-[126px] opacity-50 cursor-not-allowed pointer-events-none"
                >
                  <img src={assets.icons.android} alt="Android" className="w-4 h-4" />
                  <span>Android</span>
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && !isDashboard && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-b border-border/50 bg-background/95 backdrop-blur-sm overflow-hidden"
          >
            <div className="container mx-auto px-6 py-4 space-y-4">
              {/* Navigation Links */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    scrollToSection("features");
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    !isCreatorsPage && activeSection === "features"
                      ? "text-foreground bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => {
                    scrollToSection("product");
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    !isCreatorsPage && activeSection === "product"
                      ? "text-foreground bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  Product
                </button>
                <Link
                  to="/account-managers"
                  onClick={() => {
                    handleCreatorsClick();
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isCreatorsPage
                      ? "text-foreground bg-white/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  Account Managers
                </Link>
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t border-border/30">
                <a
                  href="https://apps.apple.com/us/app/lastr-last-longer/id6742103368"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary/20 border border-primary/30 text-foreground rounded-full text-sm font-semibold transition-all hover:bg-primary/30"
                >
                  <img src={assets.icons.apple} alt="Apple" className="w-4 h-4" />
                  <span>Download for iOS</span>
                </a>
                <div
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent border border-white/30 text-foreground rounded-full text-sm font-semibold opacity-50"
                >
                  <img src={assets.icons.android} alt="Android" className="w-4 h-4" />
                  <span>Android Coming Soon</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
