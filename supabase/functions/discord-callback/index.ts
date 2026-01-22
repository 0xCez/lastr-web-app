import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID')!
const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET')!
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_GUILD_ID = Deno.env.get('DISCORD_GUILD_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/discord-callback`
const FRONTEND_URL = Deno.env.get('FRONTEND_URL') || 'https://lastr.app'

// Role IDs from Discord server
const ROLE_IDS = {
  verified: Deno.env.get('DISCORD_ROLE_VERIFIED') || '',
  ugc_creator: Deno.env.get('DISCORD_ROLE_UGC_CREATOR') || '',
  account_manager: Deno.env.get('DISCORD_ROLE_ACCOUNT_MANAGER') || '',
  admin: Deno.env.get('DISCORD_ROLE_ADMIN') || '',
}

// Category IDs for private channels (separate categories for each role)
const UGC_CATEGORY_ID = Deno.env.get('DISCORD_UGC_CATEGORY_ID') || ''
const AM_CATEGORY_ID = Deno.env.get('DISCORD_AM_CATEGORY_ID') || ''

// Admin Discord user IDs (comma-separated in env, e.g., "123,456")
// These admins will be added to each creator's private channel AND receive DMs
const ADMIN_USER_IDS = (Deno.env.get('DISCORD_ADMIN_USER_IDS') || '').split(',').map(id => id.trim()).filter(id => id)

// Admin channel for team notifications (e.g., #new-creators channel)
const DISCORD_ADMIN_CHANNEL_ID = Deno.env.get('DISCORD_ADMIN_CHANNEL_ID') || ''

interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
  global_name: string | null
}

async function exchangeCodeForToken(code: string): Promise<{ access_token: string; token_type: string }> {
  const response = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Token exchange failed:', error)
    throw new Error('Failed to exchange code for token')
  }

  return response.json()
}

// Add user to the Discord server using their OAuth access token
async function addUserToGuild(discordUserId: string, accessToken: string): Promise<boolean> {
  console.log(`Attempting to add user ${discordUserId} to guild ${DISCORD_GUILD_ID}`)

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken,
      }),
    }
  )

  console.log(`Add to guild response status: ${response.status}`)

  // 201 = user added, 204 = user already in guild
  if (response.status === 201 || response.status === 204) {
    console.log(`User ${discordUserId} added to guild successfully (status: ${response.status})`)
    return true
  }

  const error = await response.text()
  console.error(`Failed to add user to guild. Status: ${response.status}, Error: ${error}`)
  return false
}

async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch('https://discord.com/api/v10/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to get Discord user')
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
  }
}

