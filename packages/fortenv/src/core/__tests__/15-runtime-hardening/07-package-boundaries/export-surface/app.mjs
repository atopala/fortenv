// SEC-14: enumerate everything reachable through Fortenv's public exports and try
// to reach live private state (the captured values, the grant registry) or a
// grant-installation backdoor. Also attempt to import internal dist modules by
// subpath, which the package `exports` map must refuse. No route may expose a
// secret value or let an attacker wrapper gain a grant.

import * as rootNs from "fortenv";
import { fortenv } from "fortenv";
import * as configNs from "fortenv/config";
import * as telemetryNs from "fortenv/telemetry";

const SECRETS = ["fake-hardening-database", "fake-hardening-private-key"];
/** @type {string[]} */
const findings = [];

/** Bounded deep scan of an exported value graph for a secret string.
 * @param {unknown} root @param {string} label */
function scan(root, label) {
   /** @type {Set<unknown>} */
   const seen = new Set();
   /** @type {Array<{ v: unknown; path: string; depth: number }>} */
   const stack = [{ v: root, path: label, depth: 0 }];
   while (stack.length) {
      const entry = stack.pop();
      if (!entry) continue;
      const { v, path, depth } = entry;
      if (v === null || depth > 4) continue;
      const t = typeof v;
      if (t === "string") {
         if (SECRETS.includes(/** @type {string} */ (v))) findings.push(`secret-string@${path}`);
         continue;
      }
      if (t !== "object" && t !== "function") continue;
      const obj = /** @type {object} */ (v);
      if (seen.has(obj)) continue;
      seen.add(obj);
      /** @type {PropertyKey[]} */
      let keys = [];
      try {
         keys = Reflect.ownKeys(obj);
      } catch {
         continue;
      }
      for (const key of keys) {
         if (typeof key === "symbol") continue;
         let child;
         try {
            const d = Object.getOwnPropertyDescriptor(obj, key);
            if (!d || !("value" in d)) continue; // skip accessors (don't trigger getters blindly)
            child = d.value;
         } catch {
            continue;
         }
         stack.push({ v: child, path: `${path}.${key}`, depth: depth + 1 });
      }
   }
}

// 1. Scan all public export namespaces for a leaked secret or live store.
scan(rootNs, "fortenv");
scan(configNs, "fortenv/config");
scan(telemetryNs, "fortenv/telemetry");

// 2. Attempt to import internal dist modules by subpath — must be refused.
const blockedImports = [];
for (const spec of ["fortenv/dist/core/runtime.js", "fortenv/core/runtime", "fortenv/dist/core/injection.js"]) {
   try {
      await import(spec);
      blockedImports.push(`RESOLVED:${spec}`); // a resolvable internal import is a finding
   } catch {
      // expected: package exports refuse the subpath
   }
}

// 3. Try to use any exported helper to install a grant for an attacker wrapper.
const attacker = fortenv.string(
   /** @param {import("fortenv").SecretValues<"DATABASE_URL" | "PRIVATE_KEY">} secrets */
   (secrets) =>
      secrets.DATABASE_URL === "fake-hardening-database" || secrets.PRIVATE_KEY === "fake-hardening-private-key",
);
let attackerGotSecret = false;
try {
   attackerGotSecret = attacker() === true;
} catch {
   attackerGotSecret = false;
}

console.log(
   JSON.stringify({
      rootExports: Object.keys(rootNs).sort(),
      leakFindings: findings,
      resolvedInternalImports: blockedImports,
      attackerGotSecret,
   }),
);
