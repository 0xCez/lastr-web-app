/**
 * Discord Create Channel
 * Manually creates a private channel for a user who doesn't have one
 *
 * Usage: POST with { discordUserId: "..." } or { platformUserId: "..." }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const UGC_CATEGORY_ID = Deno.env.get('DISCORD_UGC_CATEGORY_ID') || ''
const AM_CATEGORY_ID = Deno.env.get('DISCORD_AM_CATEGORY_ID') || ''
// Fallback categories when primary is full (50 channel limit)
const ACTIVE_UGC_CATEGORY_ID = '1463571669137494197'
const ACTIVE_AM_CATEGORY_ID = '1463571670710095882'
const ADMIN_USER_IDS = (Deno.env.get('DISCORD_ADMIN_USER_IDS') || '').split(',').map(id => id.trim()).filter(id => id)

// Delayed welcome messages config
const VOICE_NOTE_DELAY_MINUTES = 5
const TEXT_MESSAGE_DELAY_MINUTES = 7  // Text message 2 minutes after voice

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

let lastChannelError = ''

async function createPrivateChannel(discordUserId: string, userName: string, role: string): Promise<string | null> {
  const cleanName = userName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const channelName = `「🔐」${cleanName}`
  console.log(`Creating private channel: ${channelName} for user ${discordUserId} (role: ${role})`)

  const permissionOverwrites: any[] = [
    {
      id: DISCORD_GUILD_ID,
      type: 0,
      deny: '1024',
    },
    {
      id: discordUserId,
      type: 1,
      allow: '3072',
    },
    {
      id: DISCORD_CLIENT_ID,
      type: 1,
      allow: '3072',
    },
  ]

  for (const adminId of ADMIN_USER_IDS) {
    if (adminId && adminId !== discordUserId) {
      permissionOverwrites.push({
        id: adminId.trim(),
        type: 1,
        allow: '3072',
      })
    }
  }

  const channelPayload: any = {
    name: channelName,
    type: 0,
    permission_overwrites: permissionOverwrites,
  }

  const primaryCategoryId = role === 'ugc_creator' ? UGC_CATEGORY_ID : AM_CATEGORY_ID
  const fallbackCategoryId = role === 'ugc_creator' ? ACTIVE_UGC_CATEGORY_ID : ACTIVE_AM_CATEGORY_ID

  // Try primary category first
  if (primaryCategoryId) {
    channelPayload.parent_id = primaryCategoryId
  }

  let response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(channelPayload),
  })

  // If category is full, try fallback category
  if (!response.ok) {
    const errorText = await response.text()
    if (errorText.includes('CHANNEL_PARENT_MAX_CHANNELS') && fallbackCategoryId) {
      console.log(`Primary category full, trying fallback category: ${fallbackCategoryId}`)
      channelPayload.parent_id = fallbackCategoryId

      response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(channelPayload),
      })
    }

    if (!response.ok) {
      const error = await response.text()
      console.error(`Failed to create channel. Status: ${response.status}, Error: ${error}`)
      console.error(`Payload was: ${JSON.stringify(channelPayload)}`)
      lastChannelError = `Status ${response.status}: ${error}`
      return null
    }
  }

  const channel = await response.json()
  console.log(`Channel created successfully: ${channel.id}`)
  return channel.id
}

async function sendWelcomeMessage(channelId: string, userName: string, role: string): Promise<void> {
  const roleSpecificContent = role === 'ugc_creator'
    ? `**📋 Your Getting Started Checklist:**
⬜ Download the app & leave a 5-star rating
⬜ Read the content guide in #content-rules
⬜ Warm up your accounts (5 days of scrolling, engaging - follow + like other accounts)
⬜ Watch the example videos below
⬜ Create your first Bet.AI video (15-25 secs max!)
⬜ Submit via [Dashboard](https://www.betaiapp.com/dashboard)

---

**💰 Your Earnings:**
• **Base:** $300/month
• **Bonus:** $1.50 per 1,000 views (capped at $5k/month)
• **Weekly target:** 12 videos (Monday-Sunday)

---

📹 **Example Videos:**
• [Bedroom setup](https://www.tiktok.com/@bet.ai.app/video/7503241523845336366)
• [Living room/computer setup](https://www.tiktok.com/@bet.ai.app/video/7501411398912642334)
• [Living room](https://www.tiktok.com/@bet.ai.app/video/7502102819080654126)
• [Live bar](https://www.tiktok.com/@bet.ai.app/video/7501685800157957422)

📱 **Download the app:**
• [App Store](https://apps.apple.com/us/app/bet-ai-betting-assistant/id6743808717)
• [TestFlight (Beta)](https://testflight.apple.com/join/D824t57J)

💬 We'll get you your promo code very soon! In the meantime, start warming up your accounts! 🚀`
    : `**📋 Your Getting Started Checklist:**
⬜ Set up your TikTok/IG accounts in the Slideshow Generator
⬜ Learn how to generate slideshows
⬜ Create your first 5 slideshows
⬜ Post consistently (6 days per week)

---

**💰 Your Earnings:**
• Based on your selected tier
• **Weekly target:** 5 posts/day per account pair

📱 **Download the app:** [Bet.AI on App Store](https://apps.apple.com/us/app/bet-ai-betting-assistant/id6743808717)
*(Please leave us a 5-star rating! 🙏)*

💬 Questions? Just message here and we'll help! 🚀`;

  const welcomeMessage = {
    embeds: [{
      title: `Welcome to Bet.AI, ${userName}!`,
      description: `Your Discord is now linked to your creator account. This is your private channel where you can:

• Get personalized support
• Receive important updates
• Ask questions directly to the team

${roleSpecificContent}`,
      color: 0x22c55e,
      fields: [
        {
          name: "Quick Links",
          value: `[Dashboard](https://www.betaiapp.com/dashboard) • [Content Guide](https://www.betaiapp.com/dashboard) • [Submit Video](https://www.betaiapp.com/dashboard)`,
        },
      ],
      footer: {
        text: "Questions? Just message here and we'll help!",
      },
      timestamp: new Date().toISOString(),
    }],
  }

  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(welcomeMessage),
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { discordUserId, platformUserId, email } = body

    if (!discordUserId && !platformUserId && !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Provide discordUserId, platformUserId, or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find the user
    let query = supabase.from('users').select('id, full_name, role, discord_id, discord_channel_id')

    if (platformUserId) {
      query = query.eq('id', platformUserId)
    } else if (email) {
      query = query.eq('email', email)
    } else {
      query = query.eq('discord_id', discordUserId)
    }

    const { data: user, error: userError } = await query.is('deleted_at', null).single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found', details: userError }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found user: ${user.full_name} (${user.id})`)
    console.log(`Discord ID: ${user.discord_id}, Existing channel: ${user.discord_channel_id}`)

    if (!user.discord_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'User has no Discord ID linked' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the private channel
    const channelId = await createPrivateChannel(user.discord_id, user.full_name, user.role)

    if (!channelId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create Discord channel', details: lastChannelError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user with new channel ID
    const { error: updateError } = await supabase
      .from('users')
      .update({ discord_channel_id: channelId })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update user:', updateError)
    }

    // Send welcome message
    await sendWelcomeMessage(channelId, user.full_name, user.role)

    // Schedule delayed messages for UGC creators
    if (user.role === 'ugc_creator') {
      const voiceScheduledFor = new Date(Date.now() + VOICE_NOTE_DELAY_MINUTES * 60 * 1000)
      const textScheduledFor = new Date(Date.now() + TEXT_MESSAGE_DELAY_MINUTES * 60 * 1000)

      console.log(`📅 Scheduling messages for ${user.full_name}:`)
      console.log(`   Voice note at ${voiceScheduledFor.toISOString()}`)
      console.log(`   Text message at ${textScheduledFor.toISOString()}`)

      // Schedule voice note (5 min)
      const { error: voiceError } = await supabase
        .from('scheduled_voice_notes')
        .insert({
          channel_id: channelId,
          user_name: user.full_name,
          user_id: user.id,
          discord_user_id: user.discord_id,
          scheduled_for: voiceScheduledFor.toISOString(),
          message_type: 'voice',
        })

      if (voiceError) {
        console.error(`Failed to schedule voice note: ${voiceError.message}`)
      }

      // Schedule text message (7 min)
      const { error: textError } = await supabase
        .from('scheduled_voice_notes')
        .insert({
          channel_id: channelId,
          user_name: user.full_name,
          user_id: user.id,
          discord_user_id: user.discord_id,
          scheduled_for: textScheduledFor.toISOString(),
          message_type: 'text',
        })

      if (textError) {
        console.error(`Failed to schedule text message: ${textError.message}`)
      }

      if (!voiceError && !textError) {
        console.log(`✅ Both messages scheduled for ${user.full_name}`)
      }
    }

    console.log(`✅ Created channel ${channelId} for ${user.full_name}`)

    return new Response(
      JSON.stringify({
        success: true,
        channelId,
        userName: user.full_name,
        role: user.role
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
