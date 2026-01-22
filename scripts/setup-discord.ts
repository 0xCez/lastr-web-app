import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } from 'discord.js';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const GUILD_ID = '1463875024241954948';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

async function setupServer() {
  console.log('🚀 Starting Discord server setup...');

  const guild = await client.guilds.fetch(GUILD_ID);
  console.log(`📍 Connected to server: ${guild.name}`);

  // Create roles first
  console.log('👥 Creating roles...');

  let adminRole = guild.roles.cache.find(r => r.name === 'Admin');
  if (!adminRole) {
    adminRole = await guild.roles.create({
      name: 'Admin',
      color: 0xe74c3c,
      permissions: [PermissionFlagsBits.Administrator],
    });
    console.log('   ✅ Created role: Admin');
  }

  let amRole = guild.roles.cache.find(r => r.name === 'Account Manager');
  if (!amRole) {
    amRole = await guild.roles.create({
      name: 'Account Manager',
      color: 0x3498db,
    });
    console.log('   ✅ Created role: Account Manager');
  }

  // Top-level private channels (no category)
  console.log('🔒 Creating admin channels...');

  await guild.channels.create({
    name: '🔒-admin',
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel] },
    ],
  });
  console.log('   ✅ Created: 🔒-admin');

  await guild.channels.create({
    name: '🐐x🐐-sacha_cez',
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel] },
    ],
  });
  console.log('   ✅ Created: 🐐x🐐-sacha_cez');

  await guild.channels.create({
    name: '📮-submitted-posts',
    type: ChannelType.GuildText,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: adminRole.id, allow: [PermissionFlagsBits.ViewChannel] },
    ],
  });
  console.log('   ✅ Created: 📮-submitted-posts');

  // Info category
  console.log('📁 Creating Info category...');
  const infoCategory = await guild.channels.create({
    name: '📋 Info',
    type: ChannelType.GuildCategory,
  });

  const infoChannels = [
    '👋-welcome',
    '📢-announcements',
    '📜-content-rules',
    '📣-am-announcements',
    '📝-new-content-ideas',
    '🎁-referrals',
    '📋-channel-template',
    '🎮-replays',
  ];

  for (const name of infoChannels) {
    await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: infoCategory.id,
    });
    console.log(`   ✅ Created: ${name}`);
  }

  // Active AMs category
  console.log('📁 Creating Active AMs category...');
  const activeAMsCategory = await guild.channels.create({
    name: '✅💼 Active AMs',
    type: ChannelType.GuildCategory,
  });
  console.log('   ✅ Created category: Active AMs');

  // Account Managers category
  console.log('📁 Creating Account Managers category...');
  const amCategory = await guild.channels.create({
    name: '💼 Account Managers',
    type: ChannelType.GuildCategory,
  });
  console.log('   ✅ Created category: Account Managers');

  console.log('\n✅ Discord server setup complete!');
  console.log('🎉 Your Lastr server is ready!');

  process.exit(0);
}

client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  setupServer().catch(console.error);
});

client.login(BOT_TOKEN);
