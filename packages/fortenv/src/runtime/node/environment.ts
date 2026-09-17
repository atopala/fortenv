import { syncBuiltinESMExports } from "node:module";

import type { TelemetryOptions } from "../../config.js";
import { FortenvAccessError, FortenvEnumerationError } from "../../core/security-errors.js";
import { reportSecurityEvent } from "./security-events.js";

// A marker detects a second installed copy. It carries no grants or secret values.
const installed = Symbol.for("fortenv.environment.installed");

export function normalizeName(name: string): string {
   return process.platform === "win32" ? name.toUpperCase() : name;
}

/** Snapshot configured values, including absence, then scrub the underlying object. */
export function captureSecrets(
   original: NodeJS.ProcessEnv,
   names: Iterable<string>,
): ReadonlyMap<string, string | undefined> {
   const values = new Map<string, string | undefined>();
   for (const name of names) values.set(normalizeName(name), original[name]);
   for (const name of values.keys()) delete original[name];

   return values;
}

/** Protected environment reads always fail; this guard has no secret values. */
export function createEnvironmentGuard(
   original: NodeJS.ProcessEnv,
   names: ReadonlySet<string>,
   telemetry: TelemetryOptions = {},
): NodeJS.ProcessEnv {
   const { enumeration = false, stderrFallback = false } = telemetry;
   const protectedKey = (key: PropertyKey): key is string => typeof key === "string" && names.has(normalizeName(key));
   const rejectMutation = (key: PropertyKey): void => {
      if (protectedKey(key)) {
         throw new TypeError(`Fortenv: configured secret ${JSON.stringify(key)} is read-only.`);
      }
   };
   return new Proxy(original, {
      get(target, key) {
         if (key === installed) return true;
         if (!protectedKey(key)) return Reflect.get(target, key, target);
         const error = new FortenvAccessError(key);
         reportSecurityEvent(
            {
               version: 1,
               name: "fortenv.access.denied",
               severity: "error",
               operation: "get",
               secret: key,
               timestamp: Date.now(),
               error,
            },
            stderrFallback,
         );
         throw error;
      },
      has: (target, key) => !protectedKey(key) && Reflect.has(target, key),
      ownKeys(target) {
         if (enumeration) {
            reportSecurityEvent(
               {
                  version: 1,
                  name: "fortenv.env.enumerated",
                  severity: "warn",
                  operation: "ownKeys",
                  timestamp: Date.now(),
                  error: new FortenvEnumerationError(),
               },
               false,
            );
         }
         return Reflect.ownKeys(target).filter((key) => !protectedKey(key));
      },
      getOwnPropertyDescriptor: (target, key) =>
         protectedKey(key) ? undefined : Reflect.getOwnPropertyDescriptor(target, key),
      set(target, key, value) {
         rejectMutation(key);
         return Reflect.set(target, key, value, target);
      },
      deleteProperty(target, key) {
         rejectMutation(key);
         return Reflect.deleteProperty(target, key);
      },
      defineProperty(target, key, descriptor) {
         rejectMutation(key);
         return Reflect.defineProperty(target, key, descriptor);
      },
      setPrototypeOf: () => false,
      preventExtensions: () => false,
   });
}

/** Capture and guard synchronously, before any real config dependency executes. */
export function protectEnvironment(
   names: Iterable<string>,
   telemetry: TelemetryOptions = {},
): ReadonlyMap<string, string | undefined> {
   const original = process.env;
   if (Reflect.get(original, installed)) {
      throw new Error("Fortenv: another runtime instance already guards process.env; use one shared package instance.");
   }
   const values = captureSecrets(original, names);
   const guard = createEnvironmentGuard(original, new Set(values.keys()), telemetry);
   Object.defineProperty(process, "env", { value: guard, writable: false, configurable: false });
   // Keep `import { env } from 'node:process'` on the guarded object, too.
   syncBuiltinESMExports();
   return values;
}
