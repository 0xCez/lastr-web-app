-- =====================================================
-- LASTR CREATOR PLATFORM - INITIAL DATABASE MIGRATION
-- For Account Managers ONLY (no UGC creators)
-- =====================================================
-- Run this in your new Supabase project's SQL editor
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles (simplified for Lastr - Account Managers only)
CREATE TYPE user_role AS ENUM ('admin', 'account_manager');

-- Social media platforms
CREATE TYPE platform_type AS ENUM ('tiktok', 'instagram', 'facebook');

-- Post status
CREATE TYPE post_status AS ENUM ('pending', 'approved', 'rejected', 'processing');

-- Notification types
CREATE TYPE notification_type AS ENUM ('viral_post', 'missed_target', 'contract_update', 'payment', 'system');

-- Content types (slideshows only for Lastr)
CREATE TYPE content_type AS ENUM ('slideshow', 'other');

-- Application status
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- TABLE: users
-- Extended user profiles (linked to Supabase Auth)
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'account_manager',
  country TEXT,
  paypal_info TEXT,

  -- Account Manager specific fields
  posts_per_day INTEGER,
  devices INTEGER,
  account_pairs INTEGER DEFAULT NULL,

  -- Application approval
  application_status application_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,

  -- Discord integration
  discord_id TEXT UNIQUE,
  discord_username TEXT,
  discord_linked_at TIMESTAMPTZ,
  discord_channel_id TEXT,

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Profile
  avatar_url TEXT,
  bio TEXT
);

-- Indexes
CREATE INDEX idx_users_application_status ON users(application_status, created_at DESC);
CREATE INDEX idx_users_discord_id ON users(discord_id) WHERE discord_id IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- TABLE: accounts
-- Social media accounts (TikTok, Instagram handles)
-- =====================================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform platform_type NOT NULL,
  handle TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  follower_count INTEGER DEFAULT 0,
  profile_url TEXT,

  -- Account metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique handles per platform
  UNIQUE(platform, handle)
);

-- Indexes
CREATE INDEX idx_accounts_platform ON accounts(platform);
CREATE INDEX idx_accounts_handle ON accounts(handle);

-- =====================================================
-- TABLE: user_accounts
-- Junction table: Users manage multiple accounts
-- =====================================================

CREATE TABLE user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- When this user was assigned to manage this account
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),

  -- Prevent duplicate assignments
  UNIQUE(user_id, account_id)
);

-- Indexes
CREATE INDEX idx_user_accounts_user ON user_accounts(user_id);
CREATE INDEX idx_user_accounts_account ON user_accounts(account_id);

-- =====================================================
-- TABLE: posts
-- Posts submitted by Account Managers
-- =====================================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Post details
  url TEXT NOT NULL UNIQUE,
  platform platform_type NOT NULL,
  status post_status NOT NULL DEFAULT 'pending',
  content_type content_type NOT NULL DEFAULT 'slideshow',
  notes TEXT,

  -- Post metadata from platform
  platform_post_id TEXT,
  caption TEXT,
  thumbnail_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  -- Admin review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- Indexes
CREATE INDEX idx_posts_account ON posts(account_id);
CREATE INDEX idx_posts_submitted_by ON posts(submitted_by);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- =====================================================
-- TABLE: analytics
-- Post performance metrics
-- =====================================================

CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- Metrics
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  bookmarks INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER DEFAULT 0,

  -- Calculated fields
  engagement_rate DECIMAL(5,2),

  -- Snapshot metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'apify',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One analytics record per post
  UNIQUE(post_id)
);

-- Indexes
CREATE INDEX idx_analytics_post_fetched ON analytics(post_id, fetched_at DESC);

-- =====================================================
-- TABLE: account_manager_payouts
-- Payout records for Account Managers
-- =====================================================

CREATE TABLE account_manager_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Period info
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Post counts
  posts_count INTEGER NOT NULL DEFAULT 0,
  days_hit INTEGER DEFAULT 0,
  weeks_hit INTEGER DEFAULT 0,

  -- Payout amounts
  base_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonus_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate payouts for same period
  UNIQUE(user_id, period_type, period_start)
);

