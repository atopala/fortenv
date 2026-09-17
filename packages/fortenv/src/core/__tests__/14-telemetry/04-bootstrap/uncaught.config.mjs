import { defineConfig } from "fortenv/config";

import { read } from "./uncaught-reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [read] } });