async function createPrivateChannel(discordUserId: string, userName: string, role: string): Promise<string | null> {
  // Create a private text channel for the user with new naming convention
  const cleanName = userName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  const channelName = `「🔐」${cleanName}`
  console.log(`Creating private channel: ${channelName} for user ${discordUserId} (role: ${role})`)

  // Base permission overwrites
  const permissionOverwrites: any[] = [
    // Deny everyone from seeing the channel
    {
      id: DISCORD_GUILD_ID, // @everyone role ID is same as guild ID
      type: 0, // Role
      deny: '1024', // VIEW_CHANNEL
    },
    // Allow the specific user to see and send messages
    {
      id: discordUserId,
      type: 1, // Member
      allow: '3072', // VIEW_CHANNEL + SEND_MESSAGES
    },
    // Allow the bot to see and send messages in the channel
    {
      id: DISCORD_CLIENT_ID,
      type: 1, // Member (bot is a member)
      allow: '3072', // VIEW_CHANNEL + SEND_MESSAGES
    },
  ]

  // Add admin users to the channel so they can see and respond
  for (const adminId of ADMIN_USER_IDS) {
    if (adminId && adminId !== discordUserId) {
      permissionOverwrites.push({
        id: adminId.trim(),
        type: 1, // Member
        allow: '3072', // VIEW_CHANNEL + SEND_MESSAGES
      })
      console.log(`Adding admin ${adminId} to channel permissions`)
    }
  }

  const channelPayload: any = {
    name: channelName,
    type: 0, // Text channel
    permission_overwrites: permissionOverwrites,
  }

  // Add to category based on user role
  const categoryId = role === 'ugc_creator' ? UGC_CATEGORY_ID : AM_CATEGORY_ID
  if (categoryId) {
    channelPayload.parent_id = categoryId
    console.log(`Adding to ${role === 'ugc_creator' ? 'UGC' : 'AM'} category: ${categoryId}`)
  }

  console.log(`Channel payload: ${JSON.stringify(channelPayload)}`)

  const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/channels`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(channelPayload),
  })

  console.log(`Create channel response status: ${response.status}`)

  if (!response.ok) {
    const error = await response.text()
    console.error(`Failed to create private channel. Status: ${response.status}, Error: ${error}`)
    return null
  }

  const channel = await response.json()
  return channel.id
}

// Send a DM to ALL admins about new creator signup
async function sendAdminDMs(userName: string, discordUsername: string, privateChannelId: string | null): Promise<void> {
  if (ADMIN_USER_IDS.length === 0) {
    console.log('No admin user IDs configured, skipping DMs')
    return
  }

  const channelLink = privateChannelId ? `<#${privateChannelId}>` : 'their private channel'
  const dmMessage = {
    embeds: [{
      title: '🚨 New Creator Just Joined!',
      description: `**${userName}** (@${discordUsername}) just linked their Discord!\n\n👉 Go say hi in ${channelLink} and send their promo code!`,
      color: 0xff6b6b, // Red for urgency
      footer: {
        text: 'Quick response = happy creator!',
      },
      timestamp: new Date().toISOString(),
    }],
  }

  // Send DM to each admin
  for (const adminId of ADMIN_USER_IDS) {
    try {
      // First, create a DM channel with the admin
      const dmChannelResponse = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_id: adminId.trim(),
        }),
      })

      if (!dmChannelResponse.ok) {
        const error = await dmChannelResponse.text()
        console.error(`Failed to create DM channel with admin ${adminId}:`, error)
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
        const error = await dmResponse.text()
        console.error(`Failed to send DM to admin ${adminId}:`, error)
      } else {
        console.log(`DM sent to admin ${adminId} successfully`)
      }
    } catch (error) {
      console.error(`Error sending DM to admin ${adminId}:`, error)
    }
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
      title: '🎉 New Creator Connected!',
      description: `**${userName}** just linked their Discord account!\n\n**Send them their promo code NOW!**`,
      color: 0xfbbf24, // Yellow/amber for attention
      fields: [
        {
          name: 'Role',
          value: roleLabel,
          inline: true,
        },
        {
          name: 'Discord',
          value: `@${discordUsername}`,
          inline: true,
        },
        {
          name: 'Private Channel',
          value: channelLink,
          inline: true,
        },
      ],
      footer: {
        text: '⚡ Action required: Send promo code',
      },
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

