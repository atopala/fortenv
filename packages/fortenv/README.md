# Fortenv

Remove configured secrets from ambient `process.env` access and inject them only into explicitly registered functions.

**Node.js 22.23.2+ · ESM · Zero runtime dependencies**

## Development status and pipeline tests

See the [design](docs/design.md), [core pipeline map](src/core/CONTEXT.md) and [numbered test guide](src/core/__tests__/CONTEXT.md) for each stage, runnable snapshots and test coverage. The explicit injection contract was implemented test first.

## Quick start

```sh
npm install fortenv
```

Wrap a factory that receives its credential:

```js
// db.mjs
import { fortenv } from "fortenv";
import { DatabaseClient } from "your-database-package";

export const createDb = fortenv(({ DATABASE_URL }) => {
   if (DATABASE_URL === undefined) throw new Error("DATABASE_URL is required");
   return new DatabaseClient(DATABASE_URL);
});
```

Register that exact wrapper in configuration:

```js
// fortenv.config.mjs
import { defineConfig } from "fortenv/config";
import { createDb } from "./db.mjs";

export default defineConfig({
   secrets: {
      DATABASE_URL: [createDb],
   },
});
```

Initialize the application after preload:

```js
// app.mjs
import { createDb } from "./db.mjs";

const db = createDb(); // DATABASE_URL is injected into the callback
// A direct process.env.DATABASE_URL read here would throw an unauthorized-access error.
```

```sh
node --import fortenv/register app.mjs
```

Provide environment values before starting Node, using your existing deployment or environment-loading setup. Fortenv does not load `.env` files, validate values, or retrieve credentials from a secret manager.

## Public API

- `fortenv(fn)` injects a readonly secrets object as the callback's first argument. Callers pass only subsequent business arguments. Wrapping alone grants nothing.
- `FortenvAccessError` is exported from `fortenv` for identifying denied protected-environment reads.
- `defineConfig({ secrets, telemetry? })` validates the config shape, secret names, function arrays and telemetry flags at runtime, then returns the original config. Calling it does not install or change permissions.
- `fortenv/register` is the preload entry point. Ordinary imports of `fortenv` and `fortenv/config` do not bootstrap the process.
- `fortenv/telemetry` exports `subscribeSecurityEvents`, `SecurityEvent`, and `FortenvEnumerationError`. Connecting an observer does not bootstrap the process or grant access.

One secret can have several readers, and one reader can access several secrets. An empty reader array denies access to a secret for everyone. An empty `secrets` object protects nothing. A granted missing value is an own injected property containing `undefined`; ungranted keys are absent. All direct protected environment reads throw, even when the value is absent.

Use the exact function returned by `fortenv()`, rather than its original function, a new wrapper, a bound copy, a name, or a file path. Raw functions in config are rejected. Calling a wrapper without preload or before initialization finishes throws. After initialization, an unregistered wrapper executes with an empty grant: protected reads throw an unauthorized-access error, even when called inside an authorized wrapper.

## Config discovery

Fortenv expects exactly one of these files in the working directory:

- `fortenv.config.ts`
- `fortenv.config.mts`
- `fortenv.config.js`
- `fortenv.config.mjs`

Set `FORTENV_CONFIG` to a relative or absolute file path to select another file. Relative paths are resolved from the working directory. Multiple defaults are an error; parent directories are never searched.

Configuration uses ESM syntax. In a CommonJS project, use `.mjs` or `.mts`. TypeScript must use Node's native type-strippable syntax: no enums or runtime namespaces. Native TypeScript imports must reference files Node can actually resolve, such as `./db.ts`; Fortenv does not remap `.js` imports to `.ts` or implement TypeScript path aliases.

### How bootstrap protects config imports

Configuration contains application function references, so importing it normally would execute application dependencies before Fortenv knows which secrets to protect.

Fortenv therefore:

1. Reads the config and strips TypeScript through Node's built-in API.
2. Scans static import declarations and rewrites them into calls to a discovery loader.
3. Evaluates this discovery copy with inert mock imports. Only `fortenv/config` supplies its real helper. No application or third-party modules load in this phase.
4. Extracts the secret names and telemetry flags, captures values privately, deletes them from the original environment object, and installs the guard with the reporting policy.
5. Imports the original config normally and registers its real wrapped function identities.

The discovery copy runs outside the real module cache. Application modules execute only during the real import, with configured secrets already hidden. Ordinary variables such as `NODE_ENV` remain available to those modules.

### Declarative, trusted configuration

**The config body executes twice.** Treat it as trusted, deterministic configuration with imported function references. Local config factories and computed keys are supported. It must be deterministic and free of side effects. Secret names must not depend on imported values, time, randomness, or environment state.

