/**
 * UGC Creator Contract Constants
 *
 * Single source of truth for all contract-related values.
 * DO NOT hardcode these values elsewhere - import from here.
 */

// ============================================
// OPTION 1: Retainer + CPM
// ============================================

export const UGC_OPTION_1 = {
  /**
   * Fixed fee per approved post (cross-posted pair).
   * $300 monthly budget / 48 cross-posted posts = $6.25 per cross-posted post.
   */
  FIXED_FEE_PER_POST: 6.25,

  /**
   * Fixed fee per unit post (individual TikTok or Instagram post).
   * $300 monthly budget / 96 unit posts = $3.125 per unit post.
   */
  FIXED_FEE_PER_UNIT_POST: 3.125,

  /**
   * Fixed fee per slideshow post.
   * Slideshows are simpler content and priced lower than UGC videos.
   */
  FIXED_FEE_PER_SLIDESHOW: 1.0,

  /**
   * Monthly fixed fee budget (for reference).
   * 48 posts × $6.25 = $300/month.
   */
  MONTHLY_FIXED_FEE_BUDGET: 300,

  /**
   * @deprecated - Kept for backwards compatibility, use FIXED_FEE_PER_POST instead.
   * Weekly retainer payment when 12+ posts quota is met.
   */
  WEEKLY_RETAINER: 75,

  /**
   * CPM rate - dollars per 1000 views.
   * Applied to all views from approved posts.
   */
  CPM_RATE: 1.5,

  /**
   * Minimum posts required per week to qualify for retainer.
   * Must have 12+ approved posts in a Monday-Sunday week.
   */
  MIN_POSTS_WEEKLY: 12,

  /**
   * Monthly target for payout eligibility (cross-posted posts).
   * 48 cross-posted posts = 12 posts × 4 weeks.
   */
  MONTHLY_POST_TARGET: 48,

  /**
   * Monthly target for payout eligibility (unit posts).
   * 96 unit posts = 48 cross-posted × 2 platforms.
   */
  MONTHLY_UNIT_POST_TARGET: 96,

  /**
   * Maximum monthly payout (fixed fee + CPM combined).
   * Safety cap to prevent runaway payouts.
   */
  MONTHLY_CAP: 5000,
} as const;

// ============================================
// OPTION 2: Fixed Monthly (No CPM)
// ============================================

export const UGC_OPTION_2 = {
  /**
   * Fixed monthly payment.
   * No CPM component - flat rate regardless of views.
   */
  MONTHLY_FIXED: 500,

  /**
   * Minimum posts required per week (same as Option 1).
   */
  MIN_POSTS_WEEKLY: 12,

  /**
   * Monthly post target (same as Option 1).
   */
  MONTHLY_POST_TARGET: 48,
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export type ContractOption = 'option1' | 'option2' | null;

/**
 * Calculate CPM earnings for a given view count.
 * Only applies to Option 1 creators.
 */
export function calculateCPMEarnings(views: number): number {
  return (views / 1000) * UGC_OPTION_1.CPM_RATE;
}

/**
 * Calculate weekly retainer for Option 1.
 * Returns $75 if quota met, $0 otherwise.
 */
export function calculateWeeklyRetainer(postsThisWeek: number): number {
  return postsThisWeek >= UGC_OPTION_1.MIN_POSTS_WEEKLY
    ? UGC_OPTION_1.WEEKLY_RETAINER
    : 0;
}

/**
 * Calculate base amount for payout based on contract option.
 * Option 1: Sum of weekly retainers ($75 × weeks quota met)
 * Option 2: Fixed $500/month
 */
export function calculateBaseAmount(
  contractOption: ContractOption,
  weeksQuotaMet: number = 0
): number {
  if (contractOption === 'option1') {
    return weeksQuotaMet * UGC_OPTION_1.WEEKLY_RETAINER;
  } else if (contractOption === 'option2') {
    return UGC_OPTION_2.MONTHLY_FIXED;
  }
  return 0;
}

/**
 * Calculate total payout for a creator.
 * Option 1: Base (retainer) + CPM, capped at $5000
 * Option 2: Fixed $500
 */
export function calculateTotalPayout(
  contractOption: ContractOption,
  weeksQuotaMet: number,
  totalViews: number
): { base: number; cpm: number; total: number; capped: boolean } {
  if (contractOption === 'option2') {
    return {
      base: UGC_OPTION_2.MONTHLY_FIXED,
      cpm: 0,
      total: UGC_OPTION_2.MONTHLY_FIXED,
      capped: false,
    };
  }

  if (contractOption === 'option1') {
    const base = weeksQuotaMet * UGC_OPTION_1.WEEKLY_RETAINER;
    const cpm = calculateCPMEarnings(totalViews);
    const uncappedTotal = base + cpm;
    const total = Math.min(uncappedTotal, UGC_OPTION_1.MONTHLY_CAP);

    return {
      base,
      cpm: total === uncappedTotal ? cpm : Math.max(0, total - base),
      total,
      capped: uncappedTotal > UGC_OPTION_1.MONTHLY_CAP,
    };
  }

  // No contract option
  return { base: 0, cpm: 0, total: 0, capped: false };
}

/**
 * Check if a creator has met their weekly post quota.
 */
export function isWeeklyQuotaMet(
  postsThisWeek: number,
  contractOption: ContractOption
): boolean {
  const target = contractOption === 'option2'
    ? UGC_OPTION_2.MIN_POSTS_WEEKLY
    : UGC_OPTION_1.MIN_POSTS_WEEKLY;
  return postsThisWeek >= target;
}

/**
 * Get the weekly post target for a contract option.
 */
export function getWeeklyPostTarget(contractOption: ContractOption): number {
  if (contractOption === 'option2') return UGC_OPTION_2.MIN_POSTS_WEEKLY;
  return UGC_OPTION_1.MIN_POSTS_WEEKLY;
}

/**
 * Get posts remaining to hit weekly target.
 */
export function getPostsRemaining(
  postsThisWeek: number,
  contractOption: ContractOption
): number {
  const target = getWeeklyPostTarget(contractOption);
  return Math.max(0, target - postsThisWeek);
}
