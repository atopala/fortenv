import { defineConfig as config } from '@fortenv/secrets/config';
import { createDb as database } from '../application.mjs';

export default config({ secrets: { DATABASE_URL: [database] } });
