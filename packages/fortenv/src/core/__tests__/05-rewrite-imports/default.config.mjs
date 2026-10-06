import { defineConfig } from '@fortenv/secrets/config';
import read from './readers.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
