import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// LASTR creator names
const LASTR_NAMES = [
  'Kai', 'Jace', 'Zay', 'Zayn', 'Jay', 'Trey', 'Tre', 'AJ', 'CJ', 'MJ',
  'Ty', 'Tyree', 'Malik', 'Jamal', 'DeAndre', 'Andre', 'Darius', 'Marcus',
  'Isaiah', 'Zion', 'KJ', 'RJ', 'LJ', 'Nas', 'Amir', 'Kareem', 'Devon',
  'Deshaun', 'Terrence', 'Quincy', 'Reece', 'Myles', 'Jalen', 'Jaylen', 'Jayson',
  'Luke', 'Nick', 'Will', 'Alex', 'Ryan', 'Connor', 'Hunter', 'Chase',
  'Austin', 'Grant', 'Jack', 'Tanner', 'Parker', 'Owen', 'Carter', 'Cooper',
  'Brady', 'Drew', 'Trevor', 'Caleb', 'Zeke', 'Kaden', 'Jax', 'Knox',
  'Beau', 'Soren', 'Tate', 'Rocco', 'Cruz', 'Easton', 'Baylor'
]

// LASTR bio templates
const LASTR_BIO_TEMPLATES = [
  'No more 30 seconds bro {emoji}\nBreath. Control. Lastr',
  'Mind > body > control\nLastr',
  'Stop stressing. Start Lasting.\nLastr',
  'Train your body, not your excuses\nLASTR',
  'Built for men who overthink\nLastr {emoji}',
  'You\'re not broken\njust rushed\nLASTR',
  'Panic ruins moments\nLastr Fixes them',
  'Men don\'t talk about it\nLASTR does...',
]

// Emojis for LASTR bios
const LASTR_EMOJIS = [
  '💪', '🔥', '⚡', '🧠', '💯', '🎯', '⏱️', '🚀', '✨', '💎',
  '🧘', '🧘‍♂️', '💭', '🤔', '😤', '😮‍💨', '🫁', '🌬️', '🔒', '⚙️',
]

// Total number of profile pics available
const TOTAL_PROFILE_PICS = 18

// Track last used pic to avoid repetition
let lastUsedPicNumber = 0

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateUsername(name: string): string {
  // Format: name.lastr (lowercase)
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '')
  return `@${cleanName}.lastr`
}

function generateBio(): string {
  const template = randomItem(LASTR_BIO_TEMPLATES)

  // Replace emoji placeholder if present
  if (template.includes('{emoji}')) {
    const emoji = randomItem(LASTR_EMOJIS)
    return template.replace('{emoji}', emoji)
  }

  return template
}

function generateProfilePicUrl(): string {
  // Pick a random number between 1 and TOTAL_PROFILE_PICS
  let picNumber = randomNumber(1, TOTAL_PROFILE_PICS)

  // If same as last used, try to get a different one
  if (picNumber === lastUsedPicNumber && TOTAL_PROFILE_PICS > 1) {
    picNumber = (picNumber % TOTAL_PROFILE_PICS) + 1
  }

  lastUsedPicNumber = picNumber

  return `/images/Profile pic/${picNumber}.jpeg`
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
    const name = randomItem(LASTR_NAMES)
    const username = generateUsername(name)
    const bio = generateBio()
    const profilePicUrl = generateProfilePicUrl()

    const profile = {
      name,
      username,
      bio,
      profilePicUrl,
    }

    console.log('Generated LASTR profile:', profile)

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
