import { defineConfig } from 'fortenv/config';
import { createDb as 𐐀 } from '../application.mjs';

// This is a valid Unicode identifier spanning two UTF-16 code units.
export default defineConfig({ secrets: { DATABASE_URL: [𐐀] } });
