/**
 * Bet Apps Format - Data Configuration
 *
 * Hooks, apps catalog, and category definitions
 */

// Hooks for the opening slide
export const HOOKS = [
  "These are the 5 tools I use on every single bet.",
  "If you bet without these apps, you're leaving money on the table.",
  "I only trust these 5 tools before placing any bet.",
  "This is how I turned betting chaos into a system.",
  "These 5 apps are open every time I place a bet.",
  "Stop betting blind. Start betting smart.",
  "Before any bet, I always check these apps.",
  "If you track your bets, you instantly get better.",
  "Serious bettors don't guess — they use these tools.",
  "These tools changed how I look at every line.",
  "5 apps that separate winners from losers.",
  "Every sharp bettor has these on their phone.",
  "The betting toolkit that prints money.",
  "Apps the books don't want you to know about.",
  "My entire betting system in 5 apps.",
];

// App catalog with metadata
export interface AppInfo {
  id: string;
  name: string;
  imageCount: number; // Number of available screenshots
}

export const APPS: Record<string, AppInfo> = {
  betai: { id: "betai", name: "Bet.AI", imageCount: 4 },
  betanalytix: { id: "betanalytix", name: "Bet-Analytix", imageCount: 4 },
  betspark: { id: "betspark", name: "BetSpark", imageCount: 4 },
  bettingtips: { id: "bettingtips", name: "Betting Tips", imageCount: 4 },
  betty: { id: "betty", name: "Betty", imageCount: 4 },
  bleacherreport: { id: "bleacherreport", name: "Bleacher Report", imageCount: 4 },
  gotips: { id: "gotips", name: "Go Tips", imageCount: 4 },
  hof: { id: "hof", name: "HOF", imageCount: 4 },
  juicereel: { id: "juicereel", name: "Juice Reel", imageCount: 4 },
  linemate: { id: "linemate", name: "Line Mate", imageCount: 4 },
  liveodds: { id: "liveodds", name: "Live Odds", imageCount: 4 },
  matchedbettingtracker: { id: "matchedbettingtracker", name: "Matched Betting Tracker", imageCount: 4 },
  mlb: { id: "mlb", name: "MLB", imageCount: 4 },
  nba: { id: "nba", name: "NBA", imageCount: 4 },
  nfl: { id: "nfl", name: "NFL", imageCount: 4 },
  oddsjam: { id: "oddsjam", name: "OddsJam", imageCount: 4 },
  onefootball: { id: "onefootball", name: "OneFootball", imageCount: 4 },
  optimalbet: { id: "optimalbet", name: "Optimal Bet", imageCount: 4 },
  pikkit: { id: "pikkit", name: "Pikkit", imageCount: 4 },
  rotogrinders: { id: "rotogrinders", name: "RotoGrinders", imageCount: 4 },
  scoresandodds: { id: "scoresandodds", name: "ScoresAndOdds", imageCount: 4 },
  smartbets: { id: "smartbets", name: "Smart Bets", imageCount: 4 },
  sofascore: { id: "sofascore", name: "Sofascore", imageCount: 4 },
  tejtips: { id: "tejtips", name: "TejTips", imageCount: 4 },
  thescore: { id: "thescore", name: "The Score", imageCount: 4 },
  ufc: { id: "ufc", name: "UFC", imageCount: 4 },
};

// Categories with their eligible apps
export interface Category {
  id: string;
  label: string;
  apps: string[]; // App IDs
}

export const CATEGORIES: Category[] = [
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
  {
    id: "niche_sports",
    label: "Niche Sports Apps",
    apps: ["mlb", "nba", "nfl", "ufc", "onefootball"],
  },
];

// Default overlay text templates (fallback if no AI rewrite)
export const OVERLAY_TEMPLATES: Record<string, string> = {
  odds_comparison: "For line shopping, I use {app}.",
  ai_analysis: "For deeper EV analysis, I trust {app}.",
  stats_data: "For live scores, I check {app} all day.",
  sharp_sentiment: "To read market sentiment, I watch {app}.",
  bankroll_tools: "To track every bet, I use {app}.",
  niche_sports: "For niche sports, I rely on {app}.",
};

// Helper functions
export function getRandomHook(): string {
  return HOOKS[Math.floor(Math.random() * HOOKS.length)];
}

export function getApp(appId: string): AppInfo | undefined {
  return APPS[appId];
}

export function getRandomCategories(count: number = 5): Category[] {
  const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getOverlayText(categoryId: string, appName: string): string {
  const template = OVERLAY_TEMPLATES[categoryId] || "I use {app} every day.";
  return template.replace("{app}", appName);
}
