import { defineConfig } from "@fortenv/secrets/config";

import { authorized, rawTarget } from "./reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [authorized, rawTarget] } });
