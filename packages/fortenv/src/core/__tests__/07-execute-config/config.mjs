import { defineConfig } from 'fortenv/config';
import { read } from './application.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
