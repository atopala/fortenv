import { defineConfig } from '@fortenv/core/config';
import { createDb, createStripe } from '../application.mjs';

export default defineConfig({
   secrets: {
      DATABASE_URL: [createDb],
      STRIPE_SECRET_KEY: [createStripe],
   },
});
