/**
 * Caption Templates for Slideshow Formats
 *
 * Auto-generates captions based on league and format
 */

import { League } from '../types';

// League-specific hashtags
const LEAGUE_HASHTAGS: Record<League, string[]> = {
  NFL: ['#NFL', '#NFLPicks', '#FantasyFootball', '#NFLBetting', '#NFLProps'],
  NBA: ['#NBA', '#NBAPicks', '#NBABetting', '#NBAProps', '#Basketball'],
  SOCCER: ['#Soccer', '#PremierLeague', '#EPL', '#Football', '#SoccerBetting'],
  MLB: ['#MLB', '#MLBPicks', '#Baseball', '#MLBBetting', '#MLBProps'],
};

// Common hashtags for all posts
const COMMON_HASHTAGS = ['#BetAI', '#SportsBetting', '#PlayerProps', '#BettingTips', '#Gambling'];

// Caption templates for Target/Avoid format
const TARGET_AVOID_CAPTIONS: string[] = [
  "{league} player props breakdown - who to target and who to fade this week",
  "These {league} players are must-plays and must-fades right now",
  "The stats say it all - {league} targets and avoids",
  "{league} props you need to know about - targets vs fades",
  "Data-driven {league} player props - who's hot and who's not",
  "Stop guessing - here are your {league} targets and avoids",
  "{league} betting guide - players to target and players to fade",
  "The numbers don't lie - {league} player prop breakdown",
];

/**
 * Get current NFL week (rough estimate based on date)
 */
function getCurrentWeek(): number {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 8, 5); // Sept 5
  if (now < seasonStart) return 1;
  const weeksDiff = Math.floor((now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.min(Math.max(weeksDiff + 1, 1), 18);
}

/**
 * Generate a caption for Target/Avoid format
 */
export function generateCaption(league: League, format: 'target-avoid'): string {
  // Pick random template
  const templateIndex = Math.floor(Math.random() * TARGET_AVOID_CAPTIONS.length);
  let caption = TARGET_AVOID_CAPTIONS[templateIndex];

  // Replace league placeholder
  const leagueName = league === 'SOCCER' ? 'Premier League' : league;
  caption = caption.replace('{league}', leagueName);

  // Add week for NFL
  if (league === 'NFL') {
    const week = getCurrentWeek();
    caption = `Week ${week} ${caption}`;
  }

  // Build hashtags (pick 3 league-specific + 3 common)
  const leagueTags = LEAGUE_HASHTAGS[league].slice(0, 3);
  const commonTags = COMMON_HASHTAGS.slice(0, 3);
  const hashtags = [...leagueTags, ...commonTags].join(' ');

  return `${caption}\n\n${hashtags}`;
}

/**
 * Generate caption with custom hook text included
 */
export function generateCaptionWithHook(league: League, format: 'target-avoid', hookText: string): string {
  const baseCaption = generateCaption(league, format);
  // Don't duplicate if hook is already similar to caption start
  return baseCaption;
}
