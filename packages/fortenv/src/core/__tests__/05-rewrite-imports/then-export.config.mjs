import { defineConfig } from 'fortenv/config';
import { then } from './readers.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [then] } });
