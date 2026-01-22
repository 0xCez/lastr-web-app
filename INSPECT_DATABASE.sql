-- =====================================================
-- DATABASE INSPECTION SCRIPT
-- Run this in Supabase SQL Editor to see current state
-- =====================================================

-- =====================================================
-- 1. SHOW ALL TABLES
-- =====================================================
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 2. USERS TABLE - Show all users and their roles
-- =====================================================
SELECT
  id,
  full_name,
  email,
  role,
  country,
  contract_option,
  created_at
FROM users
ORDER BY created_at DESC;

-- =====================================================
-- 3. ACCOUNTS TABLE - Show all social accounts
-- =====================================================
SELECT
  id,
  platform,
  handle,
  follower_count,
  is_active,
  created_at
FROM accounts
ORDER BY created_at DESC;

-- =====================================================
-- 4. USER_ACCOUNTS - Show which users manage which accounts
-- =====================================================
SELECT
  ua.id,
  u.full_name as user_name,
  u.email,
  a.platform,
  a.handle,
  ua.assigned_at
FROM user_accounts ua
INNER JOIN users u ON ua.user_id = u.id
INNER JOIN accounts a ON ua.account_id = a.id
ORDER BY ua.assigned_at DESC;

-- =====================================================
-- 5. POSTS TABLE - Show all posts with status
-- =====================================================
SELECT
  p.id,
  u.full_name as submitted_by,
  a.handle as account_handle,
  p.platform,
  p.url,
  p.status,
  p.content_type,
  p.created_at
FROM posts p
INNER JOIN users u ON p.submitted_by = u.id
INNER JOIN accounts a ON p.account_id = a.id
ORDER BY p.created_at DESC;

-- =====================================================
-- 6. ANALYTICS TABLE - Show metrics for all posts
-- =====================================================
SELECT
  an.id,
  p.url as post_url,
  an.views,
  an.likes,
  an.comments,
  an.shares,
  an.bookmarks,
  an.downloads,
  an.engagement_rate,
  an.source,
  an.fetched_at,
  an.created_at
FROM analytics an
INNER JOIN posts p ON an.post_id = p.id
ORDER BY an.fetched_at DESC;

-- =====================================================
-- 7. CONTRACTS TABLE - Show active contracts
-- =====================================================
SELECT
  c.id,
  u.full_name as user_name,
  u.email,
  c.status,
  c.target_posts_weekly,
  c.target_posts_monthly,
  c.target_views_monthly,
  c.base_payout,
  c.cpm_rate,
  c.bonus_threshold,
  c.bonus_amount,
  c.start_date,
  c.end_date
FROM contracts c
INNER JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- =====================================================
-- 8. POSTS vs ANALYTICS - Check which posts have analytics
-- =====================================================
SELECT
  p.id as post_id,
  p.url,
  p.platform,
  p.status,
  p.created_at as post_created,
  CASE
    WHEN a.id IS NULL THEN 'NO ANALYTICS'
    ELSE 'HAS ANALYTICS'
  END as analytics_status,
  a.views,
  a.likes,
  a.fetched_at
FROM posts p
LEFT JOIN analytics a ON p.id = a.post_id
ORDER BY p.created_at DESC;

-- =====================================================
-- 9. SUMMARY STATS
-- =====================================================
SELECT
  'Users' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN role = 'ugc_creator' THEN 1 END) as ugc_creators,
  COUNT(CASE WHEN role = 'influencer' THEN 1 END) as influencers,
  COUNT(CASE WHEN role = 'account_manager' THEN 1 END) as account_managers,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
FROM users

UNION ALL

SELECT
  'Accounts' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN platform = 'tiktok' THEN 1 END) as tiktok_accounts,
  COUNT(CASE WHEN platform = 'instagram' THEN 1 END) as instagram_accounts,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_accounts,
  NULL as col5
FROM accounts

UNION ALL

SELECT
  'Posts' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN platform = 'tiktok' THEN 1 END) as tiktok_posts
FROM posts

UNION ALL

SELECT
  'Analytics' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN views > 0 THEN 1 END) as with_views,
  SUM(views)::bigint as total_views,
  AVG(engagement_rate)::numeric(10,2) as avg_engagement,
  NULL as col5
FROM analytics

UNION ALL

SELECT
  'Contracts' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  NULL as col3,
  NULL as col4,
  NULL as col5
FROM contracts;

-- =====================================================
-- 10. CHECK FOR ORPHANED DATA
-- =====================================================

-- Posts without analytics
SELECT
  'Posts without analytics' as issue,
  COUNT(*) as count
FROM posts p
LEFT JOIN analytics a ON p.id = a.post_id
WHERE p.status = 'approved'
  AND a.id IS NULL;

-- Analytics without posts (shouldn't happen due to FK)
-- Posts without accounts (shouldn't happen due to FK)
-- Etc.

-- =====================================================
-- 11. RECENT ACTIVITY
-- =====================================================
SELECT
  'Recent posts (last 7 days)' as activity,
  COUNT(*) as count
FROM posts
WHERE created_at >= NOW() - INTERVAL '7 days';

SELECT
  'Recent analytics fetches (last 7 days)' as activity,
  COUNT(*) as count
FROM analytics
WHERE fetched_at >= NOW() - INTERVAL '7 days';

-- =====================================================
-- 12. CHECK ANALYTICS TABLE STRUCTURE
-- =====================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'analytics'
ORDER BY ordinal_position;

-- =====================================================
-- 13. CHECK FOR UNIQUE CONSTRAINT ON analytics.post_id
-- =====================================================
SELECT
  con.conname as constraint_name,
  con.contype as constraint_type,
  col.attname as column_name
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_attribute col ON col.attrelid = con.conrelid
WHERE rel.relname = 'analytics'
  AND con.contype IN ('u', 'p')  -- unique or primary key
ORDER BY con.conname;
