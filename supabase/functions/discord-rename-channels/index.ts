import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Channel naming convention mapping
const CHANNEL_RENAMES: Record<string, string> = {
  // Categories
  'Text Channels': '「📋」Info',
  'UGC-Creators': '「🎬」Creators',
  'Account-Managers': '「💼」Managers',
  'Voice Channels': '「🎙️」Voice',

  // Public channels
  'welcome-and-rules': '「👋」welcome',
  'announcements': '「📢」announcements',
  'content-rules': '「📜」content-rules',
  'new-content-ideas': '「💡」content-ideas',
  'referral-program': '「🎁」referrals',
  'replays-ready-games': '「🎮」replays',
  'submitted-posts': '「📤」submitted-posts',
  'admin-channel': '「🔒」admin',
  'private-channel-template': '「📝」channel-template',
  'sacha_cez': '「🔐」sacha-cez',

  // Voice
  'General': '「🎙️」general',
}

// For private channels, we use a pattern
function getNewChannelName(currentName: string): string | null {
  // Check direct mapping first
  if (CHANNEL_RENAMES[currentName]) {
    return CHANNEL_RENAMES[currentName]
  }

  // Handle private channels: {name}-private -> 「🔐」{name}
  if (currentName.endsWith('-private')) {
    const name = currentName.replace('-private', '')
    return `「🔐」${name}`
  }

  return null // No rename needed
}

async function renameChannel(channelId: string, newName: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: newName }),
  })

  if (!response.ok) {
    const error = await response.text()
    return { success: false, error: `${response.status}: ${error}` }
  }

  return { success: true }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN is not configured')
    }

    const { guildId, dryRun = true } = await req.json()

    if (!guildId) {
      throw new Error('guildId is required')
    }

    // Fetch all channels
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch channels: ${response.status} - ${error}`)
    }

    const channels = await response.json()
    const results: Array<{ id: string; oldName: string; newName: string; status: string; error?: string }> = []

    for (const channel of channels) {
      const newName = getNewChannelName(channel.name)

      if (newName && newName !== channel.name) {
        if (dryRun) {
          results.push({
            id: channel.id,
            oldName: channel.name,
            newName,
            status: 'would_rename',
          })
        } else {
          // Rate limit: Discord allows 2 channel updates per 10 minutes per channel
          // But we can do multiple channels, just need small delays
          await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay between renames

          const renameResult = await renameChannel(channel.id, newName)
          results.push({
            id: channel.id,
            oldName: channel.name,
            newName,
            status: renameResult.success ? 'renamed' : 'failed',
            error: renameResult.error,
          })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        message: dryRun ? 'Dry run complete. Set dryRun: false to apply changes.' : 'Rename complete.',
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error renaming channels:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