async function sendWelcomeMessage(channelId: string, userName: string, role: string): Promise<void> {
  // Lastr is for Account Managers only
  const roleSpecificContent = `**📋 Your Getting Started Checklist:**
⬜ Set up your TikTok/IG accounts in the Slideshow Generator
⬜ Learn how to generate slideshows
⬜ Create your first 5 slideshows
⬜ Post consistently (6 days per week)

---

**💰 Your Earnings:**
• Based on your selected tier
• **Weekly target:** 5 posts/day per account pair

💬 Questions? Just message here and we'll help! 🚀`;

  const welcomeMessage = {
    embeds: [{
      title: `Welcome to Lastr, ${userName}!`,
      description: `Your Discord is now linked to your creator account. This is your private channel where you can:

• Get personalized support
• Receive important updates
• Ask questions directly to the team

${roleSpecificContent}`,
      color: 0x22c55e,
      fields: [
        {
          name: "Quick Links",
          value: `[Dashboard](https://lastr.app/dashboard)`,
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
  }
}

serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // This contains the user's platform ID

  // Handle errors from Discord
  const error = url.searchParams.get('error')
  if (error) {
    console.error('Discord OAuth error:', error)
    return Response.redirect(`${FRONTEND_URL}/dashboard?discord_error=${error}`)
  }

  if (!code) {
    return Response.redirect(`${FRONTEND_URL}/dashboard?discord_error=no_code`)
  }

  if (!state) {
    return Response.redirect(`${FRONTEND_URL}/dashboard?discord_error=no_state`)
  }

  try {
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code)

    // Get Discord user info
    const discordUser = await getDiscordUser(tokenData.access_token)

    // Add user to the Discord server (requires guilds.join scope)
    const addedToGuild = await addUserToGuild(discordUser.id, tokenData.access_token)
    if (!addedToGuild) {
      console.error('Failed to add user to guild, but continuing...')
    }

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if this Discord account is already linked to another ACTIVE user
    const { data: existingLink } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('discord_id', discordUser.id)
      .is('deleted_at', null)
      .single()

    if (existingLink && existingLink.id !== state) {
      return Response.redirect(`${FRONTEND_URL}/dashboard?discord_error=already_linked`)
    }

    // Get user data to determine role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name, role, application_status, discord_channel_id')
      .eq('id', state)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return Response.redirect(`${FRONTEND_URL}/dashboard?discord_error=user_not_found`)
    }

    // Create private channel for the user (grouped by role category)
    // Always create a new channel to ensure it exists and has correct permissions
    console.log(`User discord_channel_id from DB: ${userData.discord_channel_id}`)
    const channelId = await createPrivateChannel(discordUser.id, userData.full_name, userData.role)
    console.log(`Created channel ID: ${channelId}`)

    // Update user with Discord info
    const updateData: any = {
      discord_id: discordUser.id,
      discord_username: discordUser.global_name || discordUser.username,
      discord_linked_at: new Date().toISOString(),
    }

    if (channelId) {
      updateData.discord_channel_id = channelId
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', state)

    if (updateError) {
      console.error('Failed to update user:', updateError)
      return Response.redirect(`${FRONTEND_URL}/dashboard?discord_error=update_failed`)
    }

    // Assign roles based on user's platform role
    if (ROLE_IDS.verified) {
      await addRoleToUser(discordUser.id, ROLE_IDS.verified)
    }

    if (userData.role === 'ugc_creator' && ROLE_IDS.ugc_creator) {
      await addRoleToUser(discordUser.id, ROLE_IDS.ugc_creator)
    } else if (userData.role === 'account_manager' && ROLE_IDS.account_manager) {
      await addRoleToUser(discordUser.id, ROLE_IDS.account_manager)
    } else if (userData.role === 'admin' && ROLE_IDS.admin) {
      await addRoleToUser(discordUser.id, ROLE_IDS.admin)
    }

    // Send welcome message to private channel
    if (channelId) {
      await sendWelcomeMessage(channelId, userData.full_name, userData.role)
    }

    // Notify admins that a new creator connected (in admin channel)
    await notifyAdmins(
      userData.full_name,
      userData.role,
      discordUser.global_name || discordUser.username,
      channelId
    )

    // Send DM to all admins for immediate engagement
    await sendAdminDMs(
      userData.full_name,
      discordUser.global_name || discordUser.username,
      channelId
    )

    console.log(`Discord linked successfully: ${discordUser.username} -> ${userData.full_name}`)

    return Response.redirect(`${FRONTEND_URL}/dashboard?discord_success=true`)

  } catch (err) {
    console.error('Discord callback error:', err)
    return Response.redirect(`${FRONTEND_URL}/dashboard?discord_error=unknown`)
  }
})
