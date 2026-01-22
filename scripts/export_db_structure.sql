-- =====================================================
-- COMPLETE DATABASE EXPORT SCRIPT
-- =====================================================
-- Run this in Supabase SQL Editor to get EVERYTHING
-- Copy the output and save it for reference

-- =====================================================
-- 1. ENUMS
-- =====================================================
WITH enum_values AS (
  SELECT
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
  FROM pg_type t
  JOIN pg_enum e ON t.oid = e.enumtypid
  JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'public'
  GROUP BY t.typname
)
SELECT
  'ENUM' as type,
  enum_name as name,
  values as definition,
  NULL as extra
FROM enum_values

UNION ALL

-- =====================================================
-- 2. TABLES
-- =====================================================
SELECT
  'TABLE' as type,
  table_name as name,
  '(' || COUNT(*) || ' columns)' as definition,
  NULL as extra
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name

UNION ALL

-- =====================================================
-- 3. COLUMNS
-- =====================================================
SELECT
  'COLUMN' as type,
  table_name || '.' || column_name as name,
  data_type ||
  CASE WHEN character_maximum_length IS NOT NULL
    THEN '(' || character_maximum_length || ')'
    ELSE ''
  END as definition,
  CASE WHEN is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULLABLE' END ||
  CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END as extra
FROM information_schema.columns
WHERE table_schema = 'public'

UNION ALL

-- =====================================================
-- 4. PRIMARY KEYS
-- =====================================================
SELECT
  'PRIMARY_KEY' as type,
  tc.table_name as name,
  kcu.column_name as definition,
  tc.constraint_name as extra
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY'

UNION ALL

-- =====================================================
-- 5. FOREIGN KEYS
-- =====================================================
SELECT
  'FOREIGN_KEY' as type,
  tc.table_name || '.' || kcu.column_name as name,
  'REFERENCES ' || ccu.table_name || '.' || ccu.column_name as definition,
  tc.constraint_name as extra
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'

UNION ALL

-- =====================================================
-- 6. UNIQUE CONSTRAINTS
-- =====================================================
SELECT
  'UNIQUE' as type,
  tc.table_name as name,
  string_agg(kcu.column_name, ', ') as definition,
  tc.constraint_name as extra
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.table_name, tc.constraint_name

UNION ALL

-- =====================================================
-- 7. INDEXES
-- =====================================================
SELECT
  'INDEX' as type,
  tablename || '.' || indexname as name,
  indexdef as definition,
  NULL as extra
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'  -- Exclude primary key indexes

UNION ALL

-- =====================================================
-- 8. FUNCTIONS
-- =====================================================
SELECT
  'FUNCTION' as type,
  p.proname as name,
  pg_catalog.pg_get_function_arguments(p.oid) as definition,
  pg_catalog.pg_get_function_result(p.oid) as extra
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'

UNION ALL

-- =====================================================
-- 9. TRIGGERS
-- =====================================================
SELECT
  'TRIGGER' as type,
  trigger_name as name,
  'ON ' || event_object_table || ' ' || action_timing || ' ' || event_manipulation as definition,
  'Calls: ' || action_statement as extra
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================
SELECT
  'RLS_POLICY' as type,
  tablename || '.' || policyname as name,
  'FOR ' || cmd as definition,
  'Permissive: ' || permissive as extra
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

-- =====================================================
-- 11. VIEWS
-- =====================================================
SELECT
  'VIEW' as type,
  table_name as name,
  'View definition' as definition,
  NULL as extra
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'VIEW'

ORDER BY type, name;
