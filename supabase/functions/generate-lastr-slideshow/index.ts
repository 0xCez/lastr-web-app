import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// ============================================
// DATA - Hooks, Overlays, CTAs, Captions
// ============================================

// Route-specific hooks (tips = instructive, story = emotional)
const TIPS_HOOKS = [
  "5 proven tips to last longer in bed (that actually work)",
  "If you want to stop finishing too fast, start with these 5 tips",
  "You can DOUBLE your stamina just by following these steps",
  "Stop rushing your climax — these habits will change everything",
  "Lasting longer is a skill. Here are the 5 things that rebuilt mine.",
  "5 quick moves to last longer tonight.",
  "5 real ways to take back control.",
  "The 5 things I do before every time.",
  "How I went from 2 minutes to 20.",
  "5 habits that changed everything for me.",
  "Master these 5 things. Last as long as you want.",
  "The 5-step routine that gave me control.",
  "5 techniques every man should know.",
  "This is how you stop finishing too fast.",
  "5 ways to build real stamina.",
]

const STORY_HOOKS = [
  "If you're scared of finishing too fast… this is for you.",
  "The anxiety of finishing early almost ruined my confidence.",
  "I was terrified of disappointing her again — until I fixed this.",
  "If lasting less than a minute feels humiliating, read this.",
  "Performance anxiety is real — here's how I finally got control.",
  "When panic hits mid-moment, here's how you steal back control.",
  "I used to dread the moment it started.",
  "The look on her face still haunts me.",
  "I promised myself it wouldn't happen again.",
  "That night changed everything for me.",
  "I was tired of making excuses.",
  "The shame was eating me alive.",
  "I knew I had to fix this — or lose her.",
  "Every time felt like a countdown.",
  "I finally stopped running from the problem.",
]

// Predefined overlay SETS for tips route (4 slides each)
// Each set tells a coherent mini-story
const TIPS_OVERLAY_SETS = [
  [
    "Start with deep breathing. Control begins there.",
    "Drop your shoulders. A tense body finishes faster.",
    "Lock your eyes on one point. Stop racing thoughts.",
    "Track every session. Lastr makes it easy.",
  ],
  [
    "Breathe in for 4. Out for 6. Repeat.",
    "Relax your jaw. Tension spreads fast.",
    "Switch rhythm before you hit the edge.",
    "Practice daily with Lastr. Results follow.",
  ],
  [
    "Slow your breathing the moment you feel rush.",
    "Unclench your fists. Release the pressure.",
    "Focus on her, not the finish line.",
    "Lastr trains you to stay in control.",
  ],
  [
    "4-7-8 breathing. Learn it. Use it.",
    "Your body tenses when panic hits. Soften it.",
    "Change position when intensity spikes.",
    "Build stamina daily inside Lastr.",
  ],
  [
    "Deep belly breaths reset your nervous system.",
    "Scan your body. Release what's tight.",
    "Slow down before you need to.",
    "Lastr is your stamina training ground.",
  ],
  [
    "Inhale through nose. Exhale through mouth.",
    "Relax your pelvic floor. Most men clench.",
    "Use the stop-start method early.",
    "Lastr guides you through every session.",
  ],
  [
    "Box breathing: 4 in, 4 hold, 4 out, 4 hold.",
    "Your shoulders hold stress. Drop them now.",
    "Focus on sensation, not performance.",
    "Train with Lastr. Show up prepared.",
  ],
  [
    "Control your breath = control the moment.",
    "A relaxed body lasts longer. Period.",
    "Rhythm changes keep you in the game.",
    "Lastr is how you build real confidence.",
  ],
  [
    "Master your breathing first. Everything else follows.",
    "Tight muscles are your enemy. Stay loose.",
    "When pressure builds, slow everything down.",
    "Daily practice in Lastr = lasting results.",
  ],
  [
    "Breathwork is the foundation of lasting longer.",
    "Release tension from your face and neck.",
    "Use pauses strategically. No shame in it.",
    "Lastr teaches you the techniques that work.",
  ],
]

