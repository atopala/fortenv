import { defineConfig as config } from 'fortenv/config';
import { createDb as database } from '../application.mjs';

export default config({ secrets: { DATABASE_URL: [database] } });
