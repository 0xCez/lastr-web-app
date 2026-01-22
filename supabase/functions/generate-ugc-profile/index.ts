import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// TikTok-SAFE username components (no betting terms!)
const TT_PREFIXES = [
  '', 'The', 'Its', 'Just', 'Real', 'Official', 'Hey', 'Hi',
]

const TT_THEMES = [
  'Sports', 'Games', 'Plays', 'Stats', 'Analysis', 'Insights', 'Trends',
  'Data', 'Numbers', 'Scores', 'Updates', 'News', 'Takes', 'Views',
]

const TT_ENDINGS = [
  '', 'HQ', 'Daily', 'Now', 'Live', 'Zone', 'Hub', 'Central',
  '24', '7', 'X', 'App', 'AI', 'Tech',
]

// TikTok-SAFE bio templates (subtle, no betting language!)
const TT_BIO_TEMPLATES = [
  '{emoji} AI-powered sports analysis {emoji2}',
  '{emoji} Smart sports insights {emoji2} Try the app',
  '{emoji} Sports predictions made easy {emoji2}',
  '{emoji} Your AI sports companion {emoji2}',
  '{emoji} Next-gen sports analysis {emoji2}',
  '{emoji} Sports meets AI {emoji2} Check it out',
  '{emoji} Smarter sports decisions {emoji2}',
  '{emoji} AI sports tech {emoji2} Link below',
  '{emoji} Sports analysis app {emoji2}',
  '{emoji} Data-driven sports content {emoji2}',
]

// Instagram bio templates (can be more direct, include App Store link)
const IG_BIO_TEMPLATES = [
  '{emoji} Snap a pic of ur bet and get instant AI analysis\n{emoji2} Download below',
  '{emoji} AI-powered bet analysis in seconds\n{emoji2} Get the app',
  '{emoji} Smart betting starts here\n{emoji2} Free app below',
  '{emoji} Your AI betting assistant\n{emoji2} Link in bio',
  '{emoji} Snap. Analyze. Win.\n{emoji2} Download the app',
  '{emoji} AI bet scanner & analyzer\n{emoji2} Try it free',
  '{emoji} Instant bet slip analysis\n{emoji2} App link below',
  '{emoji} Smarter bets with AI\n{emoji2} Get started free',
]

// Safe emojis (sports/tech focused, not gambling focused)
const SAFE_EMOJIS = [
  '📱', '🎯', '📊', '⚡', '🏆', '📈', '🔥', '💯', '🚀', '✨',
  '🏀', '🏈', '⚽', '🎾', '⚾', '🤖', '💡', '🧠',
]

const BET_AI_APP_LINK = 'https://apps.apple.com/app/bet-ai-sports-betting-scanner/id6742188829'

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function extractFirstName(fullName: string): string {
  // Get first name, handle edge cases
  const parts = fullName.trim().split(/\s+/)
  return parts[0] || 'User'
}

function generateInstagramUsername(firstName: string): string {
  // Format: firstname.betai or firstnameXX.betai
  const cleanName = firstName.toLowerCase().replace(/[^a-z]/g, '')
  const useNumber = Math.random() > 0.6
  const number = useNumber ? randomNumber(1, 99).toString() : ''

  return `@${cleanName}${number}.betai`
}

function generateTikTokUsername(firstName: string): string {
  // TikTok-safe username patterns (NO betting terms!)
  const cleanName = firstName.replace(/[^a-zA-Z]/g, '')
  const prefix = Math.random() > 0.7 ? randomItem(TT_PREFIXES) : ''
  const theme = randomItem(TT_THEMES)
  const ending = Math.random() > 0.5 ? randomItem(TT_ENDINGS) : ''
  const useNumber = Math.random() > 0.6
  const number = useNumber ? randomNumber(1, 99).toString() : ''

  // Different safe patterns
  const patterns = [
    `${cleanName}${theme}${ending}${number}`,
    `${prefix}${cleanName}${theme}${number}`,
    `${cleanName}${theme}${number}`,
    `${theme}${cleanName}${number}`,
    `${cleanName}${randomNumber(10, 99)}${theme}`,
    `${cleanName}${ending}${number}`,
  ]

  const username = randomItem(patterns)
    .replace(/\s+/g, '')
    .replace(/^(.)/g, (m) => m.toLowerCase())

  return `@${username}`
}

function generateTikTokBio(): string {
  const template = randomItem(TT_BIO_TEMPLATES)
  const emoji1 = randomItem(SAFE_EMOJIS)
  let emoji2 = randomItem(SAFE_EMOJIS)
  while (emoji2 === emoji1) {
    emoji2 = randomItem(SAFE_EMOJIS)
  }

  return template
    .replace('{emoji}', emoji1)
    .replace('{emoji2}', emoji2)
}

function generateInstagramBio(): string {
  const template = randomItem(IG_BIO_TEMPLATES)
  const emoji1 = randomItem(SAFE_EMOJIS)
  let emoji2 = randomItem(SAFE_EMOJIS)
  while (emoji2 === emoji1) {
    emoji2 = randomItem(SAFE_EMOJIS)
  }

  return template
    .replace('{emoji}', emoji1)
    .replace('{emoji2}', emoji2)
}

function generateProfilePicUrl(): string {
  const gender = Math.random() > 0.5 ? 'men' : 'women'
  const id = randomNumber(1, 99)
  return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    // Get user's name from request body
    const body = await req.json().catch(() => ({}))
    const fullName = body.fullName || body.full_name || 'User'
    const firstName = extractFirstName(fullName)

    // Generate Instagram profile
    const instagramProfile = {
      username: generateInstagramUsername(firstName),
      bio: generateInstagramBio(),
      appLink: BET_AI_APP_LINK,
    }

    // Generate TikTok profile (safe version)
    const tiktokProfile = {
      username: generateTikTokUsername(firstName),
      bio: generateTikTokBio(),
    }

    // Generate shared profile pic
    const profilePicUrl = generateProfilePicUrl()

    const result = {
      firstName,
      profilePicUrl,
      instagram: instagramProfile,
      tiktok: tiktokProfile,
    }

    console.log('Generated UGC profile:', result)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error: any) {
    console.error('UGC Profile generation error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
