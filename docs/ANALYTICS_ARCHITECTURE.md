# Analytics Job Queue Architecture

## Overview

The analytics system fetches social media metrics (views, likes, comments, etc.) from TikTok and Instagram using Apify scrapers. It runs daily to update all posts within the 30-day CPM window.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MIDNIGHT UTC                                  │
│                    pg_cron trigger                                   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                                      │
│              create-analytics-jobs                                   │
│                                                                      │
│  1. Query all approved posts (within 30-day window)                  │
│  2. Chunk into batches of 30 posts                                   │
│  3. INSERT into analytics_jobs table                                 │
│  4. Complete in < 10 seconds                                         │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   analytics_jobs TABLE                               │
│  ┌────────┬─────────────────┬──────────┬─────────┐                  │
│  │ Job ID │ Post IDs (30)   │ Status   │ Batch # │                  │
│  ├────────┼─────────────────┼──────────┼─────────┤                  │
│  │ job-1  │ [p1, p2...p30]  │ pending  │ 1       │                  │
│  │ job-2  │ [p31...p60]     │ pending  │ 2       │                  │
│  │ job-3  │ [p61...p90]     │ pending  │ 3       │                  │
│  │ ...    │ ...             │ ...      │ ...     │                  │
│  └────────┴─────────────────┴──────────┴─────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   WORKER 1      │ │   WORKER 2      │ │   WORKER 3      │
│  (every 2min)   │ │  (every 2min)   │ │  (every 2min)   │
│                 │ │                 │ │  offset 1min    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┴───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    WORKER PROCESS                                    │
│              process-analytics-job                                   │
│                                                                      │
│  1. SELECT one pending job (FOR UPDATE SKIP LOCKED)                  │
│  2. Fetch 30 posts data from database                                │
│  3. Process 15 posts in parallel via Apify                           │
│  4. Wait ~30s, then next batch of 15                                 │
│  5. Save analytics, calculate CPM, check viral alerts                │
│  6. Mark job as completed                                            │
│  7. Total time: 60-90 seconds                                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Configuration

### Batch Sizes

| Parameter | Value | Notes |
|-----------|-------|-------|
| Posts per job | 30 | Fits within 400s timeout |
| Parallel Apify calls | 15 | Under Apify's 25 concurrent limit |
| Workers running | 3 | ~1.5 jobs/minute throughput |

### Timing

| Posts | Jobs | Time (3 workers) |
|-------|------|------------------|
| 100 | 4 | ~3 minutes |
| 500 | 17 | ~12 minutes |
| 1000 | 34 | ~23 minutes |
| 5000 | 167 | ~2 hours |
| 10000 | 334 | ~4 hours |

### Scaling

To process faster, add more workers:

```sql
-- Add Worker 4
SELECT cron.schedule(
  'analytics-worker-4',
  '*/2 * * * *',
  $$ SELECT net.http_post(...) $$
);
```

Each additional worker adds ~0.5 jobs/minute throughput.

## Database Tables

### analytics_jobs

Main job queue table.

```sql
CREATE TABLE analytics_jobs (
  id UUID PRIMARY KEY,
  post_ids UUID[],           -- Posts to process (max 30)
  batch_number INTEGER,      -- Order in the daily run
  total_batches INTEGER,     -- Total jobs created
  status TEXT,               -- pending, processing, completed, failed
  worker_id TEXT,            -- Which worker claimed this
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  posts_succeeded INTEGER,
  posts_failed INTEGER,
  attempt_count INTEGER,
  max_attempts INTEGER,
  error_message TEXT,
  triggered_by TEXT,         -- 'cron' or user_id
  run_date DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Key Indexes

```sql
-- Workers pick pending jobs by batch order
CREATE INDEX idx_analytics_jobs_pending
  ON analytics_jobs (status, batch_number, created_at)
  WHERE status = 'pending';

-- Abandoned job detection
CREATE INDEX idx_analytics_jobs_abandoned
  ON analytics_jobs (status, started_at)
  WHERE status = 'processing';
