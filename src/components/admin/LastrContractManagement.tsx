import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, FileCheck, FilePen, XCircle, RefreshCw, CheckCircle2 } from "lucide-react";

interface LastrCreatorContract {
  id: string;
  full_name: string;
  email: string;
  approved_at: string | null;
  contract_sent_at: string | null;
  contract_signed_at: string | null;
  signwell_document_id: string | null;
}

type FilterType = "all" | "need_contract" | "pending" | "signed";

const LastrContractManagement = () => {
  const [creators, setCreators] = useState<LastrCreatorContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingFor, setSendingFor] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, approved_at, contract_sent_at, contract_signed_at, signwell_document_id')
        .eq('application_status', 'approved')
        .eq('role', 'ugc_creator')
        .order('approved_at', { ascending: false });

      if (error) throw error;

      setCreators(data || []);
    } catch (error: any) {
      console.error('Error fetching creators:', error);
      toast.error(`Failed to load creators: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreators();
  }, []);

  const handleSendContract = async (creator: LastrCreatorContract) => {
    setSendingFor(creator.id);

    try {
      const { data, error } = await supabase.functions.invoke('send-contract', {
        body: {
          userId: creator.id,
          email: creator.email,
          fullName: creator.full_name,
        },
      });

      if (error) throw error;

      toast.success(`Contract sent to ${creator.full_name}!`);

      // Refresh the list
      await fetchCreators();
    } catch (error: any) {
      console.error('Error sending contract:', error);
      toast.error(`Failed to send contract: ${error.message}`);
    } finally {
      setSendingFor(null);
    }
  };

  const handleSyncSignWell = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('signwell-sync-status');

      if (error) throw error;

      toast.success('SignWell status synced successfully!');

      // Refresh the list
      await fetchCreators();
    } catch (error: any) {
      console.error('Error syncing SignWell:', error);
      toast.error(`Failed to sync: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const getContractStatus = (creator: LastrCreatorContract): {
    status: "need" | "pending" | "signed";
    label: string;
    color: string;
    icon: React.ReactNode;
  } => {
    if (creator.contract_signed_at) {
      return {
        status: "signed",
        label: "Signed",
        color: "bg-green-500/20 text-green-400 border-green-500/30",
        icon: <FileCheck className="w-3 h-3" />,
      };
    }

    if (creator.contract_sent_at) {
      return {
        status: "pending",
        label: "Pending",
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        icon: <FilePen className="w-3 h-3" />,
      };
    }

    return {
      status: "need",
      label: "Need Contract",
      color: "bg-red-500/20 text-red-400 border-red-500/30",
      icon: <XCircle className="w-3 h-3" />,
    };
  };

  const filteredCreators = creators.filter((creator) => {
    const status = getContractStatus(creator).status;

    if (filter === "all") return true;
    if (filter === "need_contract") return status === "need";
    if (filter === "pending") return status === "pending";
    if (filter === "signed") return status === "signed";

    return true;
  });

  const counts = {
    all: creators.length,
    need: creators.filter((c) => !c.contract_sent_at).length,
    pending: creators.filter((c) => c.contract_sent_at && !c.contract_signed_at).length,
    signed: creators.filter((c) => c.contract_signed_at).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lastr Contract Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Send and track creator contracts via SignWell
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCreators}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncSignWell}
            disabled={syncing}
          >
            <CheckCircle2 className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync SignWell'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({counts.all})
        </Button>
        <Button
          variant={filter === "need_contract" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("need_contract")}
          className={filter === "need_contract" ? "" : "border-red-500/30 text-red-400 hover:bg-red-500/10"}
        >
          Need Contract ({counts.need})
        </Button>
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("pending")}
          className={filter === "pending" ? "" : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"}
        >
          Pending ({counts.pending})
        </Button>
        <Button
          variant={filter === "signed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("signed")}
          className={filter === "signed" ? "" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}
        >
          Signed ({counts.signed})
        </Button>
      </div>

      {/* Creators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCreators.map((creator) => {
          const statusInfo = getContractStatus(creator);

          return (
            <Card key={creator.id} className={`p-4 space-y-3 border ${statusInfo.color}`}>
              {/* Creator Info */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                    {creator.full_name}
                  </h3>
                  <Badge variant="outline" className={`flex items-center gap-1 ${statusInfo.color} shrink-0`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {creator.email}
                </p>
              </div>

              {/* Dates */}
              <div className="space-y-1 text-xs">
                {creator.approved_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved:</span>
                    <span className="text-foreground">
                      {new Date(creator.approved_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {creator.contract_sent_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sent:</span>
                    <span className="text-foreground">
                      {new Date(creator.contract_sent_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {creator.contract_signed_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Signed:</span>
                    <span className="text-green-400">
                      {new Date(creator.contract_signed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <Button
                size="sm"
                variant={creator.contract_sent_at ? "outline" : "default"}
                className="w-full"
                onClick={() => handleSendContract(creator)}
                disabled={sendingFor === creator.id || creator.contract_signed_at !== null}
              >
                {sendingFor === creator.id ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-2" />
                    {creator.contract_sent_at ? 'Resend Contract' : 'Send Contract'}
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredCreators.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            No creators found with the selected filter
          </p>
        </Card>
      )}
    </div>
  );
};

export default LastrContractManagement;
