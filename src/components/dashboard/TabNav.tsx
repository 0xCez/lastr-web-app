import { cn } from "@/lib/utils";
import { LayoutDashboard, Calendar, User, Users, Trophy, Plus, LogOut, DollarSign, Sparkles } from "lucide-react";
import { useUserRole } from "@/contexts/UserRoleContext";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import assets from "@/assets";
interface TabNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSubmitPostClick?: () => void;
}

const TabNav = ({ activeTab, onTabChange, onSubmitPostClick }: TabNavProps) => {
  const { role } = useUserRole();
  const location = useLocation();
  const isAdmin = role === 'admin';
  const isManager1 = role === 'manager_1';
  const isAccountManager = role === 'account_manager';
  const isOnSlideshowGenerator = location.pathname === '/slideshow-generator';

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear all app-related localStorage to ensure clean state
      localStorage.removeItem('betai-auth');
      localStorage.removeItem('betai-user-role');
      localStorage.removeItem('pendingProfileSetup');

      // Clear any keys that start with 'onboarding_seen_'
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('onboarding_seen_')) {
          localStorage.removeItem(key);
        }
      });

      toast.success("Signed out successfully");

      // Force a full page reload to clear all React state
      window.location.href = '/login';
    } catch (error: any) {
      toast.error("Failed to sign out: " + error.message);
    }
  };

  const tabs = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Calendar", icon: Calendar },
    { name: "Account", icon: User },
    ...(isAdmin || isManager1 ? [
      { name: "Creators", icon: Users },
      { name: "Leaderboard", icon: Trophy },
      { name: "Payouts", icon: DollarSign }
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
      {/* Mobile Layout - Compact single header row + tabs */}
      <div className="md:hidden px-safe pb-2">
        {/* Header Row - Logo, Submit, Sign Out all in one line */}
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          <Link to="/" className="block flex-shrink-0">
            <img
              src={assets.logo}
              alt="Lastr Logo"
              className="w-8 h-8 hover:opacity-80 transition-opacity drop-shadow-[0_0_14px_rgba(139,92,246,0.3)]"
            />
          </Link>

          {/* Submit Post - Compact pill button */}
          {onSubmitPostClick && (
            <Button
              onClick={onSubmitPostClick}
              size="sm"
              className="gap-1.5 h-8 px-3 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Submit
            </Button>
          )}

          {/* Sign Out - Icon only on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs Row - Compact */}
        <div className="flex items-center justify-center px-3 pb-2">
          <div className="inline-flex items-center bg-secondary/50 p-0.5 rounded-lg border border-border/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;

              return (
                <button
                  key={tab.name}
                  onClick={() => onTabChange(tab.name)}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-md transition-all duration-200",
                    isActive
                      ? "bg-primary/90 text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
            {/* Create Slideshow - In tabs for Account Managers */}
            {isAccountManager && (
              <Link
                to="/slideshow-generator"
                className={cn(
                  "flex items-center justify-center p-2 rounded-md transition-all duration-200",
                  isOnSlideshowGenerator
                    ? "bg-primary/10 text-primary"
                    : "text-primary hover:bg-primary/10"
                )}
              >
                <Sparkles className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center px-6 py-4 gap-4">
        {/* Left Side - Logo + Submit Post Button */}
        <div className="flex items-center gap-4 w-48">
          <Link to="/" className="block flex-shrink-0">
            <img
              src={assets.logo}
              alt="Lastr Logo"
              className="w-11 h-11 hover:opacity-80 transition-opacity drop-shadow-[0_0_16px_rgba(139,92,246,0.3)]"
            />
          </Link>
          {onSubmitPostClick && (
            <Button
              onClick={onSubmitPostClick}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Submit Post
            </Button>
          )}
        </div>

        {/* Tabs - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="inline-flex items-center bg-secondary/50 p-1 rounded-lg border border-border/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;

              return (
                <button
                  key={tab.name}
                  onClick={() => onTabChange(tab.name)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/90 text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{tab.name}</span>
                </button>
              );
            })}
            {/* Create Slideshow - In tabs for Account Managers */}
            {isAccountManager && (
              <Link
                to="/slideshow-generator"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isOnSlideshowGenerator
                    ? "bg-primary/10 text-primary"
                    : "text-primary hover:bg-primary/10"
                )}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden lg:inline">Create</span>
              </Link>
            )}
          </div>
        </div>

        {/* Right Side - Sign Out */}
        <div className="flex items-center justify-end w-48">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TabNav;
