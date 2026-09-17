# Fortenv V1 Design Specification

## Status

This document defines the agreed Fortenv V1 architecture, including the explicit secret-injection DX and security telemetry contract. Section numbers remain stable for test references.

It supersedes earlier exploratory designs involving:

- `reader()`
- module-level ACLs
- caller stack inspection
- call-stack hashes
- generated secret tokens
- generated random reader names
- lexical reader injection
- per-file grants
- application AST rewriting
- ambient async or synchronous grant stacks
- deferred `.read()` initialization queues
- opaque objects returned from `process.env`

The V1 architecture is:

```text
fortenv() wrapper
        +
function-identity ACL
        +
explicit per-call secret injection
        +
guarded process.env
        +
two-phase safe config loading
```

The primary target is Node.js.

---

# 1. Purpose

Fortenv removes configured secrets from ambient `process.env` access and injects them into explicitly registered functions:

```ts
export const createDb = fortenv(({ DATABASE_URL }) => new Db(DATABASE_URL));
```

The configuration discovers protected names before application imports execute. Values are captured privately and scrubbed from the original environment. After real function registration, each wrapper receives only its configured secrets as its callback's first argument. All direct protected `process.env` reads throw, including inside registered callbacks.

---

# 2. Security scope

Fortenv V1 protects against ordinary ambient JavaScript access through:

```ts
process.env.SECRET;
```

including dependency code that attempts things such as:

```ts
const key = process.env.DATABASE_URL;
```

or:

```ts
JSON.stringify(process.env);
```

Fortenv is defense-in-depth against secret exposure through the Node environment API.

It is **not a sandbox** and must never claim to isolate arbitrary malicious code running in the same operating-system process.

---

# 3. Important Linux limitation

On Linux, `/proc/self/environ` exposes the process's **initial environment**.

Removing:

```ts
delete process.env.DATABASE_URL;
```

does not necessarily remove the value from:

```text
/proc/self/environ
```

Therefore sufficiently malicious same-process code with filesystem access can potentially bypass Fortenv V1 by reading the initial process environment directly.

Consequently, Fortenv must not claim:

> Malicious dependencies cannot access your secrets.

The accurate V1 guarantee is closer to:

> Fortenv removes configured secrets from ambient `process.env` access and injects them into explicitly registered functions.

A stronger future mode could solve the initial-environment issue using a launcher process; see the Future Security section.

---

# 4. Non-goals

Fortenv V1 is not:

- dotenv
- an environment validation library
- a schema library
- a coercion system
- a configuration framework
- AWS Secrets Manager integration
- Vault integration
- a general-purpose secret manager
- a JavaScript sandbox
- a complete supply-chain isolation system
- a replacement for containers/process isolation
- a build-time application transformer

Do not add unrelated configuration functionality.

---

# 5. Runtime target

V1 targets Node.js 22.23.2 and later, with Node 22 as the tested baseline. Enforce the minimum through package engines and CI. Configuration supports ESM `.ts`, `.mts`, `.js`, and `.mjs` only. TypeScript uses native type stripping; no runtime parser dependencies.

---

# 6. Package API

- `fortenv` exports `fortenv(fn)`, `FortenvAccessError`, and the `SecretValues` type.
- `fortenv/config` exports `defineConfig`, configuration and telemetry option types.
- `fortenv/register` performs preload initialization.
- `fortenv/telemetry` exports `FortenvEnumerationError`, `SecurityEvent`, and `subscribeSecurityEvents`.
- Standalone `@fortenv/pino` and `@fortenv/opentelemetry` packages each export `connectFortenv(logger): () => void`, typed with the corresponding library's official `Logger`.

Ordinary root/config/telemetry imports do not bootstrap the application.

---

# 7. Basic developer experience

```ts
// db.ts — definitions only during configuration loading
import { fortenv } from "fortenv";
import { Db } from "your-database-package";
export const createDb = fortenv(({ DATABASE_URL }, poolSize: number = 10) => {
   if (DATABASE_URL === undefined) throw new Error("DATABASE_URL is required");
   return new Db(DATABASE_URL, { poolSize });
});
```

```ts
// fortenv.config.ts
import { defineConfig } from "fortenv/config";
import { createDb } from "./db.ts";
export default defineConfig({ secrets: { DATABASE_URL: [createDb] } });
```

```ts
// app.ts — outside the config dependency graph
import { createDb } from "./db.ts";
export const db = createDb(20);
```

Run `node --import fortenv/register app.ts`. Config imports factory definitions; the application invokes them after preload completes. A dependency's `process.env.DATABASE_URL` read throws even inside `new Db(...)`. The credential explicitly passed to `Db` is outside Fortenv's control.

---

# 8. Configuration model

