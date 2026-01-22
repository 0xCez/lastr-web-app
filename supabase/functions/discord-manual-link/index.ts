import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!
const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Role IDs from Discord server
const ROLE_IDS = {
  verified: Deno.env.get('DISCORD_ROLE_VERIFIED') || '',
  ugc_creator: Deno.env.get('DISCORD_ROLE_UGC_CREATOR') || '',
  account_manager: Deno.env.get('DISCORD_ROLE_ACCOUNT_MANAGER') || '',
  admin: Deno.env.get('DISCORD_ROLE_ADMIN') || '',
}

// Category IDs for private channels
const UGC_CATEGORY_ID = Deno.env.get('DISCORD_UGC_CATEGORY_ID') || ''
const AM_CATEGORY_ID = Deno.env.get('DISCORD_AM_CATEGORY_ID') || ''

// Admin Discord user IDs
const ADMIN_USER_IDS = (Deno.env.get('DISCORD_ADMIN_USER_IDS') || '').split(',').map(id => id.trim()).filter(id => id)
const DISCORD_ADMIN_CHANNEL_ID = Deno.env.get('DISCORD_ADMIN_CHANNEL_ID') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getDiscordMember(discordUserId: string): Promise<{ user: { username: string; global_name?: string } } | null> {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
    {
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    }
  )

  if (!response.ok) {
    console.error(`Failed to get Discord member: ${response.status}`)
    return null
  }

  return response.json()
}

async function addRoleToUser(discordUserId: string, roleId: string): Promise<void> {
  if (!roleId) {
    console.log('Role ID not configured, skipping role assignment')
    return
  }

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}/roles/${roleId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    }
  )

  if (!response.ok && response.status !== 204) {
    const error = await response.text()
    console.error('Failed to add role:', error)
  } else {
    console.log(`Role ${roleId} added successfully`)
  }
}

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
      console.log(`Adding admin ${adminId} to channel permissions`)
    }
  }

  const channelPayload: any = {
    name: channelName,
    type: 0,
    permission_overwrites: permissionOverwrites,
  }

  const categoryId = role === 'ugc_creator' ? UGC_CATEGORY_ID : AM_CATEGORY_ID
  if (categoryId) {
    channelPayload.parent_id = categoryId
    console.log(`Adding to ${role === 'ugc_creator' ? 'UGC' : 'AM'} category: ${categoryId}`)
  }

  const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(channelPayload),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to create private channel: ${error}`)
    return null
  }

  const channel = await response.json()
  return channel.id
}

async function sendWelcomeMessage(channelId: string, userName: string, role: string): Promise<void> {
  const roleSpecificContent = role === 'ugc_creator'
    ? `**Getting Started Checklist:**
