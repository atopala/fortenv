import { defineConfig } from "@fortenv/core/config";

import { authorized, rawTarget } from "./reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [authorized, rawTarget] } });
