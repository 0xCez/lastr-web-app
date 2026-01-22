# Remaining Audit Items

## Completed (Dec 25, 2024)

- [x] Week definition inconsistency - Fixed with shared `src/utils/dateUtils.ts`
- [x] Timezone bugs - Fixed with UTC methods
- [x] Contract option logic mismatch - Fixed with `src/constants/contracts.ts`
- [x] N+1 query patterns - Fixed with single monthly query
- [x] useUGCAnalytics deprecated - Deleted
- [x] Hardcoded API keys in generators - Fixed with `Deno.env.get()`

## Remaining (Medium/Low Priority)

### Database/RLS

1. **Missing admin SELECT on users table** (MEDIUM)
   - Admin can't query all users
   - Add RLS policy: `CREATE POLICY "Admins can read all users" ON users FOR SELECT TO authenticated USING (is_admin());`

2. **Missing FK on failed_posts_queue** (MEDIUM)
   - `post_id` references `posts.id` but no FK constraint
   - Add: `ALTER TABLE failed_posts_queue ADD CONSTRAINT fk_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;`

3. **Missing admin policies on onboarding_checklist, notifications** (MEDIUM)
   - Admins can't manage these tables
   - Add SELECT/UPDATE policies for admin role

4. **Missing index on posts.platform** (LOW)
   - Nice to have for platform filtering queries
   - Add: `CREATE INDEX idx_posts_platform ON posts(platform);`

### Scraper

5. **Rate limit backoff missing** (MEDIUM)
   - Add 2s delay after receiving 429 status
   - Location: `supabase/functions/process-analytics-batch/index.ts`

## How to Apply Database Fixes

```sql
-- Run in Supabase SQL Editor

-- 1. Admin SELECT on users
CREATE POLICY "Admins can read all users" ON users
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 2. FK on failed_posts_queue
ALTER TABLE failed_posts_queue
ADD CONSTRAINT fk_failed_posts_queue_post
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- 3. Admin policies on onboarding_checklist
CREATE POLICY "Admins can manage onboarding_checklist" ON onboarding_checklist
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Admin policies on notifications
CREATE POLICY "Admins can manage notifications" ON notifications
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 5. Index on posts.platform
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
```
