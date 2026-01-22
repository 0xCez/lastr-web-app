import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN is not configured')
    }

    const { guildId } = await req.json()

    if (!guildId) {
      throw new Error('guildId is required')
    }

    // Fetch all channels from the guild
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Discord API error: ${response.status} - ${error}`)
    }

    const channels = await response.json()

    // Sort by position and type for readability
    const sortedChannels = channels.sort((a: any, b: any) => {
      if (a.type !== b.type) return a.type - b.type
      return a.position - b.position
    })

    // Format for easy reading
    const formatted = sortedChannels.map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      type: ch.type, // 0=text, 2=voice, 4=category, 5=announcement, 13=stage, 15=forum
      parentId: ch.parent_id,
      position: ch.position,
    }))

    return new Response(
      JSON.stringify({ success: true, channels: formatted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error listing channels:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
