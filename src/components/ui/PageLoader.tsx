import { LogoSpinner } from "@/components/ui/AnimatedLogo";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Full-page loader with animated logo spinner
 * Use this for page-level loading states (auth checks, initial data loads)
 * For component-level loading, use Skeleton components instead
 */
const PageLoader = ({ message, fullScreen = true }: PageLoaderProps) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <LogoSpinner size={128} />
        {message && (
          <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <LogoSpinner size={96} />
      {message && (
        <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default PageLoader;
