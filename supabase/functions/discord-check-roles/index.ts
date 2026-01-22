/**
 * Discord Check Roles - Debug function to see current role state
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get all roles
    const rolesResponse = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/roles`,
      {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      }
    )

    if (!rolesResponse.ok) {
      const error = await rolesResponse.text()
      throw new Error(`Failed to get roles: ${error}`)
    }

    const roles = await rolesResponse.json()

    // Get guild members to check their roles
    const membersResponse = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members?limit=100`,
      {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      }
    )

    let members: any[] = []
    if (membersResponse.ok) {
      members = await membersResponse.json()
    }

    // Sort roles by position (highest first)
    const sortedRoles = roles.sort((a: any, b: any) => b.position - a.position)

    // Find activity roles
    const activityRoleNames = ['🟢 Active', '🟡 Chatting', '🔴 No Response']
    const activityRoles = sortedRoles.filter((r: any) => activityRoleNames.includes(r.name))

    // Check which members have which roles
    const membersByActivityRole: Record<string, string[]> = {
      '🟢 Active': [],
      '🟡 Chatting': [],
      '🔴 No Response': [],
      'None': []
    }

    for (const member of members) {
      const memberRoleIds = member.roles || []
      let foundActivity = false

      for (const activityRole of activityRoles) {
        if (memberRoleIds.includes(activityRole.id)) {
          const displayName = member.nick || member.user?.global_name || member.user?.username
          membersByActivityRole[activityRole.name].push(displayName)
          foundActivity = true
          break
        }
      }

      if (!foundActivity && member.user && !member.user.bot) {
        const displayName = member.nick || member.user?.global_name || member.user?.username
        membersByActivityRole['None'].push(displayName)
      }
    }

    return new Response(
      JSON.stringify({
        allRoles: sortedRoles.map((r: any) => ({
          name: r.name,
          id: r.id,
          position: r.position,
          hoist: r.hoist,
          color: r.color
        })),
        activityRoles: activityRoles.map((r: any) => ({
          name: r.name,
          id: r.id,
          position: r.position,
          hoist: r.hoist
        })),
        membersByActivityRole,
        totalMembers: members.length
      }, null, 2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
