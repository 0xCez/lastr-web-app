import { UserRole } from "@/contexts/UserRoleContext";

// Mock data structure - will be replaced with DB queries
export interface DashboardStats {
  // Common metrics (all roles)
  totalViews: string;
  totalPosts: string;
  engagement: string;
  likes: string;
  comments: string;
  bookmarks: string;
  shares: string;
  
  // UGC Creator specific
  targetPostsWeekly?: number;
  leftToTarget?: number;
  leftToPost?: number;
  cpmPayout?: string;
  payout?: string;
  
  // Influencer specific
  targetViews?: string;
  leftToTargetViews?: string;
  bonus?: string;
  
  // Admin specific
  revenue?: string;
  downloads?: string;
  rpi?: string;
  rpm?: string;
  cpm?: string;
  conversion?: string;
}

// Mock data for each role - will be fetched from DB later
export const getMockDataForRole = (role: UserRole): DashboardStats => {
  const baseStats = {
    totalViews: "1,284,920",
    totalPosts: "42",
    engagement: "41.6k",
    likes: "34.8k",
    comments: "1.4k",
    bookmarks: "4.6k",
    shares: "754",
  };

  switch (role) {
    case "ugc_creator":
      return {
        ...baseStats,
        totalViews: "424,920",
        totalPosts: "26",
        targetPostsWeekly: 12,
        leftToTarget: 4,
        leftToPost: 2,
        cpmPayout: "$636",
        payout: "$936", // CPM payout + $300 fixed fee
      };
    
    case "influencer":
      return {
        ...baseStats,
        totalPosts: "4",
        targetViews: "2M",
        leftToTargetViews: "715k",
        leftToPost: 2,
        payout: "$3k",
        bonus: "$0",
      };
    
    case "account_manager":
      return {
        ...baseStats,
        // Account managers only see content metrics, no revenue
      };
    
    case "admin":
    default:
      return {
        ...baseStats,
        totalViews: "12,284,920",
        revenue: "24.6k",
        downloads: "29.6k",
        rpi: "$1.9",
        rpm: "$5.6",
        cpm: "$1.9",
        conversion: "16.5%",
      };
  }
};
