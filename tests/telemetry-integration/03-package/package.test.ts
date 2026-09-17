import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("03 — Published dependency boundary", () => {
   it("keeps the core telemetry entry logger-neutral", async () => {
      const telemetry = await import("fortenv/telemetry");
      expect(Object.keys(telemetry).sort()).toEqual(["FortenvEnumerationError", "subscribeSecurityEvents"]);
      const declarations = readFileSync(new URL("./telemetry.d.ts", import.meta.resolve("fortenv")), "utf8");
      expect(declarations).not.toMatch(/Pino|OpenTelemetry/);
   });

   it.each(["@fortenv/pino", "@fortenv/opentelemetry"])("provides connectFortenv through %s", async (specifier) => {
      await expect(import(specifier)).resolves.toMatchObject({ connectFortenv: expect.any(Function) });
      const entry = import.meta.resolve(specifier);
      expect(entry).toMatch(/\/dist\/index\.js$/);
      const manifest = JSON.parse(readFileSync(new URL("../package.json", entry), "utf8"));
      expect(manifest.peerDependencies.fortenv).toBe("^1.0.0");
      expect(Object.keys(manifest.peerDependencies).sort()).toEqual(
         specifier === "@fortenv/pino" ? ["fortenv", "pino"] : ["@opentelemetry/api-logs", "fortenv"],
      );
      expect(Object.keys(manifest.dependencies ?? {})).toEqual([]);
   });

   it("exports the runtime access error from the root entry only", async () => {
      const [root, telemetry] = await Promise.all([import("fortenv"), import("fortenv/telemetry")]);

      expect("FortenvAccessError" in root).toBe(true);
      expect("FortenvAccessError" in telemetry).toBe(false);
   });

   it("resolves Fortenv to dist and requires no runtime, peer, or optional packages", () => {
      const entry = import.meta.resolve("fortenv");
      expect(entry).toMatch(/\/dist\/index\.js$/);
      const manifest = JSON.parse(readFileSync(new URL("../package.json", entry), "utf8"));
      for (const field of ["dependencies", "peerDependencies", "optionalDependencies"]) {
         expect(Object.keys(manifest[field] ?? {})).toEqual([]);
      }
      expect(
         Object.keys(manifest.devDependencies ?? {}).filter(
            (name) => name === "pino" || name.startsWith("@opentelemetry/"),
         ),
      ).toEqual([]);
   });
});
