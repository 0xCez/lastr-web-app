import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  Navbar,
  HeroSection,
  FeatureGrid,
  ProductFeatures,
  ReviewSection,
  Footer,
} from "@/components/homepage";
import { GridBackground } from "@/components/ui/GridBackground";

export default function Homepage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check query param first (from navbar navigation)
    const scrollToParam = searchParams.get("scrollTo");
    if (scrollToParam) {
      setTimeout(() => {
        const section = document.getElementById(scrollToParam);
        if (section) {
          const headerOffset = 40; // Offset to show heading at top
          const elementPosition = section.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 100); // Small delay to ensure page is rendered
      return;
    }

    // Check location state (legacy support)
    if (location.state?.scrollTo) {
      const section = document.getElementById(location.state.scrollTo);
      if (section) {
        const headerOffset = 40;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }
  }, [location, searchParams]);

  return (
    <GridBackground className="bg-background" gridSize={120} gridOpacity={0.04}>
      <Navbar />
      <HeroSection />
      <FeatureGrid />
      <ProductFeatures />
      <ReviewSection />
      <Footer />
    </GridBackground>
  );
}
