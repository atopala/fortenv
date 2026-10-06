import { defineConfig } from '@fortenv/secrets/config';
import { createDb } from '../application.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [createDb] } });
