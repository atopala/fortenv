import { defineConfig } from '@fortenv/secrets/config';
import { 'database-reader' as read } from './readers.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
