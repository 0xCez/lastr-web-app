import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/homepage/Navbar";
import assets from "@/assets";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Redirect if already logged in - check application status first
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check user's application status before redirecting
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, application_status')
          .eq('id', session.user.id)
          .single();

        // If user doesn't exist in users table, sign them out
        if (error || !userData) {
          console.log('User profile not found, signing out');
          await supabase.auth.signOut();
          return; // Stay on login page
        }

        // UGC creators with pending status go to application pending page
        if (userData.role === 'ugc_creator' && userData.application_status === 'pending') {
          navigate("/application-pending");
          return;
        }

        // Rejected users get signed out
        if (userData.application_status === 'rejected') {
          await supabase.auth.signOut();
          return; // Stay on login page
        }

        // Approved users go to dashboard
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Check if there's a pending profile setup from email confirmation flow
        const pendingSetup = localStorage.getItem('pendingProfileSetup');

        if (pendingSetup) {
          try {
            const profileData = JSON.parse(pendingSetup);

            // Only complete profile if it's for this user
            if (profileData.userId === data.user.id) {
              // Convert postsPerDay string to number
              let postsPerDayNumber: number | null = null;
              if (profileData.postsPerDay) {
                const match = profileData.postsPerDay.match(/\d+/);
                postsPerDayNumber = match ? parseInt(match[0]) : null;
              }

              // Complete the user profile
              const { error: profileError } = await supabase.rpc('complete_user_profile', {
                p_user_id: data.user.id,
                p_full_name: profileData.fullName,
                p_email: profileData.email,
                p_country: profileData.country,
                p_paypal_info: profileData.paypalInfo,
                p_posts_per_day: postsPerDayNumber,
                p_devices: profileData.devices ? parseInt(profileData.devices) : null,
                p_contract_option: profileData.contractOption || null,
                p_tiktok_handle: profileData.tiktokHandle || null,
                p_ig_handle: profileData.igHandle || null,
                p_min_views: profileData.minViews ? parseInt(profileData.minViews) : null,
                p_min_posts: profileData.minPosts ? parseInt(profileData.minPosts) : null,
                p_age_range: profileData.ageRange || null,
                p_gender: profileData.gender || null,
              });

              // Clear the pending setup
              localStorage.removeItem('pendingProfileSetup');

              if (profileError) {
                console.error('Profile setup error:', profileError);
                toast.error('Failed to complete profile setup');
              } else {
                toast.success("Profile setup completed!");

                // Check user's role and application status from database
                const { data: userData } = await supabase
                  .from('users')
                  .select('role, application_status')
                  .eq('id', data.user.id)
                  .single();

                // UGC creators with pending status go to application pending
                if (userData?.role === 'ugc_creator' && userData?.application_status === 'pending') {
                  navigate("/application-pending");
                  return;
                }

                // All other roles go to dashboard
                navigate("/dashboard");
                return;
              }
            }
          } catch (error) {
            console.error('Error completing pending profile:', error);
            localStorage.removeItem('pendingProfileSetup');
          }
        }

        // Check user's status in users table before allowing access
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, application_status')
          .eq('id', data.user.id)
          .single();

        // If user doesn't exist in users table, sign them out
        if (userError || !userData) {
          console.log('User profile not found, signing out');
          await supabase.auth.signOut();
          toast.error("Your account setup is incomplete. Please sign up again.");
          return;
        }

        // UGC creators with pending status go to application pending
        if (userData.role === 'ugc_creator' && userData.application_status === 'pending') {
          toast.success("Signed in successfully");
          navigate("/application-pending");
          return;
        }

        // Rejected users get signed out
        if (userData.application_status === 'rejected') {
          await supabase.auth.signOut();
          toast.error("Your application was rejected.");
          return;
        }

        // Approved users go to dashboard
        toast.success("Signed in successfully");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResettingPassword(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Navbar />

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 md:px-8">
          <div className="w-full max-w-md">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Sign in</h2>
            <p className="text-muted-foreground mb-8">
              Please login to continue to your account.
            </p>

            {!showForgotPassword ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <Input
                  type="email"
                  placeholder="johndoe@betaiapp.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground rounded-xl"
                />

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground rounded-xl pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-lg"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>

                <p className="text-center text-muted-foreground text-sm mt-6">
                  Don't have an account yet?{" "}
                  <Link to="/creators" className="text-primary font-medium hover:underline">
                    Sign up
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                  >
                    ← Back to sign in
                  </button>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Reset Password</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-14 bg-secondary/50 border-border/50 text-foreground placeholder:text-muted-foreground rounded-xl"
                />

                <Button
                  type="submit"
                  disabled={isResettingPassword}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-lg"
                >
                  {isResettingPassword ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            )}

          </div>
        </div>

        {/* Right Side - Phone Mockups */}
        <div className="flex-1 hidden lg:flex items-center justify-center relative overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative">
              {/* Left phone - market */}
              <img
                src={assets.iPhoneMockup4}
                alt="Bet.AI App"
                className="absolute -left-40 top-9 h-[432px] w-auto object-contain drop-shadow-2xl transform -rotate-6 opacity-70"
              />

              {/* Center phone - homepage */}
              <img
                src={assets.iPhoneMockup1}
                alt="Bet.AI App"
                className="relative z-10 h-[518px] w-auto object-contain drop-shadow-2xl"
              />

              {/* Right phone - chat */}
              <img
                src={assets.iPhoneMockup12}
                alt="Bet.AI App"
                className="absolute -right-40 top-9 h-[432px] w-auto object-contain drop-shadow-2xl transform rotate-6 opacity-70"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
