import { defineConfig } from '@fortenv/secrets/config';
import { read } from './application.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
