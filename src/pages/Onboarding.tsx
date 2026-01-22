import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

const Onboarding = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // User is logged in - fetch their profile to check application status
          const { data: profile, error } = await supabase
            .from('users')
            .select('application_status, role')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
            setIsChecking(false);
            return;
          }

          // Redirect based on application status
          if (profile.application_status === 'pending') {
            navigate('/application-pending', { replace: true });
          } else if (profile.application_status === 'approved') {
            navigate('/dashboard', { replace: true });
          } else if (profile.application_status === 'rejected') {
            // Log out rejected users and send them to login
            await supabase.auth.signOut();
            navigate('/login', { replace: true });
          }
        } else {
          // No session - user can proceed to onboarding
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  // Show loading state while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <OnboardingForm />;
};

export default Onboarding;
