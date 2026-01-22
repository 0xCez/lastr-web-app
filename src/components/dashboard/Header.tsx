import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface HeaderProps {
  userName?: string;
}

const Header = ({ userName }: HeaderProps) => {
  const navigate = useNavigate();

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

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center">
          <span className="text-xl font-bold text-foreground">B</span>
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center bg-secondary/50 rounded-full px-1 py-1">
          <Button variant="navActive" size="sm" className="rounded-full">
            Creator program
          </Button>
          <Button variant="nav" size="sm" className="rounded-full">
            Features
          </Button>
          <Button variant="nav" size="sm" className="rounded-full">
            Product
          </Button>
        </nav>
      </div>

      {/* Right Side - User Info and Sign Out */}
      <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
};

export default Header;
