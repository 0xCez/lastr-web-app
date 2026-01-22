/**
 * Discord Update Activity Roles
 * Updates Discord roles based on posting activity
 *
 * 3-tier system:
 * - 🟢 Active = has posted at least 1 approved post (ever)
 * - 🟡 Chatting = manually set (replied on Discord but no posts yet)
 * - 🔴 No Response = default (hasn't replied on Discord)
 *
 * This function only auto-promotes to Active when they post.
 * Chatting status must be set manually via discord-set-chatting function.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Activity role IDs (3-tier system)
const ROLE_ACTIVE = Deno.env.get('DISCORD_ROLE_ACTIVE') || ''
const ROLE_CHATTING = Deno.env.get('DISCORD_ROLE_CHATTING') || ''
const ROLE_NO_RESPONSE = Deno.env.get('DISCORD_ROLE_NO_RESPONSE') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ActivityRole = 'active' | 'chatting' | 'no_response'

// Add role to Discord user
async function addRole(discordUserId: string, roleId: string): Promise<boolean> {
  if (!roleId) return false

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    }
  )

  if (!response.ok && response.status !== 204) {
    const error = await response.text()
    console.error(`Failed to add role ${roleId} to user ${discordUserId}:`, error)
    return false
  }
  return true
}

// Remove role from Discord user
async function removeRole(discordUserId: string, roleId: string): Promise<boolean> {
  if (!roleId) return false

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    }
  )

  if (!response.ok && response.status !== 204) {
    const error = await response.text()
    console.error(`Failed to remove role ${roleId} from user ${discordUserId}:`, error)
    return false
  }
  return true
}

// Set activity role (removes other activity roles, adds the correct one)
async function setActivityRole(discordUserId: string, newRole: ActivityRole): Promise<boolean> {
  const roleMap: Record<ActivityRole, string> = {
    active: ROLE_ACTIVE,
    chatting: ROLE_CHATTING,
    no_response: ROLE_NO_RESPONSE,
  }

  // Remove all activity roles first
  for (const [role, roleId] of Object.entries(roleMap)) {
    if (role !== newRole && roleId) {
      await removeRole(discordUserId, roleId)
    }
  }

  // Add the new role
  const newRoleId = roleMap[newRole]
  if (newRoleId) {
    return await addRole(discordUserId, newRoleId)
  }

  return true
}

// Small delay to avoid rate limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🎭 Starting Discord activity role update...')

    // Check if roles are configured
    if (!ROLE_ACTIVE && !ROLE_CHATTING && !ROLE_NO_RESPONSE) {
      console.log('⚠️ No activity roles configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Activity roles not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all UGC creators and Account Managers with Discord linked
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, discord_id, discord_activity_role, role')
      .in('role', ['ugc_creator', 'account_manager'])
      .eq('application_status', 'approved')
      .not('discord_id', 'is', null)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      console.log('No users with Discord linked found')
      return new Response(
        JSON.stringify({ success: true, processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`👥 Found ${users.length} users with Discord linked`)

    // Get users who have at least 1 approved post (ever)
    const userIds = users.map(u => u.id)
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('submitted_by')
      .eq('status', 'approved')
      .in('submitted_by', userIds)

    if (postsError) {
      throw new Error(`Failed to fetch posts: ${postsError.message}`)
    }

    // Get unique user IDs who have posted
    const usersWithPosts = new Set((postsData || []).map(p => p.submitted_by))

    console.log(`📝 ${usersWithPosts.size} users have posted at least once`)

    // Process each user
    const results = {
      total: users.length,
      active: 0,
      chatting: 0,
      no_response: 0,
      unchanged: 0,
      errors: 0,
      updates: [] as { name: string; role: string; from: string; to: string }[]
    }

    for (const user of users) {
      const hasPosted = usersWithPosts.has(user.id)
      const currentRole = (user.discord_activity_role as ActivityRole) || 'no_response'

      // Determine new role:
      // - If they've posted → active
      // - If currently chatting and haven't posted → stay chatting
      // - Otherwise → no_response
      let newRole: ActivityRole
      if (hasPosted) {
        newRole = 'active'
      } else if (currentRole === 'chatting') {
        // Don't demote from chatting - that's manually set
        newRole = 'chatting'
      } else {
        newRole = 'no_response'
      }

      console.log(`📋 ${user.full_name} (${user.role}): hasPosted=${hasPosted}, current=${currentRole}, new=${newRole}`)

      // Skip if role hasn't changed
      if (currentRole === newRole) {
        results.unchanged++
        if (newRole === 'active') results.active++
        else if (newRole === 'chatting') results.chatting++
        else results.no_response++
        continue
      }

      try {
        // Update Discord roles
        await setActivityRole(user.discord_id, newRole)

        // Update database
        await supabase
          .from('users')
          .update({
            discord_activity_role: newRole,
            discord_activity_updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        results.updates.push({
          name: user.full_name,
          role: user.role,
          from: currentRole,
          to: newRole
        })

        if (newRole === 'active') results.active++
        else if (newRole === 'chatting') results.chatting++
        else results.no_response++

        // Small delay to avoid rate limits
        await delay(100)
      } catch (err) {
        console.error(`Error updating ${user.full_name}:`, err)
        results.errors++
      }
    }

    console.log('✅ Activity role update complete:', results)

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Activity role update failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
