import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TabNav from "@/components/dashboard/TabNav";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { RefreshCw, Send, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface UserWithoutContract {
  id: string;
  full_name: string;
  email: string;
  application_status: string;
  approved_at: string | null;
  contract_sent_at: string | null;
  signwell_document_id: string | null;
}

const AdminResendContracts = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithoutContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingFor, setSendingFor] = useState<string | null>(null);

  // Verify admin access
  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        navigate("/login");
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (userError || userData?.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        navigate("/dashboard");
        return;
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const fetchUsersWithoutContracts = async () => {
    setLoading(true);
    try {
      // Fetch approved UGC creators without contracts
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, application_status, approved_at, contract_sent_at, signwell_document_id')
        .eq('role', 'ugc_creator')
        .eq('application_status', 'approved')
        .order('approved_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithoutContracts();
  }, []);

  const sendContract = async (user: UserWithoutContract) => {
    setSendingFor(user.id);
    try {
      const { error } = await supabase.functions.invoke('send-contract', {
        body: {
          userId: user.id,
          email: user.email,
          fullName: user.full_name,
        },
      });

      if (error) {
        console.error('Send contract error:', error);
        throw error;
      }

      toast.success(`Contract sent to ${user.full_name}!`);

      // Refresh the list
      await fetchUsersWithoutContracts();
    } catch (error: any) {
      console.error('Failed to send contract:', error);
      toast.error(`Failed to send contract: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingFor(null);
    }
  };

  const getContractStatus = (user: UserWithoutContract) => {
    if (user.signwell_document_id && user.contract_sent_at) {
      return { status: 'sent', label: 'Sent', color: 'text-green-500', icon: CheckCircle2 };
    }
    if (user.contract_sent_at && !user.signwell_document_id) {
      return { status: 'partial', label: 'Partially Sent', color: 'text-yellow-500', icon: XCircle };
    }
    return { status: 'not_sent', label: 'Not Sent', color: 'text-red-500', icon: XCircle };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const usersNeedingContract = users.filter(u => !u.signwell_document_id);
  const usersWithContract = users.filter(u => u.signwell_document_id);

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* TabNav header */}
      <TabNav
        activeTab="Contracts"
        onTabChange={() => {}}
        onSubmitPostClick={() => {}}
      />

      <main className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Resend Contracts</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manually resend contracts to approved creators who haven't received them
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Button onClick={fetchUsersWithoutContracts} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground">
              <span className="font-semibold text-red-500">{usersNeedingContract.length}</span> need contract
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-green-500">{usersWithContract.length}</span> have contract
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Users Needing Contracts */}
            {usersNeedingContract.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Need Contract ({usersNeedingContract.length})
                </h2>
                <div className="grid gap-4">
                  {usersNeedingContract.map((user) => {
                    const status = getContractStatus(user);
                    const Icon = status.icon;
                    const isSending = sendingFor === user.id;

                    return (
                      <Card key={user.id} className="p-4 bg-red-500/5 border-red-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground">{user.full_name}</h3>
                              <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                                <Icon className="w-4 h-4" />
                                <span>{status.label}</span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>Email: {user.email}</div>
                              <div>Approved: {formatDate(user.approved_at)}</div>
                              <div>Contract Sent: {formatDate(user.contract_sent_at)}</div>
                              {user.signwell_document_id && (
                                <div className="font-mono text-xs">Doc ID: {user.signwell_document_id}</div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => sendContract(user)}
                            disabled={isSending}
                            className="bg-primary hover:bg-primary/90"
                          >
                            {isSending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                {user.contract_sent_at ? 'Resend' : 'Send'}
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

            {/* Users With Contracts */}
            {usersWithContract.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Have Contract ({usersWithContract.length})
                </h2>
                <div className="grid gap-4">
                  {usersWithContract.map((user) => {
                    const status = getContractStatus(user);
                    const Icon = status.icon;
                    const isSending = sendingFor === user.id;

                    return (
                      <Card key={user.id} className="p-4 bg-green-500/5 border-green-500/20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground">{user.full_name}</h3>
                              <div className={`flex items-center gap-1 text-sm ${status.color}`}>
                                <Icon className="w-4 h-4" />
                                <span>{status.label}</span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>Email: {user.email}</div>
                              <div>Approved: {formatDate(user.approved_at)}</div>
                              <div>Contract Sent: {formatDate(user.contract_sent_at)}</div>
                              {user.signwell_document_id && (
                                <div className="font-mono text-xs">Doc ID: {user.signwell_document_id}</div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => sendContract(user)}
                            disabled={isSending}
                            variant="outline"
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
                No approved UGC creators found
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminResendContracts;
