/**
 * Discord Send Text as User (Self-bot)
 * Sends a text message FROM YOUR ACCOUNT to Discord channels
 * Used for personalized welcome messages to new UGC creators
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_USER_TOKEN = Deno.env.get('DISCORD_USER_TOKEN')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function generateTikTokNames(): Promise<{ name1: string; name2: string }> {
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not found, using fallback names')
    // Fallback names if GPT fails
    const fallbackNames = ['jake', 'tyler', 'noah', 'mason', 'ethan', 'carter', 'logan', 'lucas', 'owen', 'kai']
    const name1 = fallbackNames[Math.floor(Math.random() * fallbackNames.length)]
    let name2 = fallbackNames[Math.floor(Math.random() * fallbackNames.length)]
    while (name2 === name1) {
      name2 = fallbackNames[Math.floor(Math.random() * fallbackNames.length)]
    }
    return { name1, name2 }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You generate TikTok account names for Gen Z American men aged 20-25. Return ONLY a JSON object with two different lowercase first names. No markdown, no explanation.'
          },
          {
            role: 'user',
            content: 'Generate 2 different typical Gen Z American male first names (age 20-25). Return as JSON: {"name1": "...", "name2": "..."}'
          }
        ],
        temperature: 1.0,
        max_tokens: 50,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content?.trim()

    if (content) {
      const parsed = JSON.parse(content)
      return {
        name1: parsed.name1.toLowerCase(),
        name2: parsed.name2.toLowerCase()
      }
    }

    throw new Error('No content from GPT')
  } catch (error) {
    console.error('GPT name generation failed:', error)
    // Fallback
    const fallbackNames = ['jake', 'tyler', 'noah', 'mason', 'ethan', 'carter', 'logan', 'lucas', 'owen', 'kai']
    const name1 = fallbackNames[Math.floor(Math.random() * fallbackNames.length)]
    let name2 = fallbackNames[Math.floor(Math.random() * fallbackNames.length)]
    while (name2 === name1) {
      name2 = fallbackNames[Math.floor(Math.random() * fallbackNames.length)]
    }
    return { name1, name2 }
  }
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

    // Generate 2 unique TikTok names
    const { name1, name2 } = await generateTikTokNames()

    const message = `Hey ${greeting}

Great to meet u i'm cesar one of the co-founders of Lastr.

Please - start by creating your TikTok accounts, no Instagram for the moment.

First Account name: "${name1}.lastr"
Second Account name: "${name2}.lastr"

Then you can simply download the app here: https://testflight.apple.com/join/D824t57J

Warm up the acc for 24h and then you'll be ready to start posting!!! :)`

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
