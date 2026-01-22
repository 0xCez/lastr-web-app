/**
 * Discord Create Activity Roles
 * One-time setup function to create the 3 activity status roles
 *
 * Creates:
 * - 🟢 Active (green) - has posted at least once
 * - 🟡 Chatting (yellow) - replied on Discord but hasn't posted
 * - 🔴 No Response (red) - hasn't replied on Discord yet
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Discord color integers (decimal format)
const COLORS = {
  GREEN: 5763719,   // #57F287 - Discord green
  YELLOW: 16776960, // #FFFF00 - Yellow
  RED: 15548997,    // #ED4245 - Discord red
}

interface CreateRoleParams {
  name: string
  color: number
  hoist?: boolean  // Show separately in member list
  mentionable?: boolean
}

async function createRole(params: CreateRoleParams): Promise<{ id: string; name: string } | null> {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: params.name,
        color: params.color,
        hoist: params.hoist ?? true,  // Show separately by default
        mentionable: params.mentionable ?? false,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to create role ${params.name}:`, error)
    return null
  }

  const role = await response.json()
  return { id: role.id, name: role.name }
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
    console.log('🎭 Creating Discord activity roles...')

    if (!DISCORD_BOT_TOKEN || !DISCORD_GUILD_ID) {
      throw new Error('DISCORD_BOT_TOKEN and DISCORD_GUILD_ID must be configured')
    }

    // Check if roles already exist
    const existingRoles = await getRoles()
    const existingNames = existingRoles.map(r => r.name)

    const rolesToCreate = [
      { name: '🟢 Active', color: COLORS.GREEN },
      { name: '🟡 Chatting', color: COLORS.YELLOW },
      { name: '🔴 No Response', color: COLORS.RED },
    ]

    const results: { name: string; id: string; status: string }[] = []

    for (const roleConfig of rolesToCreate) {
      // Check if already exists
      const existing = existingRoles.find(r => r.name === roleConfig.name)
      if (existing) {
        console.log(`⏭️ Role "${roleConfig.name}" already exists with ID: ${existing.id}`)
        results.push({
          name: roleConfig.name,
          id: existing.id,
          status: 'already_exists'
        })
        continue
      }

      // Create the role
      const created = await createRole(roleConfig)
      if (created) {
        console.log(`✅ Created role "${created.name}" with ID: ${created.id}`)
        results.push({
          name: created.name,
          id: created.id,
          status: 'created'
        })
      } else {
        results.push({
          name: roleConfig.name,
          id: '',
          status: 'failed'
        })
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('🎉 Activity roles setup complete!')
    console.log('')
    console.log('📋 Add these to your Supabase secrets:')
    results.forEach(r => {
      if (r.id) {
        const envKey = r.name.includes('Active') ? 'DISCORD_ROLE_ACTIVE' :
                       r.name.includes('Chatting') ? 'DISCORD_ROLE_CHATTING' :
                       'DISCORD_ROLE_NO_RESPONSE'
        console.log(`${envKey}=${r.id}`)
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        roles: results,
        instructions: 'Add the role IDs to your Supabase secrets as shown in the logs'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Failed to create activity roles:', error)
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
