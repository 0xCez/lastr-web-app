import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Permission flags
const VIEW_CHANNEL = 1024n
const SEND_MESSAGES = 2048n
const MENTION_EVERYONE = 131072n

interface PermissionOverwrite {
  id: string
  type: 0 | 1 // 0 = role, 1 = member
  allow: string
  deny: string
}

async function getRoles(guildId: string): Promise<any[]> {
  const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch roles: ${response.status}`)
  }

  return response.json()
}

async function createAnnouncementChannel(
  guildId: string,
  name: string,
  parentId: string | null,
  topic: string,
  permissionOverwrites: PermissionOverwrite[]
): Promise<any> {
  const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      type: 0, // GUILD_TEXT (type 5 requires Community server)
      parent_id: parentId,
      topic,
      permission_overwrites: permissionOverwrites,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create channel ${name}: ${response.status} - ${error}`)
  }

  return response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN is not configured')
    }

    const { guildId, ugcCategoryId, amCategoryId, adminRoleId, ugcRoleId, amRoleId } = await req.json()

    if (!guildId) {
      throw new Error('guildId is required')
    }

    // Fetch all roles to find @everyone role (same ID as guild)
    const roles = await getRoles(guildId)
    const everyoneRoleId = guildId // @everyone role ID is same as guild ID

    const results: any[] = []

    // Create UGC Creators Announcement Channel
    // Permissions: @everyone denied view, admin + UGC role can view
    const ugcPermissions: PermissionOverwrite[] = [
      {
        id: everyoneRoleId,
        type: 0,
        allow: '0',
        deny: VIEW_CHANNEL.toString(), // Deny @everyone from viewing
      },
    ]

    if (adminRoleId) {
      ugcPermissions.push({
        id: adminRoleId,
        type: 0,
        allow: (VIEW_CHANNEL | SEND_MESSAGES | MENTION_EVERYONE).toString(),
        deny: '0',
      })
    }

    if (ugcRoleId) {
      ugcPermissions.push({
        id: ugcRoleId,
        type: 0,
        allow: VIEW_CHANNEL.toString(), // UGC can view but not send
        deny: '0',
      })
    }

    const ugcChannel = await createAnnouncementChannel(
      guildId,
      '「📣」ugc-announcements',
      ugcCategoryId || null,
      'Announcements for UGC Creators',
      ugcPermissions
    )
    results.push({ name: ugcChannel.name, id: ugcChannel.id, for: 'UGC Creators' })

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500))

    // Create Account Managers Announcement Channel
    const amPermissions: PermissionOverwrite[] = [
      {
        id: everyoneRoleId,
        type: 0,
        allow: '0',
        deny: VIEW_CHANNEL.toString(), // Deny @everyone from viewing
      },
    ]

    if (adminRoleId) {
      amPermissions.push({
        id: adminRoleId,
        type: 0,
        allow: (VIEW_CHANNEL | SEND_MESSAGES | MENTION_EVERYONE).toString(),
        deny: '0',
      })
    }

    if (amRoleId) {
      amPermissions.push({
        id: amRoleId,
        type: 0,
        allow: VIEW_CHANNEL.toString(), // AM can view but not send
        deny: '0',
      })
    }

    const amChannel = await createAnnouncementChannel(
      guildId,
      '「📣」am-announcements',
      amCategoryId || null,
      'Announcements for Account Managers',
      amPermissions
    )
    results.push({ name: amChannel.name, id: amChannel.id, for: 'Account Managers' })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Announcement channels created successfully!',
        channels: results,
        note: 'Make sure to pass adminRoleId, ugcRoleId, and amRoleId to set proper permissions. Admins can send messages, others can only view.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error creating announcement channels:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
