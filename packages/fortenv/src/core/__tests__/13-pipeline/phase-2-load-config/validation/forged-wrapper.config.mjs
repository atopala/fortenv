import { defineConfig } from "@fortenv/secrets/config";

import { forged } from "./readers.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [forged] } });
