/**
 * Bet Apps Format - Type Definitions
 */

export interface HookSlide {
  text: string;
  image: string;
}

export interface AppSlide {
  categoryId: string;
  categoryLabel: string;
  appId: string;
  appName: string;
  image: string;
  overlayText: string;
}

export interface BetAppsOutput {
  hook: HookSlide;
  slides: AppSlide[];
  caption: string;
  generatedAt: string;
}

export interface GenerateBetAppsRequest {
  useAI?: boolean; // Whether to use AI to rewrite texts (default: false for now)
}
