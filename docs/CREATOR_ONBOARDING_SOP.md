# Creator Onboarding SOP - Bet.AI Platform

**Version:** 1.0
**Last Updated:** January 3, 2026
**For:** Admin, VA, and Intern Team

---

## Table of Contents
1. [Overview](#overview)
2. [Creator Application](#stage-1-creator-application)
3. [Admin Review & Approval](#stage-2-admin-review--approval)
4. [Contract Signing](#stage-3-contract-signing)
5. [Creator Onboarding](#stage-4-creator-onboarding)
6. [Post Submission](#stage-5-post-submission)
7. [Checklists by Role](#checklists-by-role)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### User Types
- **UGC Creators**: Video creators (requires approval)
- **Account Managers**: Manage multiple posting accounts (requires approval)
- **Influencers**: Pre-approved influencer partners (auto-approved)

### High-Level Flow
```
Creator Signup → Admin Approval → Contract Signing → Onboarding → Post Submission → Analytics
```

---

## STAGE 1: Creator Application

### What Creators Fill Out

**Step 1 - Basic Info:**
- Full name, email, country
- PayPal email for payments
- Age range & gender
- Role selection (UGC, AM, or Influencer)

**Step 2 - Role Details:**
- **UGC Creators**: Choose contract ($300 + CPM or $500 flat)
- **Account Managers**: Choose 1-2 account pairs
- **Influencers**: Add TikTok/IG handles + minimum views/posts

**Step 3 - Password:**
- Set login credentials

### What Happens After Submit

**UGC/Account Managers:**
- Status: `pending`
- Redirected to "Application Pending" page
- Sees: "We'll review within 24-48 hours"

**Influencers:**
- Status: `approved` (auto-approved)
- Redirected to dashboard immediately

---

## STAGE 2: Admin Review & Approval

### Where to Review Applications
📍 **Location:** `/admin/applications` page

### Application Card Shows:
- Creator name + role badge (UGC/AM)
- Email, country, age, gender
- Contract option selected
- Time submitted ("3h ago")
- Posts count
- ⚠️ Inactivity warning (if approved 4+ days, 0 posts)

### Filters Available:
- **Role Tabs**: UGC Creators vs Account Managers
- **Status Filters**: All / Pending / Approved / Rejected
- **Refresh Button**: Reload latest data

---

## Admin Action: APPROVE

### Step-by-Step

1. **Click "Approve" button** on application card

2. **System automatically:**
   - ✅ Sets `application_status = 'approved'`
   - ✅ Records `approved_at` timestamp
   - ✅ Creates admin onboarding checklist

3. **Sends onboarding email** (via Resend)
   - Welcome message
   - Login button
   - 5-item first week checklist
   - Discord link

4. **Sends contract** (via SignWell)
   - Creator receives email: "Please sign contract"
   - Contract sent to creator + company rep
   - Stores SignWell document ID

5. **Toast notifications:**
   - "Approval email sent!"
   - "Contract sent to [Name]!"

### Admin Onboarding Checklist (6 Tasks)

After approval, click the **checklist button** (shows "0/6" or progress) to open:

| # | Task | What to Do |
|---|------|------------|
| 1 | **Contract verified** | Confirm contract signed by both parties in SignWell |
| 2 | **Discord & TestFlight** | Add to Discord server, DM TestFlight link |
| 3 | **Call scheduled** | Schedule 15-min onboarding call |
| 4 | **Handles verified** | Confirm TikTok/IG handles are correct |
| 5 | **Content validated** | Review 1-2 sample videos, explain format |
| 6 | **First post** | Confirm first post submitted to platform |

**How to use:**
- Click checkbox to mark complete (timestamps automatically)
- Progress bar updates (e.g., 3/6 completed)
- 🎉 Confetti when all 6 complete

---

## Admin Action: REJECT

1. Click "Reject" button
2. Enter rejection reason
3. Creator locked out of platform

---

## STAGE 3: Contract Signing

### Creator Side

1. **Receives email from SignWell**
   - Subject: "Please sign: Creator Agreement - [Name]"
   - From: SignWell (on behalf of Bet.AI)

2. **Clicks "Sign Now" link**
   - Opens contract in browser
   - Name pre-filled automatically
   - Signs electronically

3. **Contract completed**
   - Both parties receive signed copy
   - Webhook updates platform: `contract_signed_at` set

### Admin Side

**How to verify:**
1. Open admin checklist for creator
2. Check if Step 1 "Contract verified" is auto-completed
3. If not, manually check SignWell dashboard
4. Mark as complete once confirmed

---

## STAGE 4: Creator Onboarding

### What Creators See After Approval

📍 **Location:** Dashboard → "Your First Week Checklist" modal

### 6-Item Creator Checklist:

| # | Task | How They Complete |
|---|------|-------------------|
| 1 | **Connect Discord** | Click "Connect" → OAuth flow |
| 2 | **Warm up (5 days)** | Post non-Bet.AI content, check box |
| 3 | **Read Content Guide** | Click "Open Guide" → modal |
| 4 | **Watch Tutorial** | Click "Watch" → Loom video |
| 5 | **Post first video** | Create video, post to TikTok/IG |
| 6 | **Submit link** | Click "Go to Submit" → Submit form |

**Features:**
- Progress bar (X/6)
- Auto-completes Discord task when connected
- Confetti + celebration when all 6 done

### Discord Integration

When creator connects Discord:
- Auto-joins Bet.AI server
- Gets private creator channel
- Receives TestFlight link via DM
- Can chat with other creators

---

## STAGE 5: Post Submission

### How Creators Submit Posts

📍 **Location:** Dashboard → "Submit Post" button

**Submit Post Form:**
1. **Post URL** (required)
   - TikTok: `https://www.tiktok.com/@username/video/123456`
   - Instagram: `https://www.instagram.com/p/ABC123` or `/reel/ABC123`
2. **Select Account** (dropdown)
   - Auto-detects platform from URL
   - Shows only matching accounts
3. **Notes** (optional)
4. Click "Submit"

**What Happens:**
- ✅ Auto-approved (no manual review)
- ✅ Discord notification sent
- ✅ Analytics fetched at midnight UTC
- ✅ Views/likes/comments tracked
- ✅ CPM earnings calculated monthly

---

## CHECKLISTS BY ROLE

### 📋 ADMIN CHECKLIST (Before Approval)

**For each pending application:**
- [ ] Review creator info (country, age, quality signals)
- [ ] Check if duplicate handle exists
- [ ] Verify PayPal email format is valid
- [ ] Click "Approve" in platform
- [ ] Confirm toast: "Approval email sent"
- [ ] Confirm toast: "Contract sent"

---

### 📋 VA/ADMIN CHECKLIST (After Approval - 6 Tasks)

**Open admin onboarding checklist for creator:**

- [ ] **Task 1: Contract Verification**
  - Go to SignWell dashboard
  - Find creator's contract by name/email
  - Confirm status: "Completed"
  - Confirm both signatures present
  - Mark complete in platform

- [ ] **Task 2: Discord & TestFlight**
  - Add creator to Bet.AI Discord server
  - Send DM with TestFlight link
  - Confirm they joined server
  - Mark complete in platform

- [ ] **Task 3: Call Scheduled**
  - Schedule 15-min onboarding call
  - Send calendar invite
  - Confirm call on calendar
  - Mark complete in platform

- [ ] **Task 4: Handles Verified**
  - Go to creator's Account tab
  - Verify TikTok handle matches real account
  - Verify Instagram handle matches real account
  - Check accounts are active (not banned)
  - Mark complete in platform

- [ ] **Task 5: Content Validated**
  - Review 1-2 sample videos from creator
  - Explain Bet.AI content format on call
  - Answer questions about video specs
  - Confirm understanding
  - Mark complete in platform

- [ ] **Task 6: First Post**
  - Wait for creator to submit first post
  - Check submission in Dashboard
  - Verify URL works and video is live
  - Auto-completes when post submitted
  - (No manual action needed)

---

### 📋 CREATOR CHECKLIST (First Week)

**Automatically shown on dashboard:**

- [ ] **Sign Contract**
  - Check email from SignWell
  - Click "Sign Now" link
  - Review and electronically sign
  - Save signed copy

- [ ] **Connect Discord**
  - Click "Connect" button in checklist
  - Authorize Discord OAuth
  - Join Bet.AI server
  - Check for TestFlight DM

- [ ] **Warm Up (5 days)**
  - Post normal content (non-promotional)
  - 5 consecutive days minimum
  - Mark checkbox when done

- [ ] **Read Content Guide**
  - Click "Open Guide" in checklist
  - Review proven content format
  - Note video specs and style

- [ ] **Watch Tutorial**
  - Click "Watch" in checklist
  - View Loom editing tutorial
  - Practice editing technique

- [ ] **Post First Video**
  - Create Bet.AI promotional video
  - Post to TikTok/Instagram
  - Mark checkbox when posted

- [ ] **Submit Link**
  - Click "Go to Submit"
  - Paste video URL
  - Select matching account
  - Click Submit

---

## TROUBLESHOOTING

### Problem: Creator stuck on "Application Pending" page

**Solution:**
1. Check database: `users` table → `application_status`
2. Should be `'approved'` not `'pending'`
3. If stuck, ask creator to refresh page
4. If still stuck, manually send dashboard link: `https://yourapp.com/dashboard`

---

### Problem: Approval email not received

**Solution:**
1. Check spam/junk folder
2. Verify email address is correct in database
3. Check Resend API logs for errors
4. Resend manually via Resend dashboard if needed
5. Creator can still login directly at `/login`

---

### Problem: Contract not sent

**Solution:**
1. Check toast notification - did it say "Contract sent"?
2. If error, check SignWell dashboard manually
3. Check SIGNWELL_API_KEY environment variable
4. Manually send contract via SignWell:
   - Go to SignWell dashboard
   - Use template: "UGC Creator Contract"
   - Enter creator email/name
   - Send manually

---

### Problem: Creator can't submit posts

**Possible causes:**
1. **No accounts added**
   - Solution: Go to Account tab, add TikTok/IG handles
2. **Wrong URL format**
   - TikTok needs: `/video/123456`
   - Instagram needs: `/p/ABC` or `/reel/ABC`
3. **Platform mismatch**
   - Can't submit TikTok URL with Instagram account selected
   - Solution: Select matching account from dropdown

---

### Problem: Analytics not showing

**Solution:**
1. Check if post is approved (`status = 'approved'`)
2. Wait until after midnight UTC (analytics fetch nightly)
3. Check Apify API keys are configured
4. Check cron job logs: `create-analytics-jobs`
5. If still failing after 24h, contact tech support

---

### Problem: Checklist not updating

**Solution:**
1. Refresh page (hard refresh: Cmd+Shift+R)
2. Check database manually for timestamp fields
3. Click checkbox again to toggle
4. If stuck, contact tech support with user ID

---

## KEY INFORMATION

### Contract Terms (Fixed)

**UGC Creator Option 1:**
- Base: $300/month
- CPM: $1.50 per 1,000 views
- Target: 12 posts/week (Monday-Sunday)
- Cap: $5,000/month total

**Account Manager:**
- 1 pair: 5 slideshows/day
- 2 pairs: 10 slideshows/day

### Important URLs

- **Admin Applications:** `/admin/applications`
- **Creator Dashboard:** `/dashboard`
- **Login:** `/login`
- **SignWell Dashboard:** `https://app.signwell.com`
- **Discord Server:** https://discord.gg/RqhqgYwCfg

### Support Contacts

- **Admin Email:** contact@betaiapp.com
- **Tech Support:** [Your tech support channel]
- **Discord Support:** [Your Discord support channel]

---

## Quick Reference

### Approval Checklist (30 seconds)
1. ✅ Review application
2. ✅ Click "Approve"
3. ✅ Confirm toasts (email + contract sent)
4. ✅ Done!

### Post-Approval Checklist (15 mins)
1. ✅ Verify contract signed (SignWell)
2. ✅ Add to Discord + send TestFlight
3. ✅ Schedule onboarding call
4. ✅ Verify handles on call
5. ✅ Explain content format
6. ✅ Wait for first post submission

### Monthly Tasks
- [ ] Review inactive creators (approved 7+ days, 0 posts)
- [ ] Check contract completion rate
- [ ] Monitor first-week checklist completion
- [ ] Review post submission volume

---

**End of SOP**

*For questions or issues not covered here, contact the tech team or create a support ticket.*
