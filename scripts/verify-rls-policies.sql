-- ================================================================
-- VERIFY CURRENT RLS POLICIES
-- ================================================================
-- Copy and paste this entire file into Supabase SQL Editor to see
-- all current RLS policies and identify what's blocking admin access
-- ================================================================

-- 1. Check all SELECT policies on critical tables
SELECT
  tablename,
  policyname,
  cmd,
  qual as policy_condition,
  CASE
    WHEN qual LIKE '%role = ''admin''%' OR qual LIKE '%role = $$admin$$%' THEN '✅ HAS ADMIN BYPASS'
    WHEN qual = 'true' THEN '✅ PUBLIC READ'
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%admin%' THEN '⚠️ NO ADMIN BYPASS - USERS ONLY'
    ELSE '❓ UNKNOWN'
  END as admin_access_status
FROM pg_policies
WHERE tablename IN (
  'users',
  'accounts',
  'user_accounts',
  'posts',
  'cpm_post_breakdown',
  'analytics_snapshots',
  'user_streaks',
  'user_milestones'
)
AND cmd = 'SELECT'
ORDER BY tablename;

-- 2. Specifically check user_accounts policy (THIS IS THE KEY ONE)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as full_policy_text
FROM pg_policies
WHERE tablename = 'user_accounts'
AND cmd = 'SELECT';

-- 3. Check if there are any duplicate policies
SELECT
  tablename,
  cmd,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN (
  'users',
  'accounts',
  'user_accounts',
  'posts',
  'cpm_post_breakdown'
)
GROUP BY tablename, cmd
HAVING COUNT(*) > 1
ORDER BY tablename, cmd;
