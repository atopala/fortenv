import { defineConfig } from '@fortenv/core/config';
import database, { createStripe as stripe } from '../application.mjs';

export default defineConfig({
   secrets: { DATABASE_URL: [database], STRIPE_SECRET_KEY: [stripe] },
});
