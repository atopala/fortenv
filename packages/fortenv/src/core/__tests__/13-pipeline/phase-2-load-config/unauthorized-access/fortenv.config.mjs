import { defineConfig } from "@fortenv/core/config";

import { read } from "./readers.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
