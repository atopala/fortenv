import { defineConfig } from "fortenv/config";

import { authorizedScan, read } from "./readers.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [authorizedScan, read] } });
