import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Mail, MapPin, DollarSign, Clock, Pause, Trash2, AlertTriangle, Video, Smartphone, MessageCircleHeart, Eye, Send, User, Calendar, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import AdminOnboardingChecklist from "./AdminOnboardingChecklist";
import OnboardingStepDots from "./OnboardingStepDots";
import TeamAssignmentModal from "./TeamAssignmentModal";
import { useAMTeamAssignments } from "@/hooks/useAMTeamAssignments";

type UserRole = 'ugc_creator' | 'account_manager';

// Discord logo SVG component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const sendContract = async (userId: string, email: string, fullName: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-contract', {
      body: {
        userId,
        email,
        fullName,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send contract:', error);
    throw error;
  }
};

const sendAMContract = async (userId: string, email: string, fullName: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-am-contract', {
      body: {
        userId,
        email,
        fullName,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send AM contract:', error);
    throw error;
  }
};

interface ApplicationCardProps {
  application: {
    id: string;
    full_name: string;
    email: string;
    country: string;
    contract_option: string | null;
    created_at: string;
    paypal_info: string;
    application_status: 'pending' | 'approved' | 'rejected';
    age_range: string | null;
    gender: string | null;
    approved_at: string | null;
    posts_count: number;
    role?: UserRole;
    discord_id?: string | null;
  };
  onStatusChange: () => void;
  viewOnly?: boolean;
}

// Checklist data type for step dots
interface ChecklistData {
  discord_scheduled_at?: string | null;
  voice_note_sent_at?: string | null;
  handles_verified_at?: string | null;
  app_access_at?: string | null;
  content_validated_at?: string | null;
  first_post_submitted_at?: string | null;
}

