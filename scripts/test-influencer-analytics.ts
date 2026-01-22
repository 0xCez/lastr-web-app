/**
 * Test Influencer Analytics
 * Run with: npm run test-influencer
 */

import {
  calculateInfluencerProgress,
  getPayoutCardStatus,
  formatCurrency,
  formatNumber,
  formatPercentage,
  type InfluencerContract,
} from '../src/services/analytics-influencer';

console.log('🧪 Testing Influencer Analytics\n');
console.log('='.repeat(60));

// Example contract: 1M views, 6 posts, $1400 base, $300 bonus if done in 4 posts
const exampleContract: InfluencerContract = {
  targetViews: 1000000,
  targetPosts: 6,
  basePayout: 1400,
  bonusAmount: 300,
  bonusPostThreshold: 4,
};

console.log('\n📋 Contract Details:');
console.log('-'.repeat(60));
console.log(`  Target Views: ${formatNumber(exampleContract.targetViews)}`);
console.log(`  Target Posts: ${exampleContract.targetPosts}`);
console.log(`  Base Payout: ${formatCurrency(exampleContract.basePayout)}`);
console.log(`  Bonus: ${formatCurrency(exampleContract.bonusAmount || 0)} (if done in ${exampleContract.bonusPostThreshold} posts)`);

console.log('\n\n📊 Test Scenarios');
console.log('='.repeat(60));

// Scenario 1: Payment eligible with bonus (1.1M views in 4 posts)
console.log('\n🎉 Scenario 1: Payment Eligible with Bonus (1,100,000 views, 4 posts)');
const bonusCase = calculateInfluencerProgress(exampleContract, 1100000, 4);
const payoutStatus1 = getPayoutCardStatus(bonusCase);
console.log(`  Views: ${formatNumber(bonusCase.currentViews)} / ${formatNumber(bonusCase.targetViews)} (${formatPercentage(bonusCase.viewsProgress)})`);
console.log(`  Posts: ${bonusCase.currentPosts} / ${bonusCase.targetPosts} (${formatPercentage(bonusCase.postsProgress)})`);
console.log(`  Targets Met: ${bonusCase.targetsMet ? '✅ YES' : '❌ NO'}`);
console.log(`  Payment Eligible: ${bonusCase.paymentEligible ? '✅ YES' : '❌ NO'}`);
console.log(`  Bonus Eligible: ${bonusCase.bonusEligible ? '🎁 YES' : '❌ NO'}`);
console.log(`  Base Payout: ${formatCurrency(bonusCase.basePayout)}`);
console.log(`  Bonus: ${formatCurrency(bonusCase.bonusAmount)}`);
console.log(`  Total Payout: ${formatCurrency(bonusCase.totalPayout)}`);
console.log(`  UI Status: ${payoutStatus1.status === 'success' ? '🟢 GREEN' : '⚪ DEFAULT'} - ${payoutStatus1.message}`);

// Scenario 2: Payment eligible, no bonus (1.1M views in 6 posts)
console.log('\n✅ Scenario 2: Payment Eligible, No Bonus (1,100,000 views, 6 posts)');
const noBonusCase = calculateInfluencerProgress(exampleContract, 1100000, 6);
const payoutStatus2 = getPayoutCardStatus(noBonusCase);
console.log(`  Views: ${formatNumber(noBonusCase.currentViews)} / ${formatNumber(noBonusCase.targetViews)} (${formatPercentage(noBonusCase.viewsProgress)})`);
console.log(`  Posts: ${noBonusCase.currentPosts} / ${noBonusCase.targetPosts} (${formatPercentage(noBonusCase.postsProgress)})`);
console.log(`  Targets Met: ${noBonusCase.targetsMet ? '✅ YES' : '❌ NO'}`);
console.log(`  Payment Eligible: ${noBonusCase.paymentEligible ? '✅ YES' : '❌ NO'}`);
console.log(`  Bonus Eligible: ${noBonusCase.bonusEligible ? '🎁 YES' : '❌ NO'}`);
console.log(`  Total Payout: ${formatCurrency(noBonusCase.totalPayout)}`);
console.log(`  UI Status: ${payoutStatus2.status === 'success' ? '🟢 GREEN' : '⚪ DEFAULT'} - ${payoutStatus2.message}`);

