import { defineConfig } from 'fortenv/config';
import { 'database-reader' as read } from './readers.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
