/**
 * Discord Update Role Settings
 * Updates the activity roles to be hoisted (displayed separately in member list)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!

// Activity role IDs
const ROLE_ACTIVE = Deno.env.get('DISCORD_ROLE_ACTIVE') || ''
const ROLE_CHATTING = Deno.env.get('DISCORD_ROLE_CHATTING') || ''
const ROLE_NO_RESPONSE = Deno.env.get('DISCORD_ROLE_NO_RESPONSE') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function updateRole(roleId: string, settings: { hoist?: boolean; position?: number }): Promise<any> {
  if (!roleId) return null

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles/${roleId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to update role ${roleId}:`, error)
    return { error }
  }

  return response.json()
}

async function getRoles(): Promise<any[]> {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`,
    {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    }
  )

  if (!response.ok) {
    return []
  }

  return response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🎭 Updating Discord activity role settings...')

    // Get current roles to check positions
    const roles = await getRoles()
    console.log(`Found ${roles.length} roles`)

    const results: any[] = []

    // Update each activity role to be hoisted
    const activityRoles = [
      { id: ROLE_ACTIVE, name: 'Active' },
      { id: ROLE_CHATTING, name: 'Chatting' },
      { id: ROLE_NO_RESPONSE, name: 'No Response' },
    ]

    for (const role of activityRoles) {
      if (!role.id) {
        results.push({ name: role.name, status: 'skipped - no ID configured' })
        continue
      }

      // Find current role info
      const currentRole = roles.find(r => r.id === role.id)
      console.log(`${role.name} role current settings:`, currentRole ? { hoist: currentRole.hoist, position: currentRole.position } : 'not found')

      // Update to ensure hoist is true
      const result = await updateRole(role.id, { hoist: true })

      if (result?.error) {
        results.push({ name: role.name, status: 'error', error: result.error })
      } else {
        results.push({ name: role.name, status: 'updated', hoist: true })
      }

      await new Promise(resolve => setTimeout(resolve, 300))
    }

    console.log('✅ Role settings updated:', results)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        note: 'Roles are now hoisted. Users will appear grouped by their highest activity role in the member list.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Failed to update role settings:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
