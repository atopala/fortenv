import type { TelemetryOptions } from "../config.js";
import {
   appendArrayValue,
   createMap,
   forEachArrayValue,
   forEachMapEntry,
   hasMapKey,
   isArray,
   listOwnKeys,
   readMap,
   readOwnPropertyDescriptor,
   readPrototype,
   stringifyJson,
   writeMap,
} from "./intrinsics.js";
import { FortenvConfigError } from "./security-errors.js";

export type SecretEntries = ReadonlyMap<string, readonly Function[]>;

function record(value: unknown, label: string): Record<string, unknown> {
   if (value === null || typeof value !== "object" || isArray(value)) {
      throw new FortenvConfigError(`Fortenv: ${label} must be an object.`);
   }
   const prototype = readPrototype(value);
   if (prototype !== null && readPrototype(prototype) !== null) {
      throw new FortenvConfigError(`Fortenv: ${label} must be a plain object.`);
   }
   return value as Record<string, unknown>;
}

function properties(value: object, label: string): Map<string, unknown> {
   const result = createMap<string, unknown>();
   forEachArrayValue(listOwnKeys(value), (key) => {
      const descriptor = readOwnPropertyDescriptor(value, key)!;
      if (typeof key !== "string" || !("value" in descriptor) || !descriptor.enumerable) {
         throw new FortenvConfigError(`Fortenv: ${label} must contain only enumerable string data properties.`);
      }
      writeMap(result, key, descriptor.value);
   });
   return result;
}

export function validateSecretName(name: string): void {
   if (!name || name.includes("=") || name.includes("\0")) {
      throw new FortenvConfigError("Fortenv: secret names must be nonempty and cannot contain '=' or NUL.");
   }
   if (name.toUpperCase().startsWith("NEXT_PUBLIC_")) {
      throw new FortenvConfigError("Fortenv: NEXT_PUBLIC_* variables cannot be protected secrets.");
   }
}

function targets(value: unknown, name: string): Function[] {
   if (!isArray(value)) {
      throw new FortenvConfigError(`Fortenv: grants for ${stringifyJson(name)} must be an array of wrapped functions.`);
   }
   const result: Function[] = [];
   for (let index = 0; index < value.length; index++) {
      const descriptor = readOwnPropertyDescriptor(value, index);
      if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "function") {
         throw new FortenvConfigError(`Fortenv: grants for ${stringifyJson(name)} must contain only functions.`);
      }
      appendArrayValue(result, descriptor.value);
   }
   return result;
}

/** Copy the configuration so later mutation cannot change the installed policy. */
export function readConfiguration(value: unknown): SecretEntries {
   const config = properties(record(value, "configuration"), "configuration");
   let unexpectedKey = false;
   forEachMapEntry(config, (key) => {
      if (key !== "secrets" && key !== "telemetry") unexpectedKey = true;
   });
   if (!hasMapKey(config, "secrets") || unexpectedKey) {
      throw new FortenvConfigError("Fortenv: configuration must contain 'secrets' and optionally 'telemetry'.");
   }
   readTelemetryOptions(value);
   const secrets = properties(record(readMap(config, "secrets"), "secrets"), "secrets");
   const result = createMap<string, readonly Function[]>();
   forEachMapEntry(secrets, (name, secretValue) => {
      validateSecretName(name);
      writeMap(result, name, targets(secretValue, name));
   });
   return result;
}

/** Copy validated flags for installation before real config imports run. */
export function readTelemetryOptions(value: unknown): Required<TelemetryOptions> {
   const config = properties(record(value, "configuration"), "configuration");
   const result = { enumeration: false, stderrFallback: false };
   if (!hasMapKey(config, "telemetry")) return result;
   const options = properties(record(readMap(config, "telemetry"), "telemetry"), "telemetry");
   forEachMapEntry(options, (key, flag) => {
      if (key !== "enumeration" && key !== "stderrFallback") {
         throw new FortenvConfigError(`Fortenv: unknown telemetry option ${stringifyJson(key)}.`);
      }
      if (typeof flag !== "boolean") {
         throw new FortenvConfigError(`Fortenv: telemetry.${key} must be a boolean.`);
      }
      result[key] = flag;
   });
   return result;
}
