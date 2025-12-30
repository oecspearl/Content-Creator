/**
 * Google Slides API Constants
 *
 * EMU (English Metric Units) conversion:
 * 1 inch = 914,400 EMU
 * 1 point = 12,700 EMU
 */

// Slide dimensions (standard 16:9 presentation)
export const SLIDE_WIDTH_EMU = 9144000; // 10 inches
export const SLIDE_HEIGHT_EMU = 5143500; // 5.625 inches

// Image dimensions
export const DEFAULT_IMAGE_WIDTH_EMU = 4000000;
export const DEFAULT_IMAGE_HEIGHT_EMU = 3000000;
export const IMAGE_POSITION_X_EMU = 2500000;
export const IMAGE_POSITION_Y_EMU = 1500000;

// Text box dimensions
export const TITLE_BOX_WIDTH_EMU = 8000000;
export const TITLE_BOX_HEIGHT_EMU = 700000;
export const SUBTITLE_BOX_HEIGHT_EMU = 500000;
export const CONTENT_BOX_WIDTH_EMU = 8000000;
export const CONTENT_BOX_HEIGHT_EMU = 3000000;
export const BULLET_BOX_HEIGHT_EMU = 3000000;
export const QUESTIONS_BOX_HEIGHT_EMU = 3500000;

// Text box positions
export const TITLE_POSITION_X_EMU = 500000;
export const TITLE_POSITION_Y_EMU = 500000;
export const SUBTITLE_POSITION_Y_EMU = 1500000;
export const CONTENT_POSITION_WITH_TITLE_Y_EMU = 1500000;
export const CONTENT_POSITION_NO_TITLE_Y_EMU = 800000;

// Font sizes (in points)
export const FONT_SIZE_TITLE_PT = 36;
export const FONT_SIZE_SUBTITLE_PT = 20;
export const FONT_SIZE_BODY_PT = 16;
export const FONT_SIZE_BULLETS_PT = 18;
export const FONT_SIZE_QUESTIONS_PT = 16;

// Batch processing
export const GOOGLE_API_BATCH_SIZE = 100; // Maximum requests per batch
export const MAX_REQUESTS_PER_SLIDE = 10; // Estimated max requests for a complex slide

// Color themes (RGB values 0-1 range)
export const COLOR_THEMES = {
  blue: {
    primary: { red: 0.26, green: 0.52, blue: 0.96 }, // #4285F4
    secondary: { red: 0.13, green: 0.33, blue: 0.63 }, // #2155A1
    accent: { red: 0.85, green: 0.92, blue: 0.99 }, // #D9EBFC
  },
  green: {
    primary: { red: 0.13, green: 0.59, blue: 0.53 }, // #209787
    secondary: { red: 0.09, green: 0.39, blue: 0.35 }, // #166359
    accent: { red: 0.84, green: 0.95, blue: 0.93 }, // #D6F3EF
  },
  purple: {
    primary: { red: 0.61, green: 0.35, blue: 0.71 }, // #9B59B6
    secondary: { red: 0.41, green: 0.21, blue: 0.51 }, // #693682
    accent: { red: 0.95, green: 0.89, blue: 0.97 }, // #F2E3F7
  },
  orange: {
    primary: { red: 0.95, green: 0.61, blue: 0.07 }, // #F39C12
    secondary: { red: 0.76, green: 0.44, blue: 0.05 }, // #C27810
    accent: { red: 1.0, green: 0.95, blue: 0.85 }, // #FFF2D9
  },
  teal: {
    primary: { red: 0.11, green: 0.66, blue: 0.71 }, // #1CA9B4
    secondary: { red: 0.07, green: 0.47, blue: 0.51 }, // #127882
    accent: { red: 0.83, green: 0.96, blue: 0.97 }, // #D4F4F7
  },
  red: {
    primary: { red: 0.91, green: 0.3, blue: 0.24 }, // #E74C3C
    secondary: { red: 0.64, green: 0.17, blue: 0.13 }, // #A32B21
    accent: { red: 0.99, green: 0.9, blue: 0.89 }, // #FCE5E3
  },
};

export type ColorTheme = keyof typeof COLOR_THEMES;

// Trusted image domains for SSRF protection
export const TRUSTED_IMAGE_DOMAINS = [
  'images.unsplash.com',
  'unsplash.com',
  'plus.unsplash.com',
  'cdn.openai.com',
  'oaidalleapiprodscus.blob.core.windows.net',
  'puter.com',
  'api.puter.com',
  'storage.googleapis.com',
  'drive.google.com',
];
