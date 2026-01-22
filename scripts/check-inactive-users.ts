/**
 * Check for inactive users on the platform
 * Run with: npx tsx scripts/check-inactive-users.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Configuration: Define what "inactive" means
const INACTIVE_DAYS = 7; // Users with no activity in last 7 days

interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
  last_post_date: string | null;
  application_status: string | null;
  deleted_at: string | null;
}

function daysSince(date: string | null): number | null {
  if (!date) return null;
  const then = new Date(date);
  const now = new Date();
  const diffTime = now.getTime() - then.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(date: string | null): string {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function main() {
  console.log('🔍 Checking for Inactive Users...\n');
  console.log(`📅 Definition: Users with no activity in the last ${INACTIVE_DAYS} days\n`);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables. Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch all active users (not deleted)
  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name, email, role, created_at, last_login_at, last_post_date, application_status, deleted_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('⚠️  No users found in database.');
    return;
  }

  console.log(`📊 Total active users: ${users.length}\n`);

  // Get post counts for each user
  const { data: postCounts, error: postError } = await supabase
    .from('posts')
    .select('submitted_by')
    .gte('created_at', new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000).toISOString());

  const recentPostsByUser = new Map<string, number>();
  if (!postError && postCounts) {
    postCounts.forEach((post: { submitted_by: string }) => {
      const count = recentPostsByUser.get(post.submitted_by) || 0;
      recentPostsByUser.set(post.submitted_by, count + 1);
    });
  }

  // Categorize users
  const inactiveUsers: (User & { daysSinceLogin: number | null; daysSincePost: number | null; recentPosts: number })[] = [];
  const neverLoggedIn: User[] = [];
  const neverPosted: User[] = [];

  const cutoffDate = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000);

  users.forEach((user: User) => {
    const daysSinceLogin = daysSince(user.last_login_at);
    const daysSincePost = daysSince(user.last_post_date);
    const recentPosts = recentPostsByUser.get(user.id) || 0;

    // Never logged in
    if (!user.last_login_at) {
      neverLoggedIn.push(user);
    }

    // Never posted (for UGC creators)
    if (!user.last_post_date && user.role === 'ugc_creator') {
      neverPosted.push(user);
    }

    // Inactive: no login AND no posts in the last X days
    const lastLogin = user.last_login_at ? new Date(user.last_login_at) : null;
    const lastPost = user.last_post_date ? new Date(user.last_post_date) : null;

    const loginInactive = !lastLogin || lastLogin < cutoffDate;
    const postInactive = !lastPost || lastPost < cutoffDate;

    if (loginInactive && postInactive && recentPosts === 0) {
      inactiveUsers.push({ ...user, daysSinceLogin, daysSincePost, recentPosts });
    }
  });

  // Sort inactive users by longest inactivity
  inactiveUsers.sort((a, b) => {
    const aInactive = Math.max(a.daysSinceLogin || 999, a.daysSincePost || 999);
    const bInactive = Math.max(b.daysSinceLogin || 999, b.daysSincePost || 999);
    return bInactive - aInactive;
  });

  // Display results
  console.log('═'.repeat(80));
  console.log(`🔴 INACTIVE USERS (no activity in ${INACTIVE_DAYS}+ days): ${inactiveUsers.length}`);
  console.log('═'.repeat(80));

  if (inactiveUsers.length > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log(
      'Name'.padEnd(25) +
      'Email'.padEnd(30) +
      'Role'.padEnd(15) +
      'Last Login'.padEnd(15) +
      'Last Post'
    );
    console.log('─'.repeat(80));

    inactiveUsers.forEach((user) => {
      const name = (user.full_name || 'N/A').substring(0, 24).padEnd(25);
      const email = user.email.substring(0, 29).padEnd(30);
      const role = user.role.substring(0, 14).padEnd(15);
      const lastLogin = user.daysSinceLogin !== null ? `${user.daysSinceLogin}d ago` : 'Never';
      const lastPost = user.daysSincePost !== null ? `${user.daysSincePost}d ago` : 'Never';

      console.log(`${name}${email}${role}${lastLogin.padEnd(15)}${lastPost}`);
    });
  } else {
    console.log('\n✅ All users have been active recently!');
  }

  // Never logged in section
  console.log('\n' + '═'.repeat(80));
  console.log(`⚠️  NEVER LOGGED IN: ${neverLoggedIn.length}`);
  console.log('═'.repeat(80));

  if (neverLoggedIn.length > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log(
      'Name'.padEnd(25) +
      'Email'.padEnd(35) +
      'Role'.padEnd(15) +
      'Registered'
    );
    console.log('─'.repeat(80));

    neverLoggedIn.forEach((user: User) => {
      const name = (user.full_name || 'N/A').substring(0, 24).padEnd(25);
      const email = user.email.substring(0, 34).padEnd(35);
      const role = user.role.substring(0, 14).padEnd(15);
      const registered = formatDate(user.created_at);

      console.log(`${name}${email}${role}${registered}`);
    });
  }

  // UGC Creators who never posted
  const ugcNeverPosted = neverPosted.filter(u => u.role === 'ugc_creator');
  if (ugcNeverPosted.length > 0) {
    console.log('\n' + '═'.repeat(80));
    console.log(`📭 UGC CREATORS WHO NEVER POSTED: ${ugcNeverPosted.length}`);
    console.log('═'.repeat(80));

    console.log('\n' + '─'.repeat(80));
    console.log(
      'Name'.padEnd(25) +
      'Email'.padEnd(35) +
      'Status'.padEnd(12) +
      'Registered'
    );
    console.log('─'.repeat(80));

    ugcNeverPosted.forEach((user: User) => {
      const name = (user.full_name || 'N/A').substring(0, 24).padEnd(25);
      const email = user.email.substring(0, 34).padEnd(35);
      const status = (user.application_status || 'N/A').substring(0, 11).padEnd(12);
      const registered = formatDate(user.created_at);

      console.log(`${name}${email}${status}${registered}`);
    });
  }

  // Summary by role
  console.log('\n' + '═'.repeat(80));
  console.log('📊 SUMMARY BY ROLE');
  console.log('═'.repeat(80));

  const roleStats = users.reduce((acc: Record<string, { total: number; inactive: number }>, user: User) => {
    if (!acc[user.role]) {
      acc[user.role] = { total: 0, inactive: 0 };
    }
    acc[user.role].total++;

    const isInactive = inactiveUsers.some(u => u.id === user.id);
    if (isInactive) {
      acc[user.role].inactive++;
    }
    return acc;
  }, {});

  console.log('\n' + '─'.repeat(50));
  console.log('Role'.padEnd(20) + 'Total'.padEnd(10) + 'Inactive'.padEnd(10) + '% Inactive');
  console.log('─'.repeat(50));

  Object.entries(roleStats).forEach(([role, stats]) => {
    const pct = stats.total > 0 ? ((stats.inactive / stats.total) * 100).toFixed(1) : '0';
    console.log(
      role.padEnd(20) +
      stats.total.toString().padEnd(10) +
      stats.inactive.toString().padEnd(10) +
      `${pct}%`
    );
  });

  console.log('\n✅ Done!');
}

main().catch(console.error);
