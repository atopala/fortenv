import { defineConfig } from '@fortenv/core/config';
import { read } from './application.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
