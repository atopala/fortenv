import { defineConfig } from "@fortenv/secrets/config";

import { read } from "../04-bootstrap/caught-reader.mjs";

export default defineConfig({
   secrets: { DATABASE_URL: [read] },
   telemetry: { stderrFallback: true },
});
