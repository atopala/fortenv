import { readConfiguration } from "./core/configuration.js";

export interface TelemetryOptions {
   /** Report environment enumeration; protected names remain hidden. Defaults to false. */
   readonly enumeration?: boolean;
   /** Write denied reads to stderr when no observer is connected. Defaults to false. */
   readonly stderrFallback?: boolean;
}

/** Secret names mapped to the exact functions returned by fortenv(). */
export interface FortenvConfig {
   readonly secrets: Readonly<Record<string, readonly Function[]>>;
   readonly telemetry?: TelemetryOptions;
}

/** Validate config values without initializing Fortenv or granting access. */
export function defineConfig<const T extends FortenvConfig>(config: T): T {
   readConfiguration(config);
   return config;
}
