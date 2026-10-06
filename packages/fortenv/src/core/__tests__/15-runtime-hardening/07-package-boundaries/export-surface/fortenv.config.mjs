import { defineConfig } from "@fortenv/secrets/config";

import { authorized } from "./reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [authorized], PRIVATE_KEY: [] } });
