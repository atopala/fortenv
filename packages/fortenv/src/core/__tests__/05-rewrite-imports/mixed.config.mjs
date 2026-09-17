import { defineConfig } from 'fortenv/config';
import readDatabase, { readStripe as readPayment } from './readers.mjs';

export default defineConfig({
   secrets: { DATABASE_URL: [readDatabase], STRIPE_SECRET_KEY: [readPayment] },
});
