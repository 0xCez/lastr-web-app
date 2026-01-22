/**
 * Debug function to check posts table access
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Try to count posts
    const { count: postCount, error: countError } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })

    // Try to get a few posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, user_id, status, platform')
      .limit(5)

    // Get distinct statuses
    const { data: statuses, error: statusError } = await supabase
      .from('posts')
      .select('status')

    const uniqueStatuses = [...new Set((statuses || []).map(s => s.status))]

    // Get users with posts
    const { data: usersWithPosts, error: usersError } = await supabase
      .rpc('get_users_with_post_count')
      .limit(10)

    return new Response(
      JSON.stringify({
        postCount,
        countError: countError?.message,
        samplePosts: posts,
        postsError: postsError?.message,
        uniqueStatuses,
        statusError: statusError?.message,
        usersWithPosts,
        usersError: usersError?.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