-- Indexes
CREATE INDEX idx_am_payouts_user_id ON account_manager_payouts(user_id);
CREATE INDEX idx_am_payouts_period ON account_manager_payouts(period_type, period_start);
CREATE INDEX idx_am_payouts_status ON account_manager_payouts(status);

-- =====================================================
-- TABLE: am_onboarding_checklist
-- Account Manager onboarding progress
-- =====================================================

CREATE TABLE am_onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Checklist items (completed timestamps)
  contract_signed_at TIMESTAMPTZ,
  joined_discord_at TIMESTAMPTZ,
  confirmed_account_pairs_at TIMESTAMPTZ,
  accounts_assigned_at TIMESTAMPTZ,
  watched_tutorial_at TIMESTAMPTZ,
  submitted_first_post_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One checklist per user
  UNIQUE(user_id)
);

-- Index
CREATE INDEX idx_am_onboarding_checklist_user_id ON am_onboarding_checklist(user_id);

-- =====================================================
-- TABLE: notifications
-- User notifications
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification details
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related entities
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,

  -- State
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Index
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- TABLE: platform_settings
-- Platform viral thresholds
-- =====================================================

CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform platform_type NOT NULL UNIQUE,

  -- Viral thresholds
  viral_view_threshold INTEGER NOT NULL DEFAULT 100000,
  viral_engagement_threshold DECIMAL(5,2),

  -- Metadata
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default viral thresholds
INSERT INTO platform_settings (platform, viral_view_threshold) VALUES
  ('tiktok', 100000),
  ('instagram', 50000),
  ('facebook', 50000);

-- =====================================================
-- TABLE: action_items
-- Admin action items / tasks
-- =====================================================

