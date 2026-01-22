import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Plus, FileText, BookOpen, CheckCircle2, UserCircle } from "lucide-react";
import TabNav from "@/components/dashboard/TabNav";
import FilterBar, { ContentTypeFilter } from "@/components/dashboard/FilterBar";
import StatsGrid from "@/components/dashboard/StatsGrid";
import ViralVideosSection from "@/components/dashboard/ViralVideosSection";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import DailySpendChart from "@/components/dashboard/DailySpendChart";
import DailyPostsChart from "@/components/dashboard/DailyPostsChart";
import DailyMetricsModal from "@/components/dashboard/DailyMetricsModal";
import ActionItemsModal from "@/components/dashboard/ActionItemsModal";
import { useActionItems } from "@/hooks/useActionItems";
import CalendarView from "@/components/dashboard/CalendarView";
import AccountView from "@/components/dashboard/AccountView";
import Applications from "@/pages/admin/Applications";
import Leaderboard from "@/pages/admin/Leaderboard";
import AMPayouts from "@/pages/admin/AMPayouts";
import OnboardingChecklist from "@/components/dashboard/OnboardingChecklist";
import AMOnboardingChecklist from "@/components/dashboard/AMOnboardingChecklist";
import OnboardingProgress from "@/components/dashboard/OnboardingProgress";
import ContentGuideModal from "@/components/dashboard/ContentGuideModal";
import SlideshowGuideModal from "@/components/dashboard/SlideshowGuideModal";
import ScriptTemplatesModal from "@/components/dashboard/ScriptTemplatesModal";
import EditingTutorialModal from "@/components/dashboard/EditingTutorialModal";
import SubmitPostModal from "@/components/dashboard/SubmitPostModal";
import AMSubmitPostModal from "@/components/dashboard/AMSubmitPostModal";
import AMStatsGrid from "@/components/dashboard/AMStatsGrid";
import SlideshowGenerator from "@/pages/SlideshowGenerator";
import StreakTracker from "@/components/dashboard/StreakTracker";
import MilestoneBadges from "@/components/dashboard/MilestoneBadges";
import PageLoader from "@/components/ui/PageLoader";
import WeeklyRecapBanner from "@/components/dashboard/WeeklyRecapBanner";
import WeeklyRecapModal from "@/components/dashboard/WeeklyRecapModal";
import WelcomeNotificationModal from "@/components/dashboard/WelcomeNotificationModal";
import DiscordConnectModal from "@/components/dashboard/DiscordConnectModal";
import CreateAccountsModal from "@/components/dashboard/CreateAccountsModal";
import { FloatingActionButton, FloatingAction } from "@/components/ui/floating-action-button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useChartAnalytics } from "@/hooks/useChartAnalytics";
import { useWeeklyRecap } from "@/hooks/useWeeklyRecap";
import { useAMTeamAssignments } from "@/hooks/useAMTeamAssignments";
import { supabase } from "@/lib/supabase";

// Helper function to convert date preset to ISO date range
const convertPresetToDateRange = (preset: string): [string, string] => {
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: Date;

  switch (preset) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last7':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last30':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'last3months':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'alltime':
      startDate = new Date('2020-01-01');
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
  }

  return [startDate.toISOString(), endDate];
};

// Map URL paths to tab names
const pathToTab: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/account': 'Account',
  '/dashboard/creators': 'Creators',
  '/dashboard/leaderboard': 'Leaderboard',
  '/dashboard/am-payouts': 'Payouts',
};

