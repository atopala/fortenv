import { defineConfig } from "@fortenv/core/config";

import { forged } from "./readers.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [forged] } });
