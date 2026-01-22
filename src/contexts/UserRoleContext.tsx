import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUserProfile } from "@/hooks/useUserProfile";

export type UserRole = "admin" | "manager_1" | "ugc_creator" | "influencer" | "account_manager";

// DEV MODE: Set to true to enable role switching dropdown in dashboard
const DEV_MODE = import.meta.env.DEV;

// localStorage key for caching role
const ROLE_CACHE_KEY = 'betai-user-role';

interface UserRoleContextType {
  role: UserRole | null;
  isAdmin: boolean;
  isManager1: boolean;
  isUGCCreator: boolean;
  isInfluencer: boolean;
  isAccountManager: boolean;
  loading: boolean;
  // Dev mode only
  devModeEnabled: boolean;
  setDevRole: (role: UserRole) => void;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const { profile, loading: profileLoading } = useUserProfile();

  // Initialize from localStorage cache for instant role availability
  const [dbRole, setDbRole] = useState<UserRole | null>(() => {
    const cached = localStorage.getItem(ROLE_CACHE_KEY);
    return cached as UserRole | null;
  });
  const [devRoleOverride, setDevRoleOverride] = useState<UserRole | null>(null); // Dev override

  // Update role from database and cache it
  useEffect(() => {
    if (profile?.user?.role) {
      const newRole = profile.user.role as UserRole;
      setDbRole(newRole);
      // Cache in localStorage for instant availability on next load
      localStorage.setItem(ROLE_CACHE_KEY, newRole);
    } else if (!profileLoading && !profile) {
      setDbRole(null);
      localStorage.removeItem(ROLE_CACHE_KEY);
    }
  }, [profile, profileLoading]);

  // In dev mode, allow override; in production, always use DB role
  const effectiveRole = DEV_MODE && devRoleOverride ? devRoleOverride : dbRole;

  // If we have a cached role, we're not "loading" for redirect purposes
  // Only consider loading if we have no role at all and profile is still loading
  const isActuallyLoading = !effectiveRole && profileLoading;

  const value: UserRoleContextType = {
    role: effectiveRole,
    isAdmin: effectiveRole === "admin",
    isManager1: effectiveRole === "manager_1",
    isUGCCreator: effectiveRole === "ugc_creator",
    isInfluencer: effectiveRole === "influencer",
    isAccountManager: effectiveRole === "account_manager",
    loading: isActuallyLoading,
    devModeEnabled: DEV_MODE,
    setDevRole: (role: UserRole) => {
      if (DEV_MODE) {
        setDevRoleOverride(role);
      }
    },
  };

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
};
