import { defineConfig } from "fortenv/config";

import { authorized } from "./reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [authorized], PRIVATE_KEY: [] } });
