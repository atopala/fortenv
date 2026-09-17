import { defineConfig } from "fortenv/config";

import { read } from "./caught-reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
