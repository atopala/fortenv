import { defineConfig } from "@fortenv/secrets/config";

import { read } from "./caught-reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
