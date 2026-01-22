import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// WORKER: PROCESS ANALYTICS JOB
// =============================================================================
//
// This function runs every 2 minutes via pg_cron (multiple instances staggered).
// It picks ONE pending job from analytics_jobs and processes all posts in parallel.
//
// Key features:
// - Uses SELECT FOR UPDATE SKIP LOCKED to prevent race conditions
// - Processes posts in parallel (PARALLEL_BATCH_SIZE concurrent Apify calls)
// - Individual post failures go to failed_posts_queue, don't fail the job
// - Abandoned jobs (processing > 10 min) are reclaimed
//
// Execution time: 60-120 seconds per job (30 posts, 15 parallel)
//
// =============================================================================

// Configuration
const PARALLEL_BATCH_SIZE = 15  // Concurrent Apify calls (safe under 25 limit)
const MAX_RETRIES_PER_POST = 3  // Retries per post before sending to failed queue
const ABANDONED_JOB_MINUTES = 10  // Jobs processing longer than this are reclaimed
const APIFY_TIMEOUT_MS = 130000  // 130 second timeout for Apify actor run

// Apify actor IDs
const TIKTOK_ACTOR = 'GdWCkxBtKWOsKjdch'
const INSTAGRAM_ACTOR = 'shu8hvrXbJbY3Eb9W'

// CPM Configuration
const CPM_RATE = 1.5
const CPM_WINDOW_DAYS = 28  // 4 weeks
const CPM_CAP_PER_POST = 350
const CPM_CAP_PER_USER_MONTHLY = 5000

// Viral Alert Configuration
const VIRAL_MILESTONE_INCREMENT = 10000

// =============================================================================
// TYPES
// =============================================================================

interface Post {
  id: string
  url: string
  platform: 'tiktok' | 'instagram'
  account_id: string
  submitted_by: string
  created_at: string
  status: string
}

interface Metrics {
  views: number
  likes: number
  comments: number
  shares: number
  bookmarks: number
  downloads?: number
}

interface Job {
  id: string
  post_ids: string[]
  batch_number: number
  total_batches: number
  attempt_count: number
  max_attempts: number
}

interface ProcessResult {
  postId: string
  success: boolean
  error?: string
  metrics?: Metrics
}

// =============================================================================
// API KEY ROTATION (Thread-Safe)
// =============================================================================
//
// IMPORTANT: Keys are assigned BEFORE parallel execution to avoid race conditions.
// Each post gets a pre-assigned key index based on its position in the batch.
// This ensures even distribution across keys when processing posts in parallel.
//
// PAID KEY FALLBACK: When rate limited (402/429), we fall back to the paid key
// which has guaranteed credits available.
//
// =============================================================================

let apiKeys: string[] = []
let paidApiKey: string | null = null

function loadApiKeys(): string[] {
  // Load the paid key (used as fallback when rate limited)
  paidApiKey = Deno.env.get('APIFY_PAID_KEY') || Deno.env.get('APIFY_API_TOKEN') || null
  if (paidApiKey) {
    console.log('💰 Paid API key loaded for fallback')
  }

  // Try comma-separated keys first (APIFY_API_TOKENS)
  const multipleKeys = Deno.env.get('APIFY_API_TOKENS')
  if (multipleKeys) {
    const keys = multipleKeys.split(',').map(k => k.trim()).filter(k => k.length > 0)
    if (keys.length > 0) {
      console.log(`🔑 Loaded ${keys.length} Apify API keys for rotation`)
      return keys
    }
  }

  // Fall back to single key
  const singleKey = Deno.env.get('APIFY_API_TOKEN')
  if (singleKey) {
    console.log('🔑 Using single Apify API key')
    return [singleKey]
  }

  return []
}

function getKeyByIndex(index: number): string {
  if (apiKeys.length === 0) {
    throw new Error('No API keys available')
  }
  return apiKeys[index % apiKeys.length]
}

function getPaidKey(): string | null {
  return paidApiKey
}

function getNextKeyIndex(currentIndex: number): number {
  return (currentIndex + 1) % apiKeys.length
}

// =============================================================================
// APIFY SCRAPING (with timeout)
// =============================================================================

