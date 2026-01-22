import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import PageLoader from "@/components/ui/PageLoader";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check current session and user status
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Fetch user profile to check application status and role
        const { data: user, error } = await supabase
          .from('users')
          .select('application_status, role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user:', error);
          // User exists in auth but not in users table - incomplete onboarding
          // Redirect to onboarding or sign them out
          if (error.code === 'PGRST116') {
            // No rows returned - user profile doesn't exist
            console.log('User profile not found, signing out');
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }
          setLoading(false);
          return;
        }

        setApplicationStatus(user.application_status);
        setUserRole(user.role);
      } catch (error) {
        console.error('Error in checkAuth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        setApplicationStatus(null);
        setUserRole(null);
      } else {
        checkAuth();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state while checking auth
  if (loading || isAuthenticated === null) {
    return <PageLoader />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if this is an admin-only route
  if (adminOnly && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has pending application (UGC creators only)
  // Allow access to application-pending page, but block access to other protected pages
  if (applicationStatus === 'pending' && userRole === 'ugc_creator') {
    // If they're trying to access the application-pending page, allow it
    if (location.pathname === '/application-pending') {
      return <>{children}</>;
    }
    // Otherwise, redirect them to the pending page
    return <Navigate to="/application-pending" replace />;
  }

  // Check if user application was rejected
  if (applicationStatus === 'rejected') {
    // Sign them out and redirect to login
    supabase.auth.signOut();
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
