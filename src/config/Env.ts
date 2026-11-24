import * as dotenv from 'dotenv';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Environment selection: TEST_ENV=staging loads .env.staging first, then .env as a
// shared fallback (dotenv never overrides a variable that is already set).
// Default `local` keeps the plain .env working.
// ---------------------------------------------------------------------------
const TEST_ENV = process.env.TEST_ENV ?? 'local';
const root = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(root, `.env.${TEST_ENV}`), quiet: true });
dotenv.config({ path: path.join(root, '.env'), quiet: true });

// ---------------------------------------------------------------------------
// Required variables — the suite fails fast if any of these are missing
// ---------------------------------------------------------------------------
const REQUIRED_VARS = ['BASE_URL'] as const;

for (const key of REQUIRED_VARS) {
  if (!process.env[key]) {
    throw new Error(
      `[${TEST_ENV}] Missing required environment variable: "${key}". ` +
        `Copy .env.example to .env (or .env.${TEST_ENV}) and fill in the values.`
    );
  }
}

// ---------------------------------------------------------------------------
// Site URLs: public demo sites only have a built-in default for the `local` environment.
// Any other environment must set the variable explicitly (no silent fallback to production).
// ---------------------------------------------------------------------------
const LOCAL_SITE_URLS = {
  AUTOMATION_EXERCISE_URL: 'https://www.automationexercise.com',
  DEMOQA_URL: 'https://demoqa.com',
} as const;

function siteUrl(key: keyof typeof LOCAL_SITE_URLS): string {
  const value = process.env[key] ?? (TEST_ENV === 'local' ? LOCAL_SITE_URLS[key] : undefined);
  if (!value) {
    throw new Error(`[${TEST_ENV}] Missing environment variable: "${key}" (no default outside "local").`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Exported config — import this everywhere instead of reading process.env directly
// ---------------------------------------------------------------------------
export const Env = {
  /** Active environment name (TEST_ENV, default "local") */
  name: TEST_ENV,

  /** Base URL of the application under test */
  baseUrl: process.env.BASE_URL as string,

  /** Base URL of automationexercise.com */
  automationExerciseUrl: siteUrl('AUTOMATION_EXERCISE_URL'),

  /** Base URL of demoqa.com */
  demoqaUrl: siteUrl('DEMOQA_URL'),

  /** Prefix of every generated transactional record, so orphans can be found and swept */
  testDataPrefix: process.env.TEST_DATA_PREFIX ?? 'qa_',

  /** Bulk cleanup (deleteAll, sweeps) is only allowed where this is "true" */
  allowDestructiveCleanup: process.env.ALLOW_DESTRUCTIVE_CLEANUP !== 'false',

  /** Test user credentials (optional — only required for authenticated saucedemo tests) */
  testUser: {
    name: process.env.TEST_USER_NAME ?? '',
    password: process.env.TEST_USER_PASSWORD ?? '',
  },
} as const;
