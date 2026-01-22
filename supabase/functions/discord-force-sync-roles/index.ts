/**
 * Discord Force Sync Roles
 * Forces assignment of activity roles to ALL users based on their database status
 * Use this when Discord roles are out of sync with database
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Activity role IDs
const ROLE_ACTIVE = Deno.env.get('DISCORD_ROLE_ACTIVE') || ''
const ROLE_CHATTING = Deno.env.get('DISCORD_ROLE_CHATTING') || ''
const ROLE_NO_RESPONSE = Deno.env.get('DISCORD_ROLE_NO_RESPONSE') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type ActivityRole = 'active' | 'chatting' | 'no_response'

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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔄 Force syncing Discord activity roles...')

    const roleMap: Record<ActivityRole, string> = {
      active: ROLE_ACTIVE,
      chatting: ROLE_CHATTING,
      no_response: ROLE_NO_RESPONSE,
    }

    console.log('Role IDs:', roleMap)

    if (!ROLE_ACTIVE && !ROLE_CHATTING && !ROLE_NO_RESPONSE) {
      return new Response(
        JSON.stringify({ success: false, error: 'No activity roles configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all users with Discord linked
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, discord_id, discord_activity_role, role')
      .in('role', ['ugc_creator', 'account_manager'])
      .eq('application_status', 'approved')
      .not('discord_id', 'is', null)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    console.log(`Found ${users?.length || 0} users to sync`)

    const results = {
      total: users?.length || 0,
      synced: 0,
      errors: 0,
      details: [] as { name: string; status: string; role: string }[]
    }

    for (const user of users || []) {
      const activityRole = (user.discord_activity_role as ActivityRole) || 'no_response'
      const targetRoleId = roleMap[activityRole]

      console.log(`Syncing ${user.full_name}: ${activityRole} -> ${targetRoleId}`)

      try {
        // Remove all activity roles first
        for (const [role, roleId] of Object.entries(roleMap)) {
          if (roleId && role !== activityRole) {
            await removeRole(user.discord_id, roleId)
            await delay(50)
          }
        }

        // Add the correct role
        if (targetRoleId) {
          const success = await addRole(user.discord_id, targetRoleId)
          if (success) {
            results.synced++
            results.details.push({ name: user.full_name, status: 'synced', role: activityRole })
          } else {
            results.errors++
            results.details.push({ name: user.full_name, status: 'failed', role: activityRole })
          }
        }

        await delay(100) // Rate limit protection
      } catch (err) {
        console.error(`Error syncing ${user.full_name}:`, err)
        results.errors++
        results.details.push({ name: user.full_name, status: 'error', role: activityRole })
      }
    }

    console.log('✅ Force sync complete:', { synced: results.synced, errors: results.errors })

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Force sync failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
