import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { loadConfiguration } from "../../../bootstrap.js";
import * as source from "../../../config-source.js";
import * as result from "../../../discovery-result.js";
import * as imports from "../../../imports.js";
import * as mocks from "../../../mock-imports.js";
import * as execution from "../../../synthetic-execution.js";
import * as typescript from "../../../typescript.js";

describe("13 — Pipeline execution order", () => {
   const traceKey = Symbol.for("fortenv.test.pipeline-events");
   afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
      Reflect.deleteProperty(globalThis, traceKey);
   });

   it("records the actual stage order, including protection before real module evaluation", async () => {
      const events: string[] = [];
      Reflect.set(globalThis, traceKey, events);
      vi.stubEnv("FORTENV_CONFIG", fileURLToPath(new URL("./fortenv.config.mjs", import.meta.url)));
      const locate = source.configPath;
      const read = source.readConfigSource;
      const strip = typescript.stripConfigTypes;
      const rewrite = imports.transformImports;
      const loader = mocks.createMockLoader;
      const execute = execution.executeSyntheticConfig;
      const extract = result.readDiscoveryResult;
      vi.spyOn(source, "configPath").mockImplementation(async (...args) => {
         events.push("01: locate config");
         return locate(...args);
      });
      vi.spyOn(source, "readConfigSource").mockImplementation(async (...args) => {
         events.push("02: read source");
         return read(...args);
      });
      vi.spyOn(typescript, "stripConfigTypes").mockImplementation((...args) => {
         events.push("03: strip types");
         return strip(...args);
      });
      vi.spyOn(imports, "transformImports").mockImplementation((...args) => {
         events.push("05: rewrite imports");
         return rewrite(...args);
      });
      vi.spyOn(mocks, "createMockLoader").mockImplementation((...args) => {
         events.push("06: create mock loader");
         return loader(...args);
      });
      vi.spyOn(execution, "executeSyntheticConfig").mockImplementation(async (...args) => {
         events.push("07: execute synthetic config");
         return execute(...args);
      });
      vi.spyOn(result, "readDiscoveryResult").mockImplementation((...args) => {
         events.push("08: validate result and extract names");
         return extract(...args);
      });
      const entries = await loadConfiguration((names) => {
         expect([...names]).toEqual(["DATABASE_URL"]);
         events.push("09-10: protection callback");
      });
      events.push("11: real config returned and names matched");
      expect([...entries.keys()]).toEqual(["DATABASE_URL"]);
      expect(events).toEqual([
         "01: locate config",
         "02: read source",
         "03: strip types",
         "05: rewrite imports",
         "06: create mock loader",
         "07: execute synthetic config",
         "08: validate result and extract names",
         "09-10: protection callback",
         "11: real reader evaluated",
         "11: real config returned and names matched",
      ]);
      // This snapshot describes implementation order. Group 04 tests helper arguments during execution, not a separate syntax-validation pass.
      await expect(JSON.stringify(events, null, 2) + "\n").toMatchFileSnapshot("./__snapshots__/order.json");
   });
});
