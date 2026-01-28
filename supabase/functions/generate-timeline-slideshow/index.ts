import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// ============================================
// GPT INTEGRATION - Dynamic text generation
// ============================================

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const GPT_SYSTEM_PROMPT = `You are generating ultra-short, emotionally direct slideshow text for TikTok / Instagram.

The app is called LASTR.
It helps men regain control and confidence through breathing, pelvic floor awareness, and nervous system regulation.

IMPORTANT:
This content must speak DIRECTLY to the reader.
Every line must address the reader using "you".

This is not marketing.
This is not advice.
This is not explanation.

This should feel like:
- the app is talking to the reader's inner voice
- something personal
- something slightly uncomfortable but true

LANGUAGE RULES (STRICT):
- Use "you" in EVERY line
- 2–5 words per line MAX
- Short, simple words only
- No technical terms
- No sexual or explicit language
- No guarantees
- No hype
- No emojis
- No benefits explanation
- No app features

FORMAT RULES (MANDATORY):
- 5 slides total
- Each slide starts with a header:
  DAY 1–3
  DAY 3–7
  DAY 7–14
  DAY 14–30
  FINAL
- Each slide has 2–4 very short lines
- Each line is a direct statement to the reader

CONTENT DIRECTION PER SLIDE:

DAY 1–3:
- You becoming aware
- You feeling less shame about intimacy
- You noticing fear or tension around women

DAY 3–7:
- You feeling calmer with women
- You feeling less pressure during intimacy
- You starting to feel control
- You connecting better

DAY 7–14:
- You enjoying intimacy more
- You being more present with her
- More connections with women
- You start dating again
- You connecting more easily

DAY 14–30 (VERY IMPORTANT):
- You are clear of shame
- You feel confident keeping a girl
- You don't fear that moment anymore
- You feel no fear with women
- You feel emotionally stable in relationships

FINAL SLIDE (VERY IMPORTANT):
- ONE short sentence only
- 2–4 words maximum
- Must speak directly to "you"
- Quiet FOMO or life shift
- Examples of direction (do NOT copy exactly):
  "You're missing out"
  "Give yourself a chance"
  "Start living"
  "This could be you"

FINAL SLIDE WILL BE PLACED OVER AN IMAGE OF THE LASTR APP INTERFACE.

Do NOT explain anything.
Do NOT add a call to action.
Write ONLY the on-screen text.
Write in English.

Return ONLY a JSON object with this structure:
{
  "slides": [
    {"header": "DAY 1–3", "lines": ["line1", "line2", "line3"]},
    {"header": "DAY 3–7", "lines": ["line1", "line2"]},
    {"header": "DAY 7–14", "lines": ["line1", "line2", "line3"]},
    {"header": "DAY 14–30", "lines": ["line1", "line2"]},
    {"header": "FINAL", "lines": ["one short line"]}
  ]
}

No markdown, no code blocks, just raw JSON.`

async function generateTimelineTextWithGPT(): Promise<any> {
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
          content: 'Generate a new 5-slide timeline slideshow about the transformation journey.'
        }
      ],
      temperature: 0.9,
      max_tokens: 600,
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

