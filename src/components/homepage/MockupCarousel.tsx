import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import assets from "@/assets";

const mockups = [
  assets.iPhoneMockup1,
  assets.iPhoneMockup2,
  assets.iPhoneMockup3,
  assets.iPhoneMockup4,
  assets.iPhoneMockup5,
  assets.iPhoneMockup6,
  assets.iPhoneMockup7,
  assets.iPhoneMockup8,
  assets.iPhoneMockup9,
  assets.iPhoneMockup10,
];

export default function MockupCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-rotate every 3 seconds when not hovered
  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % mockups.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered]);

  const handleClick = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div
      className="relative w-full max-w-[1100px] mx-auto h-[450px] md:h-[550px] mt-12 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Stacked Cards */}
      <div className="relative w-full h-full flex items-center justify-center">
        {mockups.map((mockup, index) => {
          // Calculate position relative to active card
          const position = index - activeIndex;
          const isActive = index === activeIndex;

          // Wrap around for smooth cycling
          let adjustedPosition = position;
          if (position > 2) adjustedPosition = position - mockups.length;
          if (position < -2) adjustedPosition = position + mockups.length;

          // Only show cards within range of -2 to +2
          const isVisible = Math.abs(adjustedPosition) <= 2;

          // Calculate transforms based on position - smaller offset on mobile
          const xOffset = adjustedPosition * (isMobile ? 80 : 160);
          const zIndex = 10 - Math.abs(adjustedPosition);
          const scale = isActive ? 1 : 0.88 - Math.abs(adjustedPosition) * 0.05;
          const opacity = isActive ? 1 : 0.7 - Math.abs(adjustedPosition) * 0.1;
          const rotateY = adjustedPosition * -5; // Slight 3D rotation

          return (
            <AnimatePresence key={index}>
              {isVisible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    x: xOffset,
                    scale,
                    opacity,
                    rotateY,
                    zIndex,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  onClick={() => handleClick(index)}
                  className="absolute cursor-pointer"
                  style={{
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
                  }}
                >
                  {/* Glow effect for active card - commented out for now */}
                  {/* {isActive && (
                    <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-primary rounded-[60px] scale-90" />
                  )} */}

                  {/* Phone mockup */}
                  <motion.img
                    src={mockup}
                    alt={`Lastr App Screen ${index + 1}`}
                    className="h-[420px] md:h-[520px] w-auto object-contain"
                    whileHover={isActive ? { scale: 1.02 } : {}}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>

      {/* Navigation Dots - commented out for now */}
      {/* <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {mockups.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "bg-primary w-6"
                : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div> */}

      {/* Left/Right click areas for easier navigation */}
      <button
        onClick={() => setActiveIndex((prev) => (prev - 1 + mockups.length) % mockups.length)}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-1/4 h-3/4 cursor-pointer z-20 opacity-0"
        aria-label="Previous slide"
      />
      <button
        onClick={() => setActiveIndex((prev) => (prev + 1) % mockups.length)}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-1/4 h-3/4 cursor-pointer z-20 opacity-0"
        aria-label="Next slide"
      />
    </div>
  );
}
