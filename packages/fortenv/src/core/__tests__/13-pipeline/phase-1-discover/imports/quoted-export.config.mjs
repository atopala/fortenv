import { defineConfig } from '@fortenv/secrets/config';
import { 'database-reader' as createDb } from '../application.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [createDb] } });
