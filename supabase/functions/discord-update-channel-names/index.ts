/**
 * Discord Update Channel Names
 * Adds activity status emoji prefix to channel names
 *
 * 🟢 = Active (has posted)
 * 🟡 = Chatting (replied but no posts)
 * 🔴 = No Response (hasn't replied)
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

const STATUS_EMOJIS: Record<string, string> = {
  active: '🟢',
  chatting: '🟡',
  no_response: '🔴',
}

// Remove any existing status emoji from channel name
function cleanChannelName(name: string): string {
  return name.replace(/^[🟢🟡🔴]-?/, '').trim()
}

// Update a Discord channel's name
async function updateChannelName(channelId: string, newName: string): Promise<boolean> {
  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to update channel ${channelId}:`, error)
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
    console.log('📝 Updating Discord channel names with activity status...')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all users with Discord channels
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, discord_channel_id, discord_activity_role, role')
      .in('role', ['ugc_creator', 'account_manager'])
      .eq('application_status', 'approved')
      .not('discord_channel_id', 'is', null)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    console.log(`Found ${users?.length || 0} users with Discord channels`)

    const results = {
      total: users?.length || 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as { name: string; status: string; channelName: string }[]
    }

    for (const user of users || []) {
      const activityRole = user.discord_activity_role || 'no_response'
      const emoji = STATUS_EMOJIS[activityRole] || '🔴'

      // Create clean base name from user's full name
      // Discord channel names: lowercase, no spaces, max 100 chars
      const baseName = user.full_name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 90)

      const newChannelName = `${emoji}-${baseName}`

      console.log(`${user.full_name}: ${activityRole} -> ${newChannelName}`)

      try {
        const success = await updateChannelName(user.discord_channel_id, newChannelName)

        if (success) {
          results.updated++
          results.details.push({
            name: user.full_name,
            status: 'updated',
            channelName: newChannelName
          })
        } else {
          results.errors++
          results.details.push({
            name: user.full_name,
            status: 'failed',
            channelName: newChannelName
          })
        }

        // Discord rate limit: 2 channel updates per 10 minutes per channel
        // But we're updating different channels, so just need general rate limit protection
        await delay(500)
      } catch (err) {
        console.error(`Error updating ${user.full_name}:`, err)
        results.errors++
      }
    }

    console.log('✅ Channel name update complete:', results)

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Channel name update failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
