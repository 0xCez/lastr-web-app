// =============================================================================
// Retry Failed Analytics
// =============================================================================
//
// Retries posts from the failed_posts_queue that failed during normal processing.
// Called via cron every 6 hours.
//
// Logic:
// 1. Fetch posts from failed_posts_queue (max 50 per run)
// 2. Skip posts that were attempted in the last 6 hours
// 3. Attempt to scrape each post
// 4. On success: remove from queue
// 5. On failure: increment retry_count, update last_error
// 6. Posts with retry_count >= 10 are marked as permanently failed
//
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration
const MAX_POSTS_PER_RUN = 50
const MAX_RETRY_COUNT = 10  // After 10 retries (60 hours), give up
const MIN_HOURS_BETWEEN_RETRIES = 6
const APIFY_TIMEOUT_MS = 130000  // 130 second timeout for Apify actor run

// Apify actor IDs
const TIKTOK_ACTOR = 'GdWCkxBtKWOsKjdch'
const INSTAGRAM_ACTOR = 'shu8hvrXbJbY3Eb9W'

interface FailedPost {
  id: string
  post_id: string
  url: string
  platform: 'tiktok' | 'instagram'
  account_id: string
  submitted_by: string
  post_created_at: string
  retry_count: number
  last_error: string | null
  last_attempt_at: string | null
}

interface Metrics {
  views: number
  likes: number
  comments: number
  shares: number
  bookmarks: number
  downloads?: number
}

// =============================================================================
// API KEY MANAGEMENT
// =============================================================================

let apiKeys: string[] = []
let paidApiKey: string | null = null