```

## Edge Functions

### create-analytics-jobs (Orchestrator)

- **Trigger**: pg_cron at midnight UTC
- **Duration**: < 10 seconds
- **Purpose**: Creates all jobs for the day

### process-analytics-job (Worker)

- **Trigger**: pg_cron every 2 minutes (3 instances)
- **Duration**: 60-90 seconds per job
- **Purpose**: Process one job's worth of posts

## API Keys

### Setup in Supabase Dashboard

1. Go to **Edge Functions** → **Secrets**
2. Add `APIFY_API_TOKENS` with comma-separated keys:

```
apify_api_KEY1,apify_api_KEY2,apify_api_KEY3,apify_api_KEY4
```

### Current Keys

```
APIFY_API_TOKENS=<set in Supabase Edge Function secrets>
```

### Key Rotation

- Keys rotate automatically on 402 (quota) or 429 (rate limit) errors
- Each key can handle 25 concurrent actor runs
- With 4 keys: 100 total concurrent capacity (we use 15)

## Reliability Features

### Idempotency

- Orchestrator checks if jobs exist for today before creating
- Won't create duplicate jobs for same day

### Race Condition Prevention

- Workers use `SELECT ... FOR UPDATE SKIP LOCKED`
- Multiple workers can run simultaneously without conflicts

### Abandoned Job Recovery

- Jobs stuck in "processing" for >10 minutes are reclaimed
- Worker checks for abandoned jobs before picking new ones

### Post-Level Failure Handling

- Individual post failures go to `failed_posts_queue`
- Don't fail the entire job
- Separate retry mechanism for failed posts

### Job-Level Retry

- Jobs have `max_attempts` (default 3)
- If job fails, it goes back to pending for retry
- After max attempts, marked as permanent failure

## Monitoring

### Check Today's Run Status

```sql
SELECT * FROM get_analytics_run_status();
```

Returns:
- total_jobs
- pending_jobs, processing_jobs, completed_jobs, failed_jobs
- total_posts_succeeded, total_posts_failed
- started_at, estimated_completion
- is_complete

### Daily Summary View

```sql
SELECT * FROM analytics_run_summary
WHERE run_date >= CURRENT_DATE - INTERVAL '7 days';
```

### Active Jobs

```sql
SELECT
  id, batch_number, status, worker_id,
  posts_succeeded, posts_failed,
  started_at, completed_at
FROM analytics_jobs
WHERE run_date = CURRENT_DATE
ORDER BY batch_number;
```

## Cron Jobs

| Job Name | Schedule | Purpose |
|----------|----------|---------|
| analytics-orchestrator-daily | 0 0 * * * | Create jobs at midnight |
| analytics-worker-1 | */2 * * * * | Process jobs (even minutes) |
| analytics-worker-2 | */2 * * * * | Process jobs (even minutes) |
| analytics-worker-3 | 1-59/2 * * * * | Process jobs (odd minutes) |
| analytics-jobs-cleanup-weekly | 0 3 * * 0 | Cleanup old completed jobs |

## Troubleshooting

### Jobs not processing

1. Check if workers are running:
```sql
SELECT * FROM cron.job WHERE jobname LIKE 'analytics-worker%';
```

2. Check for abandoned jobs:
```sql
SELECT * FROM analytics_jobs
WHERE status = 'processing'
AND started_at < NOW() - INTERVAL '10 minutes';
```

### API key issues

1. Check Edge Function logs in Supabase Dashboard
2. Verify APIFY_API_TOKENS secret is set correctly
3. Check Apify dashboard for quota/rate limits

### Performance issues

1. Monitor job processing times
2. Add more workers if needed
3. Consider reducing batch size if Apify is slow

## Migration from Old System

The new system replaces:
- `fetch-analytics` (old sequential function)
- `retry-failed-analytics` (now integrated)

Old cron jobs removed:
- `fetch-analytics-daily`
- `retry-failed-analytics`

## Future Improvements

1. **Manual fetch integration**: Allow admins to trigger jobs for specific creators
2. **Priority queue**: Manual triggers get higher priority
3. **Email alerts**: Notify admins of permanent failures
4. **Metrics dashboard**: Real-time job processing stats