`defineConfig({ secrets, telemetry? })` validates its argument and returns it unchanged. It does not install grants. `secrets` maps valid names to dense arrays of function references. Only exact wrappers are accepted during real registration. Empty arrays protect a secret without granting it to any wrapper; an empty map protects nothing.

`telemetry.enumeration` and `telemetry.stderrFallback` are optional booleans, both defaulting to false. Unknown root/telemetry keys, accessors, symbol keys, invalid records and malformed grants are rejected. Discovery installs the reporting options before real config imports.

---

# 9. Secret names

Names are nonempty strings, cannot contain `=` or NUL, and cannot begin with `NEXT_PUBLIC_`. Deterministic computed names and locally constructed configuration values are supported. Names must not depend on application imports, environment, time or randomness: configuration executes twice.

On Windows, capture and environment protection normalize names case-insensitively, and case-equivalent duplicate config keys are rejected. Injected object keys retain the exact configuration spelling. The JavaScript injection object itself is case-sensitive.

---

# 10. `fortenv()` behavior

`fortenv(fn)` returns a callable wrapper. On each invocation after bootstrap it creates the authorized secrets object and calls `fn(secrets, ...callerArguments)` with the caller's `this`.

The public wrapper takes only the remaining business arguments. It preserves returned values and Promise identity, synchronous throws and asynchronous rejection identity. There is no automatic waiting for bootstrap and no permission lifetime tied to Promise settlement. Thenables are ordinary returned values. Generator callbacks and construction with `new` remain unsupported.

Caller arguments cannot replace the injected first argument. Wrapping alone grants no secrets.

---

# 11. `fortenv()` does not grant permissions

Only the loaded configuration grants keys to exact wrapper identities. Destructuring a name in the callback, callback source text, a function name, and a caller-supplied object confer no grant. The original callback is not a configured identity.

---

# 12. Function identity is the ACL identity

Authorization uses exact JavaScript function identity.

Conceptually:

```ts
WeakMap<Function, ReadonlySet<string>>;
```

Do not authorize using:

- function names
- source strings
- stack traces
- call-stack hashes
- filenames
- module names
- source maps
- generated string IDs

Exact function identity is the authorization primitive.

---

# 13. Wrapped-function identity

Fortenv should privately track which functions were produced by `fortenv()`.

Conceptually:

```ts
const wrappedFunctions = new WeakSet<Function>();
```

Do not expose forgeable metadata such as:

```ts
fn.__fortenv = true;
```

Configuration must reject raw functions:

```ts
function rawCreateDb() {}

export default defineConfig({
   secrets: {
      DATABASE_URL: [rawCreateDb],
   },
});
```

because `rawCreateDb` is not a Fortenv wrapper.

---

# 14. Unregistered wrappers

After bootstrap an unregistered wrapper executes with an empty, frozen, null-prototype object. An ungranted property reads as `undefined` and is absent from own keys. Direct protected environment reads still throw. Unregistered nested calls never inherit their caller's injected keys. Before bootstrap, while configuration is loading, and after failed bootstrap, wrapper invocation throws before running the callback.

---

# 15. Injected secret object

The first callback argument is a fresh frozen null-prototype object. It has enumerable own data properties for exactly the names granted to that wrapper. Values are strings or `undefined`. A granted missing secret is an own property with value `undefined`; an ungranted key is absent. Names such as `__proto__` are ordinary own properties. The private backing store is never handed to callbacks.

---

# 16. No ambient authorization context

Environment authorization must not use AsyncLocalStorage, caller stacks, inherited execution context or synchronous grant stacks. Every protected environment read is denied. AsyncLocalStorage used solely to suppress recursive telemetry is independent of secret delivery and confers no access.

---

# 17. One object per invocation

Every invocation gets a separate immutable object, copied from the captured values for its exact grant set. Mutating a delivered object cannot change future calls or another wrapper's values. Configuration mutations after registration do not update the installed ACL.

---

# 18. Value lifetime

Delivered strings and objects obey ordinary JavaScript lifetimes. Fortenv cannot revoke values already returned, captured by closures, stored, logged or passed to dependencies. Do not claim post-return revocation or secret erasure. Keep explicit credential sharing narrow.

---

# 19. Synchronous calls

Synchronous callbacks execute immediately after registration and return their exact result. No timer, queue or extra Promise is introduced. Ambient protected reads throw throughout the invocation.

---

# 20. Asynchronous calls

Async callbacks receive their injection before their first instruction. That object remains usable across awaits. The wrapper returns the callback's exact Promise and does not install ambient permissions while it is pending.

---

# 21. Detached asynchronous work

Detached work cannot read protected `process.env` keys, whether its parent callback is pending or finished. It can use an injected string or object deliberately captured by its closure; this is explicit data flow and cannot be revoked.

