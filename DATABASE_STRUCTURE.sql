-- =====================================================
-- CREATOR PLATFORM - COMPLETE DATABASE STRUCTURE
-- Generated: 2025-12-15
-- This document maps the entire database schema
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'account_manager', 'ugc_creator', 'influencer');
CREATE TYPE platform_type AS ENUM ('tiktok', 'instagram', 'facebook');
CREATE TYPE post_status AS ENUM ('pending', 'approved', 'rejected', 'processing');
CREATE TYPE notification_type AS ENUM ('viral_post', 'missed_target', 'contract_update', 'payment', 'system');
CREATE TYPE contract_status AS ENUM ('active', 'paused', 'completed', 'cancelled');
CREATE TYPE content_type AS ENUM ('ugc_video', 'slideshow', 'other');

-- =====================================================
-- TABLE: users
-- Extended user profiles (linked to Supabase Auth users)
-- =====================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'ugc_creator',
  country TEXT,
  paypal_info TEXT,

  -- Role-specific fields
  posts_per_day INTEGER,     -- for account managers
  devices INTEGER,            -- for account managers
  contract_option TEXT,       -- for UGC creators

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Profile
  avatar_url TEXT,
  bio TEXT
);

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
  profile_url TEXT,           -- Added in migration 20250101000008

  -- Account metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique handles per platform
  UNIQUE(platform, handle)
);

-- =====================================================
-- TABLE: user_accounts
-- Junction table: Users can manage multiple accounts
-- =====================================================

CREATE TABLE user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- When this user was assigned to manage this account
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id), -- admin who assigned

  -- Prevent duplicate assignments
  UNIQUE(user_id, account_id)
);

-- =====================================================
-- TABLE: posts
-- Posts submitted by creators
-- =====================================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Post details
  url TEXT NOT NULL UNIQUE,
  platform platform_type NOT NULL,
  status post_status NOT NULL DEFAULT 'pending',
  content_type content_type NOT NULL DEFAULT 'ugc_video',
  notes TEXT,

  -- Post metadata from platform
  platform_post_id TEXT,      -- TikTok/IG post ID extracted from URL
  caption TEXT,
  thumbnail_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,   -- when it was posted on social media

  -- Admin review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT
);

-- =====================================================
-- TABLE: analytics
-- Analytics data (time-series snapshots)
-- KEY TABLE FOR METRICS
-- =====================================================

CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- RAW METRICS FROM APIFY
  views INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  bookmarks INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER DEFAULT 0,           -- TikTok only

  -- COMPUTED METRICS
  engagement_rate DECIMAL(5,2),          -- calculated: (likes + comments + shares) / views * 100

  -- Snapshot metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'apify',  -- how we got this data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CONSTRAINT: Only one analytics record per post (upsert pattern)
  UNIQUE(post_id)
);

-- Index for fast queries
CREATE INDEX idx_analytics_post_fetched ON analytics(post_id, fetched_at DESC);

-- =====================================================
-- TABLE: contracts
-- Contracts (targets and payouts for creators)
-- =====================================================

CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Contract details
  status contract_status NOT NULL DEFAULT 'active',

  -- Targets (flexible for all roles)
  target_posts_weekly INTEGER,           -- for UGC creators (e.g., 12/week)
  target_posts_monthly INTEGER,          -- for UGC creators or influencers
  target_views_monthly INTEGER,          -- for influencers (e.g., 1000000/month)

  -- Payouts (modular for different contract options)
  base_payout DECIMAL(10,2),             -- base payment
  cpm_rate DECIMAL(10,4),                -- cost per mille (1000 views)
  bonus_threshold INTEGER,               -- views needed for bonus
  bonus_amount DECIMAL(10,2),

  -- Period
  start_date DATE NOT NULL,
  end_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)   -- admin who created
);

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
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,

  -- State
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB                         -- JSON for flexibility
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- TABLE: platform_settings
-- Platform settings (viral thresholds, etc.)
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

-- =====================================================
-- VIEWS
-- =====================================================

-- View: Latest analytics for each post
CREATE VIEW latest_analytics AS
SELECT DISTINCT ON (post_id)
  *
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
-- INDEXES
-- =====================================================

-- Posts
CREATE INDEX idx_posts_account ON posts(account_id);
CREATE INDEX idx_posts_submitted_by ON posts(submitted_by);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- User Accounts
CREATE INDEX idx_user_accounts_user ON user_accounts(user_id);
CREATE INDEX idx_user_accounts_account ON user_accounts(account_id);

-- Contracts
CREATE INDEX idx_contracts_user ON contracts(user_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- Accounts
CREATE INDEX idx_accounts_platform ON accounts(platform);
CREATE INDEX idx_accounts_handle ON accounts(handle);

-- =====================================================
-- KEY RELATIONSHIPS FOR ANALYTICS
-- =====================================================

/*
ANALYTICS DATA FLOW:
1. User submits post via SubmitPostModal
2. Post created with status='approved' (auto-approved for testing)
3. Edge function /fetch-analytics triggered (fire-and-forget)
4. Edge function:
   - Queries posts WHERE status='approved'
   - Calls Apify actors (TikTok or Instagram)
   - Waits for Apify to complete scraping
   - Upserts into analytics table
5. Frontend displays analytics from latest_analytics view

IMPORTANT TABLES FOR UGC CREATOR METRICS:
- posts: stores post URL, platform, status
- analytics: stores views, likes, comments, shares, bookmarks, engagement_rate
- contracts: stores target_posts_weekly (e.g., 12/week), base_payout, cpm_rate
- user_accounts: links users to their social accounts
- accounts: stores handle, platform for each social account

DATA RELATIONSHIPS:
users (1) ----< user_accounts >---- (M) accounts
users (1) ----< posts (submitted_by)
accounts (1) ----< posts (account_id)
posts (1) ----< analytics (post_id) [ONE-TO-ONE via UNIQUE constraint]
users (1) ----< contracts
*/
