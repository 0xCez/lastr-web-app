/**
 * Discord Set Chatting Status
 * Manually set a user's activity status to "Chatting"
 *
 * Use this when a creator has replied on Discord but hasn't posted yet.
 * This upgrades them from 🔴 No Response to 🟡 Chatting
 *
 * Call with: { "userId": "<user-uuid>" } or { "discordId": "<discord-user-id>" }
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

async function addRole(discordUserId: string, roleId: string): Promise<boolean> {
  if (!roleId) return false

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    }
  )

  return response.ok || response.status === 204
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

  return response.ok || response.status === 204
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, discordId } = await req.json()

    if (!userId && !discordId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Either userId or discordId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find the user
    let query = supabase.from('users').select('id, full_name, discord_id, discord_activity_role')

    if (userId) {
      query = query.eq('id', userId)
    } else {
      query = query.eq('discord_id', discordId)
    }

    const { data: user, error: userError } = await query.single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user.discord_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User has not linked Discord yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if already active (don't demote from active)
    if (user.discord_activity_role === 'active') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User is already Active (has posted). Cannot demote to Chatting.',
          currentRole: 'active'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update Discord roles
    // Remove other activity roles
    if (ROLE_ACTIVE) await removeRole(user.discord_id, ROLE_ACTIVE)
    if (ROLE_NO_RESPONSE) await removeRole(user.discord_id, ROLE_NO_RESPONSE)

    // Add Chatting role
    if (ROLE_CHATTING) {
      await addRole(user.discord_id, ROLE_CHATTING)
    }

    // Update database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        discord_activity_role: 'chatting',
        discord_activity_updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      throw new Error(`Failed to update database: ${updateError.message}`)
    }

    console.log(`✅ Set ${user.full_name} to Chatting status`)

    return new Response(
      JSON.stringify({
        success: true,
        user: user.full_name,
        previousRole: user.discord_activity_role || 'no_response',
        newRole: 'chatting'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error setting chatting status:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
