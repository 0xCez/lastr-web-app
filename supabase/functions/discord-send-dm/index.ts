import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const DISCORD_POSTS_CHANNEL_ID = Deno.env.get('DISCORD_POSTS_CHANNEL_ID') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendDMRequest {
  userId: string
  type: 'post_submitted' | 'weekly_reminder' | 'milestone' | 'custom'
  data?: {
    postUrl?: string
    accountHandle?: string
    platform?: 'tiktok' | 'instagram'
    postsThisWeek?: number
    postsTarget?: number
    milestoneName?: string
    customMessage?: string
    notes?: string
  }
}

async function sendDiscordMessage(channelId: string, message: any): Promise<boolean> {
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Discord API error:', error)
    return false
  }
  return true
}

function buildPostSubmittedMessage(userName: string): any {
  return {
    embeds: [{
      title: '🎉 Post Submitted!',
      description: `Great job, **${userName}**! Your post has been submitted and we're tracking it.\n\nKeep up the momentum! 💪`,
      color: 0x22c55e, // Green
      footer: {
        text: 'Views will be updated at midnight UTC',
      },
      timestamp: new Date().toISOString(),
    }],
  }
}

function buildWeeklyReminderMessage(userName: string, postsThisWeek: number, postsTarget: number): any {
  const remaining = postsTarget - postsThisWeek
  const isOnTrack = remaining <= 0

  if (isOnTrack) {
    return {
      embeds: [{
        title: '🏆 Weekly Target Achieved!',
        description: `Amazing work, **${userName}**! You've hit your weekly target of ${postsTarget} posts!\n\nKeep crushing it! 🚀`,
        color: 0x22c55e, // Green
        timestamp: new Date().toISOString(),
      }],
    }
  }

  return {
    embeds: [{
      title: '⏰ Weekly Check-In',
      description: `Hey **${userName}**! Quick update on your week:\n\n📊 **Posts this week:** ${postsThisWeek}/${postsTarget}\n⚡ **Still needed:** ${remaining} posts\n\nYou've got this! Let's get that money! 💰`,
      color: 0xfbbf24, // Yellow/amber
      footer: {
        text: 'Week resets Monday at midnight',
      },
      timestamp: new Date().toISOString(),
    }],
  }
}

function buildMilestoneMessage(userName: string, milestoneName: string): any {
  return {
    embeds: [{
      title: '🏅 Milestone Unlocked!',
      description: `Congratulations **${userName}**!\n\nYou've unlocked: **${milestoneName}**\n\nKeep going - more achievements await! 🎯`,
      color: 0x8b5cf6, // Purple
      timestamp: new Date().toISOString(),
    }],
  }
}

function buildAdminPostNotification(
  userName: string,
  userEmail: string,
  postUrl: string,
  accountHandle?: string,
  platform?: 'tiktok' | 'instagram'
): any {
  const platformEmoji = platform === 'tiktok' ? '🎵' : platform === 'instagram' ? '📸' : '📱'
  const platformName = platform === 'tiktok' ? 'TikTok' : platform === 'instagram' ? 'Instagram' : 'Unknown'
  const buttonEmoji = platform === 'tiktok' ? '🎵' : '📸'

  return {
    embeds: [{
      title: `${platformEmoji} New Post Submitted`,
      color: platform === 'tiktok' ? 0x00f2ea : 0xe1306c, // TikTok cyan or Instagram pink
      fields: [
        {
          name: 'Creator',
          value: userName,
          inline: true,
        },
        {
          name: 'Email',
          value: userEmail,
          inline: true,
        },
        {
          name: 'Platform',
          value: platformName,
          inline: true,
        },
        {
          name: 'Account',
          value: accountHandle ? `@${accountHandle}` : 'Unknown',
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
    }],
    components: [{
      type: 1, // Action Row
      components: [{
        type: 2, // Button
        style: 5, // Link button
        label: `Watch on ${platformName}`,
        url: postUrl,
        emoji: { name: buttonEmoji },
      }],
    }],
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, type, data }: SendDMRequest = await req.json()

    if (!userId || !type) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's Discord channel ID and email
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, email, discord_channel_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Always send admin notification for post_submitted, regardless of user's Discord status
    if (type === 'post_submitted' && DISCORD_POSTS_CHANNEL_ID && data?.postUrl) {
      const adminMessage = buildAdminPostNotification(
        userData.full_name,
        userData.email || 'Unknown',
        data.postUrl,
        data.accountHandle,
        data.platform
      )
      sendDiscordMessage(DISCORD_POSTS_CHANNEL_ID, adminMessage).catch(err =>
        console.error('Failed to send to posts channel:', err)
      )

      // Send directly to Notion
      const NOTION_API_KEY = Deno.env.get('NOTION_API_KEY')
      const NOTION_DATABASE_ID = '2e651d7a3e9081578ed9de21ffbe40d0'
      if (NOTION_API_KEY) {
        fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NOTION_API_KEY}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            parent: { database_id: NOTION_DATABASE_ID },
            properties: {
              'Creator': { title: [{ text: { content: userData.full_name } }] },
              'Email': { rich_text: [{ text: { content: userData.email || '' } }] },
              'Platform ': { multi_select: [{ name: data.platform || 'unknown' }] },
              'Account Handle': { rich_text: [{ text: { content: data.accountHandle ? `@${data.accountHandle}` : '' } }] },
              'URL': { url: data.postUrl },
              'Submitted At': { date: { start: new Date().toISOString().split('T')[0] } },
              'Text': { rich_text: [{ text: { content: data.notes || '' } }] },
            },
          }),
        }).catch(err => console.error('Failed to send to Notion:', err))
      }
    }

    if (!userData.discord_channel_id) {
      console.log('User has no Discord channel linked, skipping DM')
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'No Discord channel linked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build message based on type
    let message: any
    switch (type) {
      case 'post_submitted':
        message = buildPostSubmittedMessage(userData.full_name)
        break
      case 'weekly_reminder':
        message = buildWeeklyReminderMessage(
          userData.full_name,
          data?.postsThisWeek || 0,
          data?.postsTarget || 12
        )
        break
      case 'milestone':
        message = buildMilestoneMessage(userData.full_name, data?.milestoneName || 'Achievement')
        break
      case 'custom':
        message = { content: data?.customMessage || 'Message from Bet.AI' }
        break
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown message type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Send the message
    const sent = await sendDiscordMessage(userData.discord_channel_id, message)

    if (!sent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send Discord message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Discord DM sent: type=${type}, user=${userData.full_name}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error sending Discord DM:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
