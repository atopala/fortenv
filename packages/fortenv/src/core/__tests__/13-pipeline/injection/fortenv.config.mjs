import { defineConfig } from "fortenv/config";

import { captured, createDb, echo, fail, later, outer, result, snapshot } from "./factories.ts";
export default defineConfig({
   secrets: {
      DATABASE_URL: [createDb, snapshot, echo, result, later, outer, captured],
      MISSING: [snapshot],
      OTHER_SECRET: [fail],
   },
});