async function scrapeWithTimeout(
  url: string,
  platform: 'tiktok' | 'instagram',
  apiKey: string
): Promise<Metrics | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), APIFY_TIMEOUT_MS)

  try {
    const actorId = platform === 'tiktok' ? TIKTOK_ACTOR : INSTAGRAM_ACTOR
    const inputKey = platform === 'tiktok' ? 'postURLs' : 'directUrls'

    // Start the actor run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?waitForFinish=120`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          [inputKey]: [url],
          resultsLimit: 1,
        }),
        signal: controller.signal,
      }
    )

    if (!runResponse.ok) {
      const status = runResponse.status
      if (status === 402 || status === 429) {
        throw new Error(`RATE_LIMIT:${status}`)
      }
      throw new Error(`Apify run failed: ${status}`)
    }

    const runResult = await runResponse.json()

    if (!runResult.data?.defaultDatasetId) {
      throw new Error('No dataset ID returned')
    }

    // Fetch results from dataset
    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${runResult.data.defaultDatasetId}/items`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal,
      }
    )

    const items = await datasetResponse.json()

    if (!items || items.length === 0) {
      return null
    }

    const data = items[0]

    // Parse metrics based on platform
    if (platform === 'tiktok') {
      return {
        views: data.playCount || data.videoPlayCount || 0,
        likes: data.diggCount || data.likes || 0,
        comments: data.commentCount || data.comments || 0,
        shares: data.shareCount || data.shares || 0,
        bookmarks: data.collectCount || data.bookmarks || 0,
        downloads: data.downloadCount || 0,
      }
    } else {
      return {
        views: data.videoPlayCount || 0,
        likes: data.likesCount || data.likes || 0,
        comments: data.commentsCount || data.comments || 0,
        shares: data.sharesCount || data.shares || 0,
        bookmarks: data.savesCount || data.bookmarks || 0,
      }
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

// =============================================================================
// SINGLE POST PROCESSING
// =============================================================================

async function processPost(
  supabase: ReturnType<typeof createClient>,
  post: Post,
  todayStr: string,
  initialKeyIndex: number  // Pre-assigned key index for thread safety
): Promise<ProcessResult> {
  let lastError: Error | null = null
  let metrics: Metrics | null = null
  let keyIndex = initialKeyIndex
  let usedPaidKey = false

  // Try with API key rotation (using pre-assigned starting key)
  for (let attempt = 0; attempt < MAX_RETRIES_PER_POST; attempt++) {
    try {
      const apiKey = getKeyByIndex(keyIndex)
      metrics = await scrapeWithTimeout(post.url, post.platform, apiKey)
      break  // Success, exit retry loop
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if rate limited - rotate to next key
      if (lastError.message.startsWith('RATE_LIMIT:')) {
        keyIndex = getNextKeyIndex(keyIndex)
        console.log(`🔄 Rate limited, rotating to key ${(keyIndex % apiKeys.length) + 1}/${apiKeys.length}`)
        continue
      }

      // Other error - retry with next key
      if (attempt < MAX_RETRIES_PER_POST - 1) {
        keyIndex = getNextKeyIndex(keyIndex)
      }
    }
  }

  // If all retries failed, try with paid key as last resort
  if (!metrics && lastError?.message.startsWith('RATE_LIMIT:') && paidApiKey) {
    console.log(`💰 All keys rate limited, trying paid key for post ${post.id}`)
    try {
      metrics = await scrapeWithTimeout(post.url, post.platform, paidApiKey)
      usedPaidKey = true
      console.log(`✅ Paid key succeeded for post ${post.id}`)
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.log(`❌ Paid key also failed: ${lastError.message}`)
    }
  }

  // If all retries failed
  if (!metrics) {
    return {
      postId: post.id,
      success: false,
      error: lastError?.message || 'Failed to fetch metrics',
    }
  }

  // Save analytics
  try {
    const engagementRate = metrics.views > 0
      ? Number((((metrics.likes + metrics.comments + metrics.shares + metrics.bookmarks) / metrics.views) * 100).toFixed(2))
      : 0

    // Use upsert to handle duplicate entries gracefully
    // The unique constraint on (post_id, fetch_date) prevents duplicates
    // If a duplicate exists (e.g., from crash recovery), we UPDATE with latest data
    const { error: analyticsError } = await supabase
      .from('analytics')
      .upsert({
        post_id: post.id,
        views: metrics.views,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        bookmarks: metrics.bookmarks,
        downloads: metrics.downloads || 0,
        engagement_rate: engagementRate,
        source: 'apify',
        fetched_at: new Date().toISOString(),
        fetch_date: todayStr,  // Required for the unique constraint
      }, {
        onConflict: 'post_id,fetch_date',  // Match the unique index
        ignoreDuplicates: false,  // Update existing record with latest data
      })

    if (analyticsError) {
      throw new Error(`Analytics upsert failed: ${analyticsError.message}`)
    }

    // Calculate CPM
    await calculateAndStoreDailyCPM(
      supabase,
      post.id,
      post.submitted_by,
      post.created_at,
      metrics.views,
      todayStr
    )

    // Check viral alerts
    await checkViralAlert(supabase, post.id, metrics.views)

    return {
      postId: post.id,
      success: true,
      metrics,
    }
  } catch (error: unknown) {
    return {
      postId: post.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving data',
    }
  }
}

// =============================================================================
// CPM CALCULATION
// =============================================================================

async function calculateAndStoreDailyCPM(
  supabase: ReturnType<typeof createClient>,
  postId: string,
  userId: string,
  postCreatedAt: string,
  cumulativeViews: number,
  date: string
): Promise<void> {
  // Check if already exists for today
  const { data: existing } = await supabase
    .from('cpm_post_breakdown')
    .select('id')
    .eq('post_id', postId)
    .eq('date', date)
    .maybeSingle()

  if (existing) return

  // Calculate post age
  const postDate = new Date(postCreatedAt)
  const today = new Date(date)
  const postAgeDays = Math.floor((today.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24))

  if (postAgeDays > CPM_WINDOW_DAYS) return

  // Get previous record
  const { data: previous } = await supabase
    .from('cpm_post_breakdown')
    .select('cumulative_views, cumulative_post_cpm')
    .eq('post_id', postId)
    .lt('date', date)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const previousViews = previous?.cumulative_views || 0
  const previousPostCPM = previous?.cumulative_post_cpm || 0

  const viewsDelta = Math.max(0, cumulativeViews - previousViews)

  // Check post cap
  if (previousPostCPM >= CPM_CAP_PER_POST) {
    await supabase.from('cpm_post_breakdown').insert({
      post_id: postId,
      user_id: userId,
      date,
      cumulative_views: cumulativeViews,
      views_delta: viewsDelta,
      cpm_earned: 0,
      post_age_days: postAgeDays,
      cumulative_post_cpm: previousPostCPM,
      is_post_capped: true,
    })
    return
  }

  // Calculate CPM
  let cpmEarned = (viewsDelta / 1000) * CPM_RATE

  // Apply post cap
  if (previousPostCPM + cpmEarned > CPM_CAP_PER_POST) {
    cpmEarned = CPM_CAP_PER_POST - previousPostCPM
  }

  // Check monthly cap
  const monthStart = new Date(date)
  monthStart.setDate(1)

  const { data: monthlyRecords } = await supabase
    .from('cpm_post_breakdown')
    .select('cpm_earned')
    .eq('user_id', userId)
    .gte('date', monthStart.toISOString().split('T')[0])
    .lte('date', date)

  const monthlyTotal = (monthlyRecords || []).reduce((sum, r) => sum + Number(r.cpm_earned || 0), 0)

  if (monthlyTotal >= CPM_CAP_PER_USER_MONTHLY) {
    cpmEarned = 0
  } else if (monthlyTotal + cpmEarned > CPM_CAP_PER_USER_MONTHLY) {
    cpmEarned = CPM_CAP_PER_USER_MONTHLY - monthlyTotal
  }

  // Insert record
  await supabase.from('cpm_post_breakdown').insert({
    post_id: postId,
    user_id: userId,
    date,
    cumulative_views: cumulativeViews,
    views_delta: viewsDelta,
    cpm_earned: Number(cpmEarned.toFixed(2)),
    post_age_days: postAgeDays,
    cumulative_post_cpm: Number((previousPostCPM + cpmEarned).toFixed(2)),
    is_post_capped: previousPostCPM + cpmEarned >= CPM_CAP_PER_POST,
    is_user_monthly_capped: monthlyTotal + cpmEarned >= CPM_CAP_PER_USER_MONTHLY,
  })
}

// =============================================================================
// VIRAL ALERT
// =============================================================================

async function checkViralAlert(
  supabase: ReturnType<typeof createClient>,
  postId: string,
  currentViews: number
): Promise<void> {
  const { data: post } = await supabase
    .from('posts')
    .select('viral_alert_views')
    .eq('id', postId)
    .single()

  if (!post) return

  const currentMilestone = Math.floor(currentViews / VIRAL_MILESTONE_INCREMENT) * VIRAL_MILESTONE_INCREMENT
  const previousMilestone = post.viral_alert_views ?? 0

  if (currentMilestone >= VIRAL_MILESTONE_INCREMENT && currentMilestone > previousMilestone) {
    const viewsFormatted = currentMilestone >= 1000000
      ? `${(currentMilestone / 1000000).toFixed(1)}M`
      : `${(currentMilestone / 1000).toFixed(0)}K`

    await supabase
      .from('posts')
      .update({
        viral_alert_message: `🔥 Your post reached ${viewsFormatted} views!`,
        viral_alert_views: currentMilestone,
        viral_alert_created_at: new Date().toISOString(),
        viral_alert_acknowledged: false,
      })
      .eq('id', postId)
  }
}

// =============================================================================
// FAILED QUEUE MANAGEMENT
// =============================================================================

async function addToFailedQueue(
  supabase: ReturnType<typeof createClient>,
  post: Post,
  error: string
): Promise<void> {
  await supabase
    .from('failed_posts_queue')
    .upsert({
      post_id: post.id,
      url: post.url,
      platform: post.platform,
      account_id: post.account_id,
      submitted_by: post.submitted_by,
      post_created_at: post.created_at,
      last_error: error,
      last_attempt_at: new Date().toISOString(),
    }, { onConflict: 'post_id' })
}

async function removeFromFailedQueue(
  supabase: ReturnType<typeof createClient>,
  postId: string
): Promise<void> {
  await supabase
    .from('failed_posts_queue')
    .delete()
    .eq('post_id', postId)
}

// =============================================================================
// PARALLEL BATCH PROCESSING
// =============================================================================

async function processPostsInParallel(
  supabase: ReturnType<typeof createClient>,
  posts: Post[],
  todayStr: string
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0
  let failed = 0

  // Process in parallel batches of PARALLEL_BATCH_SIZE
  for (let i = 0; i < posts.length; i += PARALLEL_BATCH_SIZE) {
    const batch = posts.slice(i, i + PARALLEL_BATCH_SIZE)
    console.log(`  Processing batch ${Math.floor(i / PARALLEL_BATCH_SIZE) + 1}/${Math.ceil(posts.length / PARALLEL_BATCH_SIZE)} (${batch.length} posts)`)

    // THREAD-SAFE: Assign key indices BEFORE parallel execution
    // Each post gets a unique key index to distribute load across API keys
    // This prevents the race condition where all parallel requests used the same key
    const results = await Promise.allSettled(
      batch.map((post, batchIndex) => {
        // Distribute keys evenly: post 0 -> key 0, post 1 -> key 1, etc.
        const keyIndex = (i + batchIndex) % apiKeys.length
        return processPost(supabase, post, todayStr, keyIndex)
      })
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      const post = batch[j]

      if (result.status === 'fulfilled') {
        if (result.value.success) {
          succeeded++
          await removeFromFailedQueue(supabase, post.id)
        } else {
          failed++
          await addToFailedQueue(supabase, post, result.value.error || 'Unknown error')
        }
      } else {
        failed++
        await addToFailedQueue(supabase, post, result.reason?.message || 'Promise rejected')
      }
    }
  }

  return { succeeded, failed }
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

serve(async (req): Promise<Response> => {
  const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  console.log(`🔧 Worker ${workerId} started`)

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Load API keys
    apiKeys = loadApiKeys()
    if (apiKeys.length === 0) {
      throw new Error('No Apify API keys configured')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // =========================================================================
    // STEP 1: Reclaim abandoned jobs (processing > 10 min)
    // =========================================================================
    const abandonedCutoff = new Date(Date.now() - ABANDONED_JOB_MINUTES * 60 * 1000)

    await supabase
      .from('analytics_jobs')
      .update({
        status: 'pending',
        worker_id: null,
        started_at: null,
      })
      .eq('status', 'processing')
      .lt('started_at', abandonedCutoff.toISOString())

    // =========================================================================
    // STEP 2: Claim a pending job using FOR UPDATE SKIP LOCKED
    // =========================================================================
    // Use the claim_analytics_job RPC which uses FOR UPDATE SKIP LOCKED
    // This is CRITICAL for preventing race conditions between workers
    const { data: jobs, error: claimError } = await supabase
      .rpc('claim_analytics_job', { p_worker_id: workerId })

    if (claimError) {
      // CRITICAL: Do NOT fall back to unsafe direct query!
      // If the RPC fails, the migration hasn't been applied properly.
      // Throwing an error here prevents race conditions where two workers
      // could claim the same job.
      console.error(`❌ claim_analytics_job RPC failed: ${claimError.message}`)
      console.error('This likely means the migration 20251225000002_analytics_job_functions.sql was not applied.')
      throw new Error(`Job claiming RPC failed: ${claimError.message}. Check that migrations are applied.`)
    }

    if (!jobs || jobs.length === 0) {
      console.log('📭 No pending jobs found')
      return new Response(
        JSON.stringify({ success: true, message: 'No pending jobs', workerId }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    const job = jobs[0] as Job
    return await processJob(supabase, job, workerId, todayStr)

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Worker error: ${errorMessage}`)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, workerId }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})