---

# 22. Helpers and dependencies

Ordinary helpers receive no implicit secret access. A callback must pass a credential explicitly if a helper needs it. A dependency called synchronously or asynchronously inside the callback still gets an access error if it reads a protected environment key.

---

# 23. Security semantics

An exact registered wrapper is a capability to obtain its configured values. Any code that can call that wrapper can exercise its behavior; Fortenv does not authenticate callers. The library reduces ambient environment exposure, not malicious use of credentials deliberately handed to a dependency.

---

# 24. Recommended coding style

```ts
export const createDb = fortenv(({ DATABASE_URL }) => {
   if (DATABASE_URL === undefined) throw new Error("DATABASE_URL is required");
   return new Db(DATABASE_URL);
});
```

Prefer handing a dependency its specific credential rather than the entire injected object. Config imports definitions only. Construct clients from application code after preload. Fortenv performs no automatic value validation.

---

# 25. Nested Fortenv functions

Each nested wrapper receives only its own configured keys, regardless of its caller's grants. An unregistered nested wrapper gets an empty object. Returning or throwing from the inner call leaves the outer injection unchanged. There is no ambient context to restore.

---

# 26. Concurrent execution

Concurrent calls, including overlapping calls to the same wrapper, receive distinct frozen objects. Interleaved awaits must not mix grants or values. Direct environment reads remain denied in every continuation.

---

# 27. Secret storage

Captured values live in private module state. Public package exports must not expose a store, lookup function, mutable ACL, initialization-with-values API or general reader. Only wrapper invocation selects and copies granted values. Internal runtime adapter functions are not public package exports; package exports are not a security boundary against hostile filesystem access.

---

# 28. Bootstrap

Fortenv must initialize before normal application code.

Preferred:

```bash
node --import fortenv/register index.js
```

If multiple preload modules are used, Fortenv must execute before any potentially untrusted application preload code.

This requirement must be documented.

---

# 29. The configuration bootstrap problem

The configuration imports application functions:

```ts
import { createDb } from "./db.js";
```

Loading the real configuration immediately would execute its dependency graph.

Unsafe:

```text
Fortenv starts
    ↓
load fortenv.config.ts
    ↓
load db.ts
    ↓
load dependency
    ↓
dependency reads process.env.DATABASE_URL
    ↓
secret stolen before Fortenv scrubs it
```

Therefore configuration loading is intentionally split into two phases.

---

# 30. Phase 1 objective

Phase 1 has exactly one security-critical goal:

> Discover the set of protected secret names without executing application imports.

For:

```ts
export default defineConfig({
   secrets: {
      DATABASE_URL: [createDb],
      STRIPE_SECRET_KEY: [createStripe],
   },
});
```

Phase 1 should produce:

```ts
["DATABASE_URL", "STRIPE_SECRET_KEY"];
```

Nothing from the application dependency graph may execute to obtain this result.

---

# 31. Phase 1 uses transformed configuration execution

Read source, strip TypeScript with Node, rewrite static imports into awaited mock-loader calls, and execute the resulting discovery copy. `fortenv/config` supplies the real validating helper; application imports supply inert placeholder functions. No application dependencies execute. Validate the resulting config and extract names and telemetry options. This is executed discovery, not AST-only key extraction.

---

# 32. Why dynamic imports alone are insufficient

This is NOT sufficient:

```ts
const { createDb } = await import("./db.js");
```

because it still executes `db.js`.

Merely delaying the import also does not solve:

```ts
DATABASE_URL: [createDb];
```

because a value for `createDb` is required to evaluate the configuration.

Therefore imported grant references become inert placeholder functions during Phase 1.

---

# 33. Phase 1 example

```js
// Original
import { defineConfig } from "fortenv/config";
import { createDb } from "./db.mjs";
export default defineConfig({ secrets: { DATABASE_URL: [createDb] } });
```

Conceptually rewritten:

```js
const { defineConfig } = (await mockImport("fortenv/config")).namespace;
const { createDb } = (await mockImport("./db.mjs")).namespace;
return defineConfig({ secrets: { DATABASE_URL: [createDb] } });
```

The namespace envelope avoids Promise assimilation of an export named `then`. Static imports are hoisted before the body. `db.mjs` does not execute; the original module is imported normally in phase 2. Exact runnable transformer output is covered by file snapshots in test group 05.

---

# 34. Configuration execution contract

Configuration is trusted deterministic JavaScript, subject to the import transform's supported syntax. Local factories, computed names and ordinary expressions are allowed if they produce valid config with imported placeholder grant references. Validate `defineConfig()` arguments and the final exported value; let Node validate JavaScript syntax. Do not add an independent source grammar for how config values must be constructed.

