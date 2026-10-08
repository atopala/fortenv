import { defineConfig } from "@fortenv/core/config";

import { bound } from "./readers.mjs";

// A bound copy is a different function, not the exact returned wrapper identity.
export default defineConfig({ secrets: { DATABASE_URL: [bound] } });
