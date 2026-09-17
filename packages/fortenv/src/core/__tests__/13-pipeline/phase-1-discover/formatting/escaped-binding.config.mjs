import { defineConfig } from 'fortenv/config';
import { createDb as \u0064b } from '../application.mjs';

// The escaped identifier and 'db' refer to the same binding in JavaScript.
export default defineConfig({ secrets: { DATABASE_URL: [db] } });
