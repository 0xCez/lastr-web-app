import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useUserRole, UserRole } from "@/contexts/UserRoleContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabase";
import { Plus, X, CheckCircle2, ExternalLink, MessageCircle, Mail } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import EmailSender from "@/pages/EmailSender";

// Discord icon component
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  ugc_creator: "UGC Creator",
  influencer: "Influencer",
  account_manager: "Account Manager",
  manager_1: "Ops Manager",
};

const DISCORD_CLIENT_ID = '1463876904695238656';
const DISCORD_GUILD_ID = '1463875024241954948';
const SUPABASE_URL = 'https://kaapiqtezqydymmxsyrw.supabase.co';

const AccountView = () => {
  const [searchParams] = useSearchParams();
  const { role, isAdmin, isManager1 } = useUserRole();
  const { profile, loading, error, refetch } = useUserProfile();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    location: "",
    paypalDetails: "",
  });

  const [tiktokAccounts, setTiktokAccounts] = useState<Array<{ id: string; handle: string }>>([]);
  const [igAccounts, setIgAccounts] = useState<Array<{ id: string; handle: string }>>([]);
  const [newTiktokHandle, setNewTiktokHandle] = useState("");
  const [newIgHandle, setNewIgHandle] = useState("");
  const [isAddingTiktok, setIsAddingTiktok] = useState(false);
  const [isAddingIG, setIsAddingIG] = useState(false);
  const [discordInfo, setDiscordInfo] = useState<{ id: string; username: string; linkedAt: string; channelId: string | null } | null>(null);
  const [emailSenderOpen, setEmailSenderOpen] = useState(false);

  // Handle Discord OAuth callback results
  useEffect(() => {
    const discordSuccess = searchParams.get('discord_success');
    const discordError = searchParams.get('discord_error');

    if (discordSuccess === 'true') {
      toast.success('Discord account linked successfully!');
      refetch?.(); // Refresh profile to get updated Discord info
      // Clean up URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (discordError) {
      const errorMessages: Record<string, string> = {
        'already_linked': 'This Discord account is already linked to another user.',
        'user_not_found': 'Could not find your account. Please try again.',
        'update_failed': 'Failed to link Discord account. Please try again.',
        'no_code': 'Discord authorization was cancelled.',
        'no_state': 'Invalid authorization request. Please try again.',
      };
      toast.error(errorMessages[discordError] || 'Failed to link Discord account.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, refetch]);

  // Populate form data when profile loads
  useEffect(() => {
    if (profile) {
      const tiktokAccs = profile.accounts
        .filter(acc => acc.platform === 'tiktok')
        .map(acc => ({ id: acc.id, handle: acc.handle }));

      const igAccs = profile.accounts
        .filter(acc => acc.platform === 'instagram')
        .map(acc => ({ id: acc.id, handle: acc.handle }));

      setFormData({
        fullName: profile.user.full_name || "",
        email: profile.user.email || "",
        location: profile.user.country || "",
        paypalDetails: profile.user.paypal_info || "",
      });

      setTiktokAccounts(tiktokAccs);
      setIgAccounts(igAccs);

      // Set Discord info if linked
      if (profile.user.discord_id) {
        setDiscordInfo({
          id: profile.user.discord_id,
          username: profile.user.discord_username || 'Unknown',
          linkedAt: profile.user.discord_linked_at || '',
          channelId: profile.user.discord_channel_id || null,
        });
      } else {
        setDiscordInfo(null);
      }
    }
  }, [profile]);

  // Start Discord OAuth flow
  const handleConnectDiscord = async () => {
    if (!profile) return;

    const redirectUri = `${SUPABASE_URL}/functions/v1/discord-callback`;
    const state = profile.user.id; // Pass user ID as state for verification

    const params = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify guilds.join',
      state,
    });

    window.location.href = `https://discord.com/oauth2/authorize?${params.toString()}`;
  };

  const handleDisconnectDiscord = async () => {
    if (!profile || !confirm('Are you sure you want to disconnect your Discord account?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          discord_id: null,
          discord_username: null,
          discord_linked_at: null,
        })
        .eq('id', profile.user.id);

      if (error) throw error;

      setDiscordInfo(null);
      toast.success('Discord account disconnected.');
    } catch (err) {
      console.error('Error disconnecting Discord:', err);
      toast.error('Failed to disconnect Discord account.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      // Update user profile - using type assertion due to RLS policy limitations
      const updateData: Record<string, any> = {
        full_name: formData.fullName,
        email: formData.email,
        country: formData.location,
        paypal_info: formData.paypalDetails,
      };

      const { error } = await (supabase as any)
        .from('users')
        .update(updateData)
        .eq('id', profile.user.id);

      if (error) throw error;

      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to save changes. Please try again.");
    }
  };

  const handleAddTiktokAccount = async () => {
    if (!profile || !newTiktokHandle.trim()) return;

    try {
      const handle = newTiktokHandle.trim().replace(/^@/, '');

      // Create account
      const { data: newAccount, error: accountError } = await supabase
        .from('accounts')
        .insert({
          platform: 'tiktok',
          handle,
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Link to user
      const { error: linkError } = await supabase
        .from('user_accounts')
        .insert({
          user_id: profile.user.id,
          account_id: newAccount.id,
        });

      if (linkError) throw linkError;

      setTiktokAccounts([...tiktokAccounts, { id: newAccount.id, handle }]);
      setNewTiktokHandle("");
      setIsAddingTiktok(false);
      toast.success("TikTok account added!");
    } catch (error: any) {
      console.error('Error adding TikTok account:', error);
      const errorMessage = error?.message || error?.error_description || 'Unknown error';
      toast.error(`Failed to add account: ${errorMessage}`);
    }
  };

  const handleAddIGAccount = async () => {
    if (!profile || !newIgHandle.trim()) return;

    try {
      const handle = newIgHandle.trim().replace(/^@/, '');

      // Create account
      const { data: newAccount, error: accountError } = await supabase
        .from('accounts')
        .insert({
          platform: 'instagram',
          handle,
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Link to user
      const { error: linkError } = await supabase
        .from('user_accounts')
        .insert({
          user_id: profile.user.id,
          account_id: newAccount.id,
        });

      if (linkError) throw linkError;

      setIgAccounts([...igAccounts, { id: newAccount.id, handle }]);
      setNewIgHandle("");
      setIsAddingIG(false);
      toast.success("Instagram account added!");
    } catch (error: any) {
      console.error('Error adding Instagram account:', error);
      const errorMessage = error?.message || error?.error_description || 'Unknown error';
      toast.error(`Failed to add account: ${errorMessage}`);
    }
  };

  const handleRemoveAccount = async (accountId: string, platform: 'tiktok' | 'instagram') => {
    if (!profile) return;

    try {
      // Remove user_account link
      const { error: linkError } = await supabase
        .from('user_accounts')
        .delete()
        .eq('account_id', accountId)
        .eq('user_id', profile.user.id);

      if (linkError) throw linkError;

      // Update local state
      if (platform === 'tiktok') {
        setTiktokAccounts(tiktokAccounts.filter(acc => acc.id !== accountId));
      } else {
        setIgAccounts(igAccounts.filter(acc => acc.id !== accountId));
      }

      toast.success("Account removed!");
    } catch (error: any) {
      console.error('Error removing account:', error);
      toast.error("Failed to remove account. Please try again.");
    }
  };

  const leftColumnData = [
    { label: "Full name", field: "fullName", editable: true },
    { label: "Email account", field: "email", editable: true },
    { label: "Account Type", field: "accountType", editable: false, value: roleLabels[role] },
    { label: "Location", field: "location", editable: false },
    { label: "PayPal details", field: "paypalDetails", editable: true },
  ];

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-4 animate-fade-in-up">
        <div className="glass-card p-4 md:p-8 max-w-4xl mx-auto">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 md:px-6 py-4 animate-fade-in-up">
        <div className="glass-card p-4 md:p-8 max-w-4xl mx-auto">
          <p className="text-red-500">Error loading profile: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 md:px-6 py-4 animate-fade-in-up">
        <div className="glass-card p-4 md:p-8 max-w-4xl mx-auto">
          <p className="text-muted-foreground">No profile data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-4 animate-fade-in-up">
      <div className="glass-card p-4 md:p-8 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="mb-6 md:mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-foreground font-semibold text-base md:text-lg">{formData.fullName || 'User'}</h2>
            <p className="text-muted-foreground text-xs md:text-sm">{formData.email}</p>
          </div>
          {(isAdmin || isManager1) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEmailSenderOpen(true)}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email Sender</span>
            </Button>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
          {/* Left Column */}
          <div className="space-y-0">
            {leftColumnData.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3 md:py-4 border-b border-border/50 gap-1 sm:gap-4"
              >
                <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">{item.label}</span>
                {item.editable ? (
                  <Input
                    value={formData[item.field as keyof typeof formData]}
                    onChange={(e) => handleChange(item.field, e.target.value)}
                    className="w-full sm:max-w-[200px] bg-secondary/50 border-border/50 text-foreground text-sm sm:text-right h-9 md:h-10"
                  />
                ) : (
                  <span className="text-foreground text-sm">{item.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Right Column - Account Management */}
          <div className="space-y-6">
            {/* TikTok Accounts */}
            <div>
              <h3 className="text-foreground font-medium text-sm mb-3">TikTok Accounts</h3>
              <div className="space-y-2">
                {tiktokAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/30"
                  >
                    <span className="text-foreground text-sm">{account.handle.startsWith('@') ? account.handle : `@${account.handle}`}</span>
                    {(isAdmin || isManager1) && (
                      <button
                        onClick={() => handleRemoveAccount(account.id, 'tiktok')}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {isAddingTiktok ? (
                  <div className="flex gap-2">
                    <Input
                      value={newTiktokHandle}
                      onChange={(e) => setNewTiktokHandle(e.target.value)}
                      placeholder="username"
                      className="bg-secondary/50 border-border/50 text-foreground text-sm"
                      autoFocus
                    />
                    <Button
                      onClick={handleAddTiktokAccount}
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                    >
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingTiktok(false);
                        setNewTiktokHandle("");
                      }}
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingTiktok(true)}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add TikTok Account
                  </button>
                )}
              </div>
            </div>

            {/* Instagram Accounts */}
            <div>
              <h3 className="text-foreground font-medium text-sm mb-3">Instagram Accounts</h3>
              <div className="space-y-2">
                {igAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/30"
                  >
                    <span className="text-foreground text-sm">{account.handle.startsWith('@') ? account.handle : `@${account.handle}`}</span>
                    {(isAdmin || isManager1) && (
                      <button
                        onClick={() => handleRemoveAccount(account.id, 'instagram')}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {isAddingIG ? (
                  <div className="flex gap-2">
                    <Input
                      value={newIgHandle}
                      onChange={(e) => setNewIgHandle(e.target.value)}
                      placeholder="username"
                      className="bg-secondary/50 border-border/50 text-foreground text-sm"
                      autoFocus
                    />
                    <Button
                      onClick={handleAddIGAccount}
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                    >
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingIG(false);
                        setNewIgHandle("");
                      }}
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingIG(true)}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Instagram Account
                  </button>
                )}
              </div>
            </div>

            {/* Discord Connection */}
            <div>
              <h3 className="text-foreground font-medium text-sm mb-3">Discord</h3>
              {discordInfo ? (
                <div className="p-4 bg-[#5865F2]/10 rounded-lg border border-[#5865F2]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#5865F2] rounded-full flex items-center justify-center">
                        <DiscordIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">{discordInfo.username}</span>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Connected {discordInfo.linkedAt ? new Date(discordInfo.linkedAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDisconnectDiscord}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {discordInfo.channelId && (
                    <a
                      href={`https://discord.com/channels/${DISCORD_GUILD_ID}/${discordInfo.channelId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full flex items-center justify-center gap-2 p-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Open Your Private Channel
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleConnectDiscord}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-colors font-medium"
                >
                  <DiscordIcon className="w-5 h-5" />
                  Connect Discord
                  <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
                </button>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Connect your Discord to get roles and access exclusive creator channels.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8">
          <Button variant="submit" size="lg" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Email Sender Modal - Admin and Manager_1 */}
      {(isAdmin || isManager1) && (
        <Dialog open={emailSenderOpen} onOpenChange={setEmailSenderOpen}>
          <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0 bg-gray-950 border-gray-800">
            <EmailSender />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AccountView;
