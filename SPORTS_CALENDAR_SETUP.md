# Sports Calendar Setup

This document explains how to set up and maintain the sports calendar feature that fetches upcoming sports events and displays them in the dashboard.

## Overview

The sports calendar fetches upcoming fixtures from **TheSportsDB API** (free tier) for the following leagues:
- 🏈 NFL (National Football League)
- 🏀 NBA (National Basketball Association)
- ⚾ MLB (Major League Baseball)
- 🥊 UFC (Ultimate Fighting Championship)
- ⚽ EPL (English Premier League)
- ⚽ UCL (UEFA Champions League)

Events are stored in the `sports_events` table and displayed in the Calendar view on the dashboard.

## Initial Setup

### 1. Database Migration
Already completed! The `sports_events` table was created with:
```bash
# Migration file: supabase/migrations/20250110000001_create_sports_events_table.sql
```

### 2. Environment Variables
Your `.env` file should have:
```env
VITE_SUPABASE_URL=https://uziactaapbzrqxazhpts.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_-3U8kkJRdv-nc2EH4m05zg_JEmhQeHR
SUPABASE_SERVICE_ROLE_KEY=sb_secret_KFeL-5_0FGXjgxoMVa_ERw_HqySHbPr
```

**Important:** Never commit the `.env` file to git! The service role key has full database access.

## Manual Execution

To manually fetch and update sports events:

```bash
npm run fetch-sports
```

This will:
1. Fetch up to 10 upcoming games per league (60 total)
2. Remove duplicate events
3. Clean up old events (older than yesterday)
4. Upsert events to the database
5. Show a breakdown by sport

## Automated Weekly Updates

To keep the calendar up-to-date, set up a **weekly cron job** that runs every **Sunday at 6:00 AM**.

### On macOS/Linux

1. Open your crontab file:
```bash
crontab -e
```

2. Add this line (replace `/path/to/creator-platform` with your actual project path):
```bash
0 6 * * 0 cd /Users/MacBookdeCesar/creator-platform && npm run fetch-sports >> /tmp/sports-fetch.log 2>&1
```

This will:
- Run every Sunday (`0 6 * * 0` = 6:00 AM on day 0 of the week)
- Navigate to your project directory
- Run the fetch script
- Log output to `/tmp/sports-fetch.log`

3. Save and exit (`:wq` in vim, or `Ctrl+X` then `Y` in nano)

4. Verify the cron job was added:
```bash
crontab -l
```

### On Windows

Use **Task Scheduler**:

1. Open Task Scheduler
2. Create a new Basic Task
3. Set trigger: Weekly, every Sunday at 6:00 AM
4. Set action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c cd C:\path\to\creator-platform && npm run fetch-sports`

## How It Works

### Architecture

```
┌─────────────────┐
│  TheSportsDB    │ (Free API)
│     API         │
└────────┬────────┘
         │
         │ HTTP GET
         │
         ▼
┌─────────────────┐
│  fetch-sports-  │ (Node.js Script)
│   events.ts     │
└────────┬────────┘
         │
         │ Supabase Client
         │ (service_role key)
         ▼
┌─────────────────┐
│   sports_events │ (PostgreSQL Table)
│     table       │
└────────┬────────┘
         │
         │ Supabase Client
         │ (anon key + RLS)
         ▼
┌─────────────────┐
│  CalendarView   │ (React Component)
│   Component     │
└─────────────────┘
```

### Files

1. **src/services/sportsdb.ts**
   - API service layer
   - Defines league IDs
   - Fetches and transforms event data

2. **scripts/fetch-sports-events.ts**
   - Main script that runs via cron
   - Uses service role key for write access
   - Deduplicates events
   - Cleans up old data

3. **src/components/dashboard/CalendarView.tsx**
   - React component that displays events
   - Queries last 14 days of events
   - Groups by date and shows expandable details

## Troubleshooting

### No events showing in calendar

1. Check if script ran successfully:
```bash
npm run fetch-sports
```

2. Verify events in database (Supabase dashboard → Table Editor → sports_events)

3. Check browser console for errors

### Script fails to run

1. Verify environment variables are set in `.env`
2. Check you have the service role key (not anon key)
3. Ensure you're in the project directory when running

### Cron job not running

1. Check cron logs:
```bash
tail -f /tmp/sports-fetch.log
```

2. Verify cron is running:
```bash
crontab -l
```

3. Test the command manually first

### Wrong league IDs

If events are showing as "Other" sport, the TheSportsDB league IDs may have changed. Update them in `src/services/sportsdb.ts`:

```typescript
export const LEAGUES = {
  NFL: '4391',   // Update if needed
  NBA: '4387',   // Update if needed
  // ... etc
}
```

Find current IDs at: https://www.thesportsdb.com/api.php

## API Rate Limits

TheSportsDB free tier:
- Rate limit: Unclear (seems generous)
- 1 request per league = 6 requests total
- Running weekly should be well within limits

## Future Improvements

Potential enhancements:
- [ ] Add more leagues (NHL, Formula 1, etc.)
- [ ] Filter events by user preferences
- [ ] Add event notifications
- [ ] Show live scores during games
- [ ] Add team logos from TheSportsDB API
- [ ] Click event to see more details
- [ ] Add to personal calendar (iCal export)

## Support

For issues or questions:
- TheSportsDB API docs: https://www.thesportsdb.com/api.php
- Supabase docs: https://supabase.com/docs
