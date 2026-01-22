/**
 * Analytics for UGC Creators (Option 1)
 *
 * Payment Structure:
 * - Fixed Rate: $300/week (if 12+ posts in the week)
 * - CPM Rate: $1.5 per 1000 views
 * - Total: Fixed + CPM (only if minimum posts requirement met)
 * - Monthly Cap: $5,000 total payout per month
 */

const UGC_OPTION_1 = {
  FIXED_RATE: 300,
  CPM_RATE: 1.5,
  MIN_POSTS_WEEKLY: 12,
  MONTHLY_CAP: 5000,
};

export interface UGCWeeklyStats {
  totalPosts: number;
  totalViews: number;
  cpmEarnings: number;
  fixedEarnings: number;
  totalEarnings: number;
  qualifiedForPayment: boolean;
  targetMet: boolean; // For UI: turn card green when true
  postsRequired: number;
  postsShortfall: number;
}

export interface UGCMonthlyStats extends UGCWeeklyStats {
  monthlyEarningsBeforeCap: number;
  monthlyEarningsCapped: number;
  capApplied: boolean;
  remainingMonthlyBudget: number;
}

/**
 * Calculate pure CPM earnings (views × CPM rate)
 * No conditions - just the calculation
 */
export function calculateCPMEarnings(views: number): number {
  return (views / 1000) * UGC_OPTION_1.CPM_RATE;
}

/**
 * Calculate UGC Option 1 weekly payment
 *
 * Requirements:
 * - Must have 12+ posts in the week to qualify for ANY payment
 * - If qualified: $300 fixed + CPM earnings
 * - If not qualified: $0
 */
export function calculateUGCOption1WeeklyPayment(
  totalPosts: number,
  totalViews: number
): UGCWeeklyStats {
  const cpmEarnings = calculateCPMEarnings(totalViews);
  const targetMet = totalPosts >= UGC_OPTION_1.MIN_POSTS_WEEKLY;
  const qualifiedForPayment = targetMet;

  const fixedEarnings = qualifiedForPayment ? UGC_OPTION_1.FIXED_RATE : 0;
  const totalEarnings = qualifiedForPayment ? fixedEarnings + cpmEarnings : 0;
  const postsShortfall = Math.max(0, UGC_OPTION_1.MIN_POSTS_WEEKLY - totalPosts);

  return {
    totalPosts,
    totalViews,
    cpmEarnings,
    fixedEarnings,
    totalEarnings,
    qualifiedForPayment,
    targetMet, // UI indicator: green when 12+ posts
    postsRequired: UGC_OPTION_1.MIN_POSTS_WEEKLY,
    postsShortfall,
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
 * Apply monthly cap to earnings
 *
 * @param weeklyEarnings - Current week's calculated earnings
 * @param monthlyEarningsSoFar - Total earnings for the month so far (excluding current week)
 * @returns Capped earnings and cap status
 */
export function applyMonthlyCap(
  weeklyEarnings: number,
  monthlyEarningsSoFar: number = 0
): {
  cappedEarnings: number;
  capApplied: boolean;
  remainingBudget: number;
} {
  const totalBeforeCap = monthlyEarningsSoFar + weeklyEarnings;
  const cappedTotal = Math.min(totalBeforeCap, UGC_OPTION_1.MONTHLY_CAP);
  const cappedWeekly = Math.max(0, cappedTotal - monthlyEarningsSoFar);
  const capApplied = totalBeforeCap > UGC_OPTION_1.MONTHLY_CAP;
  const remainingBudget = Math.max(0, UGC_OPTION_1.MONTHLY_CAP - monthlyEarningsSoFar);

  return {
    cappedEarnings: cappedWeekly,
    capApplied,
    remainingBudget,
  };
}

/**
 * Get UI status for Target Posts card
 */
export function getTargetPostsStatus(totalPosts: number): {
  status: 'success' | 'warning' | 'default';
  message: string;
} {
  if (totalPosts >= UGC_OPTION_1.MIN_POSTS_WEEKLY) {
    return {
      status: 'success',
      message: 'Target met! ✅',
    };
  } else if (totalPosts >= UGC_OPTION_1.MIN_POSTS_WEEKLY * 0.75) {
    return {
      status: 'warning',
      message: `${UGC_OPTION_1.MIN_POSTS_WEEKLY - totalPosts} posts to go`,
    };
  } else {
    return {
      status: 'default',
      message: `${UGC_OPTION_1.MIN_POSTS_WEEKLY - totalPosts} posts needed`,
    };
  }
}
