import { defineConfig } from "fortenv/config";

import { concurrentA, detached, outer, readA, rejects, throws } from "./readers.ts";
import { concurrentB, readB } from "./readers.ts";

export default defineConfig({
   secrets: {
      SECRET_A: [readA, outer, concurrentA, detached, throws, rejects],
      SECRET_B: [readB, concurrentB],
   },
});