Discovery uses a separate VM context without `process`, `require`, or timers to catch accidental misuse. This is not a sandbox for hostile config. Imported values may only be used as grant references; attempting to call them or access properties on a mock function fails discovery. Namespace access such as `readers.createDb` is supported.

Supported import forms include named, aliased, default, mixed, and namespace imports. Side-effect imports are inert during discovery and execute normally during the real import. Type-only imports are stripped. Imports are hoisted ahead of the config body during discovery.

V1 rejects named exports, re-exports, import attributes, regex literals, division, and template interpolation in config. Native dynamic imports are unavailable during discovery. Use ordinary quoted strings and one `export default` (a direct declaration or a local config variable). Identifiers starting with `__fortenv_` are reserved for the transformer.

The runtime validates that real secret names match discovery. This is a diagnostic for invalid config, not protection against a malicious config that deliberately changes names: a previously undiscovered secret could already have been read during real module loading. Prefer literal or deterministically computed names.

Do not initialize clients at module scope in modules imported by config:

```js
export const createDb = fortenv(({ DATABASE_URL }) => {
   /* create client using DATABASE_URL */
});
// const db = createDb(); // Error: configuration is still loading.
```

Call the wrapper from the application after bootstrap instead.

## Injection and value lifetime

```ts
export const createDb = fortenv(({ DATABASE_URL }, poolSize: number) => {
   return new DatabaseClient(DATABASE_URL, { poolSize });
});
const db = createDb(20); // No secrets argument at the call site.
```

Each call receives a fresh, frozen, null-prototype object containing only its configured keys. Caller arguments cannot replace it. `SecretValues` is exported for explicit TypeScript annotations; values are typed as `string | undefined` because separate runtime configuration determines the actual grants.

Remaining arguments, `this`, returned values, Promise identity and error identity are preserved. Ordinary generic callback inference is supported; arbitrary overloaded callback preservation is not promised. Generators and construction through `new` are unsupported. Thenables are returned unchanged.

Nested wrappers receive only their own keys. Helpers and dependencies gain no ambient access: pass a specific credential explicitly when they need it. Async callbacks can use injected values across awaits, and concurrent calls receive separate objects.

Strings and injected objects can be retained after a callback returns, throws or rejects. Fortenv cannot revoke already delivered data. Detached work can use deliberately captured credentials, but its protected `process.env` reads always throw.

## Environment behavior

Protected values are delivered only through the injected object. Direct protected environment reads always throw a Fortenv error identifying the secret name without its value, including inside registered callbacks and their dependencies. Protection applies before real config dependencies execute; an uncaught unauthorized read during their initialization aborts startup.

Protected names remain absent from enumeration, `in`, property descriptors, spread, JSON serialization, and `Object.keys/entries/values`, even inside an authorized call. Assignment, deletion, and `Object.defineProperty` for protected names throw. Normal variables keep Node's string conversion and mutation behavior.

The installed `process.env` property cannot be replaced or redefined. Fortenv also updates the named `env` export from `node:process`. Existing references to the original environment object have the captured secrets removed. There is no reset, reload, secret rotation, or public registration API in V1.

On Windows, protected-name lookups follow the main thread's case-insensitive environment behavior. Case-equivalent config keys are rejected. Injected objects retain the exact configured spelling and use ordinary case-sensitive JavaScript property access. `NEXT_PUBLIC_*` names are rejected because they are intended to be client-visible.

## Security telemetry

Unauthorized direct reads throw `FortenvAccessError` with `code: "FORTENV_ACCESS_DENIED"`, `operation: "get"`, the secret name, and all available caller stack frames. Fortenv temporarily raises V8's stack limit while capturing the error, then restores the application's limit. This cannot reconstruct arbitrary asynchronous call history. Error data contains no protected values or environment dump.

```js
import { FortenvAccessError } from "fortenv";
```

The same Error is published synchronously on Node's `fortenv.security` diagnostics channel before it is thrown, so catching the exception does not suppress the event. Events include `version: 1`, `name`, `severity`, `operation`, Unix-millisecond `timestamp`, `error`, and a `secret` name for denied reads.

Configure reporting through the existing config:

```js
export default defineConfig({
   secrets: { DATABASE_URL: [createDb] },
   telemetry: {
      enumeration: true,
      stderrFallback: false,
   },
});
```

Both flags default to false and are installed before real config dependencies execute. `enumeration: true` reports `fortenv.env.enumerated` warnings with `operation: "ownKeys"` and the caller stack. Enumeration still hides protected keys and values, including inside authorized calls, and does not throw merely because it occurred. A warning records observation, not proof of malicious intent. Enumeration events contain no secret-name field. No rate limiting or deduplication is applied.

