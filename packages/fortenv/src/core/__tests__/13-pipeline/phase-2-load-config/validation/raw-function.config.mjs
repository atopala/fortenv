import { defineConfig } from "@fortenv/secrets/config";

import { raw } from "./readers.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [raw] } });
