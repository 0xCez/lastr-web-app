/**
 * Discord Send Delayed Welcome
 * Sends a voice note to new UGC creators 4 minutes after they join
 *
 * Configuration via environment variables:
 * - DISCORD_WELCOME_VOICE_MESSAGE_ID: The message ID containing the voice note to forward
 * - DISCORD_WELCOME_VOICE_CHANNEL_ID: The channel where the original voice note is stored
 * - DISCORD_WELCOME_DELAY_MINUTES: Delay before sending (default: 4)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!

// Configurable parameters
const WELCOME_VOICE_MESSAGE_ID = Deno.env.get('DISCORD_WELCOME_VOICE_MESSAGE_ID') || '1463555239289421845'
const WELCOME_VOICE_CHANNEL_ID = Deno.env.get('DISCORD_WELCOME_VOICE_CHANNEL_ID') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiscordMessage {
  id: string
  content: string
  attachments: Array<{
    id: string
    filename: string
    url: string
    proxy_url: string
    content_type?: string
  }>
}

// Fetch the original voice note message
async function fetchOriginalMessage(channelId: string, messageId: string): Promise<DiscordMessage | null> {
  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`,
    {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to fetch message ${messageId}:`, error)
    return null
  }

  return response.json()
}

// Download attachment and get as blob
async function downloadAttachment(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to download attachment: ${response.status}`)
      return null
    }
    return await response.blob()
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return null
  }
}

// Send message with attachment to a channel
async function sendVoiceNote(
  channelId: string,
  discordUserId: string,
  userName: string,
  attachmentBlob: Blob,
  filename: string
): Promise<boolean> {
  // Create form data for multipart upload
  const formData = new FormData()

  // Add the message content with @mention
  const payload = {
    content: `<@${discordUserId}> 🎤 **Hey ${userName}!** Here's a personal message from Cesar:`,
  }
  formData.append('payload_json', JSON.stringify(payload))

  // Add the voice note file
  formData.append('files[0]', attachmentBlob, filename)

  const response = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to send voice note to channel ${channelId}:`, error)
    return false
  }

  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Required parameters
    const {
      channelId,      // Creator's private channel ID
      discordUserId,  // Creator's Discord user ID
      userName,       // Creator's name for the message
      sourceChannelId, // Channel where the voice note is stored (optional, falls back to env)
      action          // Optional: 'debug' to just fetch and show message info
    } = body

    // Debug action - just fetch and show the message
    if (action === 'debug') {
      const debugChannelId = sourceChannelId || WELCOME_VOICE_CHANNEL_ID
      if (!debugChannelId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Provide sourceChannelId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const msg = await fetchOriginalMessage(debugChannelId, WELCOME_VOICE_MESSAGE_ID)
      return new Response(
        JSON.stringify({ success: !!msg, message: msg }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!channelId || !discordUserId || !userName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameters: channelId, discordUserId, userName'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const voiceChannelId = sourceChannelId || WELCOME_VOICE_CHANNEL_ID

    if (!voiceChannelId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No source channel ID configured. Set DISCORD_WELCOME_VOICE_CHANNEL_ID or pass sourceChannelId'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📨 Sending delayed welcome voice note to ${userName} (${discordUserId})`)
    console.log(`   Target channel: ${channelId}`)
    console.log(`   Source message: ${WELCOME_VOICE_MESSAGE_ID} in channel ${voiceChannelId}`)

    // Fetch the original message with the voice note
    const originalMessage = await fetchOriginalMessage(voiceChannelId, WELCOME_VOICE_MESSAGE_ID)

    if (!originalMessage) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not fetch original voice note message'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find audio attachment
    const audioAttachment = originalMessage.attachments.find(
      att => att.content_type?.startsWith('audio/') ||
             att.filename.endsWith('.ogg') ||
             att.filename.endsWith('.mp3') ||
             att.filename.endsWith('.m4a') ||
             att.filename.endsWith('.wav')
    )

    if (!audioAttachment) {
      console.error('No audio attachment found in message. Attachments:', originalMessage.attachments)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No audio attachment found in the source message',
          attachments: originalMessage.attachments
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`   Found audio: ${audioAttachment.filename}`)

    // Download the voice note
    const audioBlob = await downloadAttachment(audioAttachment.url)

    if (!audioBlob) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to download voice note attachment'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send to the creator's channel with @mention
    const success = await sendVoiceNote(
      channelId,
      discordUserId,
      userName,
      audioBlob,
      audioAttachment.filename
    )

    if (!success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send voice note' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`✅ Voice note sent successfully to ${userName}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Voice note sent to ${userName}`,
        channelId,
        discordUserId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error sending delayed welcome:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