// Timeline progression sets (each set is a complete 5-slide story)
// Slide format: [header, line1, line2, line3 (optional), line4 (optional)]
const TIMELINE_SETS = [
  {
    slides: [
      {
        header: "DAY 1–3",
        lines: [
          "You notice the difference immediately.",
          "Something feels off.",
          "Your body isn't responding the way you expected.",
        ],
      },
      {
        header: "DAY 3–7",
        lines: [
          "The discomfort starts to ease.",
          "You catch yourself thinking about it less.",
          "Control feels… possible.",
        ],
      },
      {
        header: "DAY 7–14",
        lines: [
          "You stop doubting it.",
          "The panic doesn't show up anymore.",
          "You trust your body again.",
        ],
      },
      {
        header: "DAY 14–30",
        lines: [
          "It's automatic now.",
          "You don't think about the timing.",
          "You're just present.",
        ],
      },
      {
        header: "",
        lines: [
          "This is what you've been missing.",
        ],
      },
    ],
  },
  {
    slides: [
      {
        header: "DAY 1–3",
        lines: [
          "The first session feels awkward.",
          "You're self-conscious.",
          "Nothing clicks yet.",
        ],
      },
      {
        header: "DAY 3–7",
        lines: [
          "You start to see patterns.",
          "Your breathing changes first.",
          "Then your tension follows.",
        ],
      },
      {
        header: "DAY 7–14",
        lines: [
          "Confidence builds quietly.",
          "You stop rushing.",
          "You stop overthinking.",
        ],
      },
      {
        header: "DAY 14–30",
        lines: [
          "The fear is gone.",
          "You show up calm.",
          "You stay in control.",
        ],
      },
      {
        header: "",
        lines: [
          "You wasted years avoiding this.",
        ],
      },
    ],
  },
  {
    slides: [
      {
        header: "DAY 1–3",
        lines: [
          "You're skeptical.",
          "This feels like another failed attempt.",
          "But you commit anyway.",
        ],
      },
      {
        header: "DAY 3–7",
        lines: [
          "Small shifts start happening.",
          "You last 30 seconds longer.",
          "It's subtle but it's real.",
        ],
      },
      {
        header: "DAY 7–14",
        lines: [
          "The improvement compounds.",
          "Your body remembers the training.",
          "You feel stable.",
        ],
      },
      {
        header: "DAY 14–30",
        lines: [
          "You're not the same person.",
          "The anxiety is a distant memory.",
          "You own the moment now.",
        ],
      },
      {
        header: "",
        lines: [
          "You could've started months ago.",
        ],
      },
    ],
  },
  {
    slides: [
      {
        header: "DAY 1–3",
        lines: [
          "Your breath is shallow.",
          "Your muscles are tight.",
          "You finish before you want to.",
        ],
      },
      {
        header: "DAY 3–7",
        lines: [
          "You learn to slow your breathing.",
          "Your body starts to relax.",
          "Control becomes tangible.",
        ],
      },
      {
        header: "DAY 7–14",
        lines: [
          "You stop fearing the rush.",
          "You know how to ride it now.",
          "You're in command.",
        ],
      },
      {
        header: "DAY 14–30",
        lines: [
          "Lasting longer isn't luck anymore.",
          "It's a skill you own.",
          "You decide when.",
        ],
      },
      {
        header: "",
        lines: [
          "Everyone else is still guessing.",
        ],
      },
    ],
  },
  {
    slides: [
      {
        header: "DAY 1–3",
        lines: [
          "The shame keeps you from trying.",
          "You avoid intimacy.",
          "You make excuses.",
        ],
      },
      {
        header: "DAY 3–7",
        lines: [
          "You face it head-on.",
          "The first breakthrough happens.",
          "Hope replaces dread.",
        ],
      },
      {
        header: "DAY 7–14",
        lines: [
          "You show up differently.",
          "She notices.",
          "You notice.",
        ],
      },
      {
        header: "DAY 14–30",
        lines: [
          "You're not hiding anymore.",
          "Confidence radiates naturally.",
          "You're finally free.",
        ],
      },
      {
        header: "",
        lines: [
          "Most guys never make it here.",
        ],
      },
    ],
  },
  {
    slides: [
      {
        header: "DAY 1–3",
        lines: [
          "You feel exposed.",
          "Every second counts.",
          "The pressure is suffocating.",
        ],
      },
      {
        header: "DAY 3–7",
        lines: [
          "You start understanding triggers.",
          "Breath control becomes instinct.",
          "The edge softens.",
        ],
      },
      {
        header: "DAY 7–14",
        lines: [
          "You trust the process.",
          "Results become consistent.",
          "Panic is replaced by calm.",
        ],
      },
      {
        header: "DAY 14–30",
        lines: [
          "You last as long as you choose.",
          "No tricks. No distractions.",
          "Just mastery.",
        ],
      },
      {
        header: "",
        lines: [
          "This should've been taught years ago.",
        ],
      },
    ],
  },
  {
    slides: [
      {
        header: "DAY 1–3",
        lines: [
          "Everything feels rushed.",
          "You're fighting your own biology.",
          "You lose every time.",
        ],
      },
      {
        header: "DAY 3–7",
        lines: [
          "You discover the pause.",
          "Slowing down changes everything.",
          "Control enters the picture.",
        ],
      },
      {
        header: "DAY 7–14",
        lines: [
          "Your body responds differently.",
          "Tension releases on command.",
          "You feel the shift.",
        ],
      },
      {
        header: "DAY 14–30",
        lines: [
          "Lasting longer becomes effortless.",
          "You stop watching the clock.",
          "You're fully present.",
        ],
      },
      {
        header: "",
        lines: [
          "You've been one decision away this whole time.",
        ],
      },
    ],
  },
  {
    slides: [
      {
        header: "DAY 1–3",
        lines: [
          "You don't believe it'll work.",
          "You've tried everything else.",
          "This feels like a last resort.",
        ],
      },
      {
        header: "DAY 3–7",
        lines: [
          "The first real improvement appears.",
          "You stop doubting.",
          "Something is actually changing.",
        ],
      },
      {
        header: "DAY 7–14",
        lines: [
          "Progress stacks quietly.",
          "Each session builds on the last.",
          "You see the path now.",
        ],
      },
      {
        header: "DAY 14–30",
        lines: [
          "You've rewritten your story.",
          "The old version feels distant.",
          "You're a different man.",
        ],
      },
      {
        header: "",
        lines: [
          "You'll wish you started earlier.",
        ],
      },
    ],
  },
]

