export default defineConfig({ secrets: { DATABASE_URL: [read] } });

import { defineConfig } from 'fortenv/config';
import { read } from './readers.mjs';
