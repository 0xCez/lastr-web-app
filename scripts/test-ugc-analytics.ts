/**
 * Test UGC Creator Analytics
 * Run with: npm run test-ugc
 */

import {
  calculateCPMEarnings,
  calculateUGCOption1WeeklyPayment,
  getTargetPostsStatus,
  formatCurrency,
  formatNumber,
} from '../src/services/analytics-ugc';

console.log('🧪 Testing UGC Creator Analytics (Option 1)\n');
console.log('='.repeat(60));

console.log('\n📊 Test 1: Pure CPM Calculation');
console.log('-'.repeat(60));

const testViews = [100000, 250000, 500000, 1000000];
testViews.forEach(views => {
  const cpm = calculateCPMEarnings(views);
  console.log(`  ${formatNumber(views).padStart(10)} views → ${formatCurrency(cpm)} CPM`);
});

console.log('\n\n📊 Test 2: UGC Option 1 Weekly Payment');
console.log('-'.repeat(60));

// Scenario 1: Qualified (12 posts, good views)
console.log('\n✅ Scenario 1: Qualified Creator (12 posts, 500K views this week)');
const qualified = calculateUGCOption1WeeklyPayment(12, 500000);
const status1 = getTargetPostsStatus(qualified.totalPosts);
console.log(`  Posts: ${qualified.totalPosts}/${qualified.postsRequired}`);
console.log(`  Views: ${formatNumber(qualified.totalViews)}`);
console.log(`  Fixed Rate: ${formatCurrency(qualified.fixedEarnings)}`);
console.log(`  CPM Earnings: ${formatCurrency(qualified.cpmEarnings)}`);
console.log(`  Total Payment: ${formatCurrency(qualified.totalEarnings)}`);
console.log(`  Qualified: ${qualified.qualifiedForPayment ? '✅ YES' : '❌ NO'}`);
console.log(`  UI Status: ${status1.status === 'success' ? '🟢 GREEN' : '⚪ DEFAULT'} - ${status1.message}`);

// Scenario 2: Not qualified (only 8 posts)
console.log('\n❌ Scenario 2: Not Qualified (8 posts, 500K views this week)');
const notQualified = calculateUGCOption1WeeklyPayment(8, 500000);
const status2 = getTargetPostsStatus(notQualified.totalPosts);
console.log(`  Posts: ${notQualified.totalPosts}/${notQualified.postsRequired} (${notQualified.postsShortfall} short)`);
console.log(`  Views: ${formatNumber(notQualified.totalViews)}`);
console.log(`  Fixed Rate: ${formatCurrency(notQualified.fixedEarnings)}`);
console.log(`  CPM Earnings: ${formatCurrency(notQualified.cpmEarnings)} (would have earned)`);
console.log(`  Total Payment: ${formatCurrency(notQualified.totalEarnings)}`);
console.log(`  Qualified: ${notQualified.qualifiedForPayment ? '✅ YES' : '❌ NO'}`);
console.log(`  UI Status: ${status2.status === 'success' ? '🟢 GREEN' : '⚪ DEFAULT'} - ${status2.message}`);

// Scenario 3: Just qualified (exactly 12 posts)
console.log('\n✅ Scenario 3: Just Qualified (12 posts, 100K views this week)');
const barelyQualified = calculateUGCOption1WeeklyPayment(12, 100000);
const status3 = getTargetPostsStatus(barelyQualified.totalPosts);
console.log(`  Posts: ${barelyQualified.totalPosts}/${barelyQualified.postsRequired}`);
console.log(`  Views: ${formatNumber(barelyQualified.totalViews)}`);
console.log(`  Fixed Rate: ${formatCurrency(barelyQualified.fixedEarnings)}`);
console.log(`  CPM Earnings: ${formatCurrency(barelyQualified.cpmEarnings)}`);
console.log(`  Total Payment: ${formatCurrency(barelyQualified.totalEarnings)}`);
console.log(`  Qualified: ${barelyQualified.qualifiedForPayment ? '✅ YES' : '❌ NO'}`);
console.log(`  UI Status: ${status3.status === 'success' ? '🟢 GREEN' : '⚪ DEFAULT'} - ${status3.message}`);

// Scenario 4: Over-performer (20 posts, 1M views)
console.log('\n🚀 Scenario 4: Over-Performer (20 posts, 1M views this week)');
const overPerformer = calculateUGCOption1WeeklyPayment(20, 1000000);
const status4 = getTargetPostsStatus(overPerformer.totalPosts);
console.log(`  Posts: ${overPerformer.totalPosts}/${overPerformer.postsRequired}`);
console.log(`  Views: ${formatNumber(overPerformer.totalViews)}`);
console.log(`  Fixed Rate: ${formatCurrency(overPerformer.fixedEarnings)}`);
console.log(`  CPM Earnings: ${formatCurrency(overPerformer.cpmEarnings)}`);
console.log(`  Total Payment: ${formatCurrency(overPerformer.totalEarnings)}`);
console.log(`  Qualified: ${overPerformer.qualifiedForPayment ? '✅ YES' : '❌ NO'}`);
console.log(`  UI Status: ${status4.status === 'success' ? '🟢 GREEN' : '⚪ DEFAULT'} - ${status4.message}`);

// Scenario 5: Close to target (10 posts)
console.log('\n⚠️  Scenario 5: Close to Target (10 posts, 200K views this week)');
const almostThere = calculateUGCOption1WeeklyPayment(10, 200000);
const status5 = getTargetPostsStatus(almostThere.totalPosts);
console.log(`  Posts: ${almostThere.totalPosts}/${almostThere.postsRequired} (${almostThere.postsShortfall} short)`);
console.log(`  Views: ${formatNumber(almostThere.totalViews)}`);
console.log(`  Fixed Rate: ${formatCurrency(almostThere.fixedEarnings)}`);
console.log(`  CPM Earnings: ${formatCurrency(almostThere.cpmEarnings)} (would have earned)`);
console.log(`  Total Payment: ${formatCurrency(almostThere.totalEarnings)}`);
console.log(`  Qualified: ${almostThere.qualifiedForPayment ? '✅ YES' : '❌ NO'}`);
console.log(`  UI Status: ${status5.status === 'warning' ? '🟡 YELLOW' : '⚪ DEFAULT'} - ${status5.message}`);

console.log('\n' + '='.repeat(60));
console.log('✅ All UGC analytics tests completed!\n');