// Scenario 3: In progress, on track for bonus (600K views, 3 posts)
console.log('\n⏳ Scenario 3: In Progress, On Track for Bonus (600,000 views, 3 posts)');
const inProgressBonus = calculateInfluencerProgress(exampleContract, 600000, 3);
const payoutStatus3 = getPayoutCardStatus(inProgressBonus);
console.log(`  Views: ${formatNumber(inProgressBonus.currentViews)} / ${formatNumber(inProgressBonus.targetViews)} (${formatPercentage(inProgressBonus.viewsProgress)})`);
console.log(`  Posts: ${inProgressBonus.currentPosts} / ${inProgressBonus.targetPosts} (${formatPercentage(inProgressBonus.postsProgress)})`);
console.log(`  Payment Eligible: ${inProgressBonus.paymentEligible ? '✅ YES' : '❌ NO'}`);
console.log(`  On Track for Bonus: ${inProgressBonus.currentPosts <= (exampleContract.bonusPostThreshold || 0) ? '✅ YES' : '❌ NO'}`);
console.log(`  Total Payout: ${formatCurrency(inProgressBonus.totalPayout)}`);
console.log(`  UI Status: ⚪ DEFAULT - ${payoutStatus3.message}`);

// Scenario 4: Views met but not enough posts (1.2M views, 4 posts)
console.log('\n⚠️  Scenario 4: Views Met But Not Enough Posts (1,200,000 views, 4 posts)');
const viewsMetOnly = calculateInfluencerProgress(exampleContract, 1200000, 4);
const payoutStatus4 = getPayoutCardStatus(viewsMetOnly);
console.log(`  Views: ${formatNumber(viewsMetOnly.currentViews)} / ${formatNumber(viewsMetOnly.targetViews)} (${formatPercentage(viewsMetOnly.viewsProgress)})`);
console.log(`  Posts: ${viewsMetOnly.currentPosts} / ${viewsMetOnly.targetPosts} (${formatPercentage(viewsMetOnly.postsProgress)})`);
console.log(`  Views Reached: ${viewsMetOnly.viewsReached ? '✅ YES' : '❌ NO'}`);
console.log(`  Posts Reached: ${viewsMetOnly.postsReached ? '✅ YES' : '❌ NO'}`);
console.log(`  Payment Eligible: ${viewsMetOnly.paymentEligible ? '✅ YES' : '❌ NO'}`);
console.log(`  Total Payout: ${formatCurrency(viewsMetOnly.totalPayout)}`);
console.log(`  UI Status: ${payoutStatus4.status === 'warning' ? '🟡 YELLOW' : '⚪ DEFAULT'} - ${payoutStatus4.message}`);

// Scenario 5: Posts met but not enough views (800K views, 7 posts)
console.log('\n⚠️  Scenario 5: Posts Met But Not Enough Views (800,000 views, 7 posts)');
const postsMetOnly = calculateInfluencerProgress(exampleContract, 800000, 7);
const payoutStatus5 = getPayoutCardStatus(postsMetOnly);
console.log(`  Views: ${formatNumber(postsMetOnly.currentViews)} / ${formatNumber(postsMetOnly.targetViews)} (${formatPercentage(postsMetOnly.viewsProgress)})`);
console.log(`  Posts: ${postsMetOnly.currentPosts} / ${postsMetOnly.targetPosts} (${formatPercentage(postsMetOnly.postsProgress)})`);
console.log(`  Views Reached: ${postsMetOnly.viewsReached ? '✅ YES' : '❌ NO'}`);
console.log(`  Posts Reached: ${postsMetOnly.postsReached ? '✅ YES' : '❌ NO'}`);
console.log(`  Payment Eligible: ${postsMetOnly.paymentEligible ? '✅ YES' : '❌ NO'}`);
console.log(`  Total Payout: ${formatCurrency(postsMetOnly.totalPayout)}`);
console.log(`  UI Status: ${payoutStatus5.status === 'warning' ? '🟡 YELLOW' : '⚪ DEFAULT'} - ${payoutStatus5.message}`);

console.log('\n' + '='.repeat(60));
console.log('✅ All influencer analytics tests completed!\n');
