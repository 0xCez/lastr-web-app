import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// ============================================
// DATA - Hooks, Apps, Categories
// ============================================

// Generic hooks (no sport specified)
const GENERIC_HOOKS = [
  "POV: You finally stop losing money on bets",
  "The apps your bookie prays you never find",
  "I was mass betting until I found these 5 apps",
  "Nobody talks about these betting apps...",
  "Delete your sportsbook if you don't have these",
  "Why do sharps always win? These 5 apps.",
  "The betting cheat codes they don't teach you",
  "I turned $50 into my rent using these apps",
  "Wait... you're still betting without these?",
  "The 5 apps I check before EVERY single bet",
  "How I went from -$2K to profitable in 30 days",
  "Sportsbooks HATE when you use these apps",
  "This is why you keep losing your parlays",
  "5 apps. That's it. That's the whole system.",
  "The apps separating winners from everyone else",
  "You're literally throwing money away without these",
  "My friend showed me these and I haven't lost since",
  "These apps see lines the books don't want you to see",
  "Stop gambling. Start investing in sports.",
  "The toolkit that turned betting into a side hustle",
]

// Sport-specific hooks
const SPORT_HOOKS: Record<string, string[]> = {
  NFL: [
    "POV: You finally start hitting NFL props",
    "Sunday Funday hits different with these apps",
    "Why your NFL parlays keep dying (and how to fix it)",
    "The NFL betting apps Vegas doesn't want you to know",
    "I turned $20 into $400 on Sunday using these",
    "Stop losing your NFL bets. Seriously.",
    "The 5 apps open on my phone every Sunday",
    "NFL sharps don't guess. They use these.",
    "Your bookie hates when you use these for NFL",
    "How I went 7-2 last Sunday using these apps",
    "NFL season is here. Are you ready or nah?",
    "The cheat codes for NFL player props",
  ],
  NBA: [
    "POV: You finally understand NBA props",
    "Why your NBA bets keep losing (fix it now)",
    "The NBA betting apps the books fear",
    "I hit a 5-leg NBA parlay using these apps",
    "Stop guessing NBA props. Start winning.",
    "The 5 apps I check before every NBA game",
    "NBA sharps have been hiding these from you",
    "How I turned NBA betting into a side hustle",
    "Your NBA bets are cooked without these apps",
    "The cheat codes for NBA player props",
    "Game night hits different with these apps",
    "Why do NBA sharps always win? These 5 apps.",
  ],
  MLB: [
    "POV: Baseball betting finally makes sense",
    "The MLB apps your bookie prays you never find",
    "Why your baseball bets keep dying",
    "I hit 4 straight MLB unders using these apps",
    "Stop guessing pitcher props. Start winning.",
    "The 5 apps I check before every MLB game",
    "MLB sharps don't guess. They use these.",
    "How I turned $50 into $500 on baseball",
    "The cheat codes for MLB player props",
    "Summer betting hits different with these apps",
  ],
  UFC: [
    "POV: You finally start hitting UFC bets",
    "Fight night hits different with these apps",
    "The UFC betting apps the books don't want you to have",
    "I called the last 3 upsets using these apps",
    "Stop guessing fight outcomes. Start winning.",
    "The 5 apps I check before every UFC card",
    "MMA sharps have been hiding these from you",
    "How I turned $100 into $1K on one fight night",
    "Your UFC bets are cooked without these apps",
    "The cheat codes for MMA betting",
  ],
  SOCCER: [
    "POV: Football betting finally clicks",
    "Match day hits different with these apps",
    "The football betting apps bookies hate",
    "I hit a 6-fold acca using these apps",
    "Stop guessing goal scorers. Start winning.",
    "The 5 apps I check before every match",
    "Football sharps don't guess. They use these.",
    "How I turned betting into match day income",
    "Your football bets are cooked without these",
    "The cheat codes for Premier League betting",
    "Why do sharps always win? These 5 apps.",
  ],
}

interface AppInfo {
  id: string
  name: string
  imageCount: number
  isSportApp?: boolean
  sport?: string
}

