import "@fortenv-fixture/cjs-dependency/import-time";

import { createClient, createClientAsync, failAsync, failSync } from "@fortenv-fixture/cjs-dependency";
import { defineConfig } from "fortenv/config";
export default defineConfig({
   secrets: {
      DATABASE_URL: [createClient, createClientAsync, failSync, failAsync],
      MISSING_SECRET: [createClient],
      OTHER_SECRET: [],
   },
});
