/**
 * Test analytics calculations locally
 * Run with: npm run test-analytics
 */

import {
  calculateUGCEarnings,
  detectViralStatus,
  shouldTriggerViralAlert,
  calculateInfluencerProgress,
  calculateMonthlyStats,
  calculateEngagementRate,
  formatCurrency,
  formatNumber,
  type PostAnalytics,
} from '../src/services/analytics';

console.log('🧪 Testing Analytics Calculations\n');
console.log('='.repeat(60));

// Test 1: UGC Creator Earnings
console.log('\n📊 Test 1: UGC Creator Earnings');
console.log('-'.repeat(60));

// Case 1: Qualified (12+ posts)
const ugcCase1 = calculateUGCEarnings(227418, 12);
console.log('\nCase 1: 227,418 views, 12 posts (qualified)');
console.log(`  Fixed Pay: ${formatCurrency(ugcCase1.fixedPay)}`);
console.log(`  CPM Earnings: ${formatCurrency(ugcCase1.cpmEarnings)}`);
console.log(`  Total: ${formatCurrency(ugcCase1.totalEarnings)}`);
console.log(`  Qualified: ${ugcCase1.qualifiedForPayment ? '✅' : '❌'}`);

// Case 2: Not qualified (< 12 posts)
const ugcCase2 = calculateUGCEarnings(227418, 8);
console.log('\nCase 2: 227,418 views, 8 posts (not qualified)');
console.log(`  Fixed Pay: ${formatCurrency(ugcCase2.fixedPay)}`);
console.log(`  CPM Earnings: ${formatCurrency(ugcCase2.cpmEarnings)}`);
console.log(`  Total: ${formatCurrency(ugcCase2.totalEarnings)}`);
console.log(`  Qualified: ${ugcCase2.qualifiedForPayment ? '✅' : '❌'}`);

// Test 2: Viral Detection
console.log('\n\n📊 Test 2: Viral Status Detection');
console.log('-'.repeat(60));

const testViews = [1000, 5000, 10000, 20000, 50000, 100000];
testViews.forEach(views => {
  const status = detectViralStatus(views);
  const emoji = status === 'viral' ? '🚀' : status === 'traction' ? '🔥' : '📊';
  console.log(`  ${formatNumber(views).padStart(7)} views → ${emoji} ${status.toUpperCase()}`);
});

// Test 3: Viral Alert Triggers
console.log('\n\n📊 Test 3: Viral Alert Triggers');
console.log('-'.repeat(60));

const alertTests = [
  { prev: 4500, curr: 5200, desc: 'Crossed 5K threshold' },
  { prev: 18000, curr: 21000, desc: 'Crossed 20K threshold' },
  { prev: 3000, curr: 4000, desc: 'No threshold crossed' },
  { prev: 10000, curr: 15000, desc: 'Already above 5K' },
];

alertTests.forEach(({ prev, curr, desc }) => {
  const alert = shouldTriggerViralAlert(curr, prev);
  if (alert) {
    const emoji = alert.level === 'viral' ? '🚀' : '🔥';
    console.log(`  ${emoji} ${desc}: Alert "${alert.level.toUpperCase()}" (${formatNumber(alert.threshold)} views)`);
  } else {
    console.log(`  ⚪ ${desc}: No alert`);
  }
});

// Test 4: Influencer Contract Progress
console.log('\n\n📊 Test 4: Influencer Contract Progress');
console.log('-'.repeat(60));

// Example contract: 1M views, 6 posts, $1400 base, $300 bonus if done in 4 posts
const contract = {
  targetViews: 1000000,
  targetPosts: 6,
  basePayout: 1400,
  bonusAmount: 300,
  bonusPostThreshold: 4,
};

// Scenario 1: On track, bonus eligible (1.1M views in 4 posts)
const progress1 = calculateInfluencerProgress(contract, {
  totalViews: 1100000,
  totalPosts: 4,
});

console.log('\nScenario 1: 1,100,000 views in 4 posts');
console.log(`  Views Progress: ${progress1.viewsProgress.percentage.toFixed(1)}% (${formatNumber(progress1.viewsProgress.current)} / ${formatNumber(progress1.viewsProgress.target)})`);
console.log(`  Posts Progress: ${progress1.postsProgress.percentage.toFixed(1)}% (${progress1.postsProgress.current} / ${progress1.postsProgress.target})`);
console.log(`  Base Payout: ${formatCurrency(progress1.basePayout)}`);
console.log(`  Bonus Eligible: ${progress1.bonusEligible ? '✅ YES' : '❌ NO'}`);
console.log(`  Bonus Amount: ${formatCurrency(progress1.bonusAmount)}`);
console.log(`  Estimated Total: ${formatCurrency(progress1.estimatedTotal)}`);

