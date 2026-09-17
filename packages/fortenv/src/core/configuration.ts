import type { TelemetryOptions } from "../config.js";

export type SecretEntries = ReadonlyMap<string, readonly Function[]>;

function record(value: unknown, label: string): Record<string, unknown> {
   if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Fortenv: ${label} must be an object.`);
   }
   const prototype: unknown = Object.getPrototypeOf(value);
   if (prototype !== null && Object.getPrototypeOf(prototype) !== null) {
      throw new Error(`Fortenv: ${label} must be a plain object.`);
   }
   return value as Record<string, unknown>;
}

function properties(value: object, label: string): Map<string, unknown> {
   const result = new Map<string, unknown>();
   for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
      if (typeof key !== "string" || !("value" in descriptor) || !descriptor.enumerable) {
         throw new Error(`Fortenv: ${label} must contain only enumerable string data properties.`);
      }
      result.set(key, descriptor.value);
   }
   return result;
}

export function validateSecretName(name: string): void {
   if (!name || name.includes("=") || name.includes("\0")) {
      throw new Error("Fortenv: secret names must be nonempty and cannot contain '=' or NUL.");
   }
   if (name.toUpperCase().startsWith("NEXT_PUBLIC_")) {
      throw new Error("Fortenv: NEXT_PUBLIC_* variables cannot be protected secrets.");
   }
}

function targets(value: unknown, name: string): Function[] {
   if (!Array.isArray(value)) {
      throw new Error(`Fortenv: grants for ${JSON.stringify(name)} must be an array of wrapped functions.`);
   }
   const result: Function[] = [];
   for (let index = 0; index < value.length; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, index);
      if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "function") {
         throw new Error(`Fortenv: grants for ${JSON.stringify(name)} must contain only functions.`);
      }
      result.push(descriptor.value);
   }
   return result;
}

/** Copy the configuration so later mutation cannot change the installed policy. */
export function readConfiguration(value: unknown): SecretEntries {
   const config = properties(record(value, "configuration"), "configuration");
   if (!config.has("secrets") || [...config.keys()].some((key) => key !== "secrets" && key !== "telemetry")) {
      throw new Error("Fortenv: configuration must contain 'secrets' and optionally 'telemetry'.");
   }
   readTelemetryOptions(value);
   const secrets = properties(record(config.get("secrets"), "secrets"), "secrets");
   const result = new Map<string, readonly Function[]>();
   for (const [name, value] of secrets) {
      validateSecretName(name);
      result.set(name, targets(value, name));
   }
   return result;
}

/** Copy validated flags for installation before real config imports run. */
export function readTelemetryOptions(value: unknown): Required<TelemetryOptions> {
   const config = properties(record(value, "configuration"), "configuration");
   const result = { enumeration: false, stderrFallback: false };
   if (!config.has("telemetry")) return result;
   const options = properties(record(config.get("telemetry"), "telemetry"), "telemetry");
   for (const [key, flag] of options) {
      if (key !== "enumeration" && key !== "stderrFallback") {
         throw new Error(`Fortenv: unknown telemetry option ${JSON.stringify(key)}.`);
      }
      if (typeof flag !== "boolean") {
         throw new Error(`Fortenv: telemetry.${key} must be a boolean.`);
      }
      result[key] = flag;
   }
   return result;
}
