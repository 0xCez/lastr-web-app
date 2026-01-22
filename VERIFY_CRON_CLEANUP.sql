-- Verify cron job cleanup
-- Run this in Supabase SQL Editor

-- 1. Check if any cron jobs exist
SELECT * FROM cron.job;

-- 2. If the job exists with a different name, unschedule it
-- SELECT cron.unschedule('actual-job-name-here');

-- 3. Verify extensions are still enabled (we'll need them later)
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');

-- If no cron jobs appear in query 1, we're clean! ✅
