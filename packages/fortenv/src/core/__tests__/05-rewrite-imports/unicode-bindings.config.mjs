import { defineConfig } from 'fortenv/config';
import { read as 𐐀reader, read as read𐐀, read as read𝟘 } from './readers.mjs';

// Astral letters can start or continue a name; an astral digit can continue it.
export default defineConfig({ secrets: { DATABASE_URL: [𐐀reader, read𐐀, read𝟘] } });
