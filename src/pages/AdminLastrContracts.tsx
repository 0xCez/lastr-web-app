import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import TabNav from "@/components/dashboard/TabNav";
import LastrContractManagement from "@/components/admin/LastrContractManagement";

const AdminLastrContracts = () => {
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      <TabNav />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <LastrContractManagement />
      </div>
    </div>
  );
};

export default AdminLastrContracts;
