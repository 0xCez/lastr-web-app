# Lastr Creator Platform Migration Plan

## Overview
Rebrand from Bet.AI to Lastr, focusing on **Account Managers only** (no UGC creators).

---

## PHASE 1: SETUP & INFRASTRUCTURE (Do First)

### 1.1 Create New Supabase Project for Lastr
- [ ] Create new Supabase project at https://supabase.com/dashboard
- [ ] Name: `lastr-creator-platform`
- [ ] Region: Choose closest to your users
- [ ] Save credentials:
  - Project URL
  - Anon Key
  - Service Role Key
  - Database Password

### 1.2 Fork Database Schema
Run these migrations in order (simplified for Account Managers only):

```sql
-- Core tables needed for Account Managers
-- 1. users (extended profiles)
-- 2. accounts (TikTok/Instagram handles)
-- 3. user_accounts (junction)
-- 4. posts (submitted slideshows)
-- 5. analytics (post metrics)
-- 6. am_onboarding_checklist
-- 7. account_manager_payouts
-- 8. action_items
-- 9. daily_metrics
```

### 1.3 Create New Discord Server
- [ ] Create Discord server: "Lastr Account Managers"
- [ ] Set up channels:
  - #announcements
  - #general
  - #support
  - #post-submissions
- [ ] Create Discord Application at https://discord.com/developers
- [ ] Get Bot Token & Client ID
- [ ] Set up OAuth2 redirect URLs

### 1.4 Update Environment Variables
Create `.env.local` with new values:
```
VITE_SUPABASE_URL=https://[NEW-PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=[NEW-ANON-KEY]
```

---

## PHASE 2: FRONTEND REBRANDING

### 2.1 Global Assets & Configuration

#### index.html (Root)
- [ ] Update `<title>` from "Bet.AI" to "Lastr"
- [ ] Update meta description
- [ ] Update og:title, og:description
- [ ] Update favicon reference if needed

#### src/index.css - Color Scheme
Current (Cyan/Blue):
```css
--primary: 187 100% 42%;
```
New Lastr colors (TBD - need your color codes):
```css
--primary: [NEW_H] [NEW_S]% [NEW_L]%;
```

#### tailwind.config.ts
- [ ] Update any hardcoded color values
- [ ] Verify custom utilities work with new colors

### 2.2 Logo & SVG Assets
Files to replace in `/public/svg/`:
- [ ] `logo.svg` → Lastr logo
- [ ] `logo1.svg` → Lastr variant
- [ ] `logo2.svg` → Lastr variant
- [ ] Update `favicon.ico`

### 2.3 Homepage (`src/pages/Homepage.tsx`)
- [ ] Update hero section copy
- [ ] Update features for Lastr's value prop
- [ ] Update footer copyright
- [ ] Verify mockup images in `/public/images/` are Lastr mockups

