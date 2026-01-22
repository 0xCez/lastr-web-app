import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  full_name: string;
  email: string;
  location: string;
  application_status: string;
  created_at: string;
  contract_type: string;
  min_views: number;
}

const ApplicationsView = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadApplications();
  }, [filter]);

  const loadApplications = async () => {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .eq('role', 'ugc_creator')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('application_status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ application_status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Application ${newStatus}!`);
      loadApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">UGC Creator Applications</h1>
        <p className="text-muted-foreground">Review and manage creator applications</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No {filter !== 'all' ? filter : ''} applications found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="glass-card p-6 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-foreground">{app.full_name}</h3>
                    {getStatusBadge(app.application_status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {app.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {app.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Contract:</span>{' '}
                      <span className="font-medium text-foreground">{app.contract_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Min Views:</span>{' '}
                      <span className="font-medium text-foreground">{app.min_views?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Applied:</span>{' '}
                      <span className="font-medium text-foreground">
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {app.application_status === 'pending' && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleStatusUpdate(app.id, 'approved')}
                      className="gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleStatusUpdate(app.id, 'rejected')}
                      className="gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsView;