---

# 35. Imported values and unsupported loading

Named, aliased, default, mixed and namespace imports are supported. Side-effect imports are inert during discovery and run normally in phase 2. Namespace property access yields a stable placeholder. Calling imported placeholders or accessing properties on a placeholder function fails discovery. Native dynamic imports cannot load real modules during discovery. Type-only imports are stripped.

The current transformer does not support re-exports, named exports or import attributes. Its scanner also rejects regex literals, division and template interpolation. These are transformer limitations, not a ban on factory-built config values. Reserved `__fortenv_` bindings are rejected. Keep these limitations documented and tested.

---

# 36. Zero-dependency import transformation

Use the existing source scanner only to identify and rewrite supported module syntax. Node's native TypeScript stripper and VM compiler validate executable code. Do not add TypeScript, Babel or other runtime parser dependencies. Tests must cover each supported import form with exact executable snapshots and ensure unsupported transformations fail visibly.

---

# 37. Synthetic execution

Run the rewritten config in an isolated VM context without process, require, timers or native dynamic imports. Disable string/Wasm code generation. Bound synchronous execution time. The VM is not a sandbox for hostile configuration and does not promise termination of arbitrary async code. Application imports must remain inert.

---

# 38. Phase 1 result verification

Validate the final configuration record, names, dense grant arrays and telemetry options. Each discovery grant must be a placeholder produced by the mock loader; local functions are not real registrations. Placeholder identities are discarded after discovery. Real wrapper identities are checked independently in phase 2.

---

# 39. Capture and scrub immediately after Phase 1

Once Fortenv knows:

```text
DATABASE_URL
STRIPE_SECRET_KEY
```

it immediately:

1. reads their values from the original environment object;
2. stores those values privately;
3. deletes them from the underlying environment object;
4. installs the protected `process.env` layer.

No application module should execute between steps 1 and 4.

---

# 40. Missing secret values

Capture absence explicitly. A wrapper granted a missing name receives that own key with value `undefined`. An ungranted key is absent from its injection. Direct `process.env` reads of configured names always throw, including names absent at startup.

---

# 41. `process.env` protection

After capture, the original environment no longer contains the configured secret values.

Fortenv then exposes a guarded `process.env`.

A Proxy is the preferred design if integration testing confirms stable behavior across supported Node versions.

Conceptually:

```ts
new Proxy(sanitizedEnvironment, {
  get(target, property) {
    ...
  }
});
```

---

# 42. Protected property reads

Every read of a configured key through the installed environment proxy throws `FortenvAccessError`, including reads inside a registered callback, helper, dependency or telemetry observer. There is no authorization callback that can permit an environment read. Successful injection uses private storage and never reads the guarded environment.

---

# 43. Normal environment variables

Non-protected variables continue to delegate to the original environment:

```ts
process.env.NODE_ENV;
process.env.PATH;
process.env.HOME;
process.env.TZ;
```

Fortenv should minimize behavioral changes outside configured secrets.

---

# 44. Enumeration protection

Protected secret values must never leak through:

```ts
Object.keys(process.env)
Object.values(process.env)
Object.entries(process.env)

JSON.stringify(process.env)

{ ...process.env }

for (const key in process.env) {}
```

Prefer protected keys to be absent from enumeration completely.

Implement Proxy traps consistently, likely including:

```text
get
has
ownKeys
getOwnPropertyDescriptor
set
deleteProperty
```

Respect JavaScript Proxy invariants.

---

# 45. `in` and property descriptors

For protected secrets, V1 should prefer ambient invisibility:

```ts
"DATABASE_URL" in process.env;
```

should behave as absent.

Likewise:

```ts
Object.getOwnPropertyDescriptor(process.env, "DATABASE_URL");
```

should not expose the protected value.

Authorized delivery uses the injected callback argument. Direct protected environment reads always throw.

---

# 46. Protected secret mutation

After bootstrap, configured secrets are owned by Fortenv.

Reject:

```ts
process.env.DATABASE_URL = "replacement";
```

and:

```ts
delete process.env.DATABASE_URL;
```

for protected names.

Throw a clear developer-facing Fortenv error.

Non-protected environment variables retain ordinary Node behavior.

---

# 47. Protect the `process.env` replacement

Where safely supported, Fortenv should prevent application code from trivially replacing the protected environment Proxy.

For example, after installation, consider making the `process.env` property non-configurable/non-writable.

This behavior must be tested across every supported Node release before being relied upon.

Compatibility matters, but a security mechanism that can simply be replaced is undesirable.

---

# 48. Phase 2