### 2.4 Account Manager Landing (`src/pages/AMLanding.tsx`)
Critical updates:
- [ ] Line 434: Footer "© 2025 Bet.AI" → "© 2025 Lastr"
- [ ] Update value proposition copy (sports betting → Lastr's offering)
- [ ] Update all "sports betting prediction slideshows" references
- [ ] Verify phone mockups reference Lastr

### 2.5 Dashboard (`src/pages/Index.tsx`)
- [ ] Line 384: `<title>Bet.AI - Creator Dashboard</title>` → Lastr
- [ ] Line 390: og:title update
- [ ] Remove UGC creator-specific components/views

### 2.6 Components to Update

| Component | File | Changes |
|-----------|------|---------|
| Navbar | `src/components/homepage/Navbar.tsx` | Line 97: alt text, app store links |
| AM Opportunity Modal | `src/components/dashboard/AccountManagerOpportunityModal.tsx` | Line 51: Bet.AI reference |
| Tab Nav | `src/components/dashboard/TabNav.tsx` | Check for brand references |
| Footer | Various | Copyright text |

### 2.7 Remove/Hide UGC Creator Features
Components to conditionally hide or remove:
- [ ] UGC creator onboarding flow
- [ ] UGC-specific dashboard views
- [ ] UGC payout calculations (CPM-based)
- [ ] Streak/badge gamification (if UGC-only)

---

## PHASE 3: SLIDESHOW GENERATOR UPDATE

### 3.1 Edge Function (`supabase/functions/generate-slideshow/`)
- [ ] Update templates for Lastr format (not sports betting)
- [ ] Modify image generation logic
- [ ] Update text generation prompts
- [ ] Remove sports betting-specific data

### 3.2 Slideshow Content
- [ ] Define new slideshow formats for Lastr
- [ ] Update team/data constants (or remove if not applicable)
- [ ] Modify caption generation
- [ ] Update audio URLs if different

### 3.3 Frontend Generator (`src/pages/SlideshowGenerator.tsx`)
- [ ] Update UI to match Lastr branding
- [ ] Modify format options
- [ ] Update preview/output

---

## PHASE 4: EMAIL TEMPLATES (Edge Functions)

### 4.1 Onboarding Email (`supabase/functions/send-onboarding-email/`)
Update:
- [ ] From: "Lastr <contact@lastr.com>"
- [ ] Subject: "Welcome to Lastr, {name}!"
- [ ] Title: "Welcome to Lastr Creator Program"
- [ ] Content: All Bet.AI references
- [ ] Logo URL: New Lastr logo URL
- [ ] Footer: Lastr copyright

### 4.2 Weekly Recap (`supabase/functions/send-weekly-recap/`)
Update:
- [ ] From address
- [ ] Subject line
- [ ] Title: "Lastr Weekly Recap"
- [ ] Dashboard URL
- [ ] Copyright

### 4.3 AM Recruitment (`supabase/functions/send-am-recruitment/`)
Update:
- [ ] From: "Emerson from Lastr" or new sender
- [ ] All recruitment copy

### 4.4 Contract Emails
- [ ] `send-contract/index.ts`
- [ ] `send-am-contract/index.ts`

---

## PHASE 5: DISCORD INTEGRATION

### 5.1 Update Edge Functions
- [ ] `discord-notify/` - Update message templates
- [ ] `discord-send-dm/` - Update DM content
- [ ] `discord-callback/` - Verify OAuth settings
- [ ] Other Discord functions as needed

### 5.2 Supabase Secrets
Set in new project:
```bash
supabase secrets set DISCORD_BOT_TOKEN=[new-token]
supabase secrets set DISCORD_CLIENT_ID=[new-client-id]
supabase secrets set DISCORD_CLIENT_SECRET=[new-secret]
supabase secrets set DISCORD_GUILD_ID=[new-server-id]
```

---

## PHASE 6: DATABASE MIGRATION

### 6.1 Core Schema (Account Managers Only)
Create simplified migration file with:
- [ ] users table (with AM-relevant fields)
- [ ] accounts table
- [ ] user_accounts junction
- [ ] posts table
- [ ] analytics table
- [ ] am_onboarding_checklist
- [ ] account_manager_payouts
- [ ] action_items
- [ ] daily_metrics

### 6.2 RLS Policies
- [ ] Admin full access
- [ ] Account Manager appropriate access
- [ ] Remove UGC-specific policies

### 6.3 Database Functions
- [ ] Review and update any functions with brand references
- [ ] Remove UGC-specific functions

---

## PHASE 7: DEPLOY & TEST

### 7.1 Deploy Edge Functions
```bash
export PATH="$HOME/.bun/bin:$PATH"

# Deploy all updated functions
bunx supabase functions deploy generate-slideshow --no-verify-jwt
bunx supabase functions deploy send-onboarding-email --no-verify-jwt
bunx supabase functions deploy send-weekly-recap --no-verify-jwt
bunx supabase functions deploy send-am-recruitment --no-verify-jwt
bunx supabase functions deploy discord-notify --no-verify-jwt
# ... etc for all functions
```

### 7.2 Test Checklist
- [ ] Homepage loads with Lastr branding
- [ ] Account Manager landing page correct
- [ ] Login/signup works
- [ ] Onboarding flow works
- [ ] Dashboard loads for admin
- [ ] Dashboard loads for account_manager
- [ ] Slideshow generator works
- [ ] Discord connection works
- [ ] Emails send with correct branding

---

## EXECUTION ORDER (Recommended)

### Day 1: Infrastructure
1. Create Supabase project
2. Create Discord server & app
3. Set up environment variables

### Day 2: Database
4. Run database migrations
5. Set up RLS policies
6. Test database connectivity

### Day 3: Frontend Core
7. Replace logo assets
8. Update color scheme
9. Update index.html metadata
10. Update Homepage
11. Update AMLanding

### Day 4: Dashboard & Components
12. Update Index.tsx (Dashboard)
13. Update all components with brand references
14. Hide/remove UGC features

### Day 5: Slideshow Generator
15. Update edge function
16. Update frontend generator
17. Test generation

### Day 6: Emails & Discord
18. Update all email templates
19. Update Discord functions
20. Deploy edge functions
21. Set Supabase secrets

### Day 7: Testing & Launch
22. Full end-to-end testing
23. Fix any issues
24. Deploy to production

---

## FILES REQUIRING CHANGES (Quick Reference)

### High Priority (User-Facing)
```
index.html
src/pages/Homepage.tsx
src/pages/AMLanding.tsx
src/pages/Index.tsx
src/components/homepage/Navbar.tsx
src/components/dashboard/AccountManagerOpportunityModal.tsx
public/svg/logo.svg
public/svg/logo1.svg
public/svg/logo2.svg
src/index.css (colors)
```

### Edge Functions
```
supabase/functions/generate-slideshow/index.ts
supabase/functions/send-onboarding-email/index.ts
supabase/functions/send-weekly-recap/index.ts
supabase/functions/send-am-recruitment/index.ts
supabase/functions/send-contract/index.ts
supabase/functions/send-am-contract/index.ts
supabase/functions/discord-notify/index.ts
```

### Configuration
```
.env.local (create new)
src/config/constants.ts (review)
```

---

## QUESTIONS TO ANSWER BEFORE STARTING

1. **Domain**: What is Lastr's domain? (lastr.com? lastrapp.com?)
2. **Email**: What email address for communications? (contact@lastr.com?)
3. **Colors**: What is Lastr's primary color scheme? (hex codes needed)
4. **Slideshow Format**: What content do Lastr slideshows contain? (not sports betting)
5. **Pricing**: Same $200-250/month for Account Managers?
6. **App Store**: Does Lastr have iOS/Android apps to link to?

---

## NOTES

- Always use `IF NOT EXISTS` in migrations for idempotency
- Deploy edge functions explicitly (git push doesn't deploy them)
- Test emails in development before production
- Back up current codebase before major changes
