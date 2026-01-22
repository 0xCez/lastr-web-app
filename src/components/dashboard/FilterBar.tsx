import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, RefreshCw, FileText, MessageCircle, ExternalLink, BookOpen, CheckCircle2, UserCircle, Building2, Video, Image, BarChart3, Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUserRole, UserRole } from "@/contexts/UserRoleContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAllAccounts } from "@/hooks/useAllAccounts";
import { useAllUsers } from "@/hooks/useAllUsers";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import AccountManagerOpportunityModal from "./AccountManagerOpportunityModal";
import { useAMTeamAssignments } from "@/hooks/useAMTeamAssignments";

const platformOptions = [
  { id: "instagram", label: "Instagram", icon: "📷" },
  { id: "tiktok", label: "TikTok", icon: "♪" },
];

const DISCORD_GUILD_ID = '1319045377549803562';

const dateOptions = [
  { id: "today", label: "Today" },
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "last3months", label: "Last 3 months" },
  { id: "alltime", label: "All time" },
];

const mockNotifications = [
  { id: 1, message: "Missed 2 posts on 24/11/2025", action: "Profile", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
  { id: 2, message: "Missed 2 posts on 24/11/2025", action: "Profile", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
  { id: 3, message: "5 Comments unanswered", action: "Post", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
  { id: 4, message: "5 Comments unanswered", action: "Post", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
];

export type ContentTypeFilter = 'all' | 'ugc_video' | 'slideshow';

interface FilterBarProps {
  onDateChange?: (dates: string[], presetId?: string) => void;
  onAccountChange?: (accountId: string | null) => void;
  onCreatorChange?: (creatorId: string | null) => void;
  selectedCreator?: string | null;
  selectedAccount?: string | null;
  selectedDatePreset?: string;
  selectedPlatforms?: string[];
  onPlatformChange?: (platforms: string[]) => void;
  onRefreshData?: () => void;
  onContentGuideClick?: () => void;
  onScriptTemplatesClick?: () => void;
  onChecklistClick?: () => void;
  onAMChecklistClick?: () => void;
  onCreateAccountsClick?: () => void;
  onSlideshowGuideClick?: () => void;
  selectedTeamId?: string | null;
  onTeamChange?: (teamId: string | null) => void;
  selectedContentType?: ContentTypeFilter;
  onContentTypeChange?: (contentType: ContentTypeFilter) => void;
  onMetricsClick?: () => void;
  onNotificationsClick?: () => void;
  notificationCount?: number;
}

const FilterBar = ({
  onDateChange,
  onAccountChange,
  onCreatorChange,
  selectedCreator,
  selectedAccount: selectedAccountProp,
  selectedDatePreset: selectedDatePresetProp,
  selectedPlatforms: selectedPlatformsProp,
  onPlatformChange,
  onRefreshData,
  onContentGuideClick,
  onScriptTemplatesClick,
  onChecklistClick,
  onAMChecklistClick,
  onCreateAccountsClick,
  onSlideshowGuideClick,
  selectedTeamId,
  onTeamChange,
  selectedContentType = 'all',
  onContentTypeChange,
  onMetricsClick,
  onNotificationsClick,
  notificationCount = 0,
}: FilterBarProps) => {
  const { role, isAccountManager, devModeEnabled, setDevRole } = useUserRole();
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const [accountSearch, setAccountSearch] = useState("");
  const [ugcSearch, setUgcSearch] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  // Team assignments for Account Managers
  const { assignments: teamAssignments } = useAMTeamAssignments();

  // Use props directly as source of truth (controlled component pattern)
  const selectedPlatforms = selectedPlatformsProp || [];
  const selectedAccount = selectedAccountProp || null;
  const selectedDatePreset = selectedDatePresetProp || "last7";

  // Get accounts using the useAllAccounts hook (handles admin vs non-admin automatically)
  const { accounts: allAccountsData, loading: accountsLoading } = useAllAccounts();
  const userAccounts = allAccountsData;

  // Get all users (for Creator dropdown - admin only)
  const { users: allUsers } = useAllUsers();

  // Filter accounts based on search, selected creator, and selected platform
  const filteredAccounts = userAccounts.filter(account => {
    const matchesSearch = account.handle.toLowerCase().includes(accountSearch.toLowerCase());
    const matchesCreator = !selectedCreator || (account as any).user_id === selectedCreator;
    // If exactly one platform is selected, only show handles from that platform
    const matchesPlatform = selectedPlatforms.length !== 1 || account.platform === selectedPlatforms[0];
    return matchesSearch && matchesCreator && matchesPlatform;
  });

  // Filter users/creators based on search
  const filteredUsers = allUsers.filter(user =>
    user.email?.toLowerCase().includes(ugcSearch.toLowerCase())
  );

  const togglePlatform = (id: string) => {
    const newPlatforms = selectedPlatforms.includes(id)
      ? selectedPlatforms.filter(p => p !== id)
      : [...selectedPlatforms, id];
    onPlatformChange?.(newPlatforms);
  };

  const handleAccountSelect = (accountId: string | null) => {
    onAccountChange?.(accountId);
  };

  const getSelectedAccountLabel = () => {
    if (!selectedAccount) return "All Handles";
    const account = userAccounts.find(acc => acc.id === selectedAccount);
    return account ? account.handle : "All Handles";
  };

  const getSelectedCreatorLabel = () => {
    if (!selectedCreator) return "All Creators";
    const user = allUsers.find(u => u.id === selectedCreator);
    return user?.email || "All Creators";
  };

  const handleCreatorSelect = (userId: string | null) => {
    onCreatorChange?.(userId);
    // Also clear account selection when changing creator (parent handles this)
  };

  // Convert date preset to ISO date range [startDate, endDate]
  const convertDatePresetToRange = (presetId: string): [string, string] => {
    const now = new Date();
    const endDate = now.toISOString();
    let startDate: Date;

    switch (presetId) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'last7':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'last30':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'last3months':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'alltime':
        startDate = new Date('2020-01-01'); // Platform start date
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30)); // Default to last 30 days
    }

    return [startDate.toISOString(), endDate];
  };

  const toggleDate = (id: string) => {
    // If clicking the same date, keep it selected (don't deselect)
    // This ensures we always have a date filter active
    if (selectedDatePreset === id) return;

    // Convert preset to ISO date range and pass to parent with preset ID
    const [startDate, endDate] = convertDatePresetToRange(id);
    onDateChange?.([startDate, endDate], id);
  };

  const selectAllPlatforms = () => {
    if (selectedPlatforms.length === platformOptions.length) {
      onPlatformChange?.([]);
    } else {
      onPlatformChange?.(platformOptions.map(p => p.id));
    }
  };

  // Poll analytics jobs until all complete
  const pollJobsUntilComplete = async (runDate: string, startBatchNumber: number, totalJobs: number): Promise<boolean> => {
    const POLL_INTERVAL = 3000; // 3 seconds
    const MAX_POLLS = 120; // 6 minutes max (120 * 3s)

    for (let i = 0; i < MAX_POLLS; i++) {
      // Query job status using REST API (analytics_jobs not in typed client)
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_jobs?run_date=eq.${runDate}&triggered_by=eq.manual&batch_number=gte.${startBatchNumber}&batch_number=lt.${startBatchNumber + totalJobs}&select=status,batch_number`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Error polling jobs:', response.statusText);
        return false;
      }

      const jobs: Array<{ status: string; batch_number: number }> = await response.json();

      if (!jobs || jobs.length === 0) {
        return false;
      }

      const completed = jobs.filter(j => j.status === 'completed').length;
      const failed = jobs.filter(j => j.status === 'failed').length;
      const pending = jobs.filter(j => j.status === 'pending').length;
      const processing = jobs.filter(j => j.status === 'processing').length;

      // Update progress toast
      toast({
        title: "Processing analytics...",
        description: `${completed}/${totalJobs} jobs complete${processing > 0 ? `, ${processing} in progress` : ''}${pending > 0 ? `, ${pending} pending` : ''}`,
      });

      // All done?
      if (pending === 0 && processing === 0) {
        if (failed > 0) {
          toast({
            title: "Analytics complete with errors",
            description: `${completed} jobs succeeded, ${failed} failed. Check logs for details.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Analytics complete!",
            description: `Successfully processed ${completed} job${completed > 1 ? 's' : ''}.`,
          });
        }
        return true;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }

    // Timeout
    toast({
      title: "Processing taking longer than expected",
      description: "Jobs are still processing. Refresh the page later to see updated data.",
    });
    return false;
  };

  const handleFetchAnalytics = async () => {
    setIsSyncing(true);

    // Determine which accounts to fetch based on current filters
    let accountIdsToFetch: string[] | undefined = undefined;

    if (selectedAccount) {
      // If specific account selected, only fetch for that account
      accountIdsToFetch = [selectedAccount];
    } else if (selectedCreator) {
      // If creator selected, fetch for all their accounts
      accountIdsToFetch = userAccounts
        .filter(acc => (acc as any).user_id === selectedCreator)
        .map(acc => acc.id);
    } else if (selectedPlatforms.length === 1) {
      // If single platform selected, fetch for all accounts on that platform
      accountIdsToFetch = userAccounts
        .filter(acc => acc.platform === selectedPlatforms[0])
        .map(acc => acc.id);
    }
    // Otherwise accountIdsToFetch stays undefined = fetch all accessible posts

    const filterDescription = accountIdsToFetch
      ? `${accountIdsToFetch.length} filtered account${accountIdsToFetch.length > 1 ? 's' : ''}`
      : 'all your posts';

    toast({
      title: "Queuing analytics jobs...",
      description: `Preparing to sync analytics for ${filterDescription}.`,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Call the orchestrator to create analytics jobs
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-analytics-jobs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            accountIds: accountIdsToFetch,
            triggeredBy: 'manual',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const result = await response.json();

      if (result.jobsCreated === 0) {
        toast({
          title: result.message ? "Info" : "No posts to process",
          description: result.message || "No posts found within the CPM window.",
        });
        setIsSyncing(false);
        return;
      }

      // Jobs created - now poll until complete
      toast({
        title: "Processing analytics...",
        description: `${result.jobsCreated} job${result.jobsCreated > 1 ? 's' : ''} queued for ${result.totalPosts} posts. Please wait...`,
      });

      // Poll until all jobs complete
      const startBatch = result.startBatchNumber || 1;
      const success = await pollJobsUntilComplete(result.runDate, startBatch, result.jobsCreated);

      // Only refresh data when jobs are complete
      if (success) {
        if (onRefreshData) {
          onRefreshData();
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };


  return (
    <>
      <div className="px-3 md:px-6 py-2 md:py-4">
        {/* Single horizontal scrolling row on mobile */}
        <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none md:flex-wrap">
          {/* Account Handle Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="filter" size="sm" className="gap-1.5 h-9 md:h-10 text-xs flex-shrink-0">
                {getSelectedAccountLabel()}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3 bg-card border-border z-50" align="start">
              <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search Handles"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="pl-8 bg-secondary border-border text-sm"
                />
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => handleAccountSelect(null)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary transition-colors",
                    !selectedAccount && "bg-secondary"
                  )}
                >
                  All Handles
                </button>
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => handleAccountSelect(account.id)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary transition-colors flex items-center gap-2",
                        selectedAccount === account.id && "bg-secondary"
                      )}
                    >
                      {account.platform === "instagram" ? (
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
                          <defs>
                            <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                              <stop offset="0%" style={{ stopColor: '#FED576' }} />
                              <stop offset="25%" style={{ stopColor: '#F47133' }} />
                              <stop offset="50%" style={{ stopColor: '#BC3081' }} />
                              <stop offset="100%" style={{ stopColor: '#4C63D2' }} />
                            </linearGradient>
                          </defs>
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      )}
                      <span className="truncate">{account.handle}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground px-2 py-1.5">No handles found.</p>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Platform Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="filter" size="sm" className="gap-1.5 h-9 md:h-10 text-xs flex-shrink-0">
                {selectedPlatforms.length === 0 || selectedPlatforms.length === 2 ? (
                  // Show both logos when nothing selected or all selected
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span>&</span>
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="url(#instagram-gradient-button)">
                      <defs>
                        <linearGradient id="instagram-gradient-button" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#FED576' }} />
                          <stop offset="25%" style={{ stopColor: '#F47133' }} />
                          <stop offset="50%" style={{ stopColor: '#BC3081' }} />
                          <stop offset="100%" style={{ stopColor: '#4C63D2' }} />
                        </linearGradient>
                      </defs>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                ) : selectedPlatforms.includes('tiktok') ? (
                  // Show TikTok logo and label
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span>TikTok</span>
                  </div>
                ) : (
                  // Show Instagram logo and label
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="url(#instagram-gradient-button-single)">
                      <defs>
                        <linearGradient id="instagram-gradient-button-single" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" style={{ stopColor: '#FED576' }} />
                          <stop offset="25%" style={{ stopColor: '#F47133' }} />
                          <stop offset="50%" style={{ stopColor: '#BC3081' }} />
                          <stop offset="100%" style={{ stopColor: '#4C63D2' }} />
                        </linearGradient>
                      </defs>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span>Instagram</span>
                  </div>
                )}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3 bg-card border-border z-50" align="start">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedPlatforms.length === platformOptions.length}
                    onCheckedChange={selectAllPlatforms}
                  />
                  <span className="text-sm text-foreground">Select All</span>
                </label>
                {platformOptions.map((platform) => (
                  <label key={platform.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => togglePlatform(platform.id)}
                    />
                    {platform.id === "instagram" ? (
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="url(#instagram-gradient-platform)">
                        <defs>
                          <linearGradient id="instagram-gradient-platform" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#FED576' }} />
                            <stop offset="25%" style={{ stopColor: '#F47133' }} />
                            <stop offset="50%" style={{ stopColor: '#BC3081' }} />
                            <stop offset="100%" style={{ stopColor: '#4C63D2' }} />
                          </linearGradient>
                        </defs>
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                      </svg>
                    )}
                    <span className="text-sm text-foreground">{platform.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Date Dropdown - Hidden for UGC creators (they don't need time filtering) */}
          {role !== 'ugc_creator' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="filter" size="sm" className="gap-1.5 h-9 md:h-10 text-xs flex-shrink-0">
                  {dateOptions.find(d => d.id === selectedDatePreset)?.label || "Last 7 days"}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3 bg-card border-border z-50" align="start">
                <div className="space-y-3">
                  {dateOptions.map((date) => (
                    <label key={date.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedDatePreset === date.id}
                        onCheckedChange={() => toggleDate(date.id)}
                      />
                      <span className="text-sm text-foreground">{date.label}</span>
                    </label>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Creator Dropdown - For Admins and Ops Managers */}
          {(role === 'admin' || role === 'manager_1') && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="filter" size="sm" className="gap-1.5 h-9 md:h-10 text-xs flex-shrink-0">
                  {getSelectedCreatorLabel()}
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 bg-card border-border z-50" align="start">
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search Creators"
                    value={ugcSearch}
                    onChange={(e) => setUgcSearch(e.target.value)}
                    className="pl-8 bg-secondary border-border text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCreatorSelect(null)}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary transition-colors",
                      !selectedCreator && "bg-secondary"
                    )}
                  >
                    All Creators
                  </button>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleCreatorSelect(user.id)}
                        className={cn(
                          "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary transition-colors",
                          selectedCreator === user.id && "bg-secondary"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="truncate">{user.email}</span>
                          <span className="text-xs text-muted-foreground capitalize">{user.role?.replace('_', ' ')}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground px-2 py-1.5">No creators found.</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Content Type Dropdown - Admin and Ops Manager */}
          {(role === 'admin' || role === 'manager_1') && onContentTypeChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="filter" size="sm" className="gap-1.5 h-9 md:h-10 text-xs flex-shrink-0">
                  {selectedContentType === 'all' ? (
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      <span>&</span>
                      <Image className="w-4 h-4" />
                    </div>
                  ) : selectedContentType === 'ugc_video' ? (
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      <span>UGC</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      <span>Slideshows</span>
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3 bg-card border-border z-50" align="start">
                <div className="space-y-2">
                  <button
                    onClick={() => onContentTypeChange('all')}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary transition-colors flex items-center gap-2",
                      selectedContentType === 'all' && "bg-secondary"
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <Video className="w-4 h-4" />
                      <span>&</span>
                      <Image className="w-4 h-4" />
                    </div>
                    <span>All Content</span>
                  </button>
                  <button
                    onClick={() => onContentTypeChange('ugc_video')}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary transition-colors flex items-center gap-2",
                      selectedContentType === 'ugc_video' && "bg-secondary"
                    )}
                  >
                    <Video className="w-4 h-4" />
                    <span>UGC Videos</span>
                  </button>
                  <button
                    onClick={() => onContentTypeChange('slideshow')}
                    className={cn(
                      "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary transition-colors flex items-center gap-2",
                      selectedContentType === 'slideshow' && "bg-secondary"
                    )}
                  >
                    <Image className="w-4 h-4" />
                    <span>Slideshows</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Fetch Analytics Button - Admin and Ops Manager */}
          {(role === 'admin' || role === 'manager_1') && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 md:h-10 flex-shrink-0"
              onClick={handleFetchAnalytics}
              disabled={isSyncing}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
              <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Fetch Analytics"}</span>
              <span className="sm:hidden">{isSyncing ? "..." : "Sync"}</span>
            </Button>
          )}

          {/* Team Selector - For Account Managers with team assignments */}
          {isAccountManager && teamAssignments.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="filter" size="sm" className="gap-1.5 h-9 md:h-10 text-xs flex-shrink-0">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  {teamAssignments.find((t) => t.id === selectedTeamId)?.team_name || teamAssignments[0]?.team_name || "Select Team"}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 bg-card border-border z-50" align="start">
                <div className="space-y-2">
                  {teamAssignments.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => onTeamChange?.(team.id)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary transition-colors flex items-center justify-between",
                        selectedTeamId === team.id && "bg-secondary"
                      )}
                    >
                      <span>{team.team_name}</span>
                      <span className="text-xs text-muted-foreground">{team.league}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

        {/* DEV MODE: Role Switcher */}
        {devModeEnabled && (
          <Select value={role || undefined} onValueChange={(value: UserRole) => setDevRole(value)}>
            <SelectTrigger className="w-24 bg-yellow-500/20 border-yellow-500/50 text-yellow-500 text-xs">
              <SelectValue placeholder="DEV" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="ugc_creator">UGC Creator</SelectItem>
              <SelectItem value="influencer">Influencer</SelectItem>
              <SelectItem value="account_manager">Account Manager</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Contract Details Button - Only for Account Managers */}
        {isAccountManager && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowContractModal(true)}
            className="gap-2 bg-secondary/50 hover:bg-secondary/70 border border-border/50 hover:border-border"
            title="View Contract Details"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Contract</span>
          </Button>
        )}

        {/* Onboarding Checklist Button - For Account Managers */}
        {isAccountManager && onAMChecklistClick && (
          <Button
            variant="ghost"
            onClick={onAMChecklistClick}
            className="gap-2 h-9 md:h-10 px-3 md:px-4 bg-gradient-to-r from-violet-500/20 to-violet-500/10 hover:from-violet-500/30 hover:to-violet-500/20 border border-violet-500/40 hover:border-violet-500/60 flex-shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.15)] hover:shadow-[0_0_15px_rgba(139,92,246,0.25)] transition-all duration-300"
            title="View Onboarding Checklist"
          >
            <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-violet-500" />
            <span className="text-sm font-medium text-violet-500 hidden sm:inline">Checklist</span>
          </Button>
        )}

        {/* Slideshow Guide Button - For Account Managers */}
        {isAccountManager && onSlideshowGuideClick && (
          <Button
            variant="ghost"
            onClick={onSlideshowGuideClick}
            className="gap-2 h-9 md:h-10 px-3 md:px-4 bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 hover:from-emerald-500/30 hover:to-emerald-500/20 border border-emerald-500/40 hover:border-emerald-500/60 flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.15)] hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all duration-300"
            title="View Slideshow Guide"
          >
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-500 hidden sm:inline">Guide</span>
          </Button>
        )}

        {/* Discord Channel Button - For Account Managers with linked Discord */}
        {isAccountManager && profile?.user?.discord_channel_id && (
          <a
            href={`https://discord.com/channels/${DISCORD_GUILD_ID}/${profile.user.discord_channel_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 md:px-4 h-9 md:h-10 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors text-sm font-medium flex-shrink-0"
          >
            <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Discord</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
          </a>
        )}

          {/* Spacer - hidden on mobile */}
          <div className="hidden md:block flex-1" />

          {/* Script Templates Button - For UGC Creators only */}
          {role === 'ugc_creator' && onScriptTemplatesClick && (
            <Button
              variant="ghost"
              onClick={onScriptTemplatesClick}
              className="gap-2 h-9 md:h-10 px-3 md:px-4 bg-gradient-to-r from-green-500/20 to-green-500/10 hover:from-green-500/30 hover:to-green-500/20 border border-green-500/40 hover:border-green-500/60 flex-shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.15)] hover:shadow-[0_0_15px_rgba(34,197,94,0.25)] transition-all duration-300"
              title="View Script Templates"
            >
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
              <span className="text-sm font-medium text-green-500 hidden sm:inline">Scripts</span>
            </Button>
          )}

          {/* Content Guide Button - For UGC Creators only */}
          {role === 'ugc_creator' && onContentGuideClick && (
            <Button
              variant="ghost"
              onClick={onContentGuideClick}
              className="gap-2 h-9 md:h-10 px-3 md:px-4 bg-gradient-to-r from-blue-500/20 to-blue-500/10 hover:from-blue-500/30 hover:to-blue-500/20 border border-blue-500/40 hover:border-blue-500/60 flex-shrink-0 shadow-[0_0_10px_rgba(59,130,246,0.15)] hover:shadow-[0_0_15px_rgba(59,130,246,0.25)] transition-all duration-300"
              title="View Content Guide"
            >
              <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-500 hidden sm:inline">Guide</span>
            </Button>
          )}

          {/* Onboarding Checklist Button - Only for UGC Creators */}
          {role === 'ugc_creator' && onChecklistClick && (
            <Button
              variant="ghost"
              onClick={onChecklistClick}
              className="gap-2 h-9 md:h-10 px-3 md:px-4 bg-gradient-to-r from-violet-500/20 to-violet-500/10 hover:from-violet-500/30 hover:to-violet-500/20 border border-violet-500/40 hover:border-violet-500/60 flex-shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.15)] hover:shadow-[0_0_15px_rgba(139,92,246,0.25)] transition-all duration-300"
              title="View Onboarding Checklist"
            >
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-violet-500" />
              <span className="text-sm font-medium text-violet-500 hidden sm:inline">Checklist</span>
            </Button>
          )}

          {/* New Profile Generator Button - For UGC Creators */}
          {role === 'ugc_creator' && onCreateAccountsClick && (
            <Button
              variant="ghost"
              onClick={onCreateAccountsClick}
              className="gap-2 h-9 md:h-10 px-3 md:px-4 bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 hover:from-cyan-500/30 hover:to-cyan-500/20 border border-cyan-500/40 hover:border-cyan-500/60 flex-shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all duration-300"
              title="Generate TikTok & Instagram Profile Info"
            >
              <UserCircle className="w-4 h-4 md:w-5 md:h-5 text-cyan-500" />
              <span className="text-sm font-medium text-cyan-500 hidden sm:inline">New Profile</span>
            </Button>
          )}

          {/* Discord Channel Button - For UGC Creators with linked Discord */}
          {role === 'ugc_creator' && profile?.user?.discord_channel_id && (
            <a
              href={`https://discord.com/channels/${DISCORD_GUILD_ID}/${profile.user.discord_channel_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 md:px-4 h-9 md:h-10 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors text-sm font-medium flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Discord</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
            </a>
          )}

          {/* Daily Metrics Button - Admin and Ops Manager (far right) */}
          {(role === 'admin' || role === 'manager_1') && onMetricsClick && (
            <Button
              variant="ghost"
              onClick={onMetricsClick}
              className="gap-2 h-9 md:h-10 px-3 md:px-4 bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 hover:border-amber-500/60 flex-shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.15)] hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all duration-300"
              title="View Daily Metrics"
            >
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-500 hidden sm:inline">Metrics</span>
            </Button>
          )}

          {/* Notifications/Action Items Button - Admin and Ops Manager (far right) */}
          {(role === 'admin' || role === 'manager_1') && onNotificationsClick && (
            <Button
              variant="ghost"
              onClick={onNotificationsClick}
              className="gap-2 h-9 md:h-10 px-3 md:px-4 bg-gradient-to-r from-rose-500/20 to-rose-500/10 hover:from-rose-500/30 hover:to-rose-500/20 border border-rose-500/40 hover:border-rose-500/60 flex-shrink-0 shadow-[0_0_10px_rgba(244,63,94,0.15)] hover:shadow-[0_0_15px_rgba(244,63,94,0.25)] transition-all duration-300 relative"
              title="View Action Items"
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5 text-rose-500" />
              <span className="text-sm font-medium text-rose-500 hidden sm:inline">Notifications</span>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Contract Details Modal - For Account Managers */}
      <AccountManagerOpportunityModal
        open={showContractModal}
        onOpenChange={setShowContractModal}
      />
    </>
  );
};

export default FilterBar;
