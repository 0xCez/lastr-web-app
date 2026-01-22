import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const WEEKLY_TARGET = 12 // Posts per week for UGC creators

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

function getWeekBoundaries(): { start: Date; end: Date } {
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0 = Sunday, 1 = Monday, etc.

  // Calculate days since Monday (if Sunday, it's 6 days ago)
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  // Start of week (Monday 00:00:00 UTC)
  const start = new Date(now)
  start.setUTCDate(now.getUTCDate() - daysSinceMonday)
  start.setUTCHours(0, 0, 0, 0)

  // End of week (Sunday 23:59:59 UTC)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  end.setUTCHours(23, 59, 59, 999)

  return { start, end }
}

function buildReminderMessage(userName: string, postsThisWeek: number, postsTarget: number): any {
  const remaining = postsTarget - postsThisWeek
  const isOnTrack = remaining <= 0

  if (isOnTrack) {
    return {
      embeds: [{
        title: '🏆 Weekly Target Achieved!',
        description: `Amazing work, **${userName}**! You've already hit your weekly target of ${postsTarget} posts!\n\nKeep crushing it! 🚀`,
        color: 0x22c55e, // Green
        timestamp: new Date().toISOString(),
      }],
    }
  }

  return {
    embeds: [{
      title: '⏰ Friday Check-In!',
      description: `Hey **${userName}**! Quick update on your week:\n\n📊 **Posts this week:** ${postsThisWeek}/${postsTarget}\n⚡ **Still needed:** ${remaining} posts\n\nYou've got until Sunday to hit your target! Let's get that money! 💰`,
      color: 0xfbbf24, // Yellow/amber for attention
      footer: {
        text: 'Week resets Monday at midnight UTC',
      },
      timestamp: new Date().toISOString(),
    }],
  }
}

serve(async (req) => {
  try {
    console.log('Starting weekly reminder cron job...')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all approved UGC creators with Discord channels
    const { data: creators, error: creatorsError } = await supabase
      .from('users')
      .select('id, full_name, discord_channel_id')
      .eq('role', 'ugc_creator')
      .eq('application_status', 'approved')
      .not('discord_channel_id', 'is', null)

    if (creatorsError) {
      console.error('Error fetching creators:', creatorsError)
      throw creatorsError
    }

    console.log(`Found ${creators?.length || 0} creators with Discord channels`)

    if (!creators || creators.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No creators to notify' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get week boundaries (Monday-Sunday)
    const { start, end } = getWeekBoundaries()
    console.log(`Week: ${start.toISOString()} to ${end.toISOString()}`)

    // Get post counts for all creators this week (only approved posts, same as dashboard)
    const creatorIds = creators.map(c => c.id)
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('submitted_by')
      .in('submitted_by', creatorIds)
      .eq('status', 'approved')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      throw postsError
    }

    // Count posts per user
    const postCounts: Record<string, number> = {}
    posts?.forEach(post => {
      postCounts[post.submitted_by] = (postCounts[post.submitted_by] || 0) + 1
    })

    // Send reminders to each creator
    let sentCount = 0
    let skippedCount = 0

    for (const creator of creators) {
      const postsThisWeek = postCounts[creator.id] || 0

      // Build and send the message
      const message = buildReminderMessage(creator.full_name, postsThisWeek, WEEKLY_TARGET)
      const sent = await sendDiscordMessage(creator.discord_channel_id, message)

      if (sent) {
        console.log(`Sent reminder to ${creator.full_name}: ${postsThisWeek}/${WEEKLY_TARGET} posts`)
        sentCount++
      } else {
        console.log(`Failed to send reminder to ${creator.full_name}`)
        skippedCount++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`Weekly reminders complete: ${sentCount} sent, ${skippedCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: skippedCount,
        total: creators.length
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Weekly reminder cron error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
