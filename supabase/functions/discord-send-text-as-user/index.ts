/**
 * Discord Send Text as User (Self-bot)
 * Sends a text message FROM YOUR ACCOUNT to Discord channels
 * Used for personalized welcome messages to new UGC creators
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_USER_TOKEN = Deno.env.get('DISCORD_USER_TOKEN')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendTextAsUser(
  channelId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://discord.com/api/v10/channels/${channelId}/messages`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: DISCORD_USER_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Failed to send: ${response.status}`, error)
      return { success: false, error: `${response.status}: ${error}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { channelId, discordUserId, userName } = body

    if (!channelId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing channelId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!DISCORD_USER_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: 'DISCORD_USER_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract first name from full name for personalization
    const firstName = userName?.split(' ')[0] || 'there'

    // Build the welcome message with Discord mention
    const greeting = discordUserId ? `<@${discordUserId}>` : firstName

    const message = `Hey ${greeting}

Great to meet u i'm cesar one of the co-founders of Bet.AI.

Please - start by creating your TT & IG accounts.

For TT: "${firstName.toLowerCase()}.bai"

For IG: "${firstName.toLowerCase()}.betai"

Then you can simply download the app here: https://testflight.apple.com/join/D824t57J

Warm up the accs for 24h and then you'll be ready to start posting!!! :)`

    console.log(`Sending welcome text to channel ${channelId} for ${userName || 'unknown'}`)

    const result = await sendTextAsUser(channelId, message)

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: `Welcome text sent to ${userName || channelId}`, channelId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
