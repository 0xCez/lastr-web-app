import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { RefreshCw, Send, XCircle, Loader2, FileCheck, FilePen, CloudDownload } from "lucide-react";

interface UserWithAMContract {
  id: string;
  full_name: string;
  email: string;
  application_status: string;
  approved_at: string | null;
  am_contract_sent_at: string | null;
  am_contract_signed_at: string | null;
  am_signwell_document_id: string | null;
}

type ContractFilter = 'all' | 'need_contract' | 'pending' | 'signed';

const AMContractResendView = () => {
  const [users, setUsers] = useState<UserWithAMContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContractFilter>('all');
  const [syncing, setSyncing] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch approved Account Managers with AM contract info
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, application_status, approved_at, am_contract_sent_at, am_contract_signed_at, am_signwell_document_id')
        .eq('role', 'account_manager')
        .eq('application_status', 'approved')
        .is('deleted_at', null)
        .order('approved_at', { ascending: false });

      if (error) throw error;

      setUsers((data || []) as unknown as UserWithAMContract[]);
    } catch (error) {
      console.error('Error fetching AM users:', error);
      toast.error('Failed to load Account Managers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const syncSignedContracts = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('signwell-sync-status', {
        body: {},
      });

      if (error) throw error;

      const results = data?.results;
      if (results?.updated > 0) {
        toast.success(`Synced ${results.updated} signed contracts`);
        await fetchUsers();
      } else {
        toast.info('No new signed contracts found');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`Sync failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const sendContract = async (user: UserWithAMContract) => {
    setSendingFor(user.id);
    try {
      const { error } = await supabase.functions.invoke('send-am-contract', {
        body: {
          userId: user.id,
          email: user.email,
          fullName: user.full_name,
        },
      });

      if (error) {
        console.error('Send AM contract error:', error);
        throw error;
      }

      toast.success(`AM Contract sent to ${user.full_name}!`);

      // Refresh the list
      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to send AM contract:', error);
      toast.error(`Failed to send contract: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingFor(null);
    }
  };

  const getContractStatus = (user: UserWithAMContract) => {
    // Signed = best status
    if (user.am_contract_signed_at) {
      return { status: 'signed', label: 'Signed', color: 'text-green-500', icon: FileCheck };
    }
    // Sent but not signed yet
    if (user.am_signwell_document_id && user.am_contract_sent_at) {
      return { status: 'pending', label: 'Pending', color: 'text-yellow-500', icon: FilePen };
    }
    // Sent but failed (no SignWell ID)
    if (user.am_contract_sent_at && !user.am_signwell_document_id) {
      return { status: 'failed', label: 'Failed', color: 'text-red-500', icon: XCircle };
    }
    return { status: 'not_sent', label: 'Not Sent', color: 'text-red-500', icon: XCircle };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const usersNeedingContract = users.filter(u => !u.am_signwell_document_id);
  const usersWithContract = users.filter(u => u.am_signwell_document_id);
  const usersSigned = usersWithContract.filter(u => u.am_contract_signed_at);
  const usersPendingSignature = usersWithContract.filter(u => !u.am_contract_signed_at);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex gap-2">
          <Button onClick={fetchUsers} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={syncSignedContracts} disabled={syncing} variant="outline" size="sm">
            <CloudDownload className={`w-4 h-4 mr-2 ${syncing ? 'animate-pulse' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync SignWell'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 text-sm">
          <Button
            variant={filter === 'all' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className="gap-1"
          >
            All <span className="text-xs opacity-70">({users.length})</span>
          </Button>
          <Button
            variant={filter === 'need_contract' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('need_contract')}
            className="gap-1"
          >
            <span className="text-red-500">Need Contract</span>
            <span className="text-xs opacity-70">({usersNeedingContract.length})</span>
          </Button>
          <Button
            variant={filter === 'pending' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('pending')}
            className="gap-1"
          >
            <span className="text-yellow-500">Pending</span>
            <span className="text-xs opacity-70">({usersPendingSignature.length})</span>
          </Button>
          <Button
            variant={filter === 'signed' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('signed')}
            className="gap-1"
          >
            <span className="text-green-500">Signed</span>
            <span className="text-xs opacity-70">({usersSigned.length})</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Users Needing Contracts */}
          {(filter === 'all' || filter === 'need_contract') && usersNeedingContract.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Need Contract ({usersNeedingContract.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {usersNeedingContract.map((user) => {
                  const status = getContractStatus(user);
                  const Icon = status.icon;
                  const isSending = sendingFor === user.id;

                  return (
                    <Card key={user.id} className="p-4 bg-red-500/5 border-red-500/20">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground truncate">{user.full_name}</h3>
                          <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="truncate">{user.email}</div>
                          <div className="text-xs">Approved: {formatDate(user.approved_at)}</div>
                          {user.am_contract_sent_at && (
                            <div className="text-xs">Sent: {formatDate(user.am_contract_sent_at)}</div>
                          )}
                        </div>
                        <Button
                          onClick={() => sendContract(user)}
                          disabled={isSending}
                          className="w-full bg-primary hover:bg-primary/90"
                          size="sm"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              {user.am_contract_sent_at ? 'Resend' : 'Send'}
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users Pending Signature */}
          {(filter === 'all' || filter === 'pending') && usersPendingSignature.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Pending Signature ({usersPendingSignature.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {usersPendingSignature.map((user) => {
                  const status = getContractStatus(user);
                  const Icon = status.icon;
                  const isSending = sendingFor === user.id;

                  return (
                    <Card key={user.id} className="p-4 bg-yellow-500/5 border-yellow-500/20">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground truncate">{user.full_name}</h3>
                          <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-xs">{status.label}</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="truncate">{user.email}</div>
                          <div className="text-xs">Sent: {formatDate(user.am_contract_sent_at)}</div>
                        </div>
                        <Button
                          onClick={() => sendContract(user)}
                          disabled={isSending}
                          variant="outline"
                          size="sm"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Resend
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users Who Signed */}
          {(filter === 'all' || filter === 'signed') && usersSigned.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Signed ({usersSigned.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {usersSigned.map((user) => {
                  const status = getContractStatus(user);
                  const Icon = status.icon;
                  const isSending = sendingFor === user.id;

                  return (
                    <Card key={user.id} className="p-4 bg-green-500/5 border-green-500/20">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground truncate">{user.full_name}</h3>
                          <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-xs">{status.label}</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="truncate">{user.email}</div>
                          <div className="text-xs">Signed: {formatDate(user.am_contract_signed_at)}</div>
                        </div>
                        <Button
                          onClick={() => sendContract(user)}
                          disabled={isSending}
                          variant="outline"
                          size="sm"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Resend
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No approved Account Managers found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AMContractResendView;