With values captured, scrubbed and the guard installed, import the original config normally. Its modules may define wrappers but cannot call them before registration completes. Validate real function references, compare the discovered and real name sets, build the ACL, then mark the runtime ready. Only then does the application start. Initialization failure keeps the environment shield in place and rejects subsequent wrapper calls.

---

# 49. Build the real ACL

Phase 2 converts:

```ts
secrets: {
  DATABASE_URL: [
    createDb,
    migrateDb,
  ],
}
```

into an identity-based ACL.

Conceptually:

```ts
ACL.set(createDb, new Set(["DATABASE_URL"]));
```

and:

```ts
ACL.set(migrateDb, new Set(["DATABASE_URL"]));
```

If the same function appears under several secrets, its set contains all of them.

---

# 50. Phase 2 validation

Every configured target must:

1. be a function;
2. be a function returned by `fortenv()`;
3. be a valid exact wrapper identity.

Invalid configuration fails startup.

Example:

```text
Fortenv: grant target "createDb" for
"DATABASE_URL" is not a fortenv() wrapped function.
```

---

# 51. Phase 1 / Phase 2 consistency

The set of configured secret names discovered in Phase 1 must exactly equal the secret set produced by the real Phase-2 configuration.

If Phase 1 sees:

```text
DATABASE_URL
```

but Phase 2 sees:

```text
DATABASE_URL
STRIPE_SECRET_KEY
```

startup fails.

Example:

```text
Fortenv: secret configuration changed
between bootstrap phases.
```

This detects inconsistent configuration, but cannot undo a read of an undiscovered name during real imports. Configuration must be trusted and deterministic.

---

# 52. Configuration discovery

Support conventional config files such as:

```text
fortenv.config.ts
fortenv.config.mts
fortenv.config.js
fortenv.config.mjs
```

Only these four extensions are supported, using ESM syntax. Exactly one default file must exist unless an explicit override is supplied.

An explicit relative or absolute override is supported through:

```text
FORTENV_CONFIG
```

Prefer deterministic lookup from the project/application working directory.

Do not silently search arbitrary parent directories.

---

# 53. TypeScript configuration

`fortenv.config.ts` is an intended developer experience.

Fortenv should not require the application to globally adopt a particular TypeScript runtime solely for this config.

On Node 22.23.2+, Fortenv uses Node's native TypeScript stripping. Enums, runtime namespaces and parameter properties requiring transformation are unsupported.

However:

- Fortenv should transform only what it owns;
- it should not become the application's TypeScript runtime;
- application modules imported by the real config must still be loadable by the application's normal runtime/tooling.

If some TypeScript syntax cannot safely be handled, fail clearly rather than silently miscompile it.

---

# 54. Node baseline

Node 22.23.2 is the baseline used for native TypeScript stripping and ESM execution. Configuration discovery rewrites its own copy; it does not install hooks to rewrite arbitrary application modules. The configured minimum and CI must agree.

---

# 55. Bundlers: important correction

Creating an injected object does not itself require module identity.

However, the **function-identity ACL registration does depend on receiving the same function objects that the application later invokes.**

This creates an important V1 limitation.

Suppose:

```text
src/db.ts
    ↓ bundle
dist/app.js
```

but Phase 2 independently imports:

```text
src/db.ts
```

from `fortenv.config.ts`.

The function created by that independent source import is not necessarily the same function object as the copy embedded in:

```text
dist/app.js
```

Therefore the ACL identity may not match.

---

# 56. V1 bundler guarantee

Do **not** claim transparent support for arbitrary fully bundled applications in V1.

V1 is correct when the real Phase-2 configuration and the application later resolve to the **same module instances/function identities**, such as normal unbundled ESM or builds that preserve those runtime module identities.

Single-file application bundling may require explicit Fortenv bundler/framework integration.

---

# 57. Future bundler integration

A future Fortenv bundler integration can solve identity registration by ensuring Phase-2 configuration registration occurs inside the same generated module graph as the application.

Potential approaches include:

- injecting configuration registration into the application bundle;
- generating a registration module that shares the bundled function instances;
- framework-specific integration.

Do not implement this until the core runtime design is stable.

---

# 58. Consequence for Next.js

Fortenv applies only in a supported Node server runtime. Client bundles and Edge runtimes are outside V1 support. Reject `NEXT_PUBLIC_*` secret names. Framework bundling must preserve a single Fortenv runtime instance and the exact wrapper identities used by configuration; otherwise registration is not valid. Do not claim automatic framework integration.

---

# 59. Bun

Bun is outside the tested V1 runtime target.

However Bun exposes environment data through additional paths such as:

```ts
Bun.env;
import.meta.env;
```

Full Bun protection cannot be claimed until all relevant access paths are tested and guarded.

Future Bun support should use an internal runtime adapter rather than changing the public API.

---

# 60. Deno

