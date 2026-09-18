import { defineConfig } from "fortenv/config";

import { authorized, unregistered } from "./reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [authorized] } });

void unregistered;
