/**
 * Hook Templates for Slideshow Formats
 *
 * Each format has its own set of hooks to grab attention
 */

export const TARGET_AVOID_HOOKS: string[] = [
  // Curiosity-driven
  "Players to target and avoid this week",
  "Who's cooking and who's cooked?",
  "Your lineup is wrong if you have these players...",
  "The data says target these, avoid those",
  "Stats don't lie - here's who to play",

  // Value-focused
  "Stop losing money on these players",
  "The props the books don't want you to know",
  "Sharps are all over these players",
  "These players are printing money right now",
  "Lock of the week vs trap of the week",

  // Urgency/FOMO
  "Last chance to fix your lineup",
  "Everyone's fading these players for a reason",
  "The market is sleeping on these guys",
  "Book it - these props are hitting",
  "Don't make these mistakes again",

  // Direct/Bold
  "Target these players, fade these players",
  "Who's hot and who's not this week",
  "The only props you need to know about",
  "My best bets for this week",
  "Winners and losers - player props edition",
];

/**
 * Get a random hook for the Target/Avoid format
 */
export function getRandomHook(format: 'target-avoid'): string {
  if (format === 'target-avoid') {
    const randomIndex = Math.floor(Math.random() * TARGET_AVOID_HOOKS.length);
    return TARGET_AVOID_HOOKS[randomIndex];
  }
  return TARGET_AVOID_HOOKS[0];
}

/**
 * Get all hooks for a format (useful for UI selection)
 */
export function getAllHooks(format: 'target-avoid'): string[] {
  if (format === 'target-avoid') {
    return TARGET_AVOID_HOOKS;
  }
  return [];
}
