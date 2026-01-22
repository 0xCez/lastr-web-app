-- ================================================================
-- QUICK ROLE SWITCH FOR TESTING
-- ================================================================
-- Use this script to quickly switch a user's role without recreating the account
-- Just replace the email and desired role, then run in Supabase SQL Editor
--
-- After running this, refresh your dashboard to see the new role in action
-- ================================================================

-- Switch to Admin
UPDATE users
SET role = 'admin'
WHERE email = 'your-test-email@example.com';

-- OR switch to UGC Creator
-- UPDATE users
-- SET role = 'ugc_creator'
-- WHERE email = 'your-test-email@example.com';

-- OR switch to Influencer
-- UPDATE users
-- SET role = 'influencer'
-- WHERE email = 'your-test-email@example.com';

-- OR switch to Account Manager
-- UPDATE users
-- SET role = 'account_manager'
-- WHERE email = 'your-test-email@example.com';

-- Verify the change
SELECT id, email, full_name, role
FROM users
WHERE email = 'your-test-email@example.com';
