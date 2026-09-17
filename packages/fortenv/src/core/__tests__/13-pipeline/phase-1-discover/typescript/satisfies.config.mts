import { defineConfig, type FortenvConfig } from 'fortenv/config';
import { createDb } from '../application-types.ts';

export default defineConfig({
   secrets: { DATABASE_URL: [createDb] },
} as const satisfies FortenvConfig);
