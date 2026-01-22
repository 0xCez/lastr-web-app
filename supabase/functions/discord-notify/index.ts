import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_ADMIN_CHANNEL_ID = Deno.env.get('DISCORD_ADMIN_CHANNEL_ID') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  type: 'new_application' | 'post_submitted' | 'custom'
  data: {
    userName?: string
    userEmail?: string
    role?: 'ugc_creator' | 'account_manager'
    country?: string
    contractOption?: string
    postUrl?: string
    message?: string
  }
}

function formatContractOption(option: string | undefined): string {
  if (!option) return 'Not specified'
  if (option === 'option1') return '$300 + $1.5 CPM'
  if (option === 'option2') return '$500 fixed/100 videos'
  if (option === '1_pair' || option === '1') return '1 Pair (5 posts/day)'
  if (option === '2_pairs' || option === '2') return '2 Pairs (10 posts/day)'
  return option
}

function buildEmbed(notification: NotificationRequest) {
  const { type, data } = notification

  switch (type) {
    case 'new_application':
      return {
        embeds: [{
          title: "New Application Received",
          color: 0x22c55e, // Green
          fields: [
            {
              name: "Name",
              value: data.userName || 'Unknown',
              inline: true,
            },
            {
              name: "Email",
              value: data.userEmail || 'Unknown',
              inline: true,
            },
            {
              name: "Role",
              value: data.role === 'ugc_creator' ? 'UGC Creator' : 'Account Manager',
              inline: true,
            },
            {
              name: "Country",
              value: data.country || 'Unknown',
              inline: true,
            },
            {
              name: "Contract",
              value: formatContractOption(data.contractOption),
              inline: true,
            },
          ],
          footer: {
            text: "Review in the admin dashboard",
          },
          timestamp: new Date().toISOString(),
        }],
      }

    case 'post_submitted':
      return {
        embeds: [{
          title: "New Post Submitted",
          color: 0x3b82f6, // Blue
          fields: [
            {
              name: "Creator",
              value: data.userName || 'Unknown',
              inline: true,
            },
            {
              name: "Post URL",
              value: data.postUrl || 'No URL',
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        }],
      }

    case 'custom':
      return {
        content: data.message || 'Notification from Bet.AI',
      }

    default:
      return {
        content: 'Unknown notification type',
      }
  }
}

async function sendDiscordMessage(channelId: string, messagePayload: any): Promise<void> {
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messagePayload),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Discord API error:', error)
    throw new Error(`Discord API error: ${response.status}`)
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN is not configured')
    }

    if (!DISCORD_ADMIN_CHANNEL_ID) {
      throw new Error('DISCORD_ADMIN_CHANNEL_ID is not configured')
    }

    const notification: NotificationRequest = await req.json()

    if (!notification.type) {
      throw new Error('Notification type is required')
    }

    const messagePayload = buildEmbed(notification)
    await sendDiscordMessage(DISCORD_ADMIN_CHANNEL_ID, messagePayload)

    console.log(`Discord notification sent: ${notification.type}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error sending Discord notification:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
