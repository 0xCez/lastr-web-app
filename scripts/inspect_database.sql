-- =====================================================
-- DATABASE INSPECTION SCRIPT
-- =====================================================
-- Run this in Supabase SQL Editor to get complete database structure
-- Copy and paste the entire output into a file for reference

-- =====================================================
-- 1. ALL ENUMS (Custom Types)
-- =====================================================
SELECT
  '=== ENUMS ===' as section,
  '' as detail
UNION ALL
SELECT
  t.typname as section,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as detail
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY section;

-- =====================================================
-- 2. ALL TABLES WITH ROW COUNTS
-- =====================================================
SELECT
  '=== TABLES ===' as info,
  '' as table_name,
  '' as row_count
UNION ALL
SELECT
  'Table' as info,
  schemaname || '.' || tablename as table_name,
  'Use: SELECT COUNT(*) FROM ' || schemaname || '.' || tablename as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY table_name;

-- =====================================================
-- 3. DETAILED TABLE STRUCTURES
-- =====================================================
-- This shows every column in every table with data types and constraints

SELECT
  '=== TABLE: ' || table_name || ' ===' as column_info
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'

UNION ALL

SELECT
  '  Column: ' || column_name ||
  ' | Type: ' || data_type ||
  CASE
    WHEN character_maximum_length IS NOT NULL
    THEN '(' || character_maximum_length || ')'
    ELSE ''
  END ||
  ' | Nullable: ' || is_nullable ||
  CASE
    WHEN column_default IS NOT NULL
    THEN ' | Default: ' || column_default
    ELSE ''
  END as column_info
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 4. PRIMARY KEYS
-- =====================================================
SELECT
  '=== PRIMARY KEYS ===' as constraint_info
UNION ALL
SELECT
  '  Table: ' || tc.table_name ||
  ' | Column: ' || kcu.column_name ||
  ' | Constraint: ' || tc.constraint_name as constraint_info
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;

-- =====================================================
-- 5. FOREIGN KEYS (Relationships)
-- =====================================================
SELECT
  '=== FOREIGN KEYS (Relationships) ===' as fk_info
UNION ALL
SELECT
  '  ' || tc.table_name || '.' || kcu.column_name ||
  ' → REFERENCES → ' ||
  ccu.table_name || '.' || ccu.column_name ||
  ' | Constraint: ' || tc.constraint_name as fk_info
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

-- =====================================================
-- 6. UNIQUE CONSTRAINTS
-- =====================================================
SELECT
  '=== UNIQUE CONSTRAINTS ===' as unique_info
UNION ALL
SELECT
  '  Table: ' || tc.table_name ||
  ' | Columns: ' || string_agg(kcu.column_name, ', ') ||
  ' | Constraint: ' || tc.constraint_name as unique_info
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;

-- =====================================================
-- 7. INDEXES
-- =====================================================
SELECT
  '=== INDEXES ===' as index_info
UNION ALL
SELECT
  '  Table: ' || tablename ||
  ' | Index: ' || indexname ||
  ' | Definition: ' || indexdef as index_info
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 8. FUNCTIONS (Stored Procedures/RPCs)
-- =====================================================
SELECT
  '=== FUNCTIONS (RPCs) ===' as function_info
UNION ALL
SELECT
  '  Function: ' || routine_name ||
  ' | Type: ' || routine_type ||
  ' | Language: ' || COALESCE(external_language, 'N/A') as function_info
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- =====================================================
-- 9. TRIGGERS
-- =====================================================
SELECT
  '=== TRIGGERS ===' as trigger_info
UNION ALL
SELECT
  '  Trigger: ' || trigger_name ||
  ' | Table: ' || event_object_table ||
  ' | Event: ' || event_manipulation ||
  ' | Timing: ' || action_timing as trigger_info
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 10. ROW LEVEL SECURITY POLICIES
-- =====================================================
SELECT
  '=== RLS POLICIES ===' as policy_info
UNION ALL
SELECT
  '  Table: ' || tablename ||
  ' | Policy: ' || policyname ||
  ' | Command: ' || cmd ||
  ' | Permissive: ' || permissive as policy_info
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 11. VIEWS
-- =====================================================
SELECT
  '=== VIEWS ===' as view_info
UNION ALL
SELECT
  '  View: ' || table_name ||
  ' | Type: ' || table_type as view_info
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'VIEW'
ORDER BY table_name;
