export const CURRENT_PROJECT_ID_KEY = "current-project-id" as const;

// Reserved UUID inserted by migrations as the default/fallback project.
// Users may rename it, but deleting it can break server-side fallbacks.
export const DEFAULT_PROJECT_ID =
  "00000000-0000-0000-0000-000000000001" as const;

// 1 year
export const CURRENT_PROJECT_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

