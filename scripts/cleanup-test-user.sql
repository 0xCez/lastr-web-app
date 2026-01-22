-- ================================================================
-- CLEANUP SCRIPT FOR TEST USER
-- ================================================================
-- Use this script to completely remove a test user and all their data
-- This allows you to re-signup with the same email using a different role
--
-- IMPORTANT: Replace 'your-test-email@example.com' with your actual test email
-- ================================================================

-- Step 1: Find the user ID (for verification)
SELECT id, email, full_name, role
FROM users
WHERE email = 'your-test-email@example.com';

-- Step 2: Delete all user data (cascading deletes will handle most relationships)
-- This follows the foreign key constraints defined in your schema

-- Delete user's posts (via their accounts)
DELETE FROM posts
WHERE account_id IN (
  SELECT account_id
  FROM user_accounts
  WHERE user_id = (SELECT id FROM users WHERE email = 'your-test-email@example.com')
);

-- Delete user's analytics data (via their accounts)
DELETE FROM analytics
WHERE account_id IN (
  SELECT account_id
  FROM user_accounts
  WHERE user_id = (SELECT id FROM users WHERE email = 'your-test-email@example.com')
);

-- Delete user's notifications
DELETE FROM notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'your-test-email@example.com');

-- Delete user's contracts
DELETE FROM contracts
WHERE user_id = (SELECT id FROM users WHERE email = 'your-test-email@example.com');

-- Delete user_accounts links
DELETE FROM user_accounts
WHERE user_id = (SELECT id FROM users WHERE email = 'your-test-email@example.com');

-- Delete accounts that are no longer linked to any user
DELETE FROM accounts
WHERE id NOT IN (SELECT account_id FROM user_accounts);

-- Delete the user from users table
DELETE FROM users
WHERE email = 'your-test-email@example.com';

-- Step 3: Delete from auth.users (Supabase Auth)
-- IMPORTANT: This requires admin privileges
DELETE FROM auth.users
WHERE email = 'your-test-email@example.com';

-- ================================================================
-- VERIFICATION: Check that user is completely removed
-- ================================================================
SELECT 'User still exists in users table' AS status, COUNT(*) AS count
FROM users
WHERE email = 'your-test-email@example.com'
UNION ALL
SELECT 'User still exists in auth.users' AS status, COUNT(*) AS count
FROM auth.users
WHERE email = 'your-test-email@example.com';

-- Should return 0 for both rows if cleanup was successful
