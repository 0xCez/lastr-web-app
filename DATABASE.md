# Database Documentation

> **Last Updated:** December 22, 2025
> **Database:** Supabase PostgreSQL
> **Total Tables:** 15
> **Total RLS Policies:** 49+
> **Total Migrations:** 42

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables](#tables)
4. [Enums](#enums)
5. [RLS Policies](#rls-policies)
6. [Functions](#functions)
7. [Triggers](#triggers)
8. [Cron Jobs](#cron-jobs)
9. [Frontend Queries](#frontend-queries)
10. [Security Model](#security-model)
11. [Migration History](#migration-history)

---

## Overview

This database powers a UGC (User-Generated Content) creator management platform. It handles:
- User authentication and profiles
- Social media account linking (TikTok, Instagram)
- Post submissions and analytics tracking
- CPM-based payment calculations
- Gamification (streaks, milestones)
- Admin approval workflows

### Tech Stack
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Frontend:** React + TypeScript + Vite
- **ORM:** Supabase JS Client (direct queries)

---

## Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase managed)
│─────────────────│
│ id (PK)         │
│ email           │
│ raw_user_meta   │
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐       ┌─────────────────┐
│     users       │       │   contracts     │
│─────────────────│       │─────────────────│
│ id (PK/FK)      │◄──────│ user_id (FK)    │
│ email           │  1:N  │ status          │
│ full_name       │       │ cpm_rate        │
│ role            │       │ target_posts    │
│ application_    │       └─────────────────┘
│   status        │
│ country         │       ┌─────────────────┐
│ paypal_info     │       │  notifications  │
│ current_streak  │       │─────────────────│
│ ...             │◄──────│ user_id (FK)    │
└────────┬────────┘  1:N  │ type            │
         │                │ message         │
         │                └─────────────────┘
         │
         │ 1:N          ┌─────────────────┐
         ├─────────────►│  user_accounts  │
         │              │─────────────────│
         │              │ user_id (FK)    │
         │              │ account_id (FK) │
         │              └────────┬────────┘
         │                       │
         │                       │ N:1
         │                       ▼
         │              ┌─────────────────┐
         │              │    accounts     │
         │              │─────────────────│
         │              │ id (PK)         │
         │              │ platform        │
         │              │ handle          │
         │              │ follower_count  │
         │              └────────┬────────┘
         │                       │
         │                       │ 1:N
         │                       ▼
         │              ┌─────────────────┐       ┌─────────────────┐
         │              │     posts       │       │   analytics     │
         │              │─────────────────│       │─────────────────│
         └─────────────►│ submitted_by(FK)│──────►│ post_id (FK)    │
              1:N       │ account_id (FK) │  1:N  │ views           │
                        │ url             │       │ likes           │
                        │ status          │       │ engagement_rate │
                        │ viral_alert_*   │       │ fetched_at      │
                        └────────┬────────┘       └─────────────────┘
                                 │
                                 │ 1:N
                                 ▼
                        ┌─────────────────┐
                        │cpm_post_breakdown│
                        │─────────────────│
                        │ post_id (FK)    │
                        │ user_id (FK)    │
                        │ date            │
                        │ views_delta     │
                        │ cpm_earned      │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  cpm_payments   │     │ user_milestones │     │onboarding_check │
│─────────────────│     │─────────────────│     │─────────────────│
│ user_id (FK)    │     │ user_id (FK)    │     │ user_id (FK)    │
│ month           │     │ milestone_type  │     │ joined_discord  │
│ total_views     │     │ milestone_value │     │ warmup_started  │
│ cpm_rate        │     │ achieved_at     │     │ posted_first    │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  sports_events  │     │platform_settings│
│─────────────────│     │─────────────────│
│ event_id        │     │ platform        │
│ league_name     │     │ viral_threshold │
│ event_date      │     │ updated_by      │
└─────────────────┘     └─────────────────┘
```

---

## Tables

### 1. `users`
User profiles linked 1:1 with `auth.users`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK, FK) | References `auth.users.id` |
| `email` | TEXT | User's email |
| `full_name` | TEXT | Display name |
| `role` | user_role | `admin`, `ugc_creator`, `influencer`, `account_manager` |
| `country` | TEXT | User's country |
| `paypal_info` | TEXT | PayPal email for payments |
| `application_status` | application_status | `pending`, `approved`, `rejected` |
| `approved_at` | TIMESTAMPTZ | When application was approved |
| `approved_by` | UUID | Admin who approved |
| `rejection_reason` | TEXT | If rejected, why |
| `age_range` | TEXT | `18-24`, `25-30`, `31-40`, `40+` |
| `gender` | TEXT | `Male`, `Female`, `Non-binary`, etc. |
| `current_streak` | INTEGER | Current posting streak (days) |
| `longest_streak` | INTEGER | Best streak ever |
| `last_post_date` | DATE | Last approved post date |
| `avatar_url` | TEXT | Profile picture URL |
| `bio` | TEXT | User bio |
| `posts_per_day` | INTEGER | For account managers |
| `devices` | INTEGER | For account managers |
| `account_pairs` | INTEGER | For account managers: 1 or 2 TT/IG pairs (NULL for others) |
| `contract_option` | TEXT | For UGC creators |
| `created_at` | TIMESTAMPTZ | Account creation |
| `updated_at` | TIMESTAMPTZ | Last update |

**Frontend Usage:**
- `src/hooks/useUserProfile.ts` - Fetches current user's profile
- `src/hooks/useAllUsers.ts` - Admin: fetches all users
- `src/hooks/useLeaderboardData.ts` - Admin: fetches creators for leaderboard
- `src/components/dashboard/AccountView.tsx` - Profile editing

---

### 2. `accounts`
Social media accounts (TikTok, Instagram).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Account ID |
| `platform` | platform_type | `tiktok`, `instagram`, `facebook` |
| `handle` | TEXT | Username (without @) |
| `display_name` | TEXT | Profile display name |
| `avatar_url` | TEXT | Profile picture |
| `follower_count` | INTEGER | Current followers |
| `profile_url` | TEXT | Link to profile |
| `is_active` | BOOLEAN | Account active status |
| `created_at` | TIMESTAMPTZ | When added |
| `updated_at` | TIMESTAMPTZ | Last update |

**Unique Constraint:** `(platform, handle)`

**Frontend Usage:**
- `src/components/dashboard/AccountView.tsx` - Add/remove accounts
- `src/hooks/useUserProfile.ts` - Load user's linked accounts
- `src/hooks/useAllAccounts.ts` - Admin: load all accounts

---

### 3. `user_accounts`
Junction table linking users to their social accounts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Link ID |
| `user_id` | UUID (FK) | References `users.id` |
| `account_id` | UUID (FK) | References `accounts.id` |
| `assigned_at` | TIMESTAMPTZ | When linked |
| `assigned_by` | UUID | Who created the link |

**Unique Constraint:** `(user_id, account_id)`

**Frontend Usage:**
- `src/components/dashboard/AccountView.tsx` - Link/unlink accounts
- `src/hooks/useUserProfile.ts` - Get user's account IDs
- `src/hooks/useAllAccounts.ts` - Admin: get all user-account links

---

### 4. `posts`
Submitted content posts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Post ID |
| `account_id` | UUID (FK) | Which account posted this |
| `submitted_by` | UUID (FK) | User who submitted |
| `url` | TEXT | Link to the post |
| `platform` | platform_type | Platform it's on |
| `status` | post_status | `pending`, `approved`, `rejected`, `processing` |
| `content_type` | content_type | `ugc_video`, `slideshow`, `other` |
| `platform_post_id` | TEXT | Platform's internal ID |
| `caption` | TEXT | Post caption |
| `thumbnail_url` | TEXT | Preview image |
| `notes` | TEXT | Submission notes |
| `published_at` | TIMESTAMPTZ | When published on platform |
| `reviewed_by` | UUID | Admin who reviewed |
| `reviewed_at` | TIMESTAMPTZ | When reviewed |
| `rejection_reason` | TEXT | If rejected, why |
| `viral_alert_message` | TEXT | Viral notification text |
| `viral_alert_views` | INTEGER | Views when alert triggered |
| `viral_alert_created_at` | TIMESTAMPTZ | When alert was created |
| `viral_alert_acknowledged` | BOOLEAN | User saw the alert |
| `created_at` | TIMESTAMPTZ | Submission time |
| `updated_at` | TIMESTAMPTZ | Last update |

**Frontend Usage:**
- `src/components/dashboard/SubmitPostModal.tsx` - Submit new posts
- `src/hooks/usePostSubmissions.ts` - Load user's posts
- `src/components/dashboard/CalendarView.tsx` - Display posts on calendar

---

### 5. `analytics`
Time-series analytics snapshots for posts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Analytics record ID |
| `post_id` | UUID (FK) | Which post |
| `views` | BIGINT | View count |
| `likes` | INTEGER | Like count |
| `comments` | INTEGER | Comment count |
| `shares` | INTEGER | Share count |
| `bookmarks` | INTEGER | Bookmark/save count |
| `downloads` | INTEGER | Download count |
| `engagement_rate` | DECIMAL(5,2) | Calculated engagement % |
| `fetched_at` | TIMESTAMPTZ | When data was fetched |
| `source` | TEXT | Data source (API, manual) |
| `created_at` | TIMESTAMPTZ | Record creation |

**Frontend Usage:**
- `src/hooks/useChartAnalytics.ts` - Dashboard charts
- `src/components/dashboard/StatsGrid.tsx` - Overview statistics
- `src/components/dashboard/ViralVideosSection.tsx` - Top performing posts

---

### 6. `contracts`
Payment contracts for users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Contract ID |
| `user_id` | UUID (FK) | Who the contract is for |
| `status` | contract_status | `active`, `paused`, `completed`, `cancelled` |
| `target_posts_weekly` | INTEGER | Weekly post target |
| `target_posts_monthly` | INTEGER | Monthly post target |
| `target_views_monthly` | BIGINT | Monthly views target |
| `base_payout` | DECIMAL(10,2) | Base payment amount |
| `cpm_rate` | DECIMAL(10,4) | CPM rate ($X per 1000 views) |
| `bonus_threshold` | BIGINT | Views needed for bonus |
| `bonus_amount` | DECIMAL(10,2) | Bonus payment |
| `start_date` | DATE | Contract start |
| `end_date` | DATE | Contract end |
| `created_by` | UUID | Admin who created |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update |

**Frontend Usage:**
- `src/hooks/useUserProfile.ts` - Load user's contract

---

### 7. `notifications`
User notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Notification ID |
| `user_id` | UUID (FK) | Who receives it |
| `type` | notification_type | `viral_post`, `missed_target`, `contract_update`, `payment`, `system` |
| `title` | TEXT | Notification title |
| `message` | TEXT | Notification body |
| `post_id` | UUID (FK) | Related post (optional) |
| `contract_id` | UUID (FK) | Related contract (optional) |
| `metadata` | JSONB | Extra data |
| `is_read` | BOOLEAN | Read status |
| `read_at` | TIMESTAMPTZ | When read |
| `created_at` | TIMESTAMPTZ | Creation time |

**Frontend Usage:**
- `src/hooks/useNotifications.ts` - Load user's notifications

---

### 8. `platform_settings`
Platform-wide configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Setting ID |
| `platform` | platform_type (UNIQUE) | Which platform |
| `viral_view_threshold` | INTEGER | Views to trigger viral alert |
| `viral_engagement_threshold` | DECIMAL(5,2) | Engagement % for viral |
| `updated_at` | TIMESTAMPTZ | Last update |
| `updated_by` | UUID | Who updated |

---

### 9. `sports_events`
Sports fixtures for content calendar.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Record ID |
| `event_id` | TEXT (UNIQUE) | External event ID |
| `league_name` | TEXT | League name |
| `league_id` | TEXT | External league ID |
| `event_name` | TEXT | Match name |
| `home_team` | TEXT | Home team |
| `away_team` | TEXT | Away team |
| `sport` | TEXT | Sport type |
| `event_date` | DATE | Event date |
| `event_time` | TIME | Event time |
| `event_timestamp` | BIGINT | Unix timestamp |
| `venue` | TEXT | Stadium/venue |
| `venue_city` | TEXT | City |
| `status` | TEXT | Event status |
| `fetched_at` | TIMESTAMPTZ | When data was fetched |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Last update |

**Frontend Usage:**
- `src/components/dashboard/CalendarView.tsx` - Display events on calendar

---

### 10. `onboarding_checklist`
UGC creator onboarding progress.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Record ID |
| `user_id` | UUID (FK, UNIQUE) | Which user |
| `joined_discord_at` | TIMESTAMPTZ | Completed Discord step |
| `warmup_started_at` | TIMESTAMPTZ | Started account warmup |
| `watched_examples_at` | TIMESTAMPTZ | Watched example videos |
| `posted_first_video_at` | TIMESTAMPTZ | Posted first video |
| `submitted_first_link_at` | TIMESTAMPTZ | Submitted first link |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Last update |

**Frontend Usage:**
- `src/components/dashboard/OnboardingChecklist.tsx` - Display checklist modal
- `src/components/dashboard/OnboardingProgress.tsx` - Show progress bar

---

### 11. `user_milestones`
Gamification achievements.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Record ID |
| `user_id` | UUID (FK) | Which user |
| `milestone_type` | TEXT | Type (views, posts, streak) |
| `milestone_value` | INTEGER | Value achieved |
| `achieved_at` | TIMESTAMPTZ | When achieved |
| `created_at` | TIMESTAMPTZ | Record creation |

**Unique Constraint:** `(user_id, milestone_type)`

**Frontend Usage:**
- `src/components/dashboard/MilestoneBadges.tsx` - Display earned badges

---

### 12. `cpm_payments`
Monthly CPM payment records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Payment ID |
| `user_id` | UUID (FK) | Who gets paid |
| `month` | DATE | Payment month |
| `total_views` | BIGINT | Total views that month |
| `total_posts` | INTEGER | Total approved posts |
| `cpm_rate` | DECIMAL(10,4) | CPM rate used |
| `total_cpm` | DECIMAL(10,2) | Total CPM earnings |
| `status` | TEXT | Payment status |
| `paid_at` | TIMESTAMPTZ | When paid |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Last update |

---

### 13. `cpm_post_breakdown`
Daily CPM tracking per post.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Record ID |
| `post_id` | UUID (FK) | Which post |
| `user_id` | UUID (FK) | Post owner |
| `date` | DATE | Tracking date |
| `cumulative_views` | BIGINT | Total views to date |
| `views_delta` | INTEGER | New views that day |
| `cpm_earned` | DECIMAL(10,4) | CPM earned that day |
| `post_age_days` | INTEGER | Days since post creation |
| `cumulative_post_cpm` | DECIMAL(10,2) | Total CPM for this post |
| `cumulative_user_monthly_cpm` | DECIMAL(10,2) | User's monthly total |
| `is_post_capped` | BOOLEAN | Post hit CPM cap |
| `is_user_monthly_capped` | BOOLEAN | User hit monthly cap |
| `created_at` | TIMESTAMPTZ | Record creation |

**Frontend Usage:**
- `src/hooks/useLeaderboardData.ts` - Calculate creator rankings

---

### 14. `account_manager_payouts`
Weekly and monthly payout records for Account Managers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Payout record ID |
| `user_id` | UUID (FK) | Account Manager user |
| `period_type` | TEXT | `weekly` or `monthly` |
| `period_start` | DATE | Start of payout period |
| `period_end` | DATE | End of payout period |
| `posts_count` | INTEGER | Total posts in period |
| `days_hit` | INTEGER | Weekly: days with 5+ posts (bonus if >= 6) |
| `weeks_hit` | INTEGER | Monthly: weeks that hit target (bonus if = 4) |
| `base_amount` | DECIMAL(10,2) | Base payout ($1/post) |
| `bonus_amount` | DECIMAL(10,2) | Bonus earned ($10 weekly, $20 monthly) |
| `total_amount` | DECIMAL(10,2) | Total payout |
| `status` | TEXT | `pending`, `approved`, `paid` |
| `approved_by` | UUID | Admin who approved |
| `approved_at` | TIMESTAMPTZ | When approved |
| `paid_at` | TIMESTAMPTZ | When paid |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Last update |

**Unique Constraint:** `(user_id, period_type, period_start)`

**Frontend Usage:**
- `src/hooks/useAccountManagerStats.ts` - Load AM stats for dashboard
- `src/hooks/useAMPayouts.ts` - Fetch/approve/mark-paid AM payouts (admin)
- `src/pages/admin/AMPayouts.tsx` - Admin page to review and approve payouts

---

## Enums

### `user_role`
```sql
'admin' | 'account_manager' | 'ugc_creator' | 'influencer'
```

### `platform_type`
```sql
'tiktok' | 'instagram' | 'facebook'
```

### `post_status`
```sql
'pending' | 'approved' | 'rejected' | 'processing'
```

### `notification_type`
```sql
'viral_post' | 'missed_target' | 'contract_update' | 'payment' | 'system'
```

### `contract_status`
```sql
'active' | 'paused' | 'completed' | 'cancelled'
```

### `content_type`
```sql
'ugc_video' | 'slideshow' | 'other'
```

### `application_status`
```sql
'pending' | 'approved' | 'rejected'
```

---

## RLS Policies

### Users Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `Users can read own profile` | SELECT | Own profile only (`auth.uid() = id`) |
| `Users can update own profile` | UPDATE | Own profile only |
| `users_delete_admin_only` | DELETE | Admins only |

### Accounts Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `accounts_select_policy` | SELECT | All authenticated users |
| `accounts_insert_policy` | INSERT | All authenticated users |
| `accounts_update` | UPDATE | Admins only |
| `accounts_delete` | DELETE | Admins only |

> **Design Note:** SELECT is intentionally open because account creation flow requires reading back the inserted row before the `user_accounts` link exists. Security is enforced via `user_accounts` - users can only submit posts for linked accounts.

### User Accounts Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `user_accounts_select_policy` | SELECT | Own links OR admin |
| `user_accounts_insert_policy` | INSERT | Own `user_id` only |
| `user_accounts_delete_policy` | DELETE | Own links only |

### Posts Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `select_own_posts` | SELECT | Own posts OR admin |
| `insert_posts_for_linked_accounts` | INSERT | Only for linked accounts |
| `ugc_update_own_posts` | UPDATE | Own posts only |
| `admin_manage_posts` | ALL | Admins only |

### Analytics Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `analytics_select_own` | SELECT | Own posts' analytics |
| `analytics_select_admin` | SELECT | Admins only |
| `analytics_insert_admin` | INSERT | Admins only |
| `analytics_update_admin` | UPDATE | Admins only |
| `analytics_delete_admin` | DELETE | Admins only |

### Contracts Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `Users can select own contracts` | SELECT | Own contracts only |
| `Users can update own contracts` | UPDATE | Own contracts only |
| `contracts_delete_admin_only` | DELETE | Admins only |

### Notifications Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `Users can read own notifications` | SELECT | Own notifications |
| `Users can update own notifications` | UPDATE | Own notifications (mark read) |
| `Admins can create notifications` | INSERT | Admins only |
| `notifications_delete_own` | DELETE | Own notifications |
| `notifications_delete_admin` | DELETE | Admins only |

### Platform Settings Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `platform_settings_select_all` | SELECT | All authenticated |
| `platform_settings_insert_admin` | INSERT | Admins only |
| `platform_settings_update_admin` | UPDATE | Admins only |
| `platform_settings_delete_admin` | DELETE | Admins only |

### Sports Events Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `sports_events_select_all` | SELECT | All authenticated |

### Onboarding Checklist Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `Users can view own onboarding checklist` | SELECT | Own checklist |
| `Users can update own onboarding checklist` | UPDATE | Own checklist |
| `Users can insert own onboarding checklist` | INSERT | Own checklist |

### User Milestones Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `user_milestones_select` | SELECT | Own milestones OR admin |
| `Users can insert own milestones` | INSERT | Own milestones |

### CPM Payments Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `Users can view own CPM payments` | SELECT | Own payments |
| `Only admins can manage CPM payments` | ALL | Admins only |

### CPM Post Breakdown Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `cpm_select_own` | SELECT | Own breakdown |
| `cpm_select_admin` | SELECT | Admins only |
| `cpm_insert_admin` | INSERT | Admins only |
| `cpm_update_admin` | UPDATE | Admins only |
| `cpm_delete_admin` | DELETE | Admins only |

### Account Manager Payouts Table

| Policy | Operation | Who Can Access |
|--------|-----------|----------------|
| `am_payouts_select_own` | SELECT | Own payouts |
| `am_payouts_select_admin` | SELECT | Admins only |
| `am_payouts_insert_admin` | INSERT | Admins only |
| `am_payouts_update_admin` | UPDATE | Admins only |
| `am_payouts_delete_admin` | DELETE | Admins only |

---

## Functions

### `handle_new_user()`
**Trigger:** `on_auth_user_created` (AFTER INSERT on `auth.users`)
**Security:** DEFINER
**Purpose:** Auto-creates user profile when someone signs up.

**Key behaviors:**
- Blocks admin role during signup (security measure)
- Creates user record with role from metadata
- Sets application_status based on role

---

### `complete_user_profile(...)`
**Security:** DEFINER
**Purpose:** Completes signup flow after onboarding form.

**Parameters:**
- `p_user_id`, `p_full_name`, `p_email`, `p_country`, `p_paypal_info`
- `p_tiktok_handle`, `p_ig_handle` (optional)
- `p_contract_option`, `p_age_range`, `p_gender` (optional)

**Key behaviors:**
- Updates user profile with form data
- Creates social accounts (TikTok, Instagram)
- Links accounts to user via `user_accounts`
- Creates contract for influencers/UGC creators
- Sets `application_status = 'pending'` for UGC creators

---

### `approve_ugc_application(user_uuid, admin_uuid)`
**Security:** DEFINER (admin only)
**Purpose:** Approves pending UGC creator application.

**Key behaviors:**
- Sets `application_status = 'approved'`
- Records `approved_at` and `approved_by`
- Triggers onboarding checklist creation

---

### `reject_ugc_application(user_uuid, admin_uuid, reason)`
**Security:** DEFINER (admin only)
**Purpose:** Rejects pending UGC creator application.

---

### `set_application_pending(user_uuid, admin_uuid)`
**Security:** DEFINER (admin only)
**Purpose:** Reverts application to pending status.

---

### `delete_user_completely(user_uuid)`
**Security:** DEFINER (admin only)
**Purpose:** Cascading delete of user and all related data.

**Deletion order:**
1. `cpm_post_breakdown`
2. `cpm_payments`
3. `analytics` (for user's posts)
4. `posts`
5. `user_accounts`
6. `user_milestones`
7. `onboarding_checklist`
8. `notifications`
9. `contracts`
10. `users`
11. `auth.users`

---

### `update_user_streak()`
**Trigger:** `trigger_update_user_streak` (AFTER INSERT/UPDATE on `posts`)
**Purpose:** Updates user's posting streak when post is approved.

---

### `create_onboarding_checklist_on_approval()`
**Trigger:** `trigger_create_onboarding_checklist` (AFTER UPDATE on `users`)
**Purpose:** Auto-creates onboarding checklist when UGC creator is approved.

---

### `update_updated_at_column()`
**Trigger:** Multiple tables (BEFORE UPDATE)
**Purpose:** Auto-updates `updated_at` timestamp.

---

## Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` |
| `trigger_create_onboarding_checklist` | users | AFTER UPDATE | `create_onboarding_checklist_on_approval()` |
| `trigger_update_user_streak` | posts | AFTER INSERT/UPDATE | `update_user_streak()` |
| `update_users_updated_at` | users | BEFORE UPDATE | `update_updated_at_column()` |
| `update_accounts_updated_at` | accounts | BEFORE UPDATE | `update_updated_at_column()` |
| `update_posts_updated_at` | posts | BEFORE UPDATE | `update_updated_at_column()` |
| `update_contracts_updated_at` | contracts | BEFORE UPDATE | `update_updated_at_column()` |
| `update_sports_events_updated_at` | sports_events | BEFORE UPDATE | `update_updated_at_column()` |
| `update_onboarding_checklist_updated_at` | onboarding_checklist | BEFORE UPDATE | `update_updated_at_column()` |

---

## Cron Jobs

| Job | Schedule | Edge Function | Purpose |
|-----|----------|---------------|---------|
| `fetch-sports-events-weekly` | Sundays 6 AM GMT | `/functions/v1/fetch-sports-events` | Update sports calendar |

---

## Frontend Queries

### Hooks Summary

| Hook | File | Tables Queried | Used By |
|------|------|----------------|---------|
| `useUserProfile` | `src/hooks/useUserProfile.ts` | users, contracts, user_accounts, accounts | Dashboard, AccountView |
| `useUserRole` | `src/contexts/UserRoleContext.tsx` | users (via context) | Everywhere |
| `useAllAccounts` | `src/hooks/useAllAccounts.ts` | user_accounts, accounts, users | FilterBar (admin) |
| `useAllUsers` | `src/hooks/useAllUsers.ts` | users | Admin views |
| `useLeaderboardData` | `src/hooks/useLeaderboardData.ts` | users, cpm_post_breakdown | Leaderboard |
| `useChartAnalytics` | `src/hooks/useChartAnalytics.ts` | analytics, posts | Dashboard chart |

### Query Patterns

**User's own data (standard pattern):**
```typescript
// Always filtered by auth.uid() - RLS enforces this
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

**User's linked accounts:**
```typescript
// Step 1: Get account IDs from user_accounts
const { data: userAccounts } = await supabase
  .from('user_accounts')
  .select('account_id')
  .eq('user_id', userId);

// Step 2: Get account details
const accountIds = userAccounts.map(ua => ua.account_id);
const { data: accounts } = await supabase
  .from('accounts')
  .select('*')
  .in('id', accountIds);
```

**Admin data (with frontend role check):**
```typescript
// Frontend checks role before querying
// RLS also enforces admin-only access
if (role === 'admin') {
  const { data } = await supabase
    .from('user_accounts')
    .select('account_id, user_id');  // Admin bypass in policy
}
```

**Account creation flow:**
```typescript
// 1. Insert account (returns the new row)
const { data: newAccount } = await supabase
  .from('accounts')
  .insert({ platform: 'tiktok', handle: 'username' })
  .select()
  .single();

// 2. Link to user
await supabase
  .from('user_accounts')
  .insert({ user_id: userId, account_id: newAccount.id });
```

---

## Security Model

### Authentication Flow

```
1. User signs up via Supabase Auth
         │
         ▼
2. handle_new_user() trigger creates profile
   (blocks admin role assignment)
         │
         ▼
3. User completes onboarding form
         │
         ▼
4. complete_user_profile() function:
   - Updates profile
   - Creates social accounts
   - Creates contract
         │
         ▼
5. UGC creators → application_status = 'pending'
   Others → application_status = 'approved'
         │
         ▼
6. Admin reviews pending applications
   - approve_ugc_application()
   - reject_ugc_application()
```

### Authorization Layers

| Layer | Implementation | Purpose |
|-------|----------------|---------|
| **1. Supabase Auth** | JWT tokens, sessions | Identity verification |
| **2. RLS Policies** | PostgreSQL policies | Database-level row filtering |
| **3. Frontend Guards** | React components | UI-level access control |

**Frontend Guards:**
- `src/components/ProtectedRoute.tsx` - Blocks unauthenticated users, handles pending applications
- `src/contexts/UserRoleContext.tsx` - Role-based UI rendering
- `src/pages/Index.tsx` - Admin route redirect (lines 109-115)

### Data Access Matrix

| Role | Own Data | Others' Data | Admin Functions |
|------|----------|--------------|-----------------|
| `ugc_creator` | Full CRUD | None | None |
| `influencer` | Full CRUD | None | None |
| `account_manager` | Full CRUD | None | None |
| `admin` | Full CRUD | Full Read | Full Access |

### Security Best Practices Implemented

1. **SECURITY DEFINER** on sensitive functions (bypasses RLS safely)
2. Admin role cannot be self-assigned (blocked in `handle_new_user`)
3. Cascading deletes handled in `delete_user_completely()`
4. All 14 tables have RLS enabled
5. Service role key rotated and not in version control
6. Frontend route protection for admin-only pages

---

## Migration History

**Total Migrations:** 40 (from `20250101000000` to `20251222000002`)

### Key Milestones

| Date | Migration | Purpose |
|------|-----------|---------|
| 2025-01-01 | `initial_schema.sql` | Core schema: users, accounts, posts, analytics, contracts |
| 2025-01-01 | Multiple RLS fixes | Iterative RLS policy refinement |
| 2025-01-10 | `create_sports_events_table.sql` | Sports calendar feature |
| 2025-12-11 | `setup_cron_job.sql` | Automated data fetching |
| 2025-12-14 | `add_application_approval_system.sql` | UGC creator approval workflow |
| 2025-12-14 | `create_onboarding_checklist.sql` | Onboarding tracking |
| 2025-12-14 | `add_gamification_features.sql` | Streaks and milestones |
| 2025-12-15 | `setup_cpm_tables.sql` | CPM payment tracking |
| 2025-12-15 | Multiple cleanup migrations | Policy consolidation |
| 2025-12-19 | `secure_signup_role.sql` | Block admin role at signup |
| 2025-12-22 | `add_delete_user_function.sql` | User deletion function |
| 2025-12-22 | `fix_critical_rls_issues.sql` | Final RLS fixes for production |
| 2025-12-22 | `add_account_manager_system.sql` | Account Manager payouts table + account_pairs column |
| 2025-12-22 | `update_complete_profile_for_am.sql` | Add p_account_pairs to complete_user_profile function |

---

## Common Queries

### Get user with all related data
```typescript
const { data: user } = await supabase
  .from('users')
  .select(`
    *,
    contracts (*),
    user_accounts (
      account:accounts (*)
    )
  `)
  .eq('id', userId)
  .single();
```

### Get posts with latest analytics
```typescript
const { data: posts } = await supabase
  .from('posts')
  .select(`
    *,
    analytics (
      views, likes, comments, engagement_rate
    )
  `)
  .eq('submitted_by', userId)
  .order('created_at', { ascending: false });
```

### Admin: Get all approved creators
```typescript
const { data: creators } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'ugc_creator')
  .eq('application_status', 'approved');
```

### Submit a new post
```typescript
const { data: post } = await supabase
  .from('posts')
  .insert({
    account_id: accountId,
    submitted_by: userId,
    url: postUrl,
    platform: 'tiktok',
    status: 'pending'
  })
  .select()
  .single();
```

---

## Appendix: Useful SQL Scripts

### Check RLS policies for a table
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'your_table_name';
```

### View all tables with RLS status
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Test a policy as a specific user
```sql
SET request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM your_table;
RESET request.jwt.claim.sub;
```