Deno exposes environment variables through:

```ts
Deno.env.get(...)
```

Therefore guarding only:

```ts
process.env;
```

would be insufficient.

Deno support requires an environment adapter that protects all relevant Deno environment APIs.

---

# 61. Cloudflare Workers

Cloudflare secrets may be exposed through Worker bindings independent of `process.env`.

Therefore Fortenv's Node protection model cannot simply be transplanted to Cloudflare.

Cloudflare support should be treated as a separate future integration with a potentially different threat model.

---

# 62. Runtime adapter architecture

The core owns discovery, config validation, exact wrapper registration and injection object creation. The Node adapter owns environment capture, normalization, shielding and security reporting. No environment adapter grants ambient access. Future runtimes need their own explicit threat model and bootstrap guarantees.

---

# 63. Packaging strategy

Keep runtime adapters in the main package initially.

Conceptually:

```text
fortenv
  core
  runtime/node
  runtime/bun       future
  runtime/deno      future
```

Do not create:

```text
@fortenv/node
@fortenv/bun
@fortenv/deno
```

unless those integrations later become substantial enough to justify separate packages.

Framework-specific integrations such as Next.js may eventually warrant their own packages.

---

# 64. Internal layout

- `core/config-source.ts`, `typescript.ts`, `imports.ts`: load and rewrite config.
- `core/mock-imports.ts`, `synthetic-execution.ts`, `discovery*.ts`: isolated discovery.
- `core/configuration.ts`, `grants.ts`, `bootstrap.ts`: validate and register.
- `core/injection.ts`, `runtime.ts`: copy permitted values and invoke callbacks.
- `runtime/node/environment.ts`: capture, scrub and permanently shield environment keys.
- `core/security-errors.ts`, `runtime/node/security-events.ts`, `telemetry.ts`: errors, events and generic subscriptions. Logger-specific adapters live in separate `packages/pino` and `packages/opentelemetry` packages.
- Numbered `core/__tests__` folders map each stage to fixtures and assertions.

---

# 65. Package exports

Public subpaths are `.`, `./config`, `./register`, and `./telemetry`, each with appropriate types. Internal store, injection helper and runtime initialization functions are not exported as public package subpaths. Root imports remain inert until preload.

---

# 66. Type safety

Export `SecretValues = Readonly<Record<string, string | undefined>>`. Contextually type the first callback parameter with this shape, remove it from the public wrapper call signature, and preserve the remaining parameter tuple, `this` and result type. Config in a separate module cannot statically infer which properties are actually granted: runtime configuration is authoritative, and values remain possibly undefined. Cover ordinary, generic and async callbacks with compile-time tests; do not claim arbitrary overloaded callback signatures are preserved.

---

# 67. Unauthorized reads and telemetry

Denied environment reads throw a structured `FortenvAccessError`, exported from the root `fortenv` entry, with stable `FORTENV_ACCESS_DENIED` code, `get` operation and secret name. Capture all available V8 caller frames without permanently changing the application's stack limit. Never include protected values or an environment dump. Stacks do not reconstruct arbitrary async history and are not used for authorization.

Synchronously publish the same error before throwing on `fortenv.security`, with version 1, event name `fortenv.access.denied`, severity `error`, operation, secret name and Unix-millisecond timestamp. Successful injection and ordinary reads are silent.

`telemetry.enumeration: true` reports `fortenv.env.enumerated`, severity `warn`, operation `ownKeys`, timestamp and a `FortenvEnumerationError` caller stack. Listing keys or keys and values still succeeds with protected keys filtered out. Enumeration events have no secret-name field and do not prove malicious intent. `in` and descriptors hide keys without enumeration warnings. No deduplication or rate limiting is implied.

`@fortenv/pino` exports `connectFortenv(logger)`, forwarding actual Error objects under `err` and namespaced metadata at error/warn level. `@fortenv/opentelemetry` exports the same function name, forwarding severity 17/13, exception attributes and Fortenv metadata in the caller's context. Each adapter uses the official logger types and declares Fortenv plus its logger API as peer dependencies. Adapters accept existing logger instances and own no SDK, provider, exporter or transport; the caller owns configuration, flush and shutdown. Core `fortenv/telemetry` has no logger-specific imports, interfaces or mapping logic. Its `subscribeSecurityEvents` supports arbitrary observers and supplies exception containment and recursion suppression for both adapters. All disconnect functions are idempotent.

Managed observer throws/rejections are contained; recursive observer reads still throw but do not recursively report. Independent observers still receive the original event. Raw diagnostics-channel subscribers retain Node's exception behavior.

`stderrFallback` defaults false. When true and no observer is connected, a denial also writes one JSON record to stderr; enumeration does not. A connected observer suppresses fallback. Node may independently print an uncaught exception. Observers only see events after connection; delivery and exporter flushing belong to the application.

