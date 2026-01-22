interface SplashScreenProps {
  children: React.ReactNode;
}

/**
 * SplashScreen - DISABLED
 * The big PathDrawingLogo splash is now disabled.
 * Only the Blue B LogoSpinner (PageLoader) is used for loading states.
 *
 * To re-enable, restore the original animation logic.
 */
const SplashScreen = ({ children }: SplashScreenProps) => {
  // Disabled - just pass through children immediately
  return <>{children}</>;
};

export default SplashScreen;
