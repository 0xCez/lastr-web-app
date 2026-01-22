-- =====================================================
-- SIMPLE DATABASE STRUCTURE INSPECTOR
-- =====================================================
-- Run this in Supabase SQL Editor
-- This will give you a clean, readable output of your entire database

-- =====================================================
-- SECTION 1: ENUMS (Custom Types)
-- =====================================================
SELECT
  '📋 ENUM: ' || t.typname as "Database Structure",
  '   Values: ' || string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as "Details"
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname

UNION ALL
SELECT '', ''

UNION ALL
-- =====================================================
-- SECTION 2: TABLES WITH COLUMNS
-- =====================================================
SELECT
  '📊 TABLE: ' || c.table_name as "Database Structure",
  '' as "Details"
FROM information_schema.columns c
WHERE c.table_schema = 'public'
GROUP BY c.table_name

UNION ALL

SELECT
  '   └─ ' || c.column_name as "Database Structure",
  '      ' || c.data_type ||
  CASE
    WHEN c.is_nullable = 'NO' THEN ' NOT NULL'
    ELSE ' NULLABLE'
  END ||
  CASE
    WHEN c.column_default IS NOT NULL THEN ' (default: ' || c.column_default || ')'
    ELSE ''
  END as "Details"
FROM information_schema.columns c
WHERE c.table_schema = 'public'

UNION ALL
SELECT '', ''

UNION ALL
-- =====================================================
-- SECTION 3: FOREIGN KEY RELATIONSHIPS
-- =====================================================
SELECT
  '🔗 RELATIONSHIPS' as "Database Structure",
  '' as "Details"

UNION ALL

SELECT
  '   ' || tc.table_name || '.' || kcu.column_name as "Database Structure",
  '      → ' || ccu.table_name || '.' || ccu.column_name as "Details"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'

UNION ALL
SELECT '', ''

UNION ALL
-- =====================================================
-- SECTION 4: FUNCTIONS
-- =====================================================
SELECT
  '⚙️ FUNCTIONS (RPCs)' as "Database Structure",
  '' as "Details"

UNION ALL

SELECT
  '   ' || p.proname as "Database Structure",
  '      Returns: ' || pg_catalog.pg_get_function_result(p.oid) as "Details"
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'

ORDER BY "Database Structure";
