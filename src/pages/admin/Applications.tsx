import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import ApplicationCard from "@/components/admin/ApplicationCard";
import ContractResendView from "@/components/admin/ContractResendView";
import AMContractResendView from "@/components/admin/AMContractResendView";
import { RefreshCw, Users, Video, Smartphone, Send, FileText, Search, X, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAllTeamAssignments } from "@/hooks/useAMTeamAssignments";

type UserRole = 'ugc_creator' | 'account_manager';
type ViewMode = 'applications' | 'contracts';
type ContractViewTab = 'ugc' | 'am';

// Discord logo SVG component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

interface Application {
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
  role: UserRole;
  discord_id: string | null;
}

const Applications = () => {
  const { isAdmin: isAdminFromContext, isManager1, loading: roleLoading } = useUserRole();
  const canView = isAdminFromContext || isManager1;
  // manager_1 has full access like admin (not view-only)
  const viewOnly = false;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterRole, setFilterRole] = useState<'ugc_creator' | 'account_manager'>('ugc_creator');
  const [filterDiscord, setFilterDiscord] = useState<'all' | 'joined' | 'not_joined'>('all');
  const [filterTeams, setFilterTeams] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('applications');
  const [contractTab, setContractTab] = useState<ContractViewTab>('ugc');

  // Fetch all team assignments for filtering
  const { assignments: allTeamAssignments } = useAllTeamAssignments();

  // Create a set of user IDs who have team assignments
  const usersWithTeams = new Set(allTeamAssignments.map(a => a.user_id));

  const fetchApplications = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {

      // Fetch applications for the selected role (all statuses), excluding soft-deleted users
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, country, contract_option, created_at, paypal_info, application_status, age_range, gender, approved_at, role, discord_id')
        .in('role', ['ugc_creator', 'account_manager'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load applications: ' + error.message);
        throw error;
      }

      // Fetch posts count for each user
      const userIds = (data || []).map(u => u.id);
      const postsCounts: Record<string, number> = {};

      if (userIds.length > 0) {
        const { data: postsData } = await supabase
          .from('posts')
          .select('submitted_by')
          .in('submitted_by', userIds);

        // Count posts per user
        (postsData || []).forEach(post => {
          postsCounts[post.submitted_by] = (postsCounts[post.submitted_by] || 0) + 1;
        });
      }

      // Transform data to include posts_count and role
      const transformedData: Application[] = (data || []).map(user => ({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        country: user.country,
        contract_option: user.contract_option,
        created_at: user.created_at,
        paypal_info: user.paypal_info,
        application_status: user.application_status,
        age_range: user.age_range,
        gender: user.gender,
        approved_at: user.approved_at,
        posts_count: postsCounts[user.id] || 0,
        role: user.role as UserRole,
        discord_id: user.discord_id,
      }));

      console.log('Fetched applications:', transformedData);
      console.log('Number of applications:', transformedData.length);

      setApplications(transformedData);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch applications once we know user can view (admin or manager_1)
  // Note: Redirect for unauthorized users is handled by Index.tsx
  useEffect(() => {
    if (roleLoading || !canView) return;
    fetchApplications(true);
  }, [roleLoading, canView]);

  const handleRefresh = () => {
    fetchApplications(false);
  };

  // Filter applications based on selected role first, then status, then discord
  const roleFilteredApplications = applications.filter(app => app.role === filterRole);

  const statusFilteredApplications = roleFilteredApplications.filter(app =>
    filterStatus === 'all' || app.application_status === filterStatus
  );

  const discordFilteredApplications = statusFilteredApplications.filter(app => {
    if (filterDiscord === 'all') return true;
    if (filterDiscord === 'joined') return !!app.discord_id;
    if (filterDiscord === 'not_joined') return !app.discord_id;
    return true;
  });

  // Apply teams filter (only for Account Managers)
  const teamsFilteredApplications = discordFilteredApplications.filter(app => {
    if (!filterTeams) return true;
    return usersWithTeams.has(app.id);
  });

  // Apply search filter (searches by name, case-insensitive)
  const filteredApplications = teamsFilteredApplications.filter(app => {
    if (!searchQuery.trim()) return true;
    return app.full_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Discord counts for the current role + status filter
  const discordCounts = {
    all: statusFilteredApplications.length,
    joined: statusFilteredApplications.filter(a => !!a.discord_id).length,
    not_joined: statusFilteredApplications.filter(a => !a.discord_id).length,
  };

  // Teams count (only relevant for Account Managers)
  const teamsCount = discordFilteredApplications.filter(a => usersWithTeams.has(a.id)).length;

  const statusCounts = {
    all: roleFilteredApplications.length,
    pending: roleFilteredApplications.filter(a => a.application_status === 'pending').length,
    approved: roleFilteredApplications.filter(a => a.application_status === 'approved').length,
    rejected: roleFilteredApplications.filter(a => a.application_status === 'rejected').length,
  };

  const roleCounts = {
    ugc_creator: applications.filter(a => a.role === 'ugc_creator').length,
    account_manager: applications.filter(a => a.role === 'account_manager').length,
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading applications...</p>
      </div>
    );
  }

  if (!canView) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-foreground">Applications</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {filteredApplications.length} {filterStatus !== 'all' && filterStatus} {filteredApplications.length === 1 ? 'application' : 'applications'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'applications' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('applications')}
                className="gap-1 md:gap-2 flex-shrink-0"
              >
                <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Applications</span>
              </Button>
              <Button
                variant={viewMode === 'contracts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('contracts')}
                className="gap-1 md:gap-2 flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Contracts</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-1 md:gap-2 flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </div>

          {/* Filters Row - Only show in applications view */}
          {viewMode === 'applications' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 md:mt-4 gap-2">
              {/* Role Tabs + Search Bar */}
              <div className="flex gap-2 items-center overflow-x-auto pb-1 -mb-1 scrollbar-none">
                <Button
                  variant={filterRole === 'ugc_creator' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setFilterRole('ugc_creator'); setFilterStatus('all'); setFilterDiscord('all'); setFilterTeams(false); setSearchQuery(''); }}
                  className="gap-1.5 md:gap-2 flex-shrink-0 text-xs md:text-sm"
                >
                  <Video className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">UGC Creators</span>
                  <span className="sm:hidden">UGC</span>
                  <span className="text-xs opacity-70">({roleCounts.ugc_creator})</span>
                </Button>
                <Button
                  variant={filterRole === 'account_manager' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setFilterRole('account_manager'); setFilterStatus('all'); setFilterDiscord('all'); setFilterTeams(false); setSearchQuery(''); }}
                  className="gap-1.5 md:gap-2 flex-shrink-0 text-xs md:text-sm"
                >
                  <Smartphone className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Account Managers</span>
                  <span className="sm:hidden">AM</span>
                  <span className="text-xs opacity-70">({roleCounts.account_manager})</span>
                </Button>

                {/* Search Bar */}
                <div className="relative w-40 sm:w-48 flex-shrink-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8 h-9 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-secondary rounded"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex gap-1 md:gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
                <Button
                  variant={filterStatus === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                  className="gap-1 text-xs md:text-sm flex-shrink-0"
                >
                  All <span className="text-xs opacity-70">({statusCounts.all})</span>
                </Button>
                <Button
                  variant={filterStatus === 'pending' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus('pending')}
                  className="gap-1 text-xs md:text-sm flex-shrink-0"
                >
                  <span className="hidden sm:inline">Pending</span>
                  <span className="sm:hidden">Pend</span>
                  <span className="text-xs opacity-70">({statusCounts.pending})</span>
                </Button>
                <Button
                  variant={filterStatus === 'approved' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus('approved')}
                  className="gap-1 text-xs md:text-sm flex-shrink-0"
                >
                  <span className="hidden sm:inline">Approved</span>
                  <span className="sm:hidden">Appr</span>
                  <span className="text-xs opacity-70">({statusCounts.approved})</span>
                </Button>
                <Button
                  variant={filterStatus === 'rejected' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterStatus('rejected')}
                  className="gap-1 text-xs md:text-sm flex-shrink-0"
                >
                  <span className="hidden sm:inline">Rejected</span>
                  <span className="sm:hidden">Rej</span>
                  <span className="text-xs opacity-70">({statusCounts.rejected})</span>
                </Button>

                {/* Discord Filter */}
                <div className="w-px h-5 bg-border mx-1" />
                <Button
                  variant={filterDiscord === 'joined' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterDiscord(filterDiscord === 'joined' ? 'all' : 'joined')}
                  className={`gap-1 text-xs md:text-sm flex-shrink-0 ${filterDiscord === 'joined' ? 'text-[#5865F2]' : ''}`}
                  title="Joined Discord"
                >
                  <DiscordIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${filterDiscord === 'joined' ? 'text-[#5865F2]' : ''}`} />
                  <span className="text-xs opacity-70">({discordCounts.joined})</span>
                </Button>
                <Button
                  variant={filterDiscord === 'not_joined' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterDiscord(filterDiscord === 'not_joined' ? 'all' : 'not_joined')}
                  className={`gap-1 text-xs md:text-sm flex-shrink-0 ${filterDiscord === 'not_joined' ? 'text-muted-foreground' : ''}`}
                  title="Not joined Discord"
                >
                  <DiscordIcon className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-40" />
                  <span className="text-xs opacity-70">({discordCounts.not_joined})</span>
                </Button>

                {/* Teams Filter - Only for Account Managers */}
                {filterRole === 'account_manager' && (
                  <>
                    <div className="w-px h-5 bg-border mx-1" />
                    <Button
                      variant={filterTeams ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterTeams(!filterTeams)}
                      className={`gap-1 text-xs md:text-sm flex-shrink-0 ${filterTeams ? 'text-blue-400' : ''}`}
                      title="Has team assigned"
                    >
                      <Building2 className={`w-3.5 h-3.5 md:w-4 md:h-4 ${filterTeams ? 'text-blue-400' : ''}`} />
                      <span className="hidden sm:inline">Teams</span>
                      <span className="text-xs opacity-70">({teamsCount})</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 py-4 md:py-8">
        {viewMode === 'contracts' ? (
          <div>
            {/* Contract View Tabs: UGC vs AM */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={contractTab === 'ugc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setContractTab('ugc')}
                className="gap-2"
              >
                <Video className="w-4 h-4" />
                UGC Contracts
              </Button>
              <Button
                variant={contractTab === 'am' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setContractTab('am')}
                className="gap-2"
              >
                <Smartphone className="w-4 h-4" />
                AM Contracts
              </Button>
            </div>
            {contractTab === 'ugc' ? <ContractResendView /> : <AMContractResendView />}
          </div>
        ) : (
          <>
            {filteredApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                  {filterRole === 'ugc_creator' ? (
                    <Video className="w-10 h-10 text-muted-foreground" />
                  ) : (
                    <Smartphone className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  No {filterStatus !== 'all' && filterStatus} Applications
                </h2>
                <p className="text-muted-foreground text-center max-w-md">
                  {filterStatus === 'all'
                    ? `No ${filterRole === 'ugc_creator' ? 'UGC creator' : 'Account Manager'} applications yet. New applications will appear here.`
                    : `No ${filterStatus} ${filterRole === 'ugc_creator' ? 'UGC creator' : 'Account Manager'} applications found.`
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onStatusChange={fetchApplications}
                    viewOnly={viewOnly}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Applications;