---

# 68. Error handling

Callback throws and Promise rejections preserve exact error identity. They neither change grants nor expose ambient values. Bootstrap failure does not reopen environment access. Values already handed to a callback cannot be revoked on error. Invalid runtime/config inputs must fail with useful errors that contain no captured values.

---

# 69. Performance

Build the ACL once. Each wrapper invocation copies only its granted keys into a frozen object and directly invokes the callback. No stack inspection, environment permission lookup or async lifecycle tracking occurs on successful injection. Full stacks are captured for denied reads and opted-in enumeration events. Keep enumeration reporting disabled by default.

---

# 70. Dependency policy

The published `fortenv` package has zero runtime, peer and optional dependencies. Node typings remain a core development dependency matching Node 22. Pino and OpenTelemetry must not be core dependencies, including dev dependencies. The separate adapter packages declare `fortenv` and respectively `pino` or `@opentelemetry/api-logs` as peer dependencies, with matching development dependencies for compilation. Real logger/SDK compatibility tests live in a separate private consumer project that imports all three packages' built exports. SDK providers, context managers and exporters remain consumer-owned.

---

# 71. Required tests: bootstrap

Test the critical scenario:

```text
fortenv.config.ts
      ↓
imports db.ts
      ↓
db.ts imports malicious-package
      ↓
malicious-package reads
process.env.DATABASE_URL
at module evaluation
```

Expected:

```text
malicious-package never sees the real secret
```

because Phase 1 does not execute those imports and Phase 2 begins only after environment protection is installed.

This is one of the most important tests.

---

# 72. Required tests: Phase 1

Given:

```ts
import { createDb } from "./db.js";

export default defineConfig({
   secrets: {
      DATABASE_URL: [createDb],
   },
});
```

verify:

- `db.js` is not executed;
- `DATABASE_URL` is discovered;
- an inert placeholder satisfies configuration evaluation;
- actual function identity is irrelevant in Phase 1.

---

# 73. Required tests: Phase consistency

Verify Phase 1 and Phase 2 secret sets match.

Reject configurations that produce different secret names between phases.

---

# 74. Required tests: injection and ambient denial

Test configured wrappers receive only their granted keys; wrapping alone grants nothing. Unregistered wrappers run with empty objects. Direct protected reads throw outside, inside and underneath registered callbacks. Test caller arguments cannot replace injection, exact wrapper identities, missing values, readonly/null-prototype object shape and unusual valid names.

---

# 75. Required tests: normal environment

Verify ordinary values such as:

```ts
NODE_ENV;
PATH;
HOME;
```

continue working.

---

# 76. Required tests: multiple secrets

Test one wrapper with several keys and several wrappers with different grants for the same key. All unrelated values stay absent. The object exposes configuration key spellings, including platform-normalized lookup.

---

# 77. Required tests: nested wrappers

Test independently granted and unregistered inner wrappers, synchronous and async nesting, and inner exceptions. The outer object remains unchanged; no grants are inherited.

---

# 78. Required tests: asynchronous injection

Test injected values across awaits, original Promise identity, and protected environment denial before and after awaits. Async callbacks take the same injected first argument as sync callbacks.

---

# 79. Required tests: concurrency

Test deliberately interleaved calls to different wrappers and overlapping calls to the same wrapper. Each call receives a distinct object with its own grant set.

---

# 80. Required tests: detached work

Test detached protected environment reads remain denied before and after callback completion. Separately verify explicitly captured injected values remain usable after return/throw/resolve/reject; do not test fictitious revocation of strings.

---

# 81. Required tests: exceptions

Test exact identity of sync errors and rejected Promise reasons. Inner failures do not change an outer injection. Subsequent invocations still receive correct objects. Startup failure leaves environment protection installed.

---

# 82. Required tests: helper calls

Test a helper cannot read protected environment keys when called by a registered wrapper. Test passing a specific injected credential to a helper succeeds, without exposing other keys.

---

# 83. Required tests: dependencies

Test a fake database constructor receives an explicitly injected URL while its direct `process.env` probe throws. The client factory is defined during config import and called after preload. A wrapper called during real config import fails with a loading error; an unauthorized raw import-time read fails separately with an access error.

---

# 84. Required tests: enumeration

Verify protected secret values do not appear through:

```ts
Object.keys(process.env)
Object.values(process.env)
Object.entries(process.env)
JSON.stringify(process.env)
{ ...process.env }
for ... in
```

---

# 85. Required tests: mutation

Verify protected values cannot be changed or removed through the guarded `process.env`.

Verify non-protected environment variables retain normal mutation behavior.

---

