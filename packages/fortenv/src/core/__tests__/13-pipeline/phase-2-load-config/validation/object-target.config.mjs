import { defineConfig } from "fortenv/config";

import { objectTarget } from "./readers.mjs";

// @ts-expect-error Phase one sees a placeholder; phase two must reject the actual object.
export default defineConfig({ secrets: { DATABASE_URL: [objectTarget] } });