// =============================================================================
// PROCESS JOB
// =============================================================================

async function processJob(
  supabase: ReturnType<typeof createClient>,
  job: Job,
  workerId: string,
  todayStr: string
): Promise<Response> {
  console.log(`📋 Processing job ${job.id} (batch ${job.batch_number}/${job.total_batches}, ${job.post_ids.length} posts)`)

  try {
    // Fetch full post data
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, url, platform, account_id, submitted_by, created_at, status')
      .in('id', job.post_ids)
      .eq('status', 'approved')

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`)
    }

    if (!posts || posts.length === 0) {
      // No posts to process (maybe all deleted or status changed)
      await supabase
        .from('analytics_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          posts_succeeded: 0,
          posts_failed: 0,
        })
        .eq('id', job.id)

      return new Response(
        JSON.stringify({ success: true, message: 'No posts to process', jobId: job.id, workerId }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    // Process posts in parallel
    const { succeeded, failed } = await processPostsInParallel(
      supabase,
      posts as Post[],
      todayStr
    )

    // Mark job as completed
    await supabase
      .from('analytics_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        posts_succeeded: succeeded,
        posts_failed: failed,
      })
      .eq('id', job.id)

    console.log(`✅ Job ${job.id} complete: ${succeeded} succeeded, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        batchNumber: job.batch_number,
        totalBatches: job.total_batches,
        postsSucceeded: succeeded,
        postsFailed: failed,
        workerId,
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check if we should retry
    if (job.attempt_count < job.max_attempts) {
      await supabase
        .from('analytics_jobs')
        .update({
          status: 'pending',
          worker_id: null,
          started_at: null,
          error_message: errorMessage,
        })
        .eq('id', job.id)

      console.log(`⚠️ Job ${job.id} failed, will retry (attempt ${job.attempt_count}/${job.max_attempts})`)
    } else {
      await supabase
        .from('analytics_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: `PERMANENT FAILURE: ${errorMessage}`,
        })
        .eq('id', job.id)

      console.log(`❌ Job ${job.id} permanently failed after ${job.max_attempts} attempts`)
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage, jobId: job.id, workerId }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}