function loadApiKeys(): string[] {
  // Load paid key for fallback
  paidApiKey = Deno.env.get('APIFY_PAID_KEY') || Deno.env.get('APIFY_API_TOKEN') || null
  if (paidApiKey) {
    console.log('💰 Paid API key loaded for fallback')
  }

  const multipleKeys = Deno.env.get('APIFY_API_TOKENS')
  if (multipleKeys) {
    const keys = multipleKeys.split(',').map(k => k.trim()).filter(k => k.length > 0)
    if (keys.length > 0) {
      console.log(`🔑 Loaded ${keys.length} Apify API keys`)
      return keys
    }
  }

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

// =============================================================================
// APIFY SCRAPING
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
      if (status === 429 || status === 402) {
        throw new Error(`RATE_LIMIT:${status}`)
      }
      throw new Error(`Apify run failed: ${status}`)
    }

    const runResult = await runResponse.json()

    if (!runResult.data?.defaultDatasetId) {
      throw new Error('No dataset ID in response')
    }

    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${runResult.data.defaultDatasetId}/items`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal,
      }
    )

    const items = await datasetResponse.json()

    if (!items || items.length === 0) {
      throw new Error('No data returned from Apify')
    }

    const data = items[0]

    if (platform === 'tiktok') {
      return {
        views: data.playCount || data.views || 0,
        likes: data.diggCount || data.likes || 0,
        comments: data.commentCount || data.comments || 0,
        shares: data.shareCount || data.shares || 0,
        bookmarks: data.collectCount || data.bookmarks || 0,
        downloads: data.downloadCount || 0,
      }
    } else {
      return {
        views: data.videoViewCount || data.playCount || data.views || 0,
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
// MAIN HANDLER
// =============================================================================

serve(async (req): Promise<Response> => {
  console.log('🔄 Retry Failed Analytics started')

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

    // Check for force flag in request body
    let forceRetry = false
    try {
      const body = await req.json()
      forceRetry = body?.force === true
    } catch {
      // No body or invalid JSON
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // Calculate cutoff time (6 hours ago) - skip if force=true
    const cutoffTime = new Date(Date.now() - MIN_HOURS_BETWEEN_RETRIES * 60 * 60 * 1000)

    // Fetch failed posts that are eligible for retry
    let query = supabase
      .from('failed_posts_queue')
      .select('*')
      .lt('retry_count', MAX_RETRY_COUNT)

    // Only apply time filter if not forcing
    if (!forceRetry) {
      query = query.or(`last_attempt_at.is.null,last_attempt_at.lt.${cutoffTime.toISOString()}`)
    }

    const { data: failedPosts, error: fetchError } = await query
      .order('retry_count', { ascending: true })
      .order('last_attempt_at', { ascending: true, nullsFirst: true })
      .limit(MAX_POSTS_PER_RUN)

    if (fetchError) {
      throw new Error(`Failed to fetch failed posts: ${fetchError.message}`)
    }

    if (!failedPosts || failedPosts.length === 0) {
      console.log('📭 No failed posts to retry')
      return new Response(
        JSON.stringify({ success: true, message: 'No failed posts to retry', retried: 0 }),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    console.log(`📋 Found ${failedPosts.length} failed posts to retry`)

    let succeeded = 0
    let failed = 0
    let permanentlyFailed = 0

    // Process each failed post
    for (let i = 0; i < failedPosts.length; i++) {
      const post = failedPosts[i] as FailedPost
      const keyIndex = i % apiKeys.length

      console.log(`  [${i + 1}/${failedPosts.length}] Retrying post ${post.post_id} (attempt ${post.retry_count + 1})`)

      let metrics: Metrics | null = null
      let lastError: string | null = null

      // Try with regular key first
      try {
        const apiKey = getKeyByIndex(keyIndex)
        metrics = await scrapeWithTimeout(post.url, post.platform, apiKey)
      } catch (error: unknown) {
        lastError = error instanceof Error ? error.message : 'Unknown error'

        // If rate limited and we have a paid key, try that
        if (lastError.startsWith('RATE_LIMIT:') && paidApiKey) {
          console.log(`    💰 Rate limited, trying paid key...`)
          try {
            metrics = await scrapeWithTimeout(post.url, post.platform, paidApiKey)
            console.log(`    ✅ Paid key succeeded!`)
          } catch (paidError: unknown) {
            lastError = paidError instanceof Error ? paidError.message : 'Unknown error'
          }
        }
      }

      if (metrics) {
        // Success! Save analytics
        const engagementRate = metrics.views > 0
          ? Number((((metrics.likes + metrics.comments + metrics.shares + metrics.bookmarks) / metrics.views) * 100).toFixed(2))
          : 0

        const { error: analyticsError } = await supabase
          .from('analytics')
          .upsert({
            post_id: post.post_id,
            views: metrics.views,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            bookmarks: metrics.bookmarks,
            downloads: metrics.downloads || 0,
            engagement_rate: engagementRate,
            source: 'apify-retry',
            fetched_at: new Date().toISOString(),
            fetch_date: todayStr,
          }, {
            onConflict: 'post_id,fetch_date',
            ignoreDuplicates: false,
          })

        if (analyticsError) {
          lastError = `Analytics save failed: ${analyticsError.message}`
        } else {
          // Remove from failed queue
          await supabase
            .from('failed_posts_queue')
            .delete()
            .eq('id', post.id)

          console.log(`    ✅ Success! Removed from queue`)
          succeeded++
          continue
        }
      }

      // Failed - update the record
      const errorMessage = lastError || 'No metrics returned'
      const newRetryCount = post.retry_count + 1

      await supabase
        .from('failed_posts_queue')
        .update({
          retry_count: newRetryCount,
          last_error: errorMessage,
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', post.id)

      if (newRetryCount >= MAX_RETRY_COUNT) {
        console.log(`    ❌ Permanently failed after ${MAX_RETRY_COUNT} attempts: ${errorMessage}`)
        permanentlyFailed++
      } else {
        console.log(`    ⚠️ Retry ${newRetryCount}/${MAX_RETRY_COUNT} failed: ${errorMessage}`)
        failed++
      }
    }

    const summary = {
      success: true,
      total: failedPosts.length,
      succeeded,
      failed,
      permanentlyFailed,
    }

    console.log(`\n📊 Retry complete: ${succeeded} succeeded, ${failed} will retry, ${permanentlyFailed} permanently failed`)

    return new Response(
      JSON.stringify(summary),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Retry failed: ${errorMessage}`)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