// Image folders and their counts (same as Lastr)
const IMAGE_FOLDERS = {
  Health: { count: 11, extension: 'jpeg' },
  Couple: { count: 8, extension: 'jpeg' },
  Muscle: { count: 11, extension: 'jpeg' },
  Room: { count: 10, extension: 'jpeg' },
  Mirror: { count: 7, extension: 'jpg' },
  Stress: { count: 5, extension: 'jpeg' },
  Aesthetic: { count: 8, extension: 'jpeg' },
}

// Middle slide folder options
const TIMELINE_FOLDERS: Array<keyof typeof IMAGE_FOLDERS> = [
  'Couple', 'Muscle', 'Room', 'Mirror', 'Stress', 'Aesthetic'
]

// Captions
const TIMELINE_CAPTIONS = [
  "30 days. That's all it took.\n\nThis is the timeline no one talks about.\n\n#lastr #30dayjourney #staminatraining #menshealth #confidence",
  "Your first 30 days will change everything.\n\nThis is what it actually looks like.\n\n#lastr #transformation #lastlonger #mensconfidence #realresults",
  "I tracked every day. Here's what happened.\n\nSave this if you're ready to commit.\n\n#lastr #progresstracking #staminacoach #menshealth #control",
  "The first week is the hardest. Then...\n\nThis is the timeline that rebuilt my confidence.\n\n#lastr #confidencejourney #menshealth #stamina #lastlonger",
  "From panic to control in 30 days.\n\nThis is the path I wish I found sooner.\n\n#lastr #anxietytoconfidence #staminatraining #menshealth #transformation",
  "Most guys give up after day 3.\n\nHere's what you miss if you quit.\n\n#lastr #commitment #stamina #mensconfidence #realresults",
  "30 days of intentional training.\n\nThis is what discipline looks like.\n\n#lastr #dailypractice #staminacoach #menshealth #control",
  "Every day mattered. Here's the breakdown.\n\nYour timeline starts today.\n\n#lastr #daybyDay #transformation #menshealth #confidence",
]

// ============================================
// TYPES
// ============================================

interface TimelineSlide {
  screenNumber: number
  imagePath: string
  textOverlay: string[]
  isHook?: boolean
  isFinal?: boolean
}

interface TimelineOutput {
  slides: TimelineSlide[]
  caption: string
  format: string
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

function getRandomImagePath(folder: keyof typeof IMAGE_FOLDERS): string {
  const { count, extension } = IMAGE_FOLDERS[folder]
  const imageIndex = getRandomInt(1, count)
  return `/images/Lastr_pics/${folder}/${imageIndex}.${extension}`
}

// ============================================
// MAIN GENERATION LOGIC
// ============================================

async function generateTimelineSlideshow(): Promise<TimelineOutput> {
  let selectedSet: { slides: Array<{ header: string; lines: string[] }> }

  // Try to generate with GPT first
  try {
    console.log('Attempting to generate timeline text with GPT...')
    selectedSet = await generateTimelineTextWithGPT()
    console.log('Successfully generated timeline text with GPT')
  } catch (error) {
    console.error('GPT generation failed, falling back to hardcoded sets:', error)
    // Fallback to random hardcoded set
    selectedSet = getRandomItem(TIMELINE_SETS)
  }

  // Build slides array
  const slides: TimelineSlide[] = []

  selectedSet.slides.forEach((slideData, index) => {
    // Determine image folder based on slide position
    let imagePath: string
    if (index === 0) {
      // Slide 1: Room
      imagePath = getRandomImagePath('Room')
    } else if (index === 1) {
      // Slide 2: Health
      imagePath = getRandomImagePath('Health')
    } else if (index === 2) {
      // Slide 3: Muscle
      imagePath = getRandomImagePath('Muscle')
    } else if (index === 3) {
      // Slide 4: Mirror
      imagePath = getRandomImagePath('Mirror')
    } else if (index === 4) {
      // Slide 5: Specific App image (2.jpg)
      imagePath = '/images/Lastr_pics/App/2.jpg'
    } else {
      // Fallback (shouldn't happen with 5 slides)
      imagePath = getRandomImagePath('Health')
    }

    // Build text overlay
    const textOverlay: string[] = []
    if (slideData.header) {
      textOverlay.push(slideData.header)
      textOverlay.push('') // Empty line after header
    }
    textOverlay.push(...slideData.lines)

    slides.push({
      screenNumber: index + 1,
      imagePath,
      textOverlay,
      isHook: index === 0,
      isFinal: index === 4,
    })
  })

  return {
    slides,
    caption: getRandomItem(TIMELINE_CAPTIONS),
    format: 'timeline',
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
    console.log('Generating Timeline slideshow...')

    const result = await generateTimelineSlideshow()

    console.log(`Generated Timeline slideshow with ${result.slides.length} slides`)

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
