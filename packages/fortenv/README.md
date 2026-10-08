# Fortenv

Keep environment secrets out of `process.env`. Give each function only the credentials it needs.

**Node.js 22.23.2+ · Zero runtime dependencies**

After Fortenv's preload runs:

- Reading a configured secret through `process.env` throws, including inside dependencies and authorized callbacks.
- Environment dumps such as `{ ...process.env }` and `JSON.stringify(process.env)` omit protected keys and values.
- Only the wrappers listed in your config receive those secrets, as an explicit callback argument.

Other environment variables work normally. Fortenv adds a layer of protection against accidental leaks and dependencies that read the environment. **It is not a sandbox for hostile code.** See [how protection can be bypassed](#security-boundaries-and-bypasses).

## Quick start

```sh
npm install @fortenv/core
```

**1. Wrap a factory.** Replace `DatabaseClient` with your database driver's client.

```js
// db.mjs
import { fortenv } from "@fortenv/core";
import { DatabaseClient } from "your-database-package";

export const createDb = fortenv.string(({ DATABASE_URL }) => {
   if (DATABASE_URL === undefined) throw new Error("DATABASE_URL is required");
   return new DatabaseClient(DATABASE_URL);
});
```

**2. Grant that wrapper access.**

```js
// fortenv.config.mjs
import { defineConfig } from "@fortenv/core/config";
import { createDb } from "./db.mjs";

export default defineConfig({
   secrets: {
      DATABASE_URL: [createDb],
   },
});
```

**3. Call it from your application.**

```js
// app.mjs
import { createDb } from "./db.mjs";

const db = createDb(); // Fortenv supplies the credential.
// process.env.DATABASE_URL would throw, here and inside DatabaseClient.
```

```sh
node --import @fortenv/core/register app.mjs
```

Provide secrets through your existing environment setup before Node starts. Fortenv does not load `.env` files, validate secret values, or fetch them from a secret manager.

## How grants work

Configuration authorizes the **exact function returned by `fortenv.string()`**. Names, file paths, TypeScript types, and the identity of the caller grant no access. Wrapping a function alone grants nothing.

- A wrapper can receive several secrets; a secret can be granted to several wrappers. `SECRET: []` protects a key without granting it to anyone.
- Each call receives a fresh, frozen object with only its granted keys. Missing values are `undefined`; ungranted keys are absent. Callers pass only the callback's remaining business arguments.
- Helpers and nested wrappers inherit no access. Pass a dependency only the specific credential it needs.
- Sync and async callbacks are supported; arguments, `this`, return values, Promises, and thrown errors are preserved.

The guard also rejects changes to protected keys and replacement of `process.env`. Protection covers only configured names; `secrets: {}` protects nothing. There is no runtime reload or secret rotation in V1.

## Security boundaries and bypasses

**Fortenv controls environment access and credential delivery. It cannot isolate arbitrary code in the same process.** Secrets can still escape through:

- **Code that runs earlier.** A preload, loader, or startup tool can copy values or tamper with built-ins before Fortenv initializes. Start Fortenv before untrusted code.
- **OS or native access.** On Linux, `/proc/self/environ` may still contain startup secrets after `process.env` is scrubbed. Filesystem reads, native addons, debuggers, and memory dumps are outside Fortenv's protection.
- **Explicitly shared values.** A database driver given `DATABASE_URL` can retain or leak it. Returned values, logs, and captured strings cannot be revoked, even after the callback finishes.
- **Accessible authorized wrappers.** Any code that can call a registered wrapper can exercise its behavior. Fortenv does not authenticate callers; a wrapper that returns a secret exposes it to its caller.
- **Runtime tampering beyond the tested hardening.** Fortenv captures selected built-in operations before config dependencies load to resist specific replacement attacks. This is not a guarantee against every same-process attack or direct access to internal files.

The configuration, Fortenv installation, and bootstrap environment must be trusted. Use process or OS isolation when you need a boundary against hostile code. See the [security model and hardening scope](https://github.com/atopala/fortenv/blob/main/packages/fortenv/docs/design.md#2-security-scope).

## Startup and compatibility

Fortenv discovers protected names without executing application imports, captures and removes their values from the original environment, then loads the real config to register wrappers.

- **Keep initialization out of the config's imports.** Modules imported by config should define factories, not call them. Call factories from the application after preload. Keep the application entry point out of that import graph, including through circular imports; early wrapper calls throw.
- **Keep config simple and deterministic.** Its body executes twice. Use imported wrappers as grant references and names independent of imports, environment, time, or randomness. The discovery VM is not a hostile-config sandbox. See [supported config syntax](https://github.com/atopala/fortenv/blob/main/packages/fortenv/docs/design.md#35-imported-values-and-unsupported-loading).
- **Use ESM config.** Fortenv looks for one `fortenv.config.ts`, `.mts`, `.js`, or `.mjs` in the working directory. `FORTENV_CONFIG` selects another path. Use `.mjs` or `.mts` in CommonJS projects. TypeScript must use Node's native type-strippable syntax and resolvable imports; Fortenv does not implement path aliases.
- **Share module identities.** Config and application must use the same loaded Fortenv package and wrapper objects. Arbitrary bundling and automatic framework integration are unsupported. V1 targets Node; Bun, Deno, and edge runtimes are unsupported.
- **Set up workers separately.** The guard applies to the thread that initializes it. Workers and child processes receive no automatic grants or captured secrets. Normal environment inheritance after scrubbing omits those values; explicitly passed credentials and workers started earlier remain outside that protection.

## TypeScript

For a narrower callback type, annotate its first parameter:

```ts
import { fortenv, type SecretValues } from "@fortenv/core";

export const createDb = fortenv.string(({ DATABASE_URL }: SecretValues<"DATABASE_URL">) => {
   if (DATABASE_URL === undefined) throw new Error("DATABASE_URL is required");
   return new DatabaseClient(DATABASE_URL);
});
```

You can also use `new Fortenv<"DATABASE_URL">()` or augment `FortenvSecretKeys` for project-wide key suggestions. These are typing aids only: **configuration remains the authority**, and values remain `string | undefined`. See [typing details](https://github.com/atopala/fortenv/blob/main/packages/fortenv/docs/design.md#66-type-safety).

## Optional telemetry

Denied reads throw `FortenvAccessError` (`FORTENV_ACCESS_DENIED`) and publish an event with the key name and available caller stack, never the protected value. Successful injection is silent.

```js
import { subscribeSecurityEvents } from "@fortenv/core/telemetry";

const disconnect = subscribeSecurityEvents((event) => {
   // Forward event.error and event metadata to your existing logger.
});
```

Observers see events only after connecting. Managed observer errors are contained. Optional [Pino](https://github.com/atopala/fortenv/blob/main/packages/pino/README.md) and [OpenTelemetry](https://github.com/atopala/fortenv/blob/main/packages/opentelemetry/README.md) adapters accept your existing logger through `connectFortenv(logger)`.

Two config flags default to `false`: `telemetry.enumeration` reports environment enumeration while still hiding protected values; `telemetry.stderrFallback` logs denied reads to stderr when no observer is connected. Without an observer or fallback, caught denials are not logged. See the [telemetry contract](https://github.com/atopala/fortenv/blob/main/packages/fortenv/docs/design.md#67-unauthorized-reads-and-telemetry).

---

[Full design and API](https://github.com/atopala/fortenv/blob/main/packages/fortenv/docs/design.md) · [Development and tests](https://github.com/atopala/fortenv/blob/main/CONTEXT.md) · [Apache-2.0](LICENSE)
