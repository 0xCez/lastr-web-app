/**
 * Discord Create Categories
 * Creates new channel categories and moves active creators to them
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a category channel
async function createCategory(name: string): Promise<string | null> {
  const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      type: 4, // Category type
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to create category "${name}": ${error}`)
    return null
  }

  const channel = await response.json()
  console.log(`Created category "${name}" with ID: ${channel.id}`)
  return channel.id
}

// Move a channel to a category
async function moveChannelToCategory(channelId: string, categoryId: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent_id: categoryId,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to move channel ${channelId}: ${error}`)
    return { success: false, error }
  }

  return { success: true }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { action } = body

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Action: create - Create the two new categories
    if (action === 'create') {
      console.log('Creating Active UGC Creators and Active AMs categories...')

      const activeUgcCategoryId = await createCategory('✅ Active UGC Creators')
      const activeAmCategoryId = await createCategory('✅ Active AMs')

      return new Response(
        JSON.stringify({
          success: true,
          categories: {
            activeUgc: activeUgcCategoryId,
            activeAm: activeAmCategoryId,
          },
          note: 'Save these IDs! Add them to Supabase secrets as DISCORD_ACTIVE_UGC_CATEGORY_ID and DISCORD_ACTIVE_AM_CATEGORY_ID'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Action: move-single - Move a single channel to a category
    if (action === 'move-single') {
      const { channelId, categoryId } = body
      if (!channelId || !categoryId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Provide channelId and categoryId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const result = await moveChannelToCategory(channelId, categoryId)
      return new Response(
        JSON.stringify({ ...result, channelId, categoryId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Action: move - Move active creators to the new categories
    if (action === 'move') {
      const { activeUgcCategoryId, activeAmCategoryId } = body

      if (!activeUgcCategoryId || !activeAmCategoryId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Provide activeUgcCategoryId and activeAmCategoryId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Find all users who have at least 1 approved post
      const { data: activeCreators, error: creatorsError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          role,
          discord_channel_id
        `)
        .in('role', ['ugc_creator', 'account_manager'])
        .not('discord_channel_id', 'is', null)
        .is('deleted_at', null)

      if (creatorsError) {
        throw new Error(`Failed to fetch users: ${creatorsError.message}`)
      }

      // Get post counts for each user (posts use submitted_by, not user_id)
      const { data: postCounts, error: postError } = await supabase
        .from('posts')
        .select('submitted_by')
        .eq('status', 'approved')

      if (postError) {
        throw new Error(`Failed to fetch posts: ${postError.message}`)
      }

      // Count posts per user
      const postsPerUser: Record<string, number> = {}
      for (const post of postCounts || []) {
        postsPerUser[post.submitted_by] = (postsPerUser[post.submitted_by] || 0) + 1
      }

      // Filter to only users with at least 1 post
      const usersWithPosts = (activeCreators || []).filter(u => (postsPerUser[u.id] || 0) >= 1)

      console.log(`Found ${usersWithPosts.length} active creators with posts`)

      const results = {
        ugcMoved: 0,
        amMoved: 0,
        errors: 0,
        details: [] as { name: string; role: string; status: string }[]
      }

      for (const user of usersWithPosts) {
        const targetCategory = user.role === 'ugc_creator' ? activeUgcCategoryId : activeAmCategoryId

        console.log(`Moving ${user.full_name} (${user.role}) to active category`)

        const moveResult = await moveChannelToCategory(user.discord_channel_id, targetCategory)

        if (moveResult.success) {
          if (user.role === 'ugc_creator') {
            results.ugcMoved++
          } else {
            results.amMoved++
          }
          results.details.push({ name: user.full_name, role: user.role, status: 'moved' })
        } else {
          results.errors++
          results.details.push({ name: user.full_name, role: user.role, status: 'failed' })
        }

        await delay(500) // Rate limit protection
      }

      return new Response(
        JSON.stringify({ success: true, ...results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Default: list active creators
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, role, discord_channel_id')
      .in('role', ['ugc_creator', 'account_manager'])
      .not('discord_channel_id', 'is', null)
      .is('deleted_at', null)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    // Get ALL posts to debug (posts use submitted_by, not user_id)
    const { data: allPosts, error: postError } = await supabase
      .from('posts')
      .select('submitted_by, status')

    console.log(`Total posts in DB: ${allPosts?.length || 0}`)
    console.log(`Post statuses: ${JSON.stringify([...new Set(allPosts?.map(p => p.status))])}`)

    const approvedPosts = (allPosts || []).filter(p => p.status === 'approved')
    console.log(`Approved posts: ${approvedPosts.length}`)

    const postsPerUser: Record<string, number> = {}
    for (const post of approvedPosts) {
      postsPerUser[post.submitted_by] = (postsPerUser[post.submitted_by] || 0) + 1
    }

    const activeUsers = (users || [])
      .map(u => ({
        ...u,
        postCount: postsPerUser[u.id] || 0
      }))
      .filter(u => u.postCount >= 1)
      .sort((a, b) => b.postCount - a.postCount)

    return new Response(
      JSON.stringify({
        totalWithDiscord: users?.length || 0,
        totalPosts: allPosts?.length || 0,
        approvedPosts: approvedPosts.length,
        postStatuses: [...new Set(allPosts?.map(p => p.status))],
        activeWithPosts: activeUsers.length,
        ugcActive: activeUsers.filter(u => u.role === 'ugc_creator').length,
        amActive: activeUsers.filter(u => u.role === 'account_manager').length,
        users: activeUsers
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
