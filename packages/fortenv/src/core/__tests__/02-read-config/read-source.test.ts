import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readConfigSource } from "../../config-source.js";

describe("02 — Read config source", () => {
   it("reads UTF-8 source verbatim without executing the file", async () => {
      const source = await readConfigSource(fileURLToPath(new URL("./source.config.mjs", import.meta.url)));
      await expect(source).toMatchFileSnapshot("./__snapshots__/source.txt");
      expect(source).toContain("READING_MUST_NOT_EXECUTE_CONFIG");
      expect(source.endsWith("\n")).toBe(true);
   });

   it("reports a missing file at the read stage", async () => {
      await expect(readConfigSource(fileURLToPath(new URL("./missing.mjs", import.meta.url)))).rejects.toMatchObject({
         code: "ENOENT",
      });
   });
});
