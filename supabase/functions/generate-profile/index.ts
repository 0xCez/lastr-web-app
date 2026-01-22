import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// First names pool
const FIRST_NAMES = [
  'Alex', 'Jordan', 'Chris', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn',
  'Blake', 'Drew', 'Jamie', 'Avery', 'Cameron', 'Dakota', 'Hayden', 'Kendall',
  'Mike', 'Jake', 'Tyler', 'Ryan', 'Matt', 'Nick', 'Josh', 'Kyle',
  'Marcus', 'Derek', 'Trey', 'Damon', 'Vince', 'Chase', 'Cole', 'Bryce',
  'Leo', 'Max', 'Ace', 'Kai', 'Jax', 'Rex', 'Zach', 'Dean',
]

// Username prefixes
const USERNAME_PREFIXES = [
  '', 'The', 'Official', 'Real', 'Its', 'Just', 'Big', 'Lil',
]

// Username suffixes/themes
const USERNAME_THEMES = [
  'Picks', 'Bets', 'Tips', 'Locks', 'Plays', 'Winners', 'Capper', 'Sharp',
  'Betting', 'Parlays', 'Props', 'Lines', 'Odds', 'Action', 'Edge', 'Value',
]

// Username endings
const USERNAME_ENDINGS = [
  '', 'HQ', 'Daily', 'King', 'Boss', 'Pro', 'SZN', 'Gang', 'Club', 'Zone',
  '24', '7', '365', 'X', 'Official', 'Live', 'Now',
]

// Bio templates
const BIO_TEMPLATES = [
  '{emoji} Sports betting content {emoji2} Free picks daily',
  '{emoji} Betting tips & analysis {emoji2} Let\'s eat',
  '{emoji} Daily locks {emoji2} Trust the process',
  '{emoji} Sharp plays only {emoji2} Fade at your own risk',
  '{emoji} Free picks {emoji2} Premium available',
  '{emoji} Sports betting made simple {emoji2} Follow for wins',
  '{emoji} Data-driven picks {emoji2} No cap',
  '{emoji} Betting content creator {emoji2} DM for collabs',
  '{emoji} Lock of the day every day {emoji2} Let\'s ride',
  '{emoji} Sports analyst {emoji2} Picks that hit different',
  '{emoji} Betting the smart way {emoji2} Join the movement',
  '{emoji} Your favorite bettor\'s favorite bettor {emoji2}',
  '{emoji} Making betting fun again {emoji2} NFA',
  '{emoji} Locks on locks {emoji2} Tail or fade',
  '{emoji} Sports content {emoji2} Entertainment only',
]

// Emojis for bios
const BIO_EMOJIS = [
  '🎯', '💰', '🔥', '📈', '🏆', '⚡', '💎', '🎰', '🤑', '📊',
  '🏀', '🏈', '⚽', '🎲', '👑', '💵', '🚀', '✨', '💯', '🔒',
]

// Profile pic URLs (using UI Faces / randomuser style URLs)
const PROFILE_PIC_STYLES = [
  'https://randomuser.me/api/portraits/men/',
  'https://randomuser.me/api/portraits/women/',
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateUsername(name: string): string {
  const usePrefix = Math.random() > 0.6
  const prefix = usePrefix ? randomItem(USERNAME_PREFIXES) : ''
  const theme = randomItem(USERNAME_THEMES)
  const useEnding = Math.random() > 0.4
  const ending = useEnding ? randomItem(USERNAME_ENDINGS) : ''
  const useNumber = Math.random() > 0.7
  const number = useNumber ? randomNumber(1, 99).toString() : ''

  // Different username patterns
  const patterns = [
    `${name}${theme}${ending}${number}`,
    `${prefix}${name}${theme}${number}`,
    `${name}The${theme}${ending}`,
    `${theme}${name}${number}`,
    `${prefix}${theme}${name}`,
    `${name}${randomNumber(10, 99)}${theme}`,
  ]

  const username = randomItem(patterns)
    .replace(/\s+/g, '')
    .replace(/^(.)/g, (m) => m.toLowerCase())

  return `@${username}`
}

function generateBio(): string {
  const template = randomItem(BIO_TEMPLATES)
  const emoji1 = randomItem(BIO_EMOJIS)
  let emoji2 = randomItem(BIO_EMOJIS)
  while (emoji2 === emoji1) {
    emoji2 = randomItem(BIO_EMOJIS)
  }

  return template
    .replace('{emoji}', emoji1)
    .replace('{emoji2}', emoji2)
}

function generateProfilePicUrl(): string {
  const style = randomItem(PROFILE_PIC_STYLES)
  const id = randomNumber(1, 99)
  return `${style}${id}.jpg`
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
    const name = randomItem(FIRST_NAMES)
    const username = generateUsername(name)
    const bio = generateBio()
    const profilePicUrl = generateProfilePicUrl()

    const profile = {
      name,
      username,
      bio,
      profilePicUrl,
    }

    console.log('Generated profile:', profile)

    return new Response(JSON.stringify(profile), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error: any) {
    console.error('Profile generation error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
