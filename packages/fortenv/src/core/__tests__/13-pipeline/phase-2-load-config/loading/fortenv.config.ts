import { defineConfig } from "fortenv/config";

import { readBoth, readDatabase, readStripe } from "./readers.ts";

export default defineConfig({
   secrets: {
      DATABASE_URL: [readDatabase, readBoth],
      STRIPE_SECRET_KEY: [readStripe, readBoth],
      MISSING_SECRET: [readDatabase],
   },
});
