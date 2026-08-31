import { config } from 'dotenv';
import path from 'node:path';

// Loads the monorepo-root .env for local dev - mirrors the same call in
// next.config.js (which only runs at build/CLI startup, not per-request),
// so this module is self-sufficient wherever it's imported from (route
// handlers, vitest). Silently does nothing if the file doesn't exist,
// which is correct in Docker/Coolify - those get real env vars injected
// by the platform, not a .env file (see docs/deploy/coolify.md).
config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  socrataUsername: process.env.SOCRATA_USERNAME,
  socrataPassword: process.env.SOCRATA_PASSWORD,
  socrataAppToken: process.env.SOCRATA_APP_TOKEN_MTC,
  vmtDataKey: process.env.VMT_DATA_KEY,
  asanaAccessToken: process.env.ASANA_ACCESS_TOKEN,
  asanaProjectId: process.env.ASANA_PROJECT_ID,
};