# 86. Required tests: `process.env` replacement

If Fortenv locks the `process.env` property, verify application code cannot replace the Proxy.

This must be tested on every supported Node release before being made a hard guarantee.

---

# 87. Linux threat-model test/documentation

On Linux, explicitly document that the original startup environment may remain available through:

```text
/proc/self/environ
```

A Linux-specific security test may demonstrate this fact, but it should be framed as a known limitation rather than a Fortenv failure.

---

# 88. Workers

Workers have separate runtime instances and need their own setup. The parent environment is scrubbed before ordinary worker creation. Do not promise automatic propagation of captured values or grants to workers.

---

# 89. Child processes

Once Fortenv has scrubbed the current `process.env`, subsequently spawned child processes using the normal current environment should not automatically inherit configured secrets through that sanitized environment.

Applications needing to provide credentials to a child must do so explicitly.

Do not claim this as a substitute for OS-level isolation.

---

# 90. Future stronger launcher mode

A stronger future Fortenv mode can address the Linux initial-environment limitation.

Conceptually:

```text
Fortenv launcher process
       ↓
reads startup secrets
       ↓
starts application child WITHOUT
those secrets in child's initial env
       ↓
passes secrets privately to
Fortenv preload through IPC/fd
       ↓
preload stores secrets privately
       ↓
application begins
```

Then:

```text
/proc/self/environ
```

inside the application process never contained those secrets in the first place.

This would materially strengthen the threat model.

It is not required for V1.

---

# 91. Security claims for README

Say: “Fortenv removes configured secrets from ambient process.env access and injects them only into explicitly registered functions.” Explain explicit credential sharing, startup ordering and same-process limitations. Never promise sandboxing, caller authentication, protection after a value is handed out or immunity to malicious dependencies.

---

# 92. README limitation disclosure

The README must clearly disclose:

1. explicitly delivered values can be retained or leaked, and accessible wrappers can be called by other code;
2. Fortenv is not a JavaScript sandbox;
3. arbitrary same-process OS/native access is outside the V1 guarantee;
4. Linux `/proc/self/environ` may expose startup environment values;
5. arbitrary fully bundled applications require future identity-registration integration.

These limitations should be visible, not buried.

---

# 93. README quickstart

Use the factory/config/app example in §7, `node --import fortenv/register`, zero dependencies, supported extensions, missing-value handling and optional telemetry. Make the config dependency-graph startup restriction visible.

---

# 94. Explicitly excluded V1 designs

Do not add ambient AsyncLocalStorage grants, per-module/name/stack ACLs, generated identity tokens, application AST rewriting, deferred `.read()` queues, timer-based registration, public secret-store getters or automatic third-party SDK setup. Do not initialize client factories while the config dependency graph is loading.

---

# 95. V1 implementation priorities

Update the contract first, write inspectable fixture tests, demonstrate failures against old behavior, then implement and rerun tests. Keep named describe suites, numbered stage folders, runnable import snapshots, and context documents. Test source files only; never collect dist tests.

---

# 96. V1 acceptance criteria

1. Discovery executes no application import and produces validated names and telemetry options.
2. Capture, scrub and shield happen before real config dependencies execute.
3. Real names match discovery and grants use exact wrapper identities.
4. Config-loading wrapper calls fail before callback execution; post-bootstrap calls work.
5. Callbacks receive fresh frozen null-prototype objects containing only granted keys.
6. Business arguments, receiver, results, Promises and errors retain their documented behavior.
7. Missing granted values are explicit undefined properties; ungranted values are absent.
8. All protected environment reads throw, including in nested, concurrent and async callbacks/dependencies.
9. Enumeration hides configured keys/values and reports only when opted in.
10.   Mutation and replacement protections remain enforced.
11.   Explicitly captured credentials are not claimed to be revocable.
12.   Telemetry preserves errors/stacks/caller context without leaking values or importing SDKs.
13.   Source-stage and built-package consumer tests, typechecking and lint pass on Node 22.
14.   Public exports expose no store or mutable registration API.
15.   Package has zero runtime/peer/optional dependencies; real SDK tests stay separate.
16.   Docs disclose startup, bundling, same-process and Linux initial-environment limitations.

---

# 97. Before release

Run:

- unit tests;
- integration tests;
- malicious dependency fixtures;
- Phase-1 bootstrap-order tests;
- async concurrency tests;
- detached-work tests;
- Node compatibility CI;
- type checking;
- linting;
- package build;
- real `node --import fortenv/register ...` fixture applications.

Review:

- package exports;
- `engines`;
- runtime dependencies;
- Proxy invariants;
- TypeScript config handling;
- config transformation;
- Phase-1/Phase-2 consistency;
- worker behavior;
- Linux threat-model documentation.
