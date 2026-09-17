import { defineConfig } from "fortenv/config";

import { readSecret } from "./reader.mjs";

export default defineConfig({
   secrets: { DATABASE_URL: [readSecret] },
   telemetry: { enumeration: true, stderrFallback: true },
});
