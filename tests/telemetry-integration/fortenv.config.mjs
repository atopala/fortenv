import { defineConfig } from "@fortenv/secrets/config";

import { readSecret } from "./reader.mjs";

export default defineConfig({
   secrets: { DATABASE_URL: [readSecret] },
   telemetry: { enumeration: true, stderrFallback: true },
});
