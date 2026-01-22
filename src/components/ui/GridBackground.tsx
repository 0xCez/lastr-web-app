import { cn } from "@/lib/utils";

interface GridBackgroundProps {
  children: React.ReactNode;
  className?: string;
  showGradient?: boolean;
  gridSize?: number;
  gridOpacity?: number;
}

export function GridBackground({
  children,
  className,
  showGradient = true,
  gridSize = 40,
  gridOpacity = 0.03,
}: GridBackgroundProps) {
  return (
    <div className={cn("relative min-h-screen w-full", className)}>
      {/* Fixed perspective grid - visible at top of viewport */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        style={{
          perspective: "1000px",
          perspectiveOrigin: "50% 0%",
        }}
      >
        <div
          className="absolute w-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, ${gridOpacity}) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, ${gridOpacity}) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
            transform: "rotateX(65deg)",
            transformOrigin: "center top",
            top: "0%",
            height: "200vh",
          }}
        />
        {/* Fade out at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-[40%]"
          style={{
            background: "linear-gradient(to top, var(--background) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Radial gradient overlay for depth */}
      {showGradient && (
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      )}

      {/* Glow spots */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function DotBackground({
  children,
  className,
  dotSize = 1,
  dotSpacing = 24,
  dotOpacity = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  dotSize?: number;
  dotSpacing?: number;
  dotOpacity?: number;
}) {
  return (
    <div className={cn("relative min-h-screen w-full", className)}>
      {/* Dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, ${dotOpacity}) ${dotSize}px, transparent ${dotSize}px)`,
          backgroundSize: `${dotSpacing}px ${dotSpacing}px`,
        }}
      />

      {/* Glow spots */}
      <div className="absolute top-20 left-1/3 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
