import { defineConfig } from "fortenv/config";

import { raw } from "./readers.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [raw] } });
