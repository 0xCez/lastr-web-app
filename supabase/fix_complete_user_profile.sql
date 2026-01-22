-- =====================================================
-- FIX: Complete user profile function with all parameters
-- Run this in Supabase SQL Editor
-- =====================================================

DROP FUNCTION IF EXISTS public.complete_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.complete_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.complete_user_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_country TEXT,
  p_paypal_info TEXT,
  p_posts_per_day INTEGER DEFAULT NULL,
  p_devices INTEGER DEFAULT NULL,
  p_contract_option TEXT DEFAULT NULL,
  p_tiktok_handle TEXT DEFAULT NULL,
  p_ig_handle TEXT DEFAULT NULL,
  p_min_views INTEGER DEFAULT NULL,
  p_min_posts INTEGER DEFAULT NULL,
  p_age_range TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_account_pairs INTEGER DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Security: Only allow users to update their own profile
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get current user role
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;

  -- Update user profile
  -- Account managers are auto-approved, others need approval
  UPDATE users
  SET
    full_name = p_full_name,
    email = p_email,
    country = p_country,
    paypal_info = p_paypal_info,
    posts_per_day = p_posts_per_day,
    devices = p_devices,
    contract_option = p_contract_option,
    tiktok_handle = p_tiktok_handle,
    ig_handle = p_ig_handle,
    min_views = p_min_views,
    min_posts = p_min_posts,
    age_range = p_age_range,
    gender = p_gender,
    account_pairs = p_account_pairs,
    application_status = CASE
      WHEN v_user_role = 'account_manager' THEN 'approved'::application_status
      ELSE 'pending'::application_status
    END,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- If account manager, create onboarding checklist
  IF v_user_role = 'account_manager' THEN
    INSERT INTO am_onboarding_checklist (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Return success with application status
  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'application_status', CASE WHEN v_user_role = 'account_manager' THEN 'approved' ELSE 'pending' END
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_user_profile TO authenticated;

-- Also ensure the users table has all needed columns
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'contract_option') THEN
    ALTER TABLE users ADD COLUMN contract_option TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tiktok_handle') THEN
    ALTER TABLE users ADD COLUMN tiktok_handle TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'ig_handle') THEN
    ALTER TABLE users ADD COLUMN ig_handle TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'min_views') THEN
    ALTER TABLE users ADD COLUMN min_views INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'min_posts') THEN
    ALTER TABLE users ADD COLUMN min_posts INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'age_range') THEN
    ALTER TABLE users ADD COLUMN age_range TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gender') THEN
    ALTER TABLE users ADD COLUMN gender TEXT;
  END IF;
END $$;