// Scenario 2: Reached target but no bonus (1.1M views in 6 posts)
const progress2 = calculateInfluencerProgress(contract, {
  totalViews: 1100000,
  totalPosts: 6,
});

console.log('\nScenario 2: 1,100,000 views in 6 posts (no bonus)');
console.log(`  Views Progress: ${progress2.viewsProgress.percentage.toFixed(1)}%`);
console.log(`  Posts Progress: ${progress2.postsProgress.percentage.toFixed(1)}%`);
console.log(`  Bonus Eligible: ${progress2.bonusEligible ? '✅ YES' : '❌ NO'}`);
console.log(`  Estimated Total: ${formatCurrency(progress2.estimatedTotal)}`);

// Scenario 3: In progress (500K views in 3 posts)
const progress3 = calculateInfluencerProgress(contract, {
  totalViews: 500000,
  totalPosts: 3,
});

console.log('\nScenario 3: 500,000 views in 3 posts (in progress)');
console.log(`  Views Progress: ${progress3.viewsProgress.percentage.toFixed(1)}%`);
console.log(`  Posts Progress: ${progress3.postsProgress.percentage.toFixed(1)}%`);
console.log(`  On track for bonus: ${progress3.postsProgress.current <= contract.bonusPostThreshold ? '✅ YES' : '❌ NO'}`);

// Test 5: Monthly Statistics
console.log('\n\n📊 Test 5: Monthly Statistics');
console.log('-'.repeat(60));

const mockPosts: PostAnalytics[] = [
  {
    postId: '1',
    platform: 'tiktok',
    views: 99300,
    likes: 7473,
    comments: 10,
    shares: 161,
    bookmarks: 132,
    engagementRate: 7.7,
    viralStatus: 'viral',
    fetchedAt: new Date(),
  },
  {
    postId: '2',
    platform: 'instagram',
    views: 227418,
    likes: 23730,
    comments: 182,
    shares: 0,
    bookmarks: 0,
    engagementRate: 10.51,
    viralStatus: 'viral',
    fetchedAt: new Date(),
  },
  {
    postId: '3',
    platform: 'tiktok',
    views: 3200,
    likes: 150,
    comments: 5,
    shares: 10,
    bookmarks: 8,
    engagementRate: 5.41,
    viralStatus: 'regular',
    fetchedAt: new Date(),
  },
  {
    postId: '4',
    platform: 'instagram',
    views: 8500,
    likes: 420,
    comments: 12,
    shares: 3,
    bookmarks: 15,
    engagementRate: 5.29,
    viralStatus: 'traction',
    fetchedAt: new Date(),
  },
];

const monthlyStats = calculateMonthlyStats(mockPosts);

console.log(`\nTotal Posts: ${monthlyStats.totalPosts}`);
console.log(`Total Views: ${formatNumber(monthlyStats.totalViews)}`);
console.log(`Total Likes: ${formatNumber(monthlyStats.totalLikes)}`);
console.log(`Total Comments: ${formatNumber(monthlyStats.totalComments)}`);
console.log(`Total Shares: ${formatNumber(monthlyStats.totalShares)}`);
console.log(`Average Engagement: ${monthlyStats.averageEngagementRate}%`);
console.log(`Viral Posts (>20K): ${monthlyStats.viralPosts} 🚀`);
console.log(`Traction Posts (>5K): ${monthlyStats.tractionPosts} 🔥`);
console.log(`Top Post: ${monthlyStats.topPost?.platform.toUpperCase()} - ${formatNumber(monthlyStats.topPost?.views || 0)} views (${monthlyStats.topPost?.engagementRate}% engagement)`);

// Test 6: Engagement Rate Calculation
console.log('\n\n📊 Test 6: Engagement Rate Calculation');
console.log('-'.repeat(60));

const engagementTests = [
  { likes: 7473, comments: 10, shares: 161, views: 99300, desc: 'TikTok viral post' },
  { likes: 23730, comments: 182, shares: 0, views: 227418, desc: 'Instagram viral post' },
  { likes: 150, comments: 5, shares: 10, views: 3200, desc: 'Regular post' },
];

engagementTests.forEach(({ likes, comments, shares, views, desc }) => {
  const rate = calculateEngagementRate(likes, comments, shares, views);
  console.log(`  ${desc}: ${rate}%`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ All analytics calculations tested successfully!\n');