CREATE TABLE action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES users(id),
  related_user_id UUID REFERENCES users(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_action_items_status ON action_items(status);
CREATE INDEX idx_action_items_assigned_to ON action_items(assigned_to);

-- =====================================================
-- TABLE: daily_metrics
-- Daily platform metrics snapshot
-- =====================================================

CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_views INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  active_account_managers INTEGER DEFAULT 0,
  posts_by_platform JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_daily_metrics_date ON daily_metrics(date DESC);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_am_payouts_updated_at BEFORE UPDATE ON account_manager_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_am_onboarding_checklist_updated_at BEFORE UPDATE ON am_onboarding_checklist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON action_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Create user profile on signup
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
BEGIN
  -- Get raw_user_meta_data
  v_raw_meta := NEW.raw_user_meta_data;

  -- Determine role from metadata (default to account_manager for Lastr)
  v_role := COALESCE(
    (v_raw_meta->>'role')::user_role,
    'account_manager'::user_role
  );

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
END;
$$;

-- Trigger to create user profile on auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FUNCTION: Complete user profile (onboarding)
-- =====================================================

CREATE OR REPLACE FUNCTION public.complete_user_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_country TEXT,
  p_paypal_info TEXT,
  p_posts_per_day INTEGER DEFAULT NULL,
  p_devices INTEGER DEFAULT NULL,
  p_account_pairs INTEGER DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Security: Only allow users to update their own profile
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update user profile
  UPDATE users
  SET
    full_name = p_full_name,
    email = p_email,
    country = p_country,
    paypal_info = p_paypal_info,
    posts_per_day = p_posts_per_day,
    devices = p_devices,
    account_pairs = p_account_pairs,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_user_profile TO authenticated;

-- =====================================================
-- FUNCTION: Approve application
-- =====================================================

CREATE OR REPLACE FUNCTION approve_application(p_user_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Security: Only admins can approve
  SELECT id INTO v_admin_id FROM users WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can approve applications';
  END IF;

  -- Update user to approved
  UPDATE users
  SET
    application_status = 'approved',
    approved_at = NOW(),
    approved_by = v_admin_id,
    updated_at = NOW()
  WHERE id = p_user_id
    AND application_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or already processed';
  END IF;

  -- Create onboarding checklist
  INSERT INTO am_onboarding_checklist (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'approved_by', v_admin_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION approve_application TO authenticated;

-- =====================================================
-- FUNCTION: Reject application
-- =====================================================

CREATE OR REPLACE FUNCTION reject_application(
  p_user_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Security: Only admins can reject
  SELECT id INTO v_admin_id FROM users WHERE id = auth.uid() AND role = 'admin';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can reject applications';
  END IF;

  UPDATE users
  SET
    application_status = 'rejected',
    rejection_reason = p_rejection_reason,
    approved_by = v_admin_id,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id
    AND application_status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or already processed';
  END IF;

  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'rejected_by', v_admin_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION reject_application TO authenticated;

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Latest analytics for each post
CREATE VIEW latest_analytics AS
SELECT DISTINCT ON (post_id) *
FROM analytics
ORDER BY post_id, fetched_at DESC;

-- View: Post performance summary
CREATE VIEW post_performance AS
SELECT
  p.id,
  p.url,
  p.platform,
  p.status,
  a.handle as account_handle,
  u.full_name as submitted_by_name,
  la.views,
  la.likes,
  la.comments,
  la.shares,
  la.bookmarks,
  la.engagement_rate,
  p.published_at,
  p.created_at
FROM posts p
LEFT JOIN accounts a ON p.account_id = a.id
LEFT JOIN users u ON p.submitted_by = u.id
LEFT JOIN latest_analytics la ON p.id = la.post_id;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_manager_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE am_onboarding_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: users
-- =====================================================

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- RLS POLICIES: accounts
-- =====================================================

CREATE POLICY "Users can read their accounts"
  ON accounts FOR SELECT
  USING (
    id IN (SELECT account_id FROM user_accounts WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert accounts"
  ON accounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage accounts"
  ON accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- RLS POLICIES: user_accounts
-- =====================================================

CREATE POLICY "Users can read own assignments"
  ON user_accounts FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert own assignments"
  ON user_accounts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage assignments"
  ON user_accounts FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- RLS POLICIES: posts
-- =====================================================

CREATE POLICY "Users can read their posts"
  ON posts FOR SELECT
  USING (
    account_id IN (SELECT account_id FROM user_accounts WHERE user_id = auth.uid())
    OR submitted_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can submit posts"
  ON posts FOR INSERT
  WITH CHECK (
    account_id IN (SELECT account_id FROM user_accounts WHERE user_id = auth.uid())
    AND submitted_by = auth.uid()
  );

CREATE POLICY "Users can update own pending posts"
  ON posts FOR UPDATE
  USING (submitted_by = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage posts"
  ON posts FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- RLS POLICIES: analytics
-- =====================================================

CREATE POLICY "Users can read analytics"
  ON analytics FOR SELECT
  USING (
    post_id IN (
      SELECT p.id FROM posts p
      INNER JOIN user_accounts ua ON p.account_id = ua.account_id
      WHERE ua.user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage analytics"
  ON analytics FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- RLS POLICIES: account_manager_payouts
-- =====================================================

CREATE POLICY "Users can view own payouts"
  ON account_manager_payouts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payouts"
  ON account_manager_payouts FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage payouts"
  ON account_manager_payouts FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- RLS POLICIES: am_onboarding_checklist
-- =====================================================

CREATE POLICY "Users can view own checklist"
  ON am_onboarding_checklist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own checklist"
  ON am_onboarding_checklist FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklist"
  ON am_onboarding_checklist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all checklists"
  ON am_onboarding_checklist FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage all checklists"
  ON am_onboarding_checklist FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- RLS POLICIES: notifications
-- =====================================================

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- RLS POLICIES: action_items
-- =====================================================

CREATE POLICY "Admins can manage action items"
  ON action_items FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- RLS POLICIES: daily_metrics
-- =====================================================

CREATE POLICY "Admins can manage daily metrics"
  ON daily_metrics FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- INITIAL ADMIN USER
-- =====================================================
-- After running this migration, create your admin user:
-- 1. Sign up via the app with your email
-- 2. Run this SQL to make yourself admin:
--
-- UPDATE users SET role = 'admin', application_status = 'approved' WHERE email = 'your@email.com';
--
-- =====================================================
