import { pathToFileURL } from "node:url";

import type { TelemetryOptions } from "../config.js";
import { normalizeName } from "../runtime/node/environment.js";
import { configPath, readConfigSource } from "./config-source.js";
import { readConfiguration, type SecretEntries } from "./configuration.js";
import { discoverConfiguration } from "./discovery.js";

export function matchingNames(discovered: SecretEntries, actual: SecretEntries): void {
   if (discovered.size !== actual.size || [...discovered.keys()].some((name) => !actual.has(name))) {
      throw new Error(
         "Fortenv: secret names changed between discovery and real config execution; secret names must be deterministic and independent of imported values.",
      );
   }
   const normalized = new Set([...actual.keys()].map(normalizeName));
   if (normalized.size !== actual.size) {
      throw new Error("Fortenv: secret names must be unique ignoring case on Windows.");
   }
}

/** Discover names, protect them through the runtime, then load real identities. */
export async function loadConfiguration(
   protect: (names: Iterable<string>, telemetry: Required<TelemetryOptions>) => void,
): Promise<SecretEntries> {
   const filename = await configPath();
   const source = await readConfigSource(filename);
   const discovered = await discoverConfiguration(source, filename);
   protect(discovered.secrets.keys(), discovered.telemetry);
   const config: { default?: unknown } = await import(pathToFileURL(filename).href);
   const entries = readConfiguration(config.default);
   matchingNames(discovered.secrets, entries);
   return entries;
}