// Map tab names to URL paths
const tabToPath: Record<string, string> = {
  'Overview': '/dashboard',
  'Calendar': '/dashboard/calendar',
  'Account': '/dashboard/account',
  'Creators': '/dashboard/creators',
  'Leaderboard': '/dashboard/leaderboard',
  'Payouts': '/dashboard/am-payouts',
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Get active tab from URL path
  const activeTab = pathToTab[location.pathname] || 'Overview';

  // Scroll to top when tab/path changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Handle tab change by navigating to the new URL
  const handleTabChange = (tab: string) => {
    const newPath = tabToPath[tab] || '/dashboard';
    // Preserve search params when changing tabs
    const search = searchParams.toString();
    navigate(search ? `${newPath}?${search}` : newPath);
  };

  const initialPreset = searchParams.get("date") || "last7";
  const [selectedDateRange, setSelectedDateRange] = useState<string[]>(() => convertPresetToDateRange(initialPreset));
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>(initialPreset);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(searchParams.get("account") || null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(searchParams.get("creator") || null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(() => {
    const platforms = searchParams.get("platforms");
    return platforms ? platforms.split(",") : [];
  });
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(searchParams.get("team") || null);
  const [selectedContentType, setSelectedContentType] = useState<ContentTypeFilter>(
    (searchParams.get("contentType") as ContentTypeFilter) || 'slideshow'
  );
  const { profile, loading } = useUserProfile();
  const { isAdmin, isManager1, isAccountManager, isUGCCreator: isUGCCreatorRole, loading: roleLoading } = useUserRole();

  // Fetch team assignments for Account Managers
  const { assignments: teamAssignments } = useAMTeamAssignments();

  // Auto-select first team for Account Managers if no team is selected
  useEffect(() => {
    if (isAccountManager && teamAssignments.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teamAssignments[0].id);
    }
  }, [isAccountManager, teamAssignments, selectedTeamId]);

  // Safety check: Redirect pending UGC creators to application-pending page
  // This is a backup check in case ProtectedRoute is bypassed
  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user, error } = await supabase
        .from('users')
        .select('application_status, role')
        .eq('id', session.user.id)
        .single();

      if (error || !user) {
        // No user profile - sign out
        console.log('No user profile found, signing out');
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
        return;
      }

      // Redirect pending UGC creators
      if (user.role === 'ugc_creator' && user.application_status === 'pending') {
        navigate('/application-pending', { replace: true });
        return;
      }

      // Sign out rejected users
      if (user.application_status === 'rejected') {
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
      }
    };

    checkUserStatus();
  }, [navigate]);

  // Weekly recap - only for admins, shows on Fridays
  const {
    data: weeklyRecapData,
    loading: weeklyRecapLoading,
    shouldShow: showWeeklyRecap,
    dismiss: dismissRecap,
    fetchForDate: fetchRecapForDate,
  } = useWeeklyRecap({ enabled: isAdmin });
  const [weeklyRecapModalOpen, setWeeklyRecapModalOpen] = useState(false);

  // Handle week change in recap modal
  const handleRecapWeekChange = (date: Date) => {
    fetchRecapForDate(date);
  };

  // Redirect non-admins/managers away from admin-only routes (but wait for role to load first)
  useEffect(() => {
    if (roleLoading) return; // Don't redirect while still loading
    const adminOnlyRoutes = ['/dashboard/creators', '/dashboard/leaderboard', '/dashboard/am-payouts'];
    if (!isAdmin && !isManager1 && adminOnlyRoutes.includes(location.pathname)) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, isAdmin, isManager1, roleLoading, navigate]);

  // Refresh trigger for data refetch without page reload
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Helper to update URL params (for filter persistence)
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === "last7") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Chart analytics - fetch real data for the graph (views only)
  const {
    data: chartData,
    totalValue: chartTotalValue,
    loading: chartLoading,
    error: chartError,
  } = useChartAnalytics({
    datePreset: selectedDatePreset,
    dateRange: selectedDateRange,
    creatorFilter: isAdmin ? selectedCreator : null,
    accountFilter: selectedAccount,
    platformFilter: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
    contentTypeFilter: selectedContentType !== 'all' ? selectedContentType : undefined,
    metric: 'views', // Always views - chart only shows views
    refreshTrigger,
  });

  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [amOnboardingModalOpen, setAMOnboardingModalOpen] = useState(false);
  const [contentGuideModalOpen, setContentGuideModalOpen] = useState(false);
  const [slideshowGuideModalOpen, setSlideshowGuideModalOpen] = useState(false);
  const [scriptTemplatesModalOpen, setScriptTemplatesModalOpen] = useState(false);
  const [editingTutorialModalOpen, setEditingTutorialModalOpen] = useState(false);
  const [submitPostModalOpen, setSubmitPostModalOpen] = useState(false);
  const [createAccountsModalOpen, setCreateAccountsModalOpen] = useState(false);
  const [discordModalDismissed, setDiscordModalDismissed] = useState(false);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isUGCCreator, setIsUGCCreator] = useState(false);
  const [progressRefreshTrigger, setProgressRefreshTrigger] = useState(0);

  // Get action items count for notification badge (admin only)
  const { totalCount: actionItemsCount } = useActionItems();

  // Check if Discord is connected - show modal if not (for UGC creators and Account Managers)
  const isDiscordConnected = !!profile?.user?.discord_id;
  const isProfileUGCCreator = profile?.user?.role === 'ugc_creator';
  const isProfileAccountManager = profile?.user?.role === 'account_manager';
  const shouldShowDiscordModal = (isProfileUGCCreator || isProfileAccountManager) && profile?.user?.id && !isDiscordConnected && !discordModalDismissed;

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Always set userId for modals that need it
      setUserId(user.id);

      // Set role flags
      const userRole = profile?.user.role;
      setIsUGCCreator(userRole === 'ugc_creator');

      // Handle UGC Creator onboarding
      if (userRole === 'ugc_creator') {
        const { data: checklist } = await supabase
          .from('onboarding_checklist')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const isOnboardingComplete = checklist &&
          (checklist as any).contract_signed_at &&
          checklist.watched_examples_at &&
          checklist.joined_discord_at &&
          (checklist as any).accounts_created_at &&
          checklist.warmup_started_at &&
          checklist.watched_tutorial_at &&
          checklist.posted_first_video_at &&
          checklist.submitted_first_link_at;

        if (!isOnboardingComplete) {
          setOnboardingModalOpen(true);
        }
        return;
      }

      // Handle Account Manager onboarding
      if (userRole === 'account_manager') {
        // Use REST API since am_onboarding_checklist isn't in generated types yet
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/am_onboarding_checklist?user_id=eq.${user.id}&select=*`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${session?.access_token}`,
            },
          }
        );

        const amChecklists = await response.json();
        const amChecklist = amChecklists?.[0] as {
          contract_signed_at: string | null;
          joined_discord_at: string | null;
          confirmed_account_pairs_at: string | null;
          accounts_assigned_at: string | null;
          watched_tutorial_at: string | null;
          submitted_first_post_at: string | null;
        } | undefined;

        const isAMOnboardingComplete = amChecklist &&
          amChecklist.contract_signed_at &&
          amChecklist.joined_discord_at &&
          amChecklist.confirmed_account_pairs_at &&
          amChecklist.accounts_assigned_at &&
          amChecklist.watched_tutorial_at &&
          amChecklist.submitted_first_post_at;

        if (!isAMOnboardingComplete) {
          setAMOnboardingModalOpen(true);
        }
        return;
      }
    };

    if (!loading && profile) {
      checkOnboardingStatus();
    }
  }, [profile, loading]);

  const handleDateChange = (dates: string[], presetId?: string) => {
    setSelectedDateRange(dates);
    if (presetId) {
      setSelectedDatePreset(presetId);
      updateUrlParams({ date: presetId });
    }
  };

  const handleAccountChange = (accountId: string | null) => {
    setSelectedAccount(accountId);
    updateUrlParams({ account: accountId });
  };

  const handleCreatorChange = (creatorId: string | null) => {
    setSelectedCreator(creatorId);
    // Clear account selection when changing creator
    setSelectedAccount(null);
    updateUrlParams({ creator: creatorId, account: null });
  };

  const handlePlatformChange = (platforms: string[]) => {
    setSelectedPlatforms(platforms);
    updateUrlParams({ platforms: platforms.length > 0 ? platforms.join(",") : null });
  };

  const handleContentTypeChange = (contentType: ContentTypeFilter) => {
    setSelectedContentType(contentType);
    updateUrlParams({ contentType: contentType === 'ugc_video' ? null : contentType });
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Dashboard-specific meta tags for iOS bookmark icon */}
      <Helmet>
        <title>Lastr - Account Manager Dashboard</title>
        <meta name="description" content="Track your social media performance with real-time analytics, engagement metrics, and viral video insights." />
        <meta name="apple-mobile-web-app-title" content="Lastr" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta property="og:title" content="Lastr - Account Manager Dashboard" />
        <meta property="og:description" content="Track your social media performance with real-time analytics, engagement metrics, and viral video insights." />
        <meta property="og:image" content="https://lastr.app/icons/apple-touch-icon-180.png" />
      </Helmet>

      {/* TabNav is now the main header for logged-in users */}
      <TabNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSubmitPostClick={() => setSubmitPostModalOpen(true)}
      />

      {loading ? (
        <PageLoader fullScreen={false} />
      ) : (
        <>
          {activeTab === "Overview" && (
            <main className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              {/* Weekly Recap Banner - Shows on Fridays for admins and ops managers */}
              {(isAdmin || isManager1) && (
                <WeeklyRecapBanner
                  visible={showWeeklyRecap}
                  onView={() => setWeeklyRecapModalOpen(true)}
                  onDismiss={dismissRecap}
                />
              )}

              {/* UGC Creator Progress & Gamification - All in one line */}
              {isUGCCreator && userId && (
                <div className="px-4 md:px-6 mt-6 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Onboarding Progress - Always show */}
                    <OnboardingProgress
                      userId={userId}
                      onClick={() => setOnboardingModalOpen(true)}
                      refreshTrigger={progressRefreshTrigger}
                    />
                    <StreakTracker userId={userId} />
                    <MilestoneBadges userId={userId} />
                  </div>
                </div>
              )}

              {/* FilterBar - Moved below gamification */}
              <FilterBar
                onDateChange={handleDateChange}
                onAccountChange={handleAccountChange}
                onCreatorChange={handleCreatorChange}
                selectedCreator={selectedCreator}
                selectedAccount={selectedAccount}
                selectedDatePreset={selectedDatePreset}
                selectedPlatforms={selectedPlatforms}
                onPlatformChange={handlePlatformChange}
                onRefreshData={handleRefreshData}
                onContentGuideClick={() => setContentGuideModalOpen(true)}
                onScriptTemplatesClick={() => setScriptTemplatesModalOpen(true)}
                onChecklistClick={() => setOnboardingModalOpen(true)}
                onAMChecklistClick={() => setAMOnboardingModalOpen(true)}
                onCreateAccountsClick={() => setCreateAccountsModalOpen(true)}
                onSlideshowGuideClick={() => setSlideshowGuideModalOpen(true)}
                selectedTeamId={selectedTeamId}
                onTeamChange={setSelectedTeamId}
                selectedContentType={selectedContentType}
                onContentTypeChange={handleContentTypeChange}
                onMetricsClick={() => setMetricsModalOpen(true)}
                onNotificationsClick={() => setNotificationsModalOpen(true)}
                notificationCount={actionItemsCount}
              />

              {/* Stats Grid - Different view for Account Managers */}
              {isAccountManager ? (
                <>
                  <AMStatsGrid key={`am-stats-${refreshTrigger}-${selectedTeamId}`} selectedTeamId={selectedTeamId} />
                  {/* Slideshow Generator embedded below AM stats */}
                  <div className="px-4 md:px-6 pt-6">
                    <SlideshowGenerator embedded />
                  </div>
                </>
              ) : (
                <StatsGrid
                  dateRange={isUGCCreator ? undefined : selectedDateRange}
                  accountIds={selectedAccount ? [selectedAccount] : undefined}
                  platformFilter={selectedPlatforms.length > 0 && selectedPlatforms.length < 2 ? selectedPlatforms : undefined}
                  creatorFilter={selectedCreator}
                  onRefreshData={handleRefreshData}
                  refreshTrigger={refreshTrigger}
                  contentTypeFilter={selectedContentType !== 'all' ? selectedContentType : undefined}
                />
              )}
              {/* Analytics Chart - Visible for admin and ops manager */}
              {(isAdmin || isManager1) && (
                <AnalyticsChart
                  selectedMetric="views"
                  selectedDateRange={selectedDateRange}
                  datePreset={selectedDatePreset}
                  chartData={chartData}
                  totalValue={chartTotalValue}
                  loading={chartLoading}
                  error={chartError}
                />
              )}
              {/* Daily Spend Chart - Visible for admin and ops manager */}
              {(isAdmin || isManager1) && (
                <DailySpendChart
                  creatorFilter={selectedCreator}
                  accountFilter={selectedAccount}
                  platformFilter={selectedPlatforms}
                  contentTypeFilter={selectedContentType !== 'all' ? selectedContentType : undefined}
                  refreshTrigger={refreshTrigger}
                />
              )}
              {/* Daily Posts Chart - Visible for admin and ops manager */}
              {(isAdmin || isManager1) && (
                <DailyPostsChart
                  creatorFilter={selectedCreator}
                  accountFilter={selectedAccount}
                  platformFilter={selectedPlatforms}
                  contentTypeFilter={selectedContentType !== 'all' ? selectedContentType : undefined}
                  refreshTrigger={refreshTrigger}
                />
              )}
              {/* Viral Videos - Only for UGC creators */}
              {isUGCCreatorRole && <ViralVideosSection />}
            </main>
          )}

          {activeTab === "Calendar" && <CalendarView />}

          {activeTab === "Account" && <AccountView />}

          {activeTab === "Creators" && <Applications />}

          {activeTab === "Leaderboard" && <Leaderboard />}

          {activeTab === "Payouts" && <AMPayouts />}

          {/* Onboarding Checklist Modal - For UGC Creators */}
          {profile?.user?.id && (
            <OnboardingChecklist
              userId={profile.user.id}
              open={onboardingModalOpen}
              onOpenChange={setOnboardingModalOpen}
              onProgressUpdate={() => setProgressRefreshTrigger(prev => prev + 1)}
              onOpenContentGuide={() => setContentGuideModalOpen(true)}
              onOpenEditingTutorial={() => setEditingTutorialModalOpen(true)}
            />
          )}

          {/* AM Onboarding Checklist Modal - For Account Managers */}
          {profile?.user?.id && isAccountManager && (
            <AMOnboardingChecklist
              userId={profile.user.id}
              open={amOnboardingModalOpen}
              onOpenChange={setAMOnboardingModalOpen}
              onOpenSlideshowTutorial={() => setEditingTutorialModalOpen(true)}
            />
          )}

          {/* Content Guide Modal - Available for UGC creators and admins */}
          {(isUGCCreatorRole || isAdmin) && (
            <ContentGuideModal
              open={contentGuideModalOpen}
              onOpenChange={setContentGuideModalOpen}
            />
          )}

          {/* Daily Metrics Modal - Admin and Ops Manager */}
          {(isAdmin || isManager1) && (
            <DailyMetricsModal
              open={metricsModalOpen}
              onOpenChange={setMetricsModalOpen}
              refreshTrigger={refreshTrigger}
            />
          )}

          {/* Action Items / Notifications Modal - Admin and Ops Manager */}
          {(isAdmin || isManager1) && (
            <ActionItemsModal
              open={notificationsModalOpen}
              onOpenChange={setNotificationsModalOpen}
            />
          )}

          {/* Slideshow Guide Modal - Available for Account Managers and admins */}
          {(isAccountManager || isAdmin) && (
            <SlideshowGuideModal
              open={slideshowGuideModalOpen}
              onOpenChange={setSlideshowGuideModalOpen}
            />
          )}

          {/* Script Templates Modal - Available for UGC creators and admins */}
          {(isUGCCreatorRole || isAdmin) && (
            <ScriptTemplatesModal
              open={scriptTemplatesModalOpen}
              onOpenChange={setScriptTemplatesModalOpen}
              onOpenEditingTutorial={() => setEditingTutorialModalOpen(true)}
            />
          )}

          {/* Editing Tutorial Modal - Available for UGC creators and admins */}
          {(isUGCCreatorRole || isAdmin) && (
            <EditingTutorialModal
              open={editingTutorialModalOpen}
              onOpenChange={setEditingTutorialModalOpen}
            />
          )}

          {/* Submit Post Modal - Different modal for Account Managers */}
          {isAccountManager ? (
            <AMSubmitPostModal
              open={submitPostModalOpen}
              onOpenChange={setSubmitPostModalOpen}
              onSubmitSuccess={handleRefreshData}
            />
          ) : (
            <SubmitPostModal
              open={submitPostModalOpen}
              onOpenChange={setSubmitPostModalOpen}
              onSubmitSuccess={handleRefreshData}
            />
          )}

          {/* Weekly Recap Modal - For admins and ops managers */}
          {(isAdmin || isManager1) && (
            <WeeklyRecapModal
              open={weeklyRecapModalOpen}
              onOpenChange={setWeeklyRecapModalOpen}
              data={weeklyRecapData}
              loading={weeklyRecapLoading}
              onDismiss={dismissRecap}
              onWeekChange={handleRecapWeekChange}
            />
          )}

          {/* Welcome Notification Modal - For all creators */}
          {userId && <WelcomeNotificationModal userId={userId} />}

          {/* Discord Connect Modal - Shows for UGC creators who haven't connected Discord */}
          {shouldShowDiscordModal && profile?.user?.id && (
            <DiscordConnectModal
              userId={profile.user.id}
              open={true}
              onOpenChange={(open) => {
                if (!open) setDiscordModalDismissed(true);
              }}
            />
          )}

          {/* Create Accounts Modal - For UGC creators to generate TikTok/Instagram profiles */}
          {profile?.user?.full_name && (
            <CreateAccountsModal
              open={createAccountsModalOpen}
              onOpenChange={setCreateAccountsModalOpen}
              userFullName={profile.user.full_name}
            />
          )}

          {/* Floating Action Button - Mobile only */}
          {activeTab === "Overview" && (
            <FloatingActionButton
              actions={[
                ...(isUGCCreator ? [
                  {
                    icon: <Plus className="w-5 h-5" />,
                    label: "Submit Post",
                    onClick: () => setSubmitPostModalOpen(true),
                    className: "bg-primary hover:bg-primary/90 text-primary-foreground",
                  },
                  {
                    icon: <UserCircle className="w-5 h-5" />,
                    label: "New Profile",
                    onClick: () => setCreateAccountsModalOpen(true),
                  },
                  {
                    icon: <BookOpen className="w-5 h-5" />,
                    label: "Content Guide",
                    onClick: () => setContentGuideModalOpen(true),
                  },
                  {
                    icon: <FileText className="w-5 h-5" />,
                    label: "Scripts",
                    onClick: () => setScriptTemplatesModalOpen(true),
                  },
                  {
                    icon: <CheckCircle2 className="w-5 h-5" />,
                    label: "Checklist",
                    onClick: () => setOnboardingModalOpen(true),
                  },
                ] as FloatingAction[] : []),
                ...(!isUGCCreator ? [
                  {
                    icon: <Plus className="w-5 h-5" />,
                    label: "Submit Post",
                    onClick: () => setSubmitPostModalOpen(true),
                    className: "bg-primary hover:bg-primary/90 text-primary-foreground",
                  },
                ] as FloatingAction[] : []),
              ]}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Index;