const APPS: Record<string, AppInfo> = {
  betai: { id: "betai", name: "Bet.AI", imageCount: 6 },
  betanalytix: { id: "betanalytix", name: "Bet-Analytix", imageCount: 4 },
  betspark: { id: "betspark", name: "BetSpark", imageCount: 6 },
  bettingtips: { id: "bettingtips", name: "Betting Tips", imageCount: 4 },
  betty: { id: "betty", name: "Betty", imageCount: 7 },
  bleacherreport: { id: "bleacherreport", name: "Bleacher Report", imageCount: 7 },
  gotips: { id: "gotips", name: "Go Tips", imageCount: 4 },
  hof: { id: "hof", name: "HOF", imageCount: 4 },
  juicereel: { id: "juicereel", name: "Juice Reel", imageCount: 4 },
  linemate: { id: "linemate", name: "Line Mate", imageCount: 5 },
  liveodds: { id: "liveodds", name: "Live Odds", imageCount: 4 },
  matchedbettingtracker: { id: "matchedbettingtracker", name: "Matched Betting Tracker", imageCount: 5 },
  mlb: { id: "mlb", name: "MLB", imageCount: 4, isSportApp: true, sport: "MLB" },
  nba: { id: "nba", name: "NBA", imageCount: 4, isSportApp: true, sport: "NBA" },
  nfl: { id: "nfl", name: "NFL", imageCount: 4, isSportApp: true, sport: "NFL" },
  oddsjam: { id: "oddsjam", name: "OddsJam", imageCount: 5 },
  onefootball: { id: "onefootball", name: "OneFootball", imageCount: 4, isSportApp: true, sport: "SOCCER" },
  optimalbet: { id: "optimalbet", name: "Optimal Bet", imageCount: 6 },
  pikkit: { id: "pikkit", name: "Pikkit", imageCount: 4 },
  rotogrinders: { id: "rotogrinders", name: "RotoGrinders", imageCount: 4 },
  scoresandodds: { id: "scoresandodds", name: "ScoresAndOdds", imageCount: 4 },
  smartbets: { id: "smartbets", name: "Smart Bets", imageCount: 5 },
  sofascore: { id: "sofascore", name: "Sofascore", imageCount: 4 },
  tejtips: { id: "tejtips", name: "TejTips", imageCount: 4 },
  thescore: { id: "thescore", name: "The Score", imageCount: 4 },
  ufc: { id: "ufc", name: "UFC", imageCount: 4, isSportApp: true, sport: "UFC" },
}

// Map sport to its app ID
const SPORT_TO_APP: Record<string, string> = {
  NFL: "nfl",
  NBA: "nba",
  MLB: "mlb",
  UFC: "ufc",
  SOCCER: "onefootball",
}

interface Category {
  id: string
  label: string
  apps: string[]
}

const CATEGORIES: Category[] = [
  {
    id: "odds_comparison",
    label: "Line Shopping & Odds",
    apps: ["oddsjam", "scoresandodds", "linemate", "optimalbet", "betai"],
  },
  {
    id: "ai_analysis",
    label: "AI Models & Analysis",
    apps: ["betai", "betanalytix", "smartbets", "optimalbet"],
  },
  {
    id: "stats_data",
    label: "Live Scores & Stats",
    apps: ["sofascore", "thescore", "liveodds", "bleacherreport", "rotogrinders", "betai"],
  },
  {
    id: "sharp_sentiment",
    label: "Sharp Money & Sentiment",
    apps: ["tejtips", "scoresandodds", "hof", "betai"],
  },
  {
    id: "bankroll_tools",
    label: "Bankroll & Tracking",
    apps: ["pikkit", "juicereel", "matchedbettingtracker", "betai"],
  },
]

const OVERLAY_TEMPLATES: Record<string, string> = {
  odds_comparison: "For line shopping, I use {app}.",
  ai_analysis: "For deeper EV analysis, I trust {app}.",
  stats_data: "For live scores, I check {app} all day.",
  sharp_sentiment: "To read market sentiment, I watch {app}.",
  bankroll_tools: "To track every bet, I use {app}.",
  sport_app: "For {sport} stats and news, I use {app}.",
}

// ============================================
// TYPES
// ============================================

interface HookSlide {
  text: string
  image: string
}

interface AppSlide {
  categoryId: string
  categoryLabel: string
  appId: string
  appName: string
  image: string
  overlayText: string
}

interface BetAppsOutput {
  hook: HookSlide
  slides: AppSlide[]
  caption: string
  sport?: string
  generatedAt: string
}

// ============================================
// HELPERS
// ============================================

