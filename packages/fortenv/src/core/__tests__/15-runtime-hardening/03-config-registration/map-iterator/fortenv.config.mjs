import { defineConfig } from "@fortenv/core/config";

import { authorized, unregistered } from "./reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [authorized], PRIVATE_KEY: [] } });

// Keep the unregistered wrapper in the real module graph without granting it.
void unregistered;
