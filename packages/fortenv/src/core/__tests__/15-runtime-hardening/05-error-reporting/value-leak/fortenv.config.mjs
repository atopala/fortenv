import { defineConfig } from "fortenv/config";

import { authorized } from "./reader.mjs";

// stderrFallback + enumeration on, so every diagnostic path (thrown error,
// serialized stderr event, enumeration warning) is exercised and can be checked
// for a leaked secret VALUE.
export default defineConfig({
   secrets: { DATABASE_URL: [authorized], PRIVATE_KEY: [] },
   telemetry: { enumeration: true, stderrFallback: true },
});
