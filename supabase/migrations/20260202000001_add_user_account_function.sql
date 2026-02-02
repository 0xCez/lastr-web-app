-- Add function to safely add user accounts (TikTok/Instagram)
-- This function bypasses RLS policies using SECURITY DEFINER
-- Solves the chicken-and-egg problem where users can't SELECT newly created accounts
-- before they're linked in user_accounts table

CREATE OR REPLACE FUNCTION public.add_user_account(
  p_user_id UUID,
  p_platform TEXT,
  p_handle TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_account_record RECORD;
BEGIN
  -- Security: Only allow users to add accounts for themselves
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only add accounts for yourself';
  END IF;

  -- Validate platform
  IF p_platform NOT IN ('tiktok', 'instagram') THEN
    RAISE EXCEPTION 'Invalid platform. Must be tiktok or instagram';
  END IF;

  -- Validate handle is not empty
  IF p_handle IS NULL OR TRIM(p_handle) = '' THEN
    RAISE EXCEPTION 'Handle cannot be empty';
  END IF;

  -- Check if account already exists for this platform and handle
  SELECT id INTO v_account_id
  FROM accounts
  WHERE platform = p_platform::platform_type
    AND LOWER(handle) = LOWER(TRIM(p_handle));

  -- If account doesn't exist, create it
  IF v_account_id IS NULL THEN
    INSERT INTO accounts (platform, handle)
    VALUES (p_platform::platform_type, TRIM(p_handle))
    RETURNING id INTO v_account_id;
  END IF;

  -- Check if user already has this account linked
  IF EXISTS (
    SELECT 1 FROM user_accounts
    WHERE user_id = p_user_id AND account_id = v_account_id
  ) THEN
    RAISE EXCEPTION 'You have already added this account';
  END IF;

  -- Link account to user
  INSERT INTO user_accounts (user_id, account_id)
  VALUES (p_user_id, v_account_id);

  -- Get the account record to return
  SELECT * INTO v_account_record
  FROM accounts
  WHERE id = v_account_id;

  -- Return success with account details
  RETURN json_build_object(
    'success', true,
    'account', json_build_object(
      'id', v_account_record.id,
      'platform', v_account_record.platform,
      'handle', v_account_record.handle,
      'created_at', v_account_record.created_at
    )
  );
END;
$$;

-- Grant execute permission to authenticated users (function checks user ID internally)
GRANT EXECUTE ON FUNCTION public.add_user_account(UUID, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.add_user_account IS 'Safely adds a TikTok or Instagram account for a user. Bypasses RLS using SECURITY DEFINER.';
