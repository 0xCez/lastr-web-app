import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// ============================================
// GPT INTEGRATION - Dynamic text generation
// ============================================

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const GPT_SYSTEM_PROMPT = `You are writing deeply personal, first-person confession-style text.

This content is for a men's self-improvement app called LASTR,
which helps men last longer in bed through breathing and body awareness.

This is NOT marketing.
This is NOT advice.
This is NOT explicit.

This is a personal realization.

TONE:
- Very personal
- Honest
- Slightly vulnerable
- Calm but direct
- Not dramatic
- Not macho
- Not inspirational

POINT OF VIEW:
- First person only ("I")
- Feels like a private thought
- Feels like something I've never said out loud

FORMAT:

SLIDE 1:
- One single sentence
- Written in first person
- A realization about relationships or being left
- Short
- Direct
- Emotional

You may start with ideas like (DO NOT COPY EXACTLY):
- "I discovered all the reasons she left me"
- "I realized I still had a choice"

SLIDE 2:
- 3 to 5 short lines
- Written in first person
- Each line describes frustration related to:
  - not lasting long enough
  - fear of disappointing girls
  - pressure during intimacy
  - feeling rushed
  - feeling ashamed or frustrated
- No explicit sexual language
- Focus on emotions, not acts

LANGUAGE RULES:
- Short sentences
- Simple words
- No medical terms
- No explanations
- No solutions
- No app mention
- No emojis

Write ONLY the on-screen text.
Write in English.

Return ONLY a JSON object with this structure:
{
  "slide1": "One single sentence for slide 1",
  "slide2": [
    "- first frustration line",
    "- second frustration line",
    "- third frustration line"
  ]
}

No markdown, no code blocks, just raw JSON.`

async function generateLandscapeTextWithGPT(): Promise<any> {
  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY not found in environment')
    throw new Error('OpenAI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: GPT_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: 'Generate a new 2-slide confession-style slideshow.'
        }
      ],
      temperature: 0.9,
      max_tokens: 400,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenAI API error:', error)
    throw new Error(`OpenAI API failed: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content?.trim()

  if (!content) {
    throw new Error('No content generated from GPT')
  }

  // Parse JSON from GPT response
  try {
    return JSON.parse(content)
  } catch (e) {
    console.error('Failed to parse GPT response as JSON:', content)
    throw new Error('Invalid JSON from GPT')
  }
}

// ============================================
// FALLBACK DATA - In case GPT fails
// ============================================

const LANDSCAPE_SETS = [
  {
    slide1: "I discovered all the reasons she left me",
    slide2: [
      "- I felt rushed every time (even when I tried to hide it)",
      "- I was scared of disappointing her (so I stayed quiet)",
      "- I pretended it didn't affect me (but it did)",
      "- I carried the frustration alone"
    ]
  },
  {
    slide1: "I realized I still had a choice",
    slide2: [
      "- I hated feeling out of control (it followed me everywhere)",
      "- I avoided getting close (to avoid the pressure)",
      "- I feared the same ending again (so I held back)",
      "- I stayed silent about it"
    ]
  },
  {
    slide1: "I discovered what was holding me back",
    slide2: [
      "- I rushed intimacy (because I was anxious)",
      "- I feared letting her down (every single time)",
      "- I felt ashamed after (even if she said nothing)",
      "- I told myself it was \"normal\""
    ]
  },
  {
    slide1: "I finally understood why I pulled away",
    slide2: [
      "- I felt pressure instead of connection",
      "- I was scared of losing control",
      "- I avoided real closeness",
      "- I never talked about it"
    ]
  },
  {
    slide1: "I realized the real problem wasn't her",
    slide2: [
      "- I finished too fast (and it killed my confidence)",
      "- I avoided intimacy (because I knew what would happen)",
      "- I made excuses (instead of facing it)",
      "- I felt ashamed every time"
    ]
  },
  {
    slide1: "I discovered what I was running from",
    slide2: [
      "- I couldn't last long enough (it affected everything)",
      "- I feared her disappointment (so I pulled away first)",
      "- I carried the shame alone (never said a word)",
      "- I told myself she wouldn't understand"
    ]
  },
]

// Captions
const LANDSCAPE_CAPTIONS = [
  "I didn't realize how much this was affecting me until I saw it written down.\n\n#lastr #menshealth #honesty #vulnerability #realizations",
  "These are the things I never said out loud.\n\n#lastr #confession #mensconfidence #intimacy #truth",
  "I wish I had figured this out sooner.\n\n#lastr #reflection #menshealth #personalgrowth #honesty",
  "This is what I discovered when I stopped pretending.\n\n#lastr #vulnerability #mentalhealth #intimacy #awareness",
  "The moment I finally understood what was holding me back.\n\n#lastr #selfawareness #menshealth #relationships #truth",
]

// ============================================
// TYPES
// ============================================

interface LandscapeSlide {
  screenNumber: number
  imagePath: string
  textOverlay: string[]
  isHook?: boolean
}

interface LandscapeOutput {
  slides: LandscapeSlide[]
  caption: string
  generatedAt: string
}

// ============================================
// HELPERS
// ============================================

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomLandscapeImage(): string {
  const imageIndex = getRandomInt(1, 9) // 9 landscape images
  return `/images/Lastr_pics/landscape/${imageIndex}.png`
}

// ============================================
// MAIN GENERATION LOGIC
// ============================================

async function generateLandscapeSlideshow(): Promise<LandscapeOutput> {
  let selectedContent: { slide1: string; slide2: string[] }

  // Try to generate with GPT first
  try {
    console.log('Attempting to generate landscape text with GPT...')
    selectedContent = await generateLandscapeTextWithGPT()
    console.log('Successfully generated landscape text with GPT')
  } catch (error) {
    console.error('GPT generation failed, falling back to hardcoded sets:', error)
    // Fallback to random hardcoded set
    selectedContent = getRandomItem(LANDSCAPE_SETS)
  }

  // Build slides array with unique images
  const slides: LandscapeSlide[] = []
  const usedImages = new Set<string>()

  // Helper to get unique image
  const getUniqueImage = (): string => {
    let imagePath: string
    let attempts = 0
    do {
      imagePath = getRandomLandscapeImage()
      attempts++
      // Prevent infinite loop if all images are used (shouldn't happen with 9 images and 2 slides)
      if (attempts > 50) break
    } while (usedImages.has(imagePath))
    usedImages.add(imagePath)
    return imagePath
  }

  // Slide 1 (Hook)
  slides.push({
    screenNumber: 1,
    imagePath: getUniqueImage(),
    textOverlay: [selectedContent.slide1],
    isHook: true,
  })

  // Slide 2 (Realizations list)
  slides.push({
    screenNumber: 2,
    imagePath: getUniqueImage(),
    textOverlay: selectedContent.slide2,
    isHook: false,
  })

  return {
    slides,
    caption: getRandomItem(LANDSCAPE_CAPTIONS),
    generatedAt: new Date().toISOString(),
  }
}

// ============================================
// HTTP HANDLER
// ============================================

serve(async (req) => {
  // Handle CORS preflight
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
    console.log('Generating Landscape slideshow...')

    const result = await generateLandscapeSlideshow()

    console.log(`Generated Landscape slideshow with ${result.slides.length} slides`)

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Generation failed'
    console.error('Generation error:', error)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    })
  }
})
