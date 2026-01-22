-- ================================================================
-- DATABASE VERIFICATION SCRIPT
-- ================================================================
-- Run this in Supabase SQL Editor to verify database matches documentation
-- Run each query separately to see the results
-- ================================================================

-- =====================================================
-- 1. CHECK ALL TABLES EXIST
-- =====================================================
-- Expected: 8 tables, all with RLS enabled

SELECT
  tablename as "Table Name",
  CASE
    WHEN rowsecurity THEN '✓ Enabled'
    ELSE '✗ Disabled'
  END as "RLS Status"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'accounts', 'user_accounts', 'posts', 'analytics', 'contracts', 'notifications', 'platform_settings')
ORDER BY tablename;

-- =====================================================
-- 2. CHECK ALL ENUMS EXIST
-- =====================================================
-- Expected: 6 enums with correct values

SELECT
  t.typname as "Enum Name",
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as "Values"
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('user_role', 'platform_type', 'post_status', 'notification_type', 'contract_status', 'content_type')
GROUP BY t.typname
ORDER BY t.typname;

-- =====================================================
-- 3. CHECK RLS POLICIES COUNT
-- =====================================================
-- Shows how many policies exist per table

SELECT
  tablename as "Table",
  COUNT(*) as "Policy Count",
  string_agg(DISTINCT cmd::text, ', ' ORDER BY cmd::text) as "Commands"
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- 4. CHECK CRITICAL POLICIES (accounts table)
-- =====================================================
-- Should show: INSERT (open), SELECT (open), UPDATE (admin), DELETE (admin)

SELECT
  policyname as "Policy Name",
  cmd as "Command",
  permissive as "Type",
  CASE
    WHEN with_check = 'true' THEN '✓ Open'
    WHEN with_check IS NULL THEN 'N/A'
    ELSE 'Restricted'
  END as "Check",
  CASE
    WHEN qual = 'true' THEN '✓ Open'
    WHEN qual IS NULL THEN 'N/A'
    ELSE 'Restricted'
  END as "Using"
FROM pg_policies
WHERE tablename = 'accounts'
ORDER BY cmd;

-- =====================================================
-- 5. CHECK FUNCTIONS
-- =====================================================
-- Expected: complete_user_profile, update_updated_at_column

SELECT
  proname as "Function Name",
  pg_get_function_arguments(oid) as "Arguments"
FROM pg_proc
WHERE proname IN ('complete_user_profile', 'update_updated_at_column')
ORDER BY proname;

-- =====================================================
-- 6. CHECK TRIGGERS
-- =====================================================
-- Expected: updated_at triggers on users, accounts, posts, contracts

SELECT
  event_object_table as "Table",
  trigger_name as "Trigger Name",
  event_manipulation as "Event"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- =====================================================
-- 7. CHECK VIEWS
-- =====================================================
-- Expected: latest_analytics, post_performance

SELECT
  table_name as "View Name"
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('latest_analytics', 'post_performance')
ORDER BY table_name;

-- =====================================================
-- 8. CHECK INDEXES (Performance)
-- =====================================================
-- Expected: Multiple idx_ indexes for performance

SELECT
  tablename as "Table",
  indexname as "Index Name"
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- 9. CHECK PLATFORM SETTINGS (Default Values)
-- =====================================================
-- Expected: TikTok (100000), Instagram (50000)

SELECT
  platform as "Platform",
  viral_view_threshold as "Viral Threshold"
FROM platform_settings
ORDER BY platform;

-- =====================================================
-- 10. CHECK FOREIGN KEY CONSTRAINTS
-- =====================================================
-- Shows all FK relationships

SELECT
  tc.table_name as "Table",
  kcu.column_name as "Column",
  ccu.table_name AS "References Table"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ================================================================
-- VERIFICATION COMPLETE
-- Compare results with DATABASE.md documentation
-- ================================================================
