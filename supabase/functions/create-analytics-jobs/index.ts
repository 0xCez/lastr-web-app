import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =============================================================================
// ORCHESTRATOR: CREATE ANALYTICS JOBS
// =============================================================================
//
// This function runs once daily (midnight UTC) via pg_cron.
// It queries all posts that need analytics and creates batched jobs
// for the worker functions to process.
//
// Flow:
// 1. Query all approved posts within 4-week CPM window
// 2. Chunk into batches of BATCH_SIZE posts
// 3. Insert one job per batch into analytics_jobs table
// 4. Return summary
//
// Execution time: < 10 seconds (just database operations)
//
// =============================================================================

const BATCH_SIZE = 30  // Posts per job (15 parallel × 2 rounds = ~60-90s per job)
const CPM_WINDOW_DAYS = 28  // Only fetch analytics for posts within 4-week window

interface OrchestratorResult {
  success: boolean
  totalPosts: number
  jobsCreated: number
  batchSize: number
  triggeredBy: string
  runDate: string
  startBatchNumber?: number  // Starting batch number for polling
  error?: string
  message?: string
}

serve(async (req): Promise<Response> => {
  const startTime = Date.now()
  console.log('🚀 Orchestrator: create-analytics-jobs started')

  // Handle CORS preflight
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
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Parse request body for optional parameters
    let triggeredBy = 'cron'
    let accountIds: string[] | undefined
    try {
      const body = await req.json()
      triggeredBy = body?.triggeredBy || 'cron'
      accountIds = body?.accountIds  // Optional: filter to specific accounts
    } catch {
      // No body or invalid JSON - use defaults
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const runDate = today.toISOString().split('T')[0]

    // Calculate cutoff date for CPM window
    const cutoffDate = new Date(today)
    cutoffDate.setDate(cutoffDate.getDate() - CPM_WINDOW_DAYS)

    console.log(`📅 Run date: ${runDate}`)
    console.log(`📊 Fetching approved posts from ${cutoffDate.toISOString().split('T')[0]} to today`)

    // =========================================================================
    // STEP 1: Check existing jobs for today
    // =========================================================================
    // For cron: skip if cron jobs already exist (prevent double daily runs)
    // For manual: skip if manual jobs are still processing (prevent waste)
    //             allow if all manual jobs are completed (fetch new posts)
    const { data: existingJobs, error: checkError } = await supabase
      .from('analytics_jobs')
      .select('id, status, triggered_by')
      .eq('run_date', runDate)
      .eq('triggered_by', triggeredBy)

    if (checkError) {
      throw new Error(`Failed to check existing jobs: ${checkError.message}`)
    }

    // Get max batch number for this trigger type today (for offset if we allow new jobs)
    let batchOffset = 0

    if (existingJobs && existingJobs.length > 0) {
      if (triggeredBy === 'cron') {
        // Cron: never allow duplicates
        console.log(`⚠️ Cron jobs already exist for ${runDate}. Skipping.`)
        return new Response(
          JSON.stringify({
            success: true,
            totalPosts: 0,
            jobsCreated: 0,
            batchSize: BATCH_SIZE,
            triggeredBy,
            runDate,
            message: 'Cron jobs already exist for today. Skipping to prevent duplicates.'
          } as OrchestratorResult),
          { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        )
      } else {
        // Manual: check if any are still pending/processing
        const inProgress = existingJobs.filter(j => j.status === 'pending' || j.status === 'processing')
        if (inProgress.length > 0) {
          console.log(`⚠️ ${inProgress.length} manual jobs still in progress. Please wait.`)
          return new Response(
            JSON.stringify({
              success: true,
              totalPosts: 0,
              jobsCreated: 0,
              batchSize: BATCH_SIZE,
              triggeredBy,
              runDate,
              message: `${inProgress.length} analytics job${inProgress.length > 1 ? 's' : ''} still processing. Please wait a few minutes and try again.`
            } as OrchestratorResult),
            { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
          )
        }
        // All previous manual jobs completed - allow creating new ones
        // Use offset to avoid unique constraint on (run_date, batch_number, triggered_by)
        batchOffset = existingJobs.length
        console.log(`✅ Previous ${existingJobs.length} manual jobs completed. Creating new batch set with offset ${batchOffset}.`)
      }
    }

    // =========================================================================
    // STEP 2: Query all posts that need analytics
    // =========================================================================
    let query = supabase
      .from('posts')
      .select('id')
      .eq('status', 'approved')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: true })  // Oldest first for fair processing

    // Apply optional account filter
    if (accountIds && accountIds.length > 0) {
      query = query.in('account_id', accountIds)
    }

    const { data: posts, error: postsError } = await query

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`)
    }

    if (!posts || posts.length === 0) {
      console.log('📭 No posts found that need analytics')
      return new Response(
        JSON.stringify({
          success: true,
          totalPosts: 0,
          jobsCreated: 0,
          batchSize: BATCH_SIZE,
          triggeredBy,
          runDate,
          message: 'No posts found within CPM window'
        } as OrchestratorResult),
        { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      )
    }

    console.log(`📦 Found ${posts.length} posts to process`)

    // =========================================================================
    // STEP 3: Chunk posts into batches
    // =========================================================================
    const postIds = posts.map(p => p.id)
    const batches: string[][] = []

    for (let i = 0; i < postIds.length; i += BATCH_SIZE) {
      batches.push(postIds.slice(i, i + BATCH_SIZE))
    }

    console.log(`📋 Created ${batches.length} batches of up to ${BATCH_SIZE} posts each`)

    // =========================================================================
    // STEP 4: Insert jobs into analytics_jobs table
    // =========================================================================
    const jobsToInsert = batches.map((batchPostIds, index) => ({
      post_ids: batchPostIds,
      batch_number: batchOffset + index + 1,  // Offset to avoid unique constraint violation
      total_batches: batches.length,
      status: 'pending',
      triggered_by: triggeredBy,
      run_date: runDate,
    }))

    const { error: insertError } = await supabase
      .from('analytics_jobs')
      .insert(jobsToInsert)

    if (insertError) {
      throw new Error(`Failed to insert jobs: ${insertError.message}`)
    }

    const duration = Date.now() - startTime
    console.log(`✅ Orchestrator complete: ${batches.length} jobs created in ${duration}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        totalPosts: posts.length,
        jobsCreated: batches.length,
        batchSize: BATCH_SIZE,
        triggeredBy,
        runDate,
        startBatchNumber: batchOffset + 1,  // First batch number we created
      } as OrchestratorResult),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Orchestrator error:', errorMessage)
    return new Response(
      JSON.stringify({
        success: false,
        totalPosts: 0,
        jobsCreated: 0,
        batchSize: BATCH_SIZE,
        triggeredBy: 'cron',
        runDate: new Date().toISOString().split('T')[0],
        error: errorMessage,
      } as OrchestratorResult),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
})
