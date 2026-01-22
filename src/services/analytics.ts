/**
 * Analytics Service
 * Handles all analytics calculations for different user roles
 */

// Viral thresholds
const VIRAL_THRESHOLD_TRACTION = 5000;  // "Gaining traction"
const VIRAL_THRESHOLD_VIRAL = 20000;    // "VIRAL!"

// UGC Creator payment structure
const UGC_FIXED_RATE = 300;             // Base payment
const UGC_CPM_RATE = 1.5;               // Cost per 1000 views
const UGC_MIN_POSTS_WEEKLY = 12;        // Minimum posts required per week

export type ViralStatus = 'viral' | 'traction' | 'regular';

export interface UGCEarnings {
  fixedPay: number;
  cpmEarnings: number;
  totalEarnings: number;
  qualifiedForPayment: boolean;
  postsThisWeek: number;
  postsRequired: number;
}

export interface InfluencerContractProgress {
  viewsProgress: {
    current: number;
    target: number;
    percentage: number;
  };
  postsProgress: {
    current: number;
    target: number;
    percentage: number;
  };
  basePayout: number;
  bonusEligible: boolean;
  bonusAmount: number;
  estimatedTotal: number;
}

export interface PostAnalytics {
  postId: string;
  platform: 'tiktok' | 'instagram';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  engagementRate: number;
  viralStatus: ViralStatus;
  fetchedAt: Date;
}

export interface MonthlyStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
  viralPosts: number;
  tractionPosts: number;
  topPost: PostAnalytics | null;
}

/**
 * Calculate UGC Creator earnings
 * Payment structure: $300 fixed + $1.5 CPM (if 12+ posts/week)
 */
export function calculateUGCEarnings(
  totalViews: number,
  postsThisWeek: number
): UGCEarnings {
  const qualifiedForPayment = postsThisWeek >= UGC_MIN_POSTS_WEEKLY;
  const cpmEarnings = (totalViews / 1000) * UGC_CPM_RATE;

  return {
    fixedPay: qualifiedForPayment ? UGC_FIXED_RATE : 0,
    cpmEarnings: qualifiedForPayment ? cpmEarnings : 0,
    totalEarnings: qualifiedForPayment ? UGC_FIXED_RATE + cpmEarnings : 0,
    qualifiedForPayment,
    postsThisWeek,
    postsRequired: UGC_MIN_POSTS_WEEKLY,
  };
}

/**
 * Detect viral status of a post
 * Returns 'viral' (>20K), 'traction' (>5K), or 'regular'
 */
export function detectViralStatus(views: number): ViralStatus {
  if (views >= VIRAL_THRESHOLD_VIRAL) {
    return 'viral';
  } else if (views >= VIRAL_THRESHOLD_TRACTION) {
    return 'traction';
  }
  return 'regular';
}

/**
 * Check if a viral alert should be triggered
 * Returns the alert level or null if no alert needed
 */
export function shouldTriggerViralAlert(
  currentViews: number,
  previousViews: number = 0
): { level: 'traction' | 'viral'; threshold: number } | null {
  // Check if we just crossed the 5K threshold
  if (currentViews >= VIRAL_THRESHOLD_TRACTION && previousViews < VIRAL_THRESHOLD_TRACTION) {
    return { level: 'traction', threshold: VIRAL_THRESHOLD_TRACTION };
  }

  // Check if we just crossed the 20K threshold
  if (currentViews >= VIRAL_THRESHOLD_VIRAL && previousViews < VIRAL_THRESHOLD_VIRAL) {
    return { level: 'viral', threshold: VIRAL_THRESHOLD_VIRAL };
  }

  return null;
}

/**
 * Calculate influencer contract progress
 * Influencers have custom contracts with view/post targets and bonus structure
 */
export function calculateInfluencerProgress(
  contract: {
    targetViews: number;
    targetPosts: number;
    basePayout: number;
    bonusAmount?: number;
    bonusPostThreshold?: number; // e.g., "reach 1M views in 4 posts instead of 6"
  },
  currentStats: {
    totalViews: number;
    totalPosts: number;
  }
): InfluencerContractProgress {
  const viewsPercentage = (currentStats.totalViews / contract.targetViews) * 100;
  const postsPercentage = (currentStats.totalPosts / contract.targetPosts) * 100;

  // Check if eligible for bonus (reached views in fewer posts)
  const bonusEligible =
    contract.bonusAmount &&
    contract.bonusPostThreshold &&
    currentStats.totalViews >= contract.targetViews &&
    currentStats.totalPosts <= contract.bonusPostThreshold;

  const estimatedTotal = contract.basePayout + (bonusEligible ? (contract.bonusAmount || 0) : 0);

  return {
    viewsProgress: {
      current: currentStats.totalViews,
      target: contract.targetViews,
      percentage: Math.min(viewsPercentage, 100),
    },
    postsProgress: {
      current: currentStats.totalPosts,
      target: contract.targetPosts,
      percentage: Math.min(postsPercentage, 100),
    },
    basePayout: contract.basePayout,
    bonusEligible: bonusEligible || false,
    bonusAmount: contract.bonusAmount || 0,
    estimatedTotal,
  };
}

/**
 * Calculate monthly statistics for a creator
 */
export function calculateMonthlyStats(posts: PostAnalytics[]): MonthlyStats {
  if (posts.length === 0) {
    return {
      totalPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      averageEngagementRate: 0,
      viralPosts: 0,
      tractionPosts: 0,
      topPost: null,
    };
  }

  const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
  const totalShares = posts.reduce((sum, p) => sum + p.shares, 0);

  const avgEngagement = posts.reduce((sum, p) => sum + p.engagementRate, 0) / posts.length;

  const viralPosts = posts.filter(p => p.viralStatus === 'viral').length;
  const tractionPosts = posts.filter(p => p.viralStatus === 'traction').length;

  // Find top performing post by engagement rate
  const topPost = posts.reduce((best, current) =>
    current.engagementRate > best.engagementRate ? current : best
  , posts[0]);

  return {
    totalPosts: posts.length,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
    averageEngagementRate: Number(avgEngagement.toFixed(2)),
    viralPosts,
    tractionPosts,
    topPost,
  };
}

/**
 * Calculate engagement rate
 * Formula: (likes + comments + shares) / views × 100
 */
export function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  views: number
): number {
  if (views === 0) return 0;
  const totalEngagement = likes + comments + shares;
  return Number(((totalEngagement / views) * 100).toFixed(2));
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format number with commas (e.g., 1000000 -> 1,000,000)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format engagement rate for display
 */
export function formatEngagementRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}
