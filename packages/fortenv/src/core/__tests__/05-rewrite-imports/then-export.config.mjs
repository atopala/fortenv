import { defineConfig } from '@fortenv/core/config';
import { then } from './readers.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [then] } });
