import { defineConfig } from "@fortenv/core/config";
import { createClient, createClientAsync, failAsync, failSync } from "@fortenv-fixture/esm-dependency";
export default defineConfig({
   secrets: {
      DATABASE_URL: [createClient, createClientAsync, failSync, failAsync],
      MISSING_SECRET: [createClient],
      OTHER_SECRET: [],
   },
});
