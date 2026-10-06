import { defineConfig } from '@fortenv/secrets/config';
import database, { createStripe as stripe } from '../application.mjs';

export default defineConfig({
   secrets: { DATABASE_URL: [database], STRIPE_SECRET_KEY: [stripe] },
});