// Predefined overlay SETS for story route (4 slides each)
// Each set tells an emotional arc
const STORY_OVERLAY_SETS = [
  [
    "Breathe slow when the rush spikes.",
    "Panic tells you tonight will end the same way.",
    "Shame shows up the second you start rushing.",
    "Lastr is where you rebuild that calm daily.",
  ],
  [
    "The fear hits before you even start.",
    "Your body remembers every time you lost control.",
    "You tell yourself 'not again' — but it happens.",
    "Lastr taught me how to rewrite that story.",
  ],
  [
    "That sinking feeling when you know it's happening.",
    "You try to think of anything else. It doesn't work.",
    "The silence after is the worst part.",
    "Lastr gave me the tools to finally change.",
  ],
  [
    "Your heart races. Your breath gets shallow.",
    "The countdown starts in your head.",
    "You see the disappointment before she says anything.",
    "Lastr helped me break the cycle for good.",
  ],
  [
    "You've tried distracting yourself. It never works.",
    "The anxiety makes everything worse.",
    "You avoid intimacy because of the fear.",
    "Lastr showed me there's another way.",
  ],
  [
    "The pressure builds the moment things start.",
    "You're fighting your own body the whole time.",
    "Control slips away no matter what you try.",
    "Lastr gave me back what I thought I'd lost.",
  ],
  [
    "Every time feels like a test you're about to fail.",
    "You've read the tips. They don't stick.",
    "Real change requires real practice.",
    "That's exactly what Lastr is built for.",
  ],
  [
    "The shame hits different when it keeps happening.",
    "You start believing this is just who you are.",
    "But it's not. It's a skill you never learned.",
    "Lastr teaches what no one else does.",
  ],
  [
    "You've made promises to yourself before.",
    "You've tried to 'just relax' — it doesn't work.",
    "Control isn't about willpower. It's about training.",
    "Lastr is where that training happens.",
  ],
  [
    "The fear of finishing fast runs the whole show.",
    "You're not present. You're just surviving.",
    "That's no way to experience intimacy.",
    "Lastr helped me show up differently.",
  ],
]

// CTA sentences for the final slide (repeated 8-10 times)
const CTA_SENTENCES = [
  "You promised yourself this wouldn't happen again.",
  "You know exactly why you can't slip again.",
  "You remember how it felt last time — never again.",
  "You know what losing control feels like.",
  "You still hear that moment replaying in your head.",
  "You know the feeling you're trying to avoid.",
  "You know the look she gave you — don't relive it.",
  "You remember how fast confidence can disappear.",
  "You know the moment you wish you could redo.",
  "You know exactly what night you're trying to forget.",
  "You've been here before. You know how it ends.",
  "You remember the silence that followed.",
  "You know the excuse you made last time.",
  "You felt it slipping away. Again.",
  "You swore you'd figure this out.",
]

// Image folders and their counts
const IMAGE_FOLDERS = {
  Health: { count: 11, extension: 'png' },    // Used for hook slide
  Couple: { count: 8, extension: 'png' },
  Muscle: { count: 11, extension: 'png' },
  Room: { count: 19, extension: 'png' },
  App: { count: 1, extension: 'png' },         // CTA slide only
}

// Middle slide folder options (for slides 2-5)
const MIDDLE_FOLDERS: Array<'Couple' | 'Muscle' | 'Room'> = ['Couple', 'Muscle', 'Room']

