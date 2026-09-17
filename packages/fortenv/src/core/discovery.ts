import type { TelemetryOptions } from "../config.js";
import { readTelemetryOptions, type SecretEntries } from "./configuration.js";
import { readDiscoveryResult } from "./discovery-result.js";
import { transformImports } from "./imports.js";
import { createMockLoader } from "./mock-imports.js";
import { executeSyntheticConfig } from "./synthetic-execution.js";
import { stripConfigTypes } from "./typescript.js";

/** Discover names through mocked execution, without importing application modules. */
export async function discoverSecrets(source: string, filename: string): Promise<SecretEntries> {
   return (await discoverConfiguration(source, filename)).secrets;
}

/** Discover protection and reporting policy in the same mocked execution. */
export async function discoverConfiguration(
   source: string,
   filename: string,
): Promise<{
   secrets: SecretEntries;
   telemetry: Required<TelemetryOptions>;
}> {
   try {
      const javascript = stripConfigTypes(source, filename);
      // Rewrite imports; defineConfig validates its arguments during execution.
      const transformed = transformImports(javascript);
      const placeholders = new WeakSet<Function>();
      const value = await executeSyntheticConfig(transformed, filename, createMockLoader(placeholders));
      return { secrets: readDiscoveryResult(value, placeholders), telemetry: readTelemetryOptions(value) };
   } catch (cause) {
      const detail =
         cause !== null && typeof cause === "object" && "message" in cause ? String(cause.message) : "invalid config";
      throw new Error(
         `Fortenv: config discovery failed for ${filename}: ${detail}. Use declarative config with static imports and native type-strippable TypeScript (Node ${process.versions.node}).`,
      );
   }
}
