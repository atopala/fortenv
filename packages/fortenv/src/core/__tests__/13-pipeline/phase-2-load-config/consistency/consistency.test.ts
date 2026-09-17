import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { loadConfiguration } from "../../../../bootstrap.js";
import { discoverConfiguration } from "../../../../discovery.js";

// Inject only phase one's result so these tests reach the phase-two consistency check.
// No dynamic or otherwise invalid config syntax is needed to manufacture a mismatch.
vi.mock("../../../../discovery.js", () => ({ discoverConfiguration: vi.fn() }));

describe("13 — Phase consistency", () => {
   afterEach(() => {
      vi.unstubAllEnvs();
      vi.clearAllMocks();
   });

   it.each([
      { name: "matching sets", discovered: ["DATABASE_URL", "STRIPE_SECRET_KEY"], accepted: true },
      { name: "matching sets in a different order", discovered: ["STRIPE_SECRET_KEY", "DATABASE_URL"], accepted: true },
      { name: "a secret added in phase two", discovered: ["DATABASE_URL"], accepted: false },
      {
         name: "a secret removed in phase two",
         discovered: ["DATABASE_URL", "STRIPE_SECRET_KEY", "REMOVED"],
         accepted: false,
      },
      {
         name: "a secret renamed without changing the count",
         discovered: ["DATABASE_URL", "OLD_NAME"],
         accepted: false,
      },
   ])("checks phase-one / phase-two secret consistency: $name", async ({ discovered, accepted }) => {
      const file = fileURLToPath(new URL("./fortenv.config.mjs", import.meta.url));
      vi.stubEnv("FORTENV_CONFIG", file);
      vi.mocked(discoverConfiguration).mockResolvedValue({
         secrets: new Map(discovered.map((name) => [name, []])),
         telemetry: { enumeration: false, stderrFallback: false },
      });
      const protect = vi.fn<(names: Iterable<string>) => void>();
      const loading = loadConfiguration(protect);

      if (accepted) {
         const entries = await loading;
         expect([...entries.keys()].sort()).toEqual(["DATABASE_URL", "STRIPE_SECRET_KEY"]);
      } else {
         await expect(loading).rejects.toThrow(/secret.*(?:changed|differ|mismatch)/i);
      }
      expect(protect).toHaveBeenCalledOnce();
      expect([...protect.mock.calls[0]![0]]).toEqual(discovered);
   });
});
