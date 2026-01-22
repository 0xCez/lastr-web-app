-- =====================================================
-- LASTR COMPLETE FIX - RUN THIS IN SUPABASE SQL EDITOR
-- This fixes ALL issues with signup/login flow
-- =====================================================

-- =====================================================
-- STEP 1: Add missing columns to users table
-- =====================================================

DO $$
BEGIN
  -- Add columns needed for the complete_user_profile function
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

-- =====================================================
-- STEP 2: Drop ALL versions of complete_user_profile
-- =====================================================

DROP FUNCTION IF EXISTS public.complete_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.complete_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT, TEXT, INTEGER);

-- =====================================================
-- STEP 3: Create the CORRECT complete_user_profile function
-- This matches exactly what the frontend sends
-- =====================================================

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
  SELECT role::TEXT INTO v_user_role FROM users WHERE id = p_user_id;

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

-- =====================================================
-- STEP 4: Fix handle_new_user trigger function
-- Ensures user row is created properly on signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_role user_role;
  v_raw_meta JSONB;
  v_role_text TEXT;
BEGIN
  -- Get raw_user_meta_data
  v_raw_meta := NEW.raw_user_meta_data;

  -- Get role from metadata, default to 'account_manager' for Lastr
  v_role_text := COALESCE(v_raw_meta->>'role', 'account_manager');

  -- Only allow valid roles (admin, account_manager)
  -- Any other role defaults to account_manager
  IF v_role_text = 'admin' THEN
    v_role := 'admin'::user_role;
  ELSE
    v_role := 'account_manager'::user_role;
  END IF;

  -- Insert into users table
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    application_status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(v_raw_meta->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    'pending'::application_status
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 5: Clean up any orphaned auth users
-- If you signed up but got kicked out, this helps
-- =====================================================

-- Check for auth users without profiles (run this to see if there are any)
-- SELECT au.id, au.email FROM auth.users au LEFT JOIN public.users pu ON au.id = pu.id WHERE pu.id IS NULL;

-- =====================================================
-- STEP 6: Verify everything is set up
-- =====================================================

-- This should return the function with 15 parameters
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'complete_user_profile';

-- =====================================================
-- DONE! Now you can sign up as Account Manager
-- After signup, run this to make yourself admin:
-- UPDATE users SET role = 'admin', application_status = 'approved' WHERE email = 'contact@lastr.app';
-- =====================================================