const ApplicationCard = ({ application, onStatusChange, viewOnly = false }: ApplicationCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<'pending' | 'approved' | 'rejected'>(application.application_status);
  const [isDeleted, setIsDeleted] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showTeamAssignment, setShowTeamAssignment] = useState(false);
  const [checklistData, setChecklistData] = useState<ChecklistData | null>(null);
  const [isSendingWelcome, setIsSendingWelcome] = useState(false);
  const [welcomeStatus, setWelcomeStatus] = useState<{ sent: boolean; viewed: boolean; viewedAt?: string } | null>(null);

  // Fetch team assignments for Account Managers
  const { assignments: teamAssignments, refetch: refetchTeams } = useAMTeamAssignments(
    application.role === 'account_manager' ? application.id : undefined
  );

  // Fetch checklist data for approved users
  useEffect(() => {
    const fetchChecklistStatus = async () => {
      if (currentStatus !== 'approved') return;

      const { data: checklist } = await supabase
        .from('admin_onboarding_checklist')
        .select('*')
        .eq('user_id', application.id)
        .single();

      if (checklist) {
        setChecklistData({
          discord_scheduled_at: checklist.discord_scheduled_at,
          voice_note_sent_at: (checklist as any).voice_note_sent_at,
          handles_verified_at: checklist.handles_verified_at,
          app_access_at: checklist.app_access_at,
          content_validated_at: checklist.content_validated_at,
          first_post_submitted_at: checklist.first_post_submitted_at,
        });
      } else {
        setChecklistData(null);
      }
    };

    fetchChecklistStatus();
  }, [application.id, currentStatus, showChecklist]);

  // Fetch welcome notification status for approved users
  useEffect(() => {
    const fetchWelcomeStatus = async () => {
      if (currentStatus !== 'approved') return;

      const { data } = await supabase
        .from('notifications')
        .select('is_read, read_at')
        .eq('user_id', application.id)
        .eq('type', 'system')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setWelcomeStatus({
          sent: true,
          viewed: data[0].is_read,
          viewedAt: data[0].read_at || undefined
        });
      } else {
        setWelcomeStatus({ sent: false, viewed: false });
      }
    };

    fetchWelcomeStatus();
  }, [application.id, currentStatus, isSendingWelcome]);

  // Check if user is inactive (approved 4+ days ago, 0 posts)
  const isInactive = (() => {
    if (currentStatus !== 'approved' || !application.approved_at) return false;
    if (application.posts_count > 0) return false;

    const approvedDate = new Date(application.approved_at);
    const now = new Date();
    const daysSinceApproval = Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceApproval >= 4;
  })();

  const getDaysSinceApproval = () => {
    if (!application.approved_at) return 0;
    const approvedDate = new Date(application.approved_at);
    const now = new Date();
    return Math.floor((now.getTime() - approvedDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatContractOption = (option: string | null) => {
    if (!option) return 'N/A';
    if (option === 'option1') return '$300 + CPM';
    if (option === 'option2') return '$500 fixed';
    if (option === '1_pair' || option === '1') return '1 Pair';
    if (option === '2_pairs' || option === '2') return '2 Pairs';
    return option;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1d ago';
    return `${diffInDays}d ago`;
  };

  const updateApplicationStatus = async (newStatus: 'pending' | 'approved' | 'rejected') => {
    setIsProcessing(true);
    try {
      if (newStatus === 'approved') {
        const { error } = await supabase.rpc('approve_ugc_application', {
          p_user_id: application.id
        });
        if (error) throw error;

        // Send welcome notification automatically on approval
        await supabase
          .from('notifications')
          .insert({
            user_id: application.id,
            type: 'system',
            title: 'Welcome to the Platform! 🎉',
            message: `Hey ${application.full_name.split(' ')[0]}, glad to have you on our platform! Connect your Discord from your checklist to join our community and get your private support channel!`,
            metadata: {
              cta_text: 'Open Checklist',
              cta_url: '/dashboard',
              admin_sent: true
            }
          });

        // Onboarding email is sent automatically by database trigger
        toast.success(`${application.full_name} approved! Welcome notification sent.`);

        // Send the appropriate contract based on user role
        try {
          if (application.role === 'account_manager') {
            await sendAMContract(application.id, application.email, application.full_name);
            toast.success(`AM contract sent!`);
          } else {
            await sendContract(application.id, application.email, application.full_name);
            toast.success(`Contract sent!`);
          }
        } catch (contractError) {
          console.error('Contract send failed:', contractError);
        }
      } else if (newStatus === 'rejected') {
        const { error } = await supabase.rpc('reject_ugc_application', {
          p_user_id: application.id,
          p_rejection_reason: 'Application did not meet requirements'
        });
        if (error) throw error;
        toast.success(`${application.full_name} rejected`);
      } else {
        const { error } = await supabase.rpc('set_application_pending', {
          p_user_id: application.id
        });
        if (error) throw error;
        toast.success(`${application.full_name} set to pending`);
      }

      setCurrentStatus(newStatus);
      setTimeout(() => onStatusChange(), 100);
    } catch (error: any) {
      console.error('Error updating application status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = () => updateApplicationStatus('approved');
  const handleReject = () => updateApplicationStatus('rejected');
  const handleSetPending = () => updateApplicationStatus('pending');

  const handleDelete = async () => {
    if (!confirm(`Delete ${application.full_name}'s application permanently?`)) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc('delete_user_completely', {
        p_user_id: application.id
      });

      if (error) throw error;

      setIsDeleted(true);
      toast.success(`Deleted ${application.full_name}`);
      setTimeout(() => onStatusChange(), 300);
    } catch (error: any) {
      console.error('Error deleting application:', error);
      toast.error(error.message || 'Failed to delete');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendWelcome = async () => {
    setIsSendingWelcome(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: application.id,
          type: 'system',
          title: 'Welcome to the Platform! 🎉',
          message: `Hey ${application.full_name.split(' ')[0]}, glad to have you on our platform! Connect your Discord from your checklist to join our community and get your private support channel!`,
          metadata: {
            cta_text: 'Open Checklist',
            cta_url: '/dashboard',
            admin_sent: true
          }
        });

      if (error) throw error;
      toast.success(`Welcome sent to ${application.full_name}!`);
    } catch (error: any) {
      console.error('Error sending welcome notification:', error);
      toast.error('Failed to send welcome');
    } finally {
      setIsSendingWelcome(false);
    }
  };

  if (isDeleted) return null;

  // Welcome status badge component - compact version
  const WelcomeBadge = () => {
    if (!welcomeStatus) return null;

    if (welcomeStatus.viewed) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
          <Eye className="w-3 h-3" />
          Viewed
        </span>
      );
    }

    if (welcomeStatus.sent) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <Send className="w-3 h-3" />
          Sent
        </span>
      );
    }

    return null;
  };

  return (
    <div
      className={`glass-card p-4 transition-all duration-300 ${
        currentStatus === 'approved'
          ? 'bg-green-500/10 border-green-500/30'
          : currentStatus === 'rejected'
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-yellow-500/10 border-yellow-500/30'
      }`}
    >
      {/* Header Row: Name, Role, Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate">{application.full_name}</h3>
          {application.role && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
              application.role === 'ugc_creator'
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {application.role === 'ugc_creator' ? (
                <><Video className="w-3 h-3" /></>
              ) : (
                <><Smartphone className="w-3 h-3" /></>
              )}
            </span>
          )}
          {/* Discord connection status icon */}
          <span
            className={`flex-shrink-0 ${application.discord_id ? 'text-[#5865F2]' : 'text-muted-foreground/40'}`}
            title={application.discord_id ? 'Discord connected' : 'Discord not connected'}
          >
            <DiscordIcon className="w-4 h-4" />
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Status badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            currentStatus === 'approved'
              ? 'bg-green-500/20 text-green-400'
              : currentStatus === 'rejected'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {currentStatus === 'approved' && <CheckCircle2 className="w-3 h-3" />}
            {currentStatus === 'rejected' && <XCircle className="w-3 h-3" />}
            {currentStatus === 'pending' && <Clock className="w-3 h-3" />}
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </span>
        </div>
      </div>

      {/* Info Row: Email, Location, Contract, Time */}
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground ${currentStatus === 'approved' ? 'mb-3' : ''}`}>
        <span className="flex items-center gap-1">
          <Mail className="w-3 h-3" />
          <span className="break-all">{application.email}</span>
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {application.country}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          {formatContractOption(application.contract_option)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(application.created_at)}
        </span>
        {application.gender && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {application.gender}
          </span>
        )}
        {application.age_range && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {application.age_range}
          </span>
        )}
      </div>

      {/* Badges Row: Onboarding Steps + Welcome status, Inactivity warning */}
      {currentStatus === 'approved' && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Onboarding steps + welcome badge grouped together */}
          <div className="flex items-center gap-1.5">
            <OnboardingStepDots
              checklist={checklistData}
              onClick={() => setShowChecklist(true)}
            />
            <WelcomeBadge />
          </div>

          {/* Inactivity warning badge */}
          {isInactive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <AlertTriangle className="w-3 h-3" />
              {getDaysSinceApproval()}d inactive
            </span>
          )}

          {/* Team chips for Account Managers - clickable to open team modal */}
          {application.role === 'account_manager' && teamAssignments.length > 0 && (
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-400" />
              {teamAssignments.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setShowTeamAssignment(true)}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 hover:border-blue-500/50 transition-colors cursor-pointer"
                >
                  {team.team_name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Row - Hidden for view-only users */}
      {!viewOnly && (
        <div className="flex items-center gap-2 pt-3 border-t border-border/30">
          {currentStatus === 'approved' && (
            <div className="flex items-center gap-2 w-full">
              {application.role === 'ugc_creator' && (
                <Button
                  onClick={handleSendWelcome}
                  disabled={isSendingWelcome}
                  size="sm"
                  variant="outline"
                  className="flex-1 min-w-0 text-purple-500 border-purple-500/50 hover:bg-purple-500/10 text-xs h-8"
                >
                  <MessageCircleHeart className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  {isSendingWelcome ? '...' : welcomeStatus?.sent ? 'Resend' : 'Welcome'}
                </Button>
              )}
              {application.role === 'account_manager' && (
                <Button
                  onClick={() => setShowTeamAssignment(true)}
                  size="sm"
                  variant="outline"
                  className="flex-1 min-w-0 text-blue-500 border-blue-500/50 hover:bg-blue-500/10 text-xs h-8"
                >
                  <Building2 className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                  Team
                </Button>
              )}
              <Button
                onClick={handleSetPending}
                disabled={isProcessing}
                size="sm"
                variant="outline"
                className="flex-1 min-w-0 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10 text-xs h-8"
              >
                <Pause className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                Suspend
              </Button>
              <Button
                onClick={handleReject}
                disabled={isProcessing}
                size="sm"
                variant="outline"
                className="flex-1 min-w-0 text-red-500 border-red-500/50 hover:bg-red-500/10 text-xs h-8"
              >
                <XCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                Reject
              </Button>
            </div>
          )}

          {currentStatus === 'pending' && (
            <div className="flex items-center gap-2 w-full">
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                size="sm"
                className="flex-1 min-w-0 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                Approve
              </Button>
              <Button
                onClick={handleReject}
                disabled={isProcessing}
                size="sm"
                variant="outline"
                className="flex-1 min-w-0 text-red-500 border-red-500/50 hover:bg-red-500/10 text-xs h-8"
              >
                <XCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                Reject
              </Button>
            </div>
          )}

          {currentStatus === 'rejected' && (
            <div className="flex items-center gap-2 w-full">
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                size="sm"
                className="flex-1 min-w-0 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                Approve
              </Button>
              <Button
                onClick={handleSetPending}
                disabled={isProcessing}
                size="sm"
                variant="outline"
                className="flex-1 min-w-0 text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10 text-xs h-8"
              >
                <Pause className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                Pending
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isProcessing}
                size="sm"
                variant="outline"
                className="flex-1 min-w-0 text-red-600 border-red-700/50 hover:bg-red-700/20 text-xs h-8"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                Delete
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Admin Onboarding Checklist Modal */}
      <AdminOnboardingChecklist
        userId={application.id}
        userName={application.full_name}
        open={showChecklist}
        onOpenChange={setShowChecklist}
      />

      {/* Team Assignment Modal - Only for Account Managers */}
      {application.role === 'account_manager' && (
        <TeamAssignmentModal
          userId={application.id}
          userName={application.full_name}
          open={showTeamAssignment}
          onOpenChange={setShowTeamAssignment}
          onAssigned={() => {
            refetchTeams();
            onStatusChange();
          }}
        />
      )}
    </div>
  );
};

export default ApplicationCard;
