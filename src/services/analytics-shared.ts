/**
 * Shared Analytics Functions
 * Used across all user roles (UGC, Influencer, Account Manager)
 */

export type ViralStatus = 'viral' | 'traction' | 'regular';

// Viral thresholds
const VIRAL_THRESHOLD_TRACTION = 5000;  // "Gaining traction"
const VIRAL_THRESHOLD_VIRAL = 20000;    // "VIRAL!"

export interface PostMetrics {
  postId: string;
  platform: 'tiktok' | 'instagram';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  engagementRate: number;
  viralStatus: ViralStatus;
  createdAt: Date;
  fetchedAt: Date;
}

export interface MonthlyAggregateStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  averageEngagementRate: number;
  viralPosts: number; // >20K views
  tractionPosts: number; // >5K views
  topPost: PostMetrics | null;
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
 * Detect viral status of a post
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
 * Returns alert info if post just crossed a threshold
 */
export function shouldTriggerViralAlert(
  currentViews: number,
  previousViews: number = 0
): { level: 'traction' | 'viral'; threshold: number } | null {
  // Crossed 5K threshold
  if (currentViews >= VIRAL_THRESHOLD_TRACTION && previousViews < VIRAL_THRESHOLD_TRACTION) {
    return { level: 'traction', threshold: VIRAL_THRESHOLD_TRACTION };
  }

  // Crossed 20K threshold
  if (currentViews >= VIRAL_THRESHOLD_VIRAL && previousViews < VIRAL_THRESHOLD_VIRAL) {
    return { level: 'viral', threshold: VIRAL_THRESHOLD_VIRAL };
  }

  return null;
}

/**
 * Calculate aggregate statistics for a set of posts
 */
export function calculateMonthlyStats(posts: PostMetrics[]): MonthlyAggregateStats {
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
  );

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
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format engagement rate
 */
export function formatEngagementRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}