function getRandomHook(sport?: string): string {
  if (sport && SPORT_HOOKS[sport]) {
    const hooks = SPORT_HOOKS[sport]
    return hooks[Math.floor(Math.random() * hooks.length)]
  }
  return GENERIC_HOOKS[Math.floor(Math.random() * GENERIC_HOOKS.length)]
}

function getOverlayText(categoryId: string, appName: string, sport?: string): string {
  if (categoryId === 'sport_app' && sport) {
    return OVERLAY_TEMPLATES.sport_app.replace("{app}", appName).replace("{sport}", sport)
  }
  const template = OVERLAY_TEMPLATES[categoryId] || "I use {app} every day."
  return template.replace("{app}", appName)
}

function getRandomCategories(count: number = 4): Category[] {
  const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function getRandomImageIndex(appId: string): number {
  const app = APPS[appId]
  const max = app?.imageCount || 4
  return Math.floor(Math.random() * max) + 1
}

function getAppImagePath(appId: string): string {
  const imageIndex = getRandomImageIndex(appId)
  return `/images/bet-apps/apps/${appId}/${imageIndex}.jpg`
}

function getHookImagePath(): string {
  const hookIndex = Math.floor(Math.random() * 18) + 1
  return `/images/bet-apps/hooks/${hookIndex}.jpeg`
}

// ============================================
// MAIN LOGIC
// ============================================

function generateSlides(sport?: string): AppSlide[] {
  const slides: AppSlide[] = []

  // Get 4 random categories (we'll add sport app separately if needed)
  const selectedCategories = getRandomCategories(sport ? 3 : 4)

  // Find a category for BetAI
  const betaiCategoryIndex = Math.floor(Math.random() * selectedCategories.length)

  // Build slides for each category
  for (let i = 0; i < selectedCategories.length; i++) {
    const category = selectedCategories[i]
    let appId: string

    if (i === betaiCategoryIndex) {
      // This category gets BetAI
      appId = 'betai'
    } else {
      // Pick a random app from this category (excluding betai)
      const possibleApps = category.apps.filter((a) => a !== 'betai')
      appId = possibleApps[Math.floor(Math.random() * possibleApps.length)]
    }

    const app = APPS[appId]
    if (!app) continue

    slides.push({
      categoryId: category.id,
      categoryLabel: category.label,
      appId: app.id,
      appName: app.name,
      image: getAppImagePath(app.id),
      overlayText: getOverlayText(category.id, app.name),
    })
  }

  // Add sport-specific app if sport is selected
  if (sport && SPORT_TO_APP[sport]) {
    const sportAppId = SPORT_TO_APP[sport]
    const sportApp = APPS[sportAppId]

    if (sportApp) {
      slides.push({
        categoryId: 'sport_app',
        categoryLabel: `${sport} Stats & News`,
        appId: sportApp.id,
        appName: sportApp.name,
        image: getAppImagePath(sportApp.id),
        overlayText: getOverlayText('sport_app', sportApp.name, sport),
      })
    }
  }

  // If no sport selected, add one more random category slide
  if (!sport) {
    const remainingCategories = CATEGORIES.filter(
      c => !selectedCategories.some(sc => sc.id === c.id)
    )
    if (remainingCategories.length > 0) {
      const extraCategory = remainingCategories[Math.floor(Math.random() * remainingCategories.length)]
      const possibleApps = extraCategory.apps.filter((a) => a !== 'betai')
      const appId = possibleApps[Math.floor(Math.random() * possibleApps.length)]
      const app = APPS[appId]

      if (app) {
        slides.push({
          categoryId: extraCategory.id,
          categoryLabel: extraCategory.label,
          appId: app.id,
          appName: app.name,
          image: getAppImagePath(app.id),
          overlayText: getOverlayText(extraCategory.id, app.name),
        })
      }
    }
  }

  // Ensure Bet.AI is at position 2, 3, or 4 (index 1, 2, or 3) - never first or last
  const betaiIndex = slides.findIndex(s => s.appId === 'betai')
  const betaiSlide = slides[betaiIndex]
  const otherSlides = slides.filter(s => s.appId !== 'betai')

  // Shuffle the other slides
  for (let i = otherSlides.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[otherSlides[i], otherSlides[j]] = [otherSlides[j], otherSlides[i]]
  }

  // Pick a position for Bet.AI: index 1, 2, or 3 (positions 2nd, 3rd, 4th)
  const betaiPosition = Math.floor(Math.random() * 3) + 1 // 1, 2, or 3

  // Insert Bet.AI at the chosen position
  otherSlides.splice(betaiPosition, 0, betaiSlide)

  return otherSlides
}

function generateCaption(sport?: string): string {
  if (sport) {
    const sportCaptions: Record<string, string[]> = {
      NFL: [
        "My NFL betting toolkit for the season.\n\nSave this before Sunday.\n\n#nfl #nflbetting #nflbets #sportsbetting #footballbetting",
        "Stop losing NFL bets. Use these apps.\n\nWhich one is your favorite?\n\n#nfl #nflpicks #bettingtips #nflseason #sportsbets",
        "5 apps that changed my NFL betting.\n\nTrust the process.\n\n#nflbetting #nflpicks #bettingapps #footballbets #sundayfootball",
      ],
      NBA: [
        "My NBA betting toolkit for the season.\n\nSave this for game nights.\n\n#nba #nbabetting #nbabets #sportsbetting #basketballbetting",
        "Stop guessing NBA props. Use these apps.\n\nWhich one do you use?\n\n#nba #nbapicks #bettingtips #nbaseason #sportsbets",
        "5 apps that changed my NBA betting.\n\nThe data doesn't lie.\n\n#nbabetting #nbapicks #bettingapps #basketballbets #nbaprops",
      ],
      MLB: [
        "My MLB betting toolkit for the season.\n\nSave this for game day.\n\n#mlb #mlbbetting #mlbbets #sportsbetting #baseballbetting",
        "5 apps for smarter baseball bets.\n\nWhich one is your go-to?\n\n#mlb #mlbpicks #bettingtips #baseballbets #sportsbets",
      ],
      UFC: [
        "My UFC betting toolkit for fight nights.\n\nSave this before the next card.\n\n#ufc #ufcbetting #ufcbets #sportsbetting #mmabetting",
        "5 apps I check before every UFC card.\n\nWhich one do you use?\n\n#ufc #ufcpicks #bettingtips #mmabets #fightnight",
      ],
      SOCCER: [
        "My football betting toolkit.\n\nSave this for match day.\n\n#soccer #footballbetting #soccerbets #sportsbetting #premierleague",
        "5 apps for smarter football bets.\n\nWhich one is your favorite?\n\n#soccer #soccerpicks #bettingtips #footballbets #sportsbets",
      ],
    }

    const captions = sportCaptions[sport] || sportCaptions.NFL
    return captions[Math.floor(Math.random() * captions.length)]
  }

  const genericCaptions = [
    "These 5 apps changed my betting game completely.\n\nSave this for later.\n\n#sportsbetting #bettingtips #bettingapps #gambling",
    "Stop betting blind. Use these tools.\n\nWhich one do you use? Comment below.\n\n#betting #sportsbets #bettingstrategy #gamblingtips",
    "My entire betting toolkit in one post.\n\nFollow for more tips.\n\n#bettinglife #sportsbetting #bettingapps #sharpbetting",
    "The apps serious bettors actually use.\n\nSave and thank me later.\n\n#sportsgambling #bettingedge #sharpbetting #bettingtips",
    "If you're not using these, you're behind.\n\nDrop a follow for more.\n\n#betting #gamblinglife #sportsbets #bettingadvice",
  ]
  return genericCaptions[Math.floor(Math.random() * genericCaptions.length)]
}

function generateBetAppsSlideshow(sport?: string): BetAppsOutput {
  const hook: HookSlide = {
    text: getRandomHook(sport),
    image: getHookImagePath(),
  }

  const slides = generateSlides(sport)

  return {
    hook,
    slides,
    caption: generateCaption(sport),
    sport,
    generatedAt: new Date().toISOString(),
  }
}

// ============================================
// HTTP HANDLER
// ============================================

serve(async (req) => {
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
    let sport: string | undefined

    // Parse request body for sport filter
    try {
      const body = await req.json()
      sport = body.sport
    } catch {
      // No body or invalid JSON, that's fine - use generic
    }

    console.log(`Generating bet-apps slideshow... sport=${sport || 'generic'}`)

    const result = generateBetAppsSlideshow(sport)

    console.log(`Generated slideshow with ${result.slides.length} app slides`)

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error: any) {
    console.error('Generation error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
