import { defineConfig } from '@fortenv/core/config';
import { createDb, createStripe } from '../application.mjs';

export default defineConfig({
   secrets: {
      DATABASE_URL: [createDb, createStripe],
      DATABASE_PASSWORD: [createDb, createStripe],
   },
});