Connect an existing logger with `connectFortenv(logger)` from `@fortenv/pino` or `@fortenv/opentelemetry`. Install the adapter alongside `fortenv` and its peer (`pino` or `@opentelemetry/api-logs`). Each returns an idempotent disconnect function and uses the logger library's official types. The adapters create no logger, SDK, provider, transport or exporter. The caller configures, flushes and shuts down those components. Core `fortenv`, including `fortenv/telemetry`, remains dependency-free; other loggers can use `subscribeSecurityEvents` directly.

```ts
import { connectFortenv } from "@fortenv/pino";
import pino from "pino";

const disconnect = connectFortenv(pino());
// Disconnect when this observer is no longer needed.
disconnect();
```

Pino receives the actual Error under `err`, namespaced `fortenv` metadata, and the error message. Denials use `error`, enumeration uses `warn`, following [Pino's error serialization convention](https://github.com/pinojs/pino/blob/main/docs/api.md). OpenTelemetry receives ERROR (17) or WARN (13), `fortenv.*` metadata and `exception.type/message/stacktrace`, following its [log severity model](https://opentelemetry.io/docs/specs/otel/logs/data-model/). Calls stay in the active caller context, allowing an existing OpenTelemetry context manager and SDK to correlate the log with its trace/span.

Other loggers can connect through a managed callback:

```js
import { subscribeSecurityEvents } from "fortenv/telemetry";

const disconnect = subscribeSecurityEvents((event) => {
   // Forward to your existing monitoring system.
   // event.error is the Error thrown for a denied read.
});
```

Managed observer exceptions and rejected promises are contained. Reads from an observer or its spawned async work still obey authorization but do not generate recursive telemetry. Other observers continue receiving the original event. Subscribers attached directly through Node's diagnostics_channel API retain Node's own exception behavior.

`stderrFallback: true` writes one JSON record for a denied read when no observer is connected. Connecting an observer suppresses that fallback; disconnecting the last observer restores it. It does not print enumeration warnings. An uncaught exception can also receive Node's normal stderr output, independently of Fortenv's fallback. With fallback disabled and no observer, a caught denial remains unlogged.

Observers only receive events after they connect. A built-in-only diagnostics-channel preload can observe real config import failures; application-level logger connections start observing when the application connects them. Remote delivery and exporter flush during fatal startup remain the application's responsibility.

## Security boundary

Fortenv reduces ambient environment access by dependencies. It is not isolation against arbitrary code executing in the same process.

```js
const createDb = fortenv(({ DATABASE_URL }) => {
   // A dependency's process.env.DATABASE_URL read still throws here.
   return new DatabaseClient(DATABASE_URL);
});
```

Pass each dependency only the credential it needs. A dependency can retain or leak credentials deliberately handed to it. Code can also call an accessible registered wrapper directly; Fortenv does not authenticate callers. Returned secrets and captured credentials are outside its protection.

Protection starts when preload captures and scrubs secrets. Earlier preloads, loaders, startup tooling, native code, OS inspection, already-copied values, and code tampering with runtime internals are outside the guarantee. The config, Fortenv installation, and bootstrap environment are trusted. Package export restrictions prevent accidental internal imports; they are not a security boundary against direct filesystem access.

Child processes and workers receive no automatic secret or grant transfer. They normally start from the sanitized environment and cannot recover removed values through their own Fortenv bootstrap. Explicitly copying credentials into another process is the application's responsibility.

Use one shared Fortenv package instance. Config and application must reference the same wrapper objects; bundling a second copy of either wrappers or the runtime breaks identity registration. Automatic bundler integration, Bun, Deno, Next.js integration, and edge runtimes are outside V1 support.

## Development

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
```

TypeScript and Vitest are development tools only. ESLint checks the workspace; separate TypeScript checks cover unused code, fallthrough, unreachable code and unused labels. The published library has no runtime or peer dependencies. Each integration test lives beside the JavaScript or TypeScript program it executes in a fresh Node process against the built package. Tests and their programs are included in typechecking and excluded from the published package.

Real Pino/OpenTelemetry compatibility tests live in the separate private [telemetry integration project](../../tests/telemetry-integration/README.md). That project owns test SDK providers/exporters and consumes the core and standalone adapters' public dist exports. Separate [ESM and CommonJS consumer projects](../../tests/CONTEXT.md) test all four consumer/dependency combinations, including denied access, startup failures and callback rejections. The root test command and Vitest configuration run all four projects; package-local tests cover Fortenv's source and pipeline tests.
