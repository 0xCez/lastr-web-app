import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Clock, FileText, Mail, Sparkles, ArrowRight, Video, DollarSign } from "lucide-react";
import PageLoader from "@/components/ui/PageLoader";
import Navbar from "@/components/homepage/Navbar";
import { Button } from "@/components/ui/button";
import UGCOpportunityModal from "@/components/dashboard/UGCOpportunityModal";

const ApplicationPending = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [checking, setChecking] = useState(true);
  const [showContractModal, setShowContractModal] = useState(false);

  useEffect(() => {
    const checkApplicationStatus = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          navigate("/login");
          return;
        }

        // Fetch user profile to check application status
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('application_status, email, role')
          .eq('id', authUser.id)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          navigate("/login");
          return;
        }

        setUserEmail(user.email);

        // If already approved, redirect to dashboard
        if (user.application_status === 'approved') {
          navigate("/dashboard");
          return;
        }

        // If rejected, show login page with message
        if (user.application_status === 'rejected') {
          navigate("/login");
          return;
        }

        // If not a UGC creator, they shouldn't be here
        if (user.role !== 'ugc_creator') {
          navigate("/dashboard");
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error('Error checking application status:', error);
        navigate("/login");
      }
    };

    checkApplicationStatus();

    // Set up real-time listener for approval status changes
    const channel = supabase
      .channel('application-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          // Check if this update is for the current user and status changed to approved
          if (payload.new.application_status === 'approved') {
            // Redirect to dashboard
            navigate("/dashboard");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  if (checking) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar activePage="dashboard" />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-2xl">

          {/* Hero Section */}
          <div className="text-center mb-8">
            {/* Animated Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-full flex items-center justify-center ring-4 ring-green-500/10">
                  <CheckCircle2 className="w-14 h-14 text-green-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse">
                  <Clock className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
              Application Submitted!
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Thanks for applying to join our creator program. We're excited to review your application!
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">

            {/* Email Notification Banner */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Check Your Inbox</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll send updates to <span className="font-medium text-foreground">{userEmail}</span>
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-xs text-muted-foreground">Response time</span>
                  <p className="text-sm font-semibold text-primary">24-48 hours</p>
                </div>
              </div>
            </div>

            {/* Timeline Steps */}
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                What Happens Next
              </h3>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg shadow-primary/25">
                      1
                    </div>
                    <div className="w-0.5 h-full bg-gradient-to-b from-primary/50 to-border mt-2" />
                  </div>
                  <div className="flex-1 pb-6">
                    <h4 className="font-semibold text-foreground mb-1">Application Review</h4>
                    <p className="text-sm text-muted-foreground">
                      Our team reviews your application within 24-48 hours to ensure you're a great fit.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center font-bold text-sm border border-border">
                      2
                    </div>
                    <div className="w-0.5 h-full bg-border mt-2" />
                  </div>
                  <div className="flex-1 pb-6">
                    <h4 className="font-semibold text-foreground mb-1">Get Approved</h4>
                    <p className="text-sm text-muted-foreground">
                      Once approved, you'll receive an email with your login credentials and next steps.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center font-bold text-sm border border-border">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Start Creating & Earning</h4>
                    <p className="text-sm text-muted-foreground">
                      Access the platform, post videos, and start earning $500-$5,000/month!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 border-t border-border">
              <div className="p-5 border-r border-border text-center hover:bg-secondary/30 transition-colors">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="text-2xl font-bold text-foreground">12</span>
                </div>
                <p className="text-xs text-muted-foreground">Videos/week (~1hr)</p>
              </div>
              <div className="p-5 text-center hover:bg-secondary/30 transition-colors">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-2xl font-bold text-foreground">$5K</span>
                </div>
                <p className="text-xs text-muted-foreground">Monthly earning cap</p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="p-6 bg-gradient-to-r from-secondary/50 to-secondary/30 border-t border-border">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => setShowContractModal(true)}
                  className="flex-1 gap-2 shadow-lg"
                >
                  <FileText className="w-4 h-4" />
                  View Contract Details
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="flex-1 gap-2"
                >
                  <a href="mailto:contact@betaiapp.com">
                    <Mail className="w-4 h-4" />
                    Contact Support
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Review the contract details while you wait. Start brainstorming video ideas!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Have questions? Email us at{" "}
              <a href="mailto:contact@betaiapp.com" className="text-primary hover:underline font-medium">
                contact@betaiapp.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Contract Details Modal */}
      <UGCOpportunityModal
        open={showContractModal}
        onOpenChange={setShowContractModal}
      />
    </div>
  );
};

export default ApplicationPending;
