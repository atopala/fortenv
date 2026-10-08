import { defineConfig } from '@fortenv/core/config';
import { read, readStripe } from './readers.mjs';

export default defineConfig({
   secrets: { DATABASE_URL: [read], STRIPE_SECRET_KEY: [readStripe] },
});
