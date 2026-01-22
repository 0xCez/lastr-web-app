/**
 * Analytics for Influencers
 *
 * Contract Structure:
 * - Target views (e.g., 1M views)
 * - Target posts (e.g., 6 posts)
 * - Base payout (e.g., $1400)
 * - Optional bonus (e.g., $300 if done in 4 posts instead of 6)
 *
 * NO CPM - just flat contract amount when targets are met
 */

export interface InfluencerContract {
  targetViews: number;
  targetPosts: number;
  basePayout: number;
  bonusAmount?: number;
  bonusPostThreshold?: number; // e.g., "reach target views in 4 posts instead of 6"
}

export interface InfluencerProgress {
  // View progress
  currentViews: number;
  targetViews: number;
  viewsProgress: number; // percentage (0-100)
  viewsReached: boolean;

  // Post progress
  currentPosts: number;
  targetPosts: number;
  postsProgress: number; // percentage (0-100)
  postsReached: boolean;

  // Payment eligibility
  targetsMet: boolean; // Both views AND posts reached
  paymentEligible: boolean; // UI indicator: turn payout card green when true
  bonusEligible: boolean;
  basePayout: number;
  bonusAmount: number;
  totalPayout: number;
}

/**
 * Calculate influencer contract progress
 *
 * Payment logic:
 * - Both target views AND target posts must be met
 * - Base payout when both targets met
 * - Bonus if reached target views in fewer posts than threshold
 */
export function calculateInfluencerProgress(
  contract: InfluencerContract,
  currentViews: number,
  currentPosts: number
): InfluencerProgress {
  // Calculate progress percentages
  const viewsProgress = Math.min((currentViews / contract.targetViews) * 100, 100);
  const postsProgress = Math.min((currentPosts / contract.targetPosts) * 100, 100);

  // Check if targets are reached
  const viewsReached = currentViews >= contract.targetViews;
  const postsReached = currentPosts >= contract.targetPosts;
  const targetsMet = viewsReached && postsReached;

  // Check bonus eligibility
  // Bonus: reached view target in fewer posts than bonus threshold
  const bonusEligible =
    contract.bonusAmount &&
    contract.bonusPostThreshold &&
    viewsReached &&
    currentPosts <= contract.bonusPostThreshold
      ? true
      : false;

  // Calculate payout
  const basePayout = targetsMet ? contract.basePayout : 0;
  const bonusAmount = bonusEligible ? (contract.bonusAmount || 0) : 0;
  const totalPayout = basePayout + bonusAmount;
  const paymentEligible = targetsMet; // UI indicator: green when both targets met

  return {
    currentViews,
    targetViews: contract.targetViews,
    viewsProgress: Number(viewsProgress.toFixed(1)),
    viewsReached,

    currentPosts,
    targetPosts: contract.targetPosts,
    postsProgress: Number(postsProgress.toFixed(1)),
    postsReached,

    targetsMet,
    paymentEligible, // Turn payout card green when true
    bonusEligible,
    basePayout,
    bonusAmount,
    totalPayout,
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
 * Format percentage
 */
export function formatPercentage(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

/**
 * Get UI status for Payout card
 */
export function getPayoutCardStatus(progress: InfluencerProgress): {
  status: 'success' | 'warning' | 'default';
  message: string;
} {
  if (progress.paymentEligible) {
    return {
      status: 'success',
      message: progress.bonusEligible ? 'Payment ready! (with bonus)' : 'Payment ready!',
    };
  } else if (progress.viewsReached && !progress.postsReached) {
    return {
      status: 'warning',
      message: `${progress.targetPosts - progress.currentPosts} more posts needed`,
    };
  } else if (progress.postsReached && !progress.viewsReached) {
    return {
      status: 'warning',
      message: `${formatNumber(progress.targetViews - progress.currentViews)} more views needed`,
    };
  } else {
    return {
      status: 'default',
      message: 'In progress',
    };
  }
}
