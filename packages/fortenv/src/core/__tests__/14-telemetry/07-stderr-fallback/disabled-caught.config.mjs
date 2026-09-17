import { defineConfig } from "fortenv/config";

import { read } from "../04-bootstrap/caught-reader.mjs";

export default defineConfig({
   secrets: { DATABASE_URL: [read] },
   telemetry: { stderrFallback: false },
});
