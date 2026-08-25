import { config } from 'dotenv';
import path from 'node:path';

// Loads the monorepo-root .env (documented in .env.example) into
// process.env for local dev - `tsx watch` doesn't reliably forward
// Node's native --env-file flag (confirmed by testing), and this file
// isn't in Next.js's own auto-load directory either. Silently does
// nothing if the file doesn't exist, which is correct in
// Docker/ECS - those get real env vars injected by the task
// definition, not a .env file (see docs/deploy/ecs.md).
config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: Number(process.env.PORT ?? 4000),
  socrataUsername: process.env.SOCRATA_USERNAME,
  socrataPassword: process.env.SOCRATA_PASSWORD,
  socrataAppToken: process.env.SOCRATA_APP_TOKEN_MTC,
  vmtDataKey: process.env.VMT_DATA_KEY,
  asanaAccessToken: process.env.ASANA_ACCESS_TOKEN,
  asanaProjectId: process.env.ASANA_PROJECT_ID,
};
