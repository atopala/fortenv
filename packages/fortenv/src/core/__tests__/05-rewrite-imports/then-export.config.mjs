import { defineConfig } from '@fortenv/secrets/config';
import { then } from './readers.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [then] } });
