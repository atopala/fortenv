import { defineConfig } from "fortenv/config";

import { original } from "./readers.mjs";

// The original target is not the wrapper returned by fortenv.string(original).
export default defineConfig({ secrets: { DATABASE_URL: [original] } });
