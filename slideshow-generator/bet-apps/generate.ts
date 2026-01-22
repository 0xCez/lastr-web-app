/**
 * Bet Apps Format - Main Generator
 *
 * Generates "5 best apps for betting" slideshows
 * - 1 Hook slide
 * - 5 App slides (one per category)
 * - BetAI must appear exactly once
 */

import {
  APPS,
  CATEGORIES,
  Category,
  getRandomHook,
  getRandomCategories,
  getOverlayText,
  getApp,
} from './data';
import { BetAppsOutput, AppSlide, HookSlide } from './types';

// Base URL for images (stored in Supabase Storage or similar)
const IMAGES_BASE_URL = '/images/bet-apps';

/**
 * Pick a random image index for an app (1 to imageCount)
 */
function getRandomImageIndex(appId: string): number {
  const app = getApp(appId);
  const max = app?.imageCount || 4;
  return Math.floor(Math.random() * max) + 1;
}

/**
 * Build image path for an app
 */
function getAppImagePath(appId: string): string {
  const imageIndex = getRandomImageIndex(appId);
  return `${IMAGES_BASE_URL}/apps/${appId}/${imageIndex}.jpg`;
}

/**
 * Build image path for hook
 */
function getHookImagePath(): string {
  const hookIndex = Math.floor(Math.random() * 10) + 1; // Assuming 10 hook images
  return `${IMAGES_BASE_URL}/hooks/${hookIndex}.jpg`;
}

/**
 * Assign one app to each category
 * Rules:
 * - BetAI must appear EXACTLY once
 * - BetAI cannot appear in niche_sports category
 */
function assignAppsToCategories(selectedCategories: Category[]): AppSlide[] {
  // Find categories where BetAI can appear (not niche_sports, and betai is in the apps list)
  const eligibleForBetAI = selectedCategories.filter(
    (c) => c.id !== 'niche_sports' && c.apps.includes('betai')
  );

  if (eligibleForBetAI.length === 0) {
    throw new Error('No eligible category for BetAI placement');
  }

  // Randomly pick one category where BetAI will appear
  const betaiCategory = eligibleForBetAI[Math.floor(Math.random() * eligibleForBetAI.length)];

  const slides: AppSlide[] = [];

  for (const category of selectedCategories) {
    let appId: string;

    if (category.id === betaiCategory.id) {
      // Force BetAI in this category
      appId = 'betai';
    } else if (category.id === 'niche_sports') {
      // Niche sports: pick randomly (BetAI not allowed)
      appId = category.apps[Math.floor(Math.random() * category.apps.length)];
    } else {
      // Other categories: pick any app EXCEPT betai
      const possibleApps = category.apps.filter((a) => a !== 'betai');
      if (possibleApps.length === 0) {
        throw new Error(`No valid apps in category ${category.id}`);
      }
      appId = possibleApps[Math.floor(Math.random() * possibleApps.length)];
    }

    const app = getApp(appId);
    if (!app) {
      throw new Error(`App not found: ${appId}`);
    }

    slides.push({
      categoryId: category.id,
      categoryLabel: category.label,
      appId: app.id,
      appName: app.name,
      image: getAppImagePath(app.id),
      overlayText: getOverlayText(category.id, app.name),
    });
  }

  // Verify BetAI appears exactly once
  const betaiCount = slides.filter((s) => s.appId === 'betai').length;
  if (betaiCount !== 1) {
    throw new Error(`BetAI must appear exactly once, found: ${betaiCount}`);
  }

  return slides;
}

/**
 * Generate caption for the post
 */
function generateCaption(): string {
  const captions = [
    "These 5 apps changed my betting game completely.\n\nSave this for later.\n\n#sportsbetting #bettingtips #bettingapps #gambling #nfl #nba",
    "Stop betting blind. Use these tools.\n\nWhich one do you use? Comment below.\n\n#betting #sportsbets #bettingstrategy #gamblingtips",
    "My entire betting toolkit in one post.\n\nFollow for more tips.\n\n#bettinglife #sportsbetting #nflbets #nbabets #bettingapps",
    "The apps serious bettors actually use.\n\nSave and thank me later.\n\n#sportsgambling #bettingedge #sharpbetting #bettingtips",
    "If you're not using these, you're behind.\n\nDrop a follow for more.\n\n#betting #gamblinglife #sportsbets #bettingadvice",
  ];
  return captions[Math.floor(Math.random() * captions.length)];
}

/**
 * Main generator function
 */
export function generateBetAppsSlideshow(): BetAppsOutput {
  // Pick 5 random categories
  const selectedCategories = getRandomCategories(5);

  // Generate hook
  const hook: HookSlide = {
    text: getRandomHook(),
    image: getHookImagePath(),
  };

  // Assign apps to categories
  const slides = assignAppsToCategories(selectedCategories);

  return {
    hook,
    slides,
    caption: generateCaption(),
    generatedAt: new Date().toISOString(),
  };
}

// Export for direct use
export { APPS, CATEGORIES } from './data';
export * from './types';