- Download the app & leave a 5-star rating
- Read the content guide in #content-rules
- Warm up your accounts (5 days of scrolling, engaging - follow + like other accounts)
- Watch the example videos below
- Create your first Bet.AI video (15-25 secs max!)
- Submit via [Dashboard](https://www.betaiapp.com/dashboard)

---

**Your Earnings:**
- **Base:** $300/month
- **Bonus:** $1.50 per 1,000 views (capped at $5k/month)
- **Weekly target:** 12 videos (Monday-Sunday)

---

**Example Videos:**
- [Bedroom setup](https://www.tiktok.com/@bet.ai.app/video/7503241523845336366)
- [Living room/computer setup](https://www.tiktok.com/@bet.ai.app/video/7501411398912642334)
- [Living room](https://www.tiktok.com/@bet.ai.app/video/7502102819080654126)
- [Live bar](https://www.tiktok.com/@bet.ai.app/video/7501685800157957422)

**Download the app:**
- [App Store](https://apps.apple.com/us/app/bet-ai-betting-assistant/id6743808717)
- [TestFlight (Beta)](https://testflight.apple.com/join/D824t57J)

We'll get you your promo code very soon! In the meantime, start warming up your accounts!`
    : `**Getting Started Checklist:**
- Set up your TikTok/IG accounts in the Slideshow Generator
- Learn how to generate slideshows
- Create your first 5 slideshows
- Post consistently (6 days per week)

---

**Your Earnings:**
- Based on your selected tier
- **Weekly target:** 5 posts/day per account pair

**Download the app:** [Bet.AI on App Store](https://apps.apple.com/us/app/bet-ai-betting-assistant/id6743808717)
*(Please leave us a 5-star rating!)*

Questions? Just message here and we'll help!`

  const welcomeMessage = {
    embeds: [{
      title: `Welcome to Bet.AI, ${userName}!`,
      description: `Your Discord is now linked to your creator account. This is your private channel where you can:

- Get personalized support
- Receive important updates
- Ask questions directly to the team

${roleSpecificContent}`,
      color: 0x22c55e,
      fields: [
        {
          name: "Quick Links",
          value: `[Dashboard](https://www.betaiapp.com/dashboard) | [Content Guide](https://www.betaiapp.com/dashboard) | [Submit Video](https://www.betaiapp.com/dashboard)`,
        },
      ],
      footer: {
        text: "Questions? Just message here and we'll help!",
      },
      timestamp: new Date().toISOString(),
    }],
  }

  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(welcomeMessage),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Failed to send welcome message:', error)
  } else {
    console.log('Welcome message sent successfully')
  }
}

async function notifyAdmins(userName: string, role: string, discordUsername: string, privateChannelId: string | null): Promise<void> {
  if (!DISCORD_ADMIN_CHANNEL_ID) {
    console.log('Admin channel not configured, skipping admin notification')
    return
  }

  const roleLabel = role === 'ugc_creator' ? 'UGC Creator' : 'Account Manager'
  const channelLink = privateChannelId ? `<#${privateChannelId}>` : 'N/A'

  const notification = {
    embeds: [{
      title: 'New Creator Connected (Manual Link)',
      description: `**${userName}** has been manually linked to Discord!\n\n**Send them their promo code NOW!**`,
      color: 0xfbbf24,
      fields: [
        { name: 'Role', value: roleLabel, inline: true },
        { name: 'Discord', value: `@${discordUsername}`, inline: true },
        { name: 'Private Channel', value: channelLink, inline: true },
      ],
      footer: { text: 'Action required: Send promo code' },
      timestamp: new Date().toISOString(),
    }],
  }

  const response = await fetch(`https://discord.com/api/v10/channels/${DISCORD_ADMIN_CHANNEL_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(notification),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Failed to send admin notification:', error)
  } else {
    console.log('Admin notification sent successfully')
  }
}

async function sendAdminDMs(userName: string, discordUsername: string, privateChannelId: string | null): Promise<void> {
  if (ADMIN_USER_IDS.length === 0) {
    console.log('No admin user IDs configured, skipping DMs')
    return
  }

  const channelLink = privateChannelId ? `<#${privateChannelId}>` : 'their private channel'
  const dmMessage = {
    embeds: [{
      title: 'New Creator Just Joined! (Manual Link)',
      description: `**${userName}** (@${discordUsername}) was manually linked!\n\nGo say hi in ${channelLink} and send their promo code!`,
      color: 0xff6b6b,
      footer: { text: 'Quick response = happy creator!' },
      timestamp: new Date().toISOString(),
    }],
  }

  for (const adminId of ADMIN_USER_IDS) {
    try {
      const dmChannelResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipient_id: adminId.trim() }),
      })

      if (!dmChannelResponse.ok) {
        console.error(`Failed to create DM channel with admin ${adminId}`)
        continue
      }

      const dmChannel = await dmChannelResponse.json()

      const dmResponse = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dmMessage),
      })

      if (!dmResponse.ok) {
        console.error(`Failed to send DM to admin ${adminId}`)
      } else {
        console.log(`DM sent to admin ${adminId} successfully`)
      }
    } catch (error) {
      console.error(`Error sending DM to admin ${adminId}:`, error)
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { user_email, discord_id } = await req.json()

    if (!user_email || !discord_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_email and discord_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Manual Discord link request: ${user_email} -> ${discord_id}`)

    // Verify the Discord user is actually in the guild
    const discordMember = await getDiscordMember(discord_id)
    if (!discordMember) {
      return new Response(
        JSON.stringify({ error: 'Discord user not found in the server. They must join the server first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const discordUsername = discordMember.user.global_name || discordMember.user.username
    console.log(`Discord user verified: ${discordUsername}`)

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, full_name, role, discord_id, discord_channel_id')
      .eq('email', user_email)
      .is('deleted_at', null)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return new Response(
        JSON.stringify({ error: `User not found with email: ${user_email}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if this Discord ID is already linked to another user
    const { data: existingLink } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('discord_id', discord_id)
      .is('deleted_at', null)
      .single()

    if (existingLink && existingLink.id !== userData.id) {
      return new Response(
        JSON.stringify({
          error: `This Discord ID is already linked to another user: ${existingLink.full_name} (${existingLink.email})`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already has Discord linked
    if (userData.discord_id && userData.discord_channel_id) {
      return new Response(
        JSON.stringify({
          message: 'User already has Discord linked',
          discord_id: userData.discord_id,
          discord_channel_id: userData.discord_channel_id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Linking Discord for user: ${userData.full_name} (${userData.role})`)

    // Create private channel
    const channelId = await createPrivateChannel(discord_id, userData.full_name, userData.role)
    console.log(`Created channel ID: ${channelId}`)

    // Update user with Discord info
    const updateData: any = {
      discord_id: discord_id,
      discord_username: discordUsername,
      discord_linked_at: new Date().toISOString(),
    }

    if (channelId) {
      updateData.discord_channel_id = channelId
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userData.id)

    if (updateError) {
      console.error('Failed to update user:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update user record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign roles
    if (ROLE_IDS.verified) {
      await addRoleToUser(discord_id, ROLE_IDS.verified)
    }

    if (userData.role === 'ugc_creator' && ROLE_IDS.ugc_creator) {
      await addRoleToUser(discord_id, ROLE_IDS.ugc_creator)
    } else if (userData.role === 'account_manager' && ROLE_IDS.account_manager) {
      await addRoleToUser(discord_id, ROLE_IDS.account_manager)
    } else if (userData.role === 'admin' && ROLE_IDS.admin) {
      await addRoleToUser(discord_id, ROLE_IDS.admin)
    }

    // Send welcome message
    if (channelId) {
      await sendWelcomeMessage(channelId, userData.full_name, userData.role)
    }

    // Notify admins
    await notifyAdmins(userData.full_name, userData.role, discordUsername, channelId)
    await sendAdminDMs(userData.full_name, discordUsername, channelId)

    console.log(`Discord linked successfully: ${discordUsername} -> ${userData.full_name}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Discord linked successfully for ${userData.full_name}`,
        discord_id: discord_id,
        discord_username: discordUsername,
        discord_channel_id: channelId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Manual link error:', err)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
