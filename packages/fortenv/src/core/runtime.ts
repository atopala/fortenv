import { isGeneratorFunction } from "node:util/types";

import { normalizeName, protectEnvironment } from "../runtime/node/environment.js";
import type { SecretEntries } from "./configuration.js";
import { buildGrants } from "./grants.js";
import { injectSecrets, type SecretValues } from "./injection.js";
import { readWeakMap } from "./intrinsics.js";

// Capture before real config dependencies load: later replacements must not see injected values.
const reflectApply = Reflect.apply;

const wrappers = new WeakSet<Function>();
let grants = new WeakMap<Function, ReadonlySet<string>>();
let values: ReadonlyMap<string, string | undefined> = new Map();
let phase: "uninitialized" | "loading" | "ready" | "failed" = "uninitialized";
let initialization: Promise<void> | undefined;

function beginBootstrap(): void {
   if (phase !== "uninitialized") {
      throw new Error("Fortenv: initialization can only happen once per runtime instance.");
   }
   phase = "loading";
}

function failBootstrap(): void {
   phase = "failed";
   grants = new WeakMap();
   values = new Map();
}

function installGrants(entries: SecretEntries): void {
   if (phase !== "loading") throw new Error("Fortenv: configuration is not loading.");
   grants = buildGrants(entries, (fn) => wrappers.has(fn));
   phase = "ready";
}

function invocationGrants(wrapper: Function): ReadonlySet<string> {
   if (phase === "uninitialized") {
      throw new Error("Fortenv: not initialized; start Node with --import fortenv/register.");
   }
   if (phase !== "ready") {
      throw new Error(`Fortenv: wrapped functions cannot run while configuration is ${phase}.`);
   }
   return readWeakMap(grants, wrapper) ?? new Set<string>();
}

/** Wrap a callable; permission comes only from the loaded configuration. */
export function fortenv<This, Args extends unknown[], Result>(
   fn: (this: This, secrets: SecretValues, ...args: Args) => Result,
): (this: This, ...args: Args) => Result {
   if (typeof fn !== "function" || isGeneratorFunction(fn)) {
      throw new TypeError("Fortenv: expected an ordinary synchronous or async function, not a generator.");
   }
   const wrapped = new Proxy(fn, {
      apply(_target, receiver: unknown, args: unknown[]) {
         const secrets = injectSecrets(invocationGrants(wrapped), values, normalizeName);
         return reflectApply(fn, receiver, [secrets, ...args]);
      },
      construct() {
         throw new TypeError("Fortenv: wrapped functions cannot be used as constructors.");
      },
   });
   wrappers.add(wrapped);
   return wrapped as unknown as (this: This, ...args: Args) => Result;
}

async function initialize(): Promise<void> {
   beginBootstrap();
   try {
      const { loadConfiguration } = await import("./bootstrap.js");
      const entries = await loadConfiguration((names, telemetry) => {
         values = protectEnvironment(names, telemetry);
      });
      installGrants(entries);
   } catch (cause) {
      failBootstrap();
      throw cause;
   }
}

/** The preload can request initialization, but cannot supply grants or values. */
export function bootstrap(): Promise<void> {
   initialization ??= initialize();
   return initialization;
}
