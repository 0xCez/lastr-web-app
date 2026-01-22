/**
 * Discord Remove Activity Roles
 * Removes all activity roles from all users and deletes the roles from the server
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!

const ROLE_ACTIVE = Deno.env.get('DISCORD_ROLE_ACTIVE') || ''
const ROLE_CHATTING = Deno.env.get('DISCORD_ROLE_CHATTING') || ''
const ROLE_NO_RESPONSE = Deno.env.get('DISCORD_ROLE_NO_RESPONSE') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function deleteRole(roleId: string): Promise<boolean> {
  if (!roleId) return false

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles/${roleId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
    }
  )

  if (!response.ok && response.status !== 204) {
    const error = await response.text()
    console.error(`Failed to delete role ${roleId}:`, error)
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
    console.log('🗑️ Removing activity roles from Discord server...')

    const rolesToDelete = [
      { id: ROLE_ACTIVE, name: 'Active' },
      { id: ROLE_CHATTING, name: 'Chatting' },
      { id: ROLE_NO_RESPONSE, name: 'No Response' },
    ]

    const results: { name: string; status: string }[] = []

    for (const role of rolesToDelete) {
      if (!role.id) {
        results.push({ name: role.name, status: 'skipped - no ID' })
        continue
      }

      console.log(`Deleting role: ${role.name} (${role.id})`)

      const success = await deleteRole(role.id)
      results.push({
        name: role.name,
        status: success ? 'deleted' : 'failed'
      })

      await delay(500)
    }

    console.log('✅ Activity roles removed:', results)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        note: 'Activity roles have been deleted from the Discord server. Remember to remove the DISCORD_ROLE_ACTIVE, DISCORD_ROLE_CHATTING, and DISCORD_ROLE_NO_RESPONSE secrets from Supabase.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Failed to remove activity roles:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
