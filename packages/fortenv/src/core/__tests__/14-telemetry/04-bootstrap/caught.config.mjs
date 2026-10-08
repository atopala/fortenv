import { defineConfig } from "@fortenv/core/config";

import { read } from "./caught-reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
