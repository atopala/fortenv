import { defineConfig } from '@fortenv/core/config';
import { 'database-reader' as read } from './readers.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
