/**
 * Check Creator Reminders
 * Daily cron function to check for creators needing follow-up
 *
 * Reminder types:
 * - no_discord_3d: Approved 3+ days ago, no Discord linked
 * - no_post_3d: Discord linked 3+ days ago, no posts submitted
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Admin Discord user IDs to notify
const ADMIN_USER_IDS = (Deno.env.get('DISCORD_ADMIN_USER_IDS') || '').split(',').map(id => id.trim()).filter(id => id)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActionItem {
  type: 'no_discord_3d' | 'no_post_3d'
  userId: string
  userName: string
  userEmail: string
  daysSince: number
  metadata: Record<string, any>
}

// Send DM to a Discord user
async function sendDiscordDM(discordUserId: string, message: any): Promise<boolean> {
  try {
    // First, create DM channel
    const channelResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recipient_id: discordUserId }),
    })

    if (!channelResponse.ok) {
      console.error('Failed to create DM channel:', await channelResponse.text())
      return false
    }

    const channel = await channelResponse.json()

    // Send message to DM channel
    const messageResponse = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!messageResponse.ok) {
      console.error('Failed to send DM:', await messageResponse.text())
      return false
    }

    return true
  } catch (err) {
    console.error('Error sending DM:', err)
    return false
  }
}

// Build summary message for admins
function buildAdminSummaryMessage(items: ActionItem[]): any {
  if (items.length === 0) {
    return {
      embeds: [{
        title: '✅ Creator Reminders Check',
        description: 'All caught up! No creators need follow-up today.',
        color: 0x22c55e, // Green
        timestamp: new Date().toISOString(),
      }],
    }
  }

  const noDiscordItems = items.filter(i => i.type === 'no_discord_3d')
  const noPostItems = items.filter(i => i.type === 'no_post_3d')

  let description = `Found **${items.length}** creator(s) needing attention:\n\n`

  if (noDiscordItems.length > 0) {
    description += `**📵 No Discord (${noDiscordItems.length}):**\n`
    noDiscordItems.slice(0, 5).forEach(item => {
      description += `• ${item.userName} - ${item.daysSince} days since approval\n`
    })
    if (noDiscordItems.length > 5) {
      description += `  _...and ${noDiscordItems.length - 5} more_\n`
    }
    description += '\n'
  }

  if (noPostItems.length > 0) {
    description += `**📝 No Posts (${noPostItems.length}):**\n`
    noPostItems.slice(0, 5).forEach(item => {
      description += `• ${item.userName} - ${item.daysSince} days since Discord join\n`
    })
    if (noPostItems.length > 5) {
      description += `  _...and ${noPostItems.length - 5} more_\n`
    }
  }

  description += '\n_Check the Action Items widget on your dashboard for full details._'

  return {
    embeds: [{
      title: '⚠️ Creator Follow-up Needed',
      description,
      color: 0xfbbf24, // Amber
      footer: {
        text: 'Daily reminder check',
      },
      timestamp: new Date().toISOString(),
    }],
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔔 Starting creator reminders check...')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Calculate dates
    const now = new Date()
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const threeDaysAgoStr = threeDaysAgo.toISOString()

    console.log(`📅 Checking creators approved/joined before: ${threeDaysAgoStr}`)

    const actionItems: ActionItem[] = []

    // ==========================================
    // Check 1: Approved but no Discord after 3 days
    // ==========================================
    const { data: noDiscordUsers, error: noDiscordError } = await supabase
      .from('users')
      .select('id, full_name, email, approved_at')
      .eq('role', 'ugc_creator')
      .eq('application_status', 'approved')
      .is('discord_id', null)
      .not('approved_at', 'is', null)
      .lt('approved_at', threeDaysAgoStr)

    if (noDiscordError) {
      console.error('Error fetching no-Discord users:', noDiscordError)
    } else {
      console.log(`📵 Found ${noDiscordUsers?.length || 0} users without Discord`)

      for (const user of noDiscordUsers || []) {
        const approvedAt = new Date(user.approved_at)
        const daysSince = Math.floor((now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60 * 24))

        actionItems.push({
          type: 'no_discord_3d',
          userId: user.id,
          userName: user.full_name,
          userEmail: user.email,
          daysSince,
          metadata: { approvedAt: user.approved_at }
        })
      }
    }

    // ==========================================
    // Check 2: Has Discord but no posts after 3 days
    // ==========================================
    const { data: discordUsers, error: discordUsersError } = await supabase
      .from('users')
      .select('id, full_name, email, discord_linked_at')
      .eq('role', 'ugc_creator')
      .eq('application_status', 'approved')
      .not('discord_id', 'is', null)
      .not('discord_linked_at', 'is', null)
      .lt('discord_linked_at', threeDaysAgoStr)

    if (discordUsersError) {
      console.error('Error fetching Discord users:', discordUsersError)
    } else {
      // For each user, check if they have any posts
      for (const user of discordUsers || []) {
        const { count, error: postsError } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('submitted_by', user.id)

        if (postsError) {
          console.error(`Error checking posts for ${user.full_name}:`, postsError)
          continue
        }

        if (count === 0) {
          const linkedAt = new Date(user.discord_linked_at)
          const daysSince = Math.floor((now.getTime() - linkedAt.getTime()) / (1000 * 60 * 60 * 24))

          actionItems.push({
            type: 'no_post_3d',
            userId: user.id,
            userName: user.full_name,
            userEmail: user.email,
            daysSince,
            metadata: { discordLinkedAt: user.discord_linked_at }
          })
        }
      }

      console.log(`📝 Found ${actionItems.filter(i => i.type === 'no_post_3d').length} users without posts`)
    }

    // ==========================================
    // Create/update action items in database
    // ==========================================
    let created = 0
    let skipped = 0

    for (const item of actionItems) {
      // Check if action item already exists (pending)
      const { data: existing } = await supabase
        .from('admin_action_items')
        .select('id')
        .eq('type', item.type)
        .eq('user_id', item.userId)
        .eq('status', 'pending')
        .single()

      if (existing) {
        skipped++
        continue
      }

      // Create new action item
      const { error: insertError } = await supabase
        .from('admin_action_items')
        .insert({
          type: item.type,
          user_id: item.userId,
          status: 'pending',
          metadata: {
            ...item.metadata,
            daysSince: item.daysSince,
            userName: item.userName,
            userEmail: item.userEmail
          }
        })

      if (insertError) {
        // Might be duplicate constraint - that's fine
        if (!insertError.message.includes('duplicate')) {
          console.error(`Error creating action item for ${item.userName}:`, insertError)
        }
        skipped++
      } else {
        created++
      }
    }

    console.log(`📋 Action items: ${created} created, ${skipped} skipped (already exist)`)

    // ==========================================
    // Send Discord DM summary to admins
    // ==========================================
    if (ADMIN_USER_IDS.length > 0 && actionItems.length > 0) {
      const summaryMessage = buildAdminSummaryMessage(actionItems)

      for (const adminId of ADMIN_USER_IDS) {
        const sent = await sendDiscordDM(adminId, summaryMessage)
        if (sent) {
          console.log(`📨 Sent summary DM to admin ${adminId}`)
        }
      }
    }

    // ==========================================
    // Update notification timestamps
    // ==========================================
    if (created > 0) {
      await supabase
        .from('admin_action_items')
        .update({ discord_notified_at: now.toISOString() })
        .eq('status', 'pending')
        .is('discord_notified_at', null)
    }

    console.log('✅ Creator reminders check complete')

    return new Response(
      JSON.stringify({
        success: true,
        total: actionItems.length,
        noDiscord: actionItems.filter(i => i.type === 'no_discord_3d').length,
        noPosts: actionItems.filter(i => i.type === 'no_post_3d').length,
        created,
        skipped,
        adminNotified: ADMIN_USER_IDS.length > 0 && actionItems.length > 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Creator reminders check failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
