import { databaseUrl, stripeKey } from "./test-values.mjs";

// Supply explicit fake values; do not inherit the developer's secrets or NODE_OPTIONS.
export const environment = {
   PATH: process.env.PATH,
   ...(process.platform === "win32" ? { SystemRoot: process.env.SystemRoot } : {}),
   NODE_ENV: "production",
   DATABASE_URL: databaseUrl,
   STRIPE_SECRET_KEY: stripeKey,
};
