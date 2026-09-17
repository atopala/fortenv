import { realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { configPath } from "../../config-source.js";

describe("01 — Locate config", () => {
   beforeEach(() => vi.stubEnv("FORTENV_CONFIG", undefined));
   afterEach(() => vi.unstubAllEnvs());

   it.each(["ts", "mts", "js", "mjs"])("selects the sole .%s config", async (extension) => {
      const directory = fileURLToPath(new URL(`./${extension}/`, import.meta.url));
      expect(await configPath(directory)).toBe(await realpath(`${directory}/fortenv.config.${extension}`));
   });

   it("rejects a directory with no supported default config", async () => {
      await expect(configPath(fileURLToPath(new URL("./none/", import.meta.url)))).rejects.toThrow(
         "expected exactly one",
      );
   });

   it("rejects ambiguous defaults and accepts an explicit relative selection", async () => {
      const directory = fileURLToPath(new URL("./ambiguous/", import.meta.url));
      await expect(configPath(directory)).rejects.toThrow("expected exactly one");
      expect(await configPath(directory, "fortenv.config.mjs")).toBe(await realpath(`${directory}/fortenv.config.mjs`));
   });

   it("accepts an absolute override outside the search directory", async () => {
      const selected = fileURLToPath(new URL("./mjs/fortenv.config.mjs", import.meta.url));
      expect(await configPath(fileURLToPath(new URL("./none/", import.meta.url)), selected)).toBe(
         await realpath(selected),
      );
   });

   it("honors FORTENV_CONFIG", async () => {
      vi.stubEnv("FORTENV_CONFIG", "fortenv.config.mjs");
      const directory = fileURLToPath(new URL("./mjs/", import.meta.url));
      expect(await configPath(directory)).toBe(await realpath(`${directory}/fortenv.config.mjs`));
   });

   it.each(["", "config.cjs", "config.cts", "config.json"])("rejects override %j", async (override) => {
      await expect(configPath(fileURLToPath(new URL(".", import.meta.url)), override)).rejects.toThrow(
         "FORTENV_CONFIG must name",
      );
   });

   it("reports a missing explicitly selected file", async () => {
      await expect(configPath(fileURLToPath(new URL(".", import.meta.url)), "missing.mjs")).rejects.toMatchObject({
         code: "ENOENT",
      });
   });
});
