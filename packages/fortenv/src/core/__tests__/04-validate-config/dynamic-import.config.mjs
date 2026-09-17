import { defineConfig } from 'fortenv/config';

// A native dynamic import still executes application code (design section 32).
const { createDb } = await import('../13-pipeline/phase-1-discover/application.mjs');

export default defineConfig({ secrets: { DATABASE_URL: [createDb] } });
