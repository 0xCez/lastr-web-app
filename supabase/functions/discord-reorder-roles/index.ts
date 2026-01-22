/**
 * Discord Reorder Roles
 * Moves activity roles above other roles so they display in the member list
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!

// Activity role IDs (should be ordered highest to lowest)
const ROLE_ACTIVE = Deno.env.get('DISCORD_ROLE_ACTIVE') || ''
const ROLE_CHATTING = Deno.env.get('DISCORD_ROLE_CHATTING') || ''
const ROLE_NO_RESPONSE = Deno.env.get('DISCORD_ROLE_NO_RESPONSE') || ''

// Other role IDs (these should be below activity roles)
const ROLE_UGC_CREATOR = Deno.env.get('DISCORD_ROLE_UGC_CREATOR') || ''
const ROLE_ACCOUNT_MANAGER = Deno.env.get('DISCORD_ROLE_ACCOUNT_MANAGER') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const error = await response.text()
    throw new Error(`Failed to get roles: ${error}`)
  }

  return response.json()
}

async function reorderRoles(rolePositions: { id: string; position: number }[]): Promise<any> {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rolePositions),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to reorder roles: ${error}`)
  }

  return response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🎭 Reordering Discord roles...')

    // Get current roles
    const roles = await getRoles()
    console.log('Current roles:')
    roles
      .sort((a, b) => b.position - a.position)
      .forEach(r => console.log(`  ${r.position}: ${r.name} (${r.id})`))

    // Find the bot's role to know the max position we can use
    // The bot can only move roles below its own role
    const botRole = roles.find(r => r.managed && r.tags?.bot_id)
    const maxPosition = botRole ? botRole.position - 1 : 10

    console.log(`Bot role position: ${botRole?.position}, max usable position: ${maxPosition}`)

    // Find current positions
    const activeRole = roles.find(r => r.id === ROLE_ACTIVE)
    const chattingRole = roles.find(r => r.id === ROLE_CHATTING)
    const noResponseRole = roles.find(r => r.id === ROLE_NO_RESPONSE)
    const ugcRole = roles.find(r => r.id === ROLE_UGC_CREATOR)
    const amRole = roles.find(r => r.id === ROLE_ACCOUNT_MANAGER)

    console.log('\nTarget roles found:')
    console.log(`  Active: ${activeRole?.name} at position ${activeRole?.position}`)
    console.log(`  Chatting: ${chattingRole?.name} at position ${chattingRole?.position}`)
    console.log(`  No Response: ${noResponseRole?.name} at position ${noResponseRole?.position}`)
    console.log(`  UGC Creator: ${ugcRole?.name} at position ${ugcRole?.position}`)
    console.log(`  Account Manager: ${amRole?.name} at position ${amRole?.position}`)

    // Calculate new positions
    // Activity roles should be higher than UGC/AM roles
    // Order: Active (highest) > Chatting > No Response > UGC Creator > Account Manager
    const basePosition = Math.max(
      ugcRole?.position || 1,
      amRole?.position || 1
    )

    const newPositions: { id: string; position: number }[] = []

    // Activity roles go above the base position
    if (ROLE_ACTIVE) {
      newPositions.push({ id: ROLE_ACTIVE, position: basePosition + 3 })
    }
    if (ROLE_CHATTING) {
      newPositions.push({ id: ROLE_CHATTING, position: basePosition + 2 })
    }
    if (ROLE_NO_RESPONSE) {
      newPositions.push({ id: ROLE_NO_RESPONSE, position: basePosition + 1 })
    }

    console.log('\nNew positions:', newPositions)

    // Apply new positions
    const result = await reorderRoles(newPositions)

    // Get updated roles
    const updatedRoles = await getRoles()
    console.log('\nUpdated roles:')
    updatedRoles
      .sort((a, b) => b.position - a.position)
      .slice(0, 15)
      .forEach(r => console.log(`  ${r.position}: ${r.name}`))

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Activity roles moved above UGC/AM roles',
        newOrder: updatedRoles
          .sort((a, b) => b.position - a.position)
          .slice(0, 10)
          .map(r => ({ name: r.name, position: r.position }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Failed to reorder roles:', error)
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