// Captions for TikTok/Instagram
const CAPTIONS = [
  "Stop guessing. Start training.\n\nThe app that finally helped me last longer.\n\n#lastr #staminatraining #lastlonger #confidence #menshealth",
  "This changed everything for me.\n\nSave this if you've ever felt the panic.\n\n#lastr #performanceanxiety #control #mensconfidence #lastlonger",
  "You're not broken. You just need practice.\n\nTry Lastr.\n\n#lastr #staminacoach #lastlongerinbed #mentalcontrol #confidence",
  "The secret nobody talks about.\n\nBreathing + rhythm + practice = control.\n\n#lastr #breathwork #stamina #lastlonger #menshealth",
  "I was tired of the same ending.\n\nLastr gave me my confidence back.\n\n#lastr #confidenceboost #staminatraining #control #menshealth",
  "Real talk: lasting longer is a skill.\n\nHere's how I trained mine.\n\n#lastr #menshealth #stamina #confidence #lastlonger",
  "The app I wish I had years ago.\n\nDon't wait like I did.\n\n#lastr #staminatraining #control #mensconfidence #lastlonger",
  "No pills. No tricks. Just practice.\n\nThat's what Lastr taught me.\n\n#lastr #naturalconfidence #stamina #lastlonger #menshealth",
  "Every man deserves to feel confident.\n\nLastr helps you get there.\n\n#lastr #confidence #staminacoach #control #menshealth",
  "Save this if you're tired of the same story.\n\nIt's time to rewrite it.\n\n#lastr #lastlonger #staminatraining #confidence #menshealth",
]

// ============================================
// TYPES
// ============================================

interface LastrSlide {
  screenNumber: number
  imagePath: string
  textOverlay: string[]
  isHook?: boolean
  isCTA?: boolean
}

interface LastrOutput {
  slides: LastrSlide[]
  caption: string
  route: string
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

function formatCtaSlide(sentence: string, repeatCount: number): string[] {
  const repeats = Math.max(8, Math.min(10, repeatCount))
  const lines: string[] = []
  for (let i = 0; i < repeats; i++) {
    lines.push(sentence)
  }
  lines.push('')
  lines.push('Try Lastr.')
  return lines
}

// ============================================
// MAIN GENERATION LOGIC
// ============================================

function generateLastrSlideshow(route?: string): LastrOutput {
  // Choose route if not specified
  const selectedRoute = route || getRandomItem(['tips', 'story'])

  // Get hook based on route
  const hooks = selectedRoute === 'tips' ? TIPS_HOOKS : STORY_HOOKS
  const hook = getRandomItem(hooks)

  // Get overlay set based on route
  const overlaySets = selectedRoute === 'tips' ? TIPS_OVERLAY_SETS : STORY_OVERLAY_SETS
  const overlays = getRandomItem(overlaySets)

  // Get random CTA sentence and repeat count
  const ctaSentence = getRandomItem(CTA_SENTENCES)
  const ctaRepeats = getRandomInt(8, 10)

  // Build slides array
  const slides: LastrSlide[] = []

  // Slide 1: Hook (Health image)
  slides.push({
    screenNumber: 1,
    imagePath: getRandomImagePath('Health'),
    textOverlay: [hook],
    isHook: true,
  })

  // Slides 2-5: Content overlays (random middle images)
  for (let i = 0; i < overlays.length; i++) {
    const folder = getRandomItem(MIDDLE_FOLDERS)
    slides.push({
      screenNumber: i + 2,
      imagePath: getRandomImagePath(folder),
      textOverlay: [overlays[i]],
    })
  }

  // Slide 6: CTA (App image)
  const ctaLines = formatCtaSlide(ctaSentence, ctaRepeats)
  slides.push({
    screenNumber: 6,
    imagePath: getRandomImagePath('App'),
    textOverlay: ctaLines,
    isCTA: true,
  })

  return {
    slides,
    caption: getRandomItem(CAPTIONS),
    route: selectedRoute,
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
    let route: string | undefined

    // Parse request body for route preference
    try {
      const body = await req.json()
      route = body.route // 'tips' or 'story'
    } catch {
      // No body or invalid JSON - will randomly select route
    }

    console.log(`Generating Lastr slideshow... route=${route || 'random'}`)

    const result = generateLastrSlideshow(route)

    console.log(`Generated Lastr slideshow with ${result.slides.length} slides (route: ${result.route})`)

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
