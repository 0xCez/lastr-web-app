import { Client, GatewayIntentBits, ChannelType } from 'discord.js';

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';
const GUILD_ID = '1463875024241954948';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

async function getIds() {
  const guild = await client.guilds.fetch(GUILD_ID);
  console.log(`\n📍 Server: ${guild.name}\n`);

  // Get all roles
  console.log('=== ROLES ===');
  let roles = await guild.roles.fetch();

  // Create Verified role if it doesn't exist
  let verifiedRole = roles.find(r => r.name === 'Verified');
  if (!verifiedRole) {
    console.log('Creating Verified role...');
    verifiedRole = await guild.roles.create({
      name: 'Verified',
      color: 0x2ecc71, // Green
    });
    console.log(`Created Verified role: ${verifiedRole.id}`);
    // Refetch roles
    roles = await guild.roles.fetch();
  }

  roles.forEach(role => {
    if (role.name !== '@everyone') {
      console.log(`${role.name}: ${role.id}`);
    }
  });

  // Get all channels
  console.log('\n=== CHANNELS ===');
  const channels = await guild.channels.fetch();

  // Separate categories and text channels
  const categories: { name: string; id: string }[] = [];
  const textChannels: { name: string; id: string; parentId: string | null }[] = [];

  channels.forEach(channel => {
    if (channel) {
      if (channel.type === ChannelType.GuildCategory) {
        categories.push({ name: channel.name, id: channel.id });
      } else if (channel.type === ChannelType.GuildText) {
        textChannels.push({
          name: channel.name,
          id: channel.id,
          parentId: channel.parentId
        });
      }
    }
  });

  console.log('\nCategories:');
  categories.forEach(cat => console.log(`  ${cat.name}: ${cat.id}`));

  console.log('\nText Channels:');
  textChannels.forEach(ch => console.log(`  ${ch.name}: ${ch.id}`));

  // Print env var format
  console.log('\n\n=== COPY THESE FOR SUPABASE ===\n');

  const adminRole = roles.find(r => r.name === 'Admin');
  const amRole = roles.find(r => r.name === 'Account Manager');
  const verifiedRoleFinal = roles.find(r => r.name === 'Verified');

  const amCategory = categories.find(c => c.name.includes('Account Managers') && !c.name.includes('Active'));
  const activeAmCategory = categories.find(c => c.name.includes('Active AMs'));
  const adminChannel = textChannels.find(c => c.name.includes('admin') && c.name.includes('🔒'));

  console.log(`DISCORD_GUILD_ID=${GUILD_ID}`);
  console.log(`DISCORD_BOT_TOKEN=${BOT_TOKEN}`);
  console.log(`DISCORD_ROLE_ADMIN=${adminRole?.id || 'NOT_FOUND'}`);
  console.log(`DISCORD_ROLE_ACCOUNT_MANAGER=${amRole?.id || 'NOT_FOUND'}`);
  console.log(`DISCORD_ROLE_VERIFIED=${verifiedRoleFinal?.id || 'NEEDS_CREATION'}`);
  console.log(`DISCORD_AM_CATEGORY_ID=${amCategory?.id || 'NOT_FOUND'}`);
  console.log(`DISCORD_ACTIVE_AM_CATEGORY_ID=${activeAmCategory?.id || 'NOT_FOUND'}`);
  console.log(`DISCORD_ADMIN_CHANNEL_ID=${adminChannel?.id || 'NOT_FOUND'}`);

  process.exit(0);
}

client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  getIds().catch(console.error);
});

client.login(BOT_TOKEN);
