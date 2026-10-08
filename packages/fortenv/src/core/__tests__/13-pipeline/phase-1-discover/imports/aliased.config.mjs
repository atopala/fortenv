import { defineConfig as config } from '@fortenv/core/config';
import { createDb as database } from '../application.mjs';

export default config({ secrets: { DATABASE_URL: [database] } });
