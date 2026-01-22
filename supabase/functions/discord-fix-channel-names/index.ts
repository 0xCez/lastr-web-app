/**
 * Discord Fix Channel Names
 * Restores the original 「🔐」 prefix to all creator channels
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    console.log('🔧 Fixing Discord channel names (restoring 「🔐」 prefix)...')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all users with Discord channels
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, discord_channel_id, role')
      .in('role', ['ugc_creator', 'account_manager'])
      .eq('application_status', 'approved')
      .not('discord_channel_id', 'is', null)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    console.log(`Found ${users?.length || 0} users with Discord channels`)

    const results = {
      total: users?.length || 0,
      fixed: 0,
      errors: 0,
      details: [] as { name: string; status: string; channelName: string }[]
    }

    for (const user of users || []) {
      // Create the original format: 「🔐」clean-name
      const cleanName = user.full_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 90)

      const channelName = `「🔐」${cleanName}`

      console.log(`Fixing ${user.full_name} -> ${channelName}`)

      try {
        const success = await updateChannelName(user.discord_channel_id, channelName)

        if (success) {
          results.fixed++
          results.details.push({
            name: user.full_name,
            status: 'fixed',
            channelName: channelName
          })
        } else {
          results.errors++
          results.details.push({
            name: user.full_name,
            status: 'failed',
            channelName: channelName
          })
        }

        await delay(500)
      } catch (err) {
        console.error(`Error fixing ${user.full_name}:`, err)
        results.errors++
      }
    }

    console.log('✅ Channel name fix complete:', results)

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Channel name fix failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
