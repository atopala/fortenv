# Fortenv

### Protect your secrets from unrestricted `process.env` access.

Choose which functions receive your secrets. Monitor unauthorized attempts to read them.

Fortenv brings explicit secret sharing to ordinary JavaScript and TypeScript—with a small API and zero runtime dependencies in core.

**Zero runtime dependencies in core · Node.js 22.23.2+ · JavaScript & TypeScript · Apache-2.0**

[Quick start](#quick-start) · [How it works](#how-it-works) · [Telemetry](#see-denied-access-in-your-existing-tools) · [Security boundaries](#security-boundaries) · [Contributing](#contributing)

## Why Fortenv?

Your database client needs its connection URL. Your payload signer needs its private key. Put both in `process.env`, and code running in your process can attempt to read either.

Fortenv lets you draw that boundary in code:

```js
// In your Fortenv config: two secrets, two explicit grants.
defineConfig({
   secrets: {
      DATABASE_URL: [createDb],
      PRIVATE_KEY: [signPayload],
   },
});
```

`createDb` receives the database URL. `signPayload` receives the private key. Direct reads of either protected key through `process.env` throw—even inside those callbacks. A scan with `Object.entries(process.env)` omits both.

Fortenv makes sharing deliberate:

- **Review secret access in one place.** Named secrets and explicit function grants make sharing easy to inspect.
- **Keep everyday code simple.** Destructure the secrets you need. Pass ordinary arguments when calling the function.
- **Turn silent reads into visible failures.** Denied reads include the secret name and available caller stack frames, without its value.
- **Bring your existing tools.** Keep your environment provisioning and connect Pino, OpenTelemetry or your own observer.

Fortenv reduces ambient access. It is not a sandbox for hostile code running in the same process. [Read the boundaries below](#security-boundaries).

## Quick start

Two secrets. Two functions. Three small files. This example uses Node's built-in crypto module, so you can run it without a database, an account or another application dependency.

### 1. Install

```sh
npm install fortenv
```

Use Node.js **22.23.2 or later**. The example uses explicit `.mjs` files so it works without changing your project's module setting.

### 2. Give each function its secret

```js
// signers.mjs
import { createHmac } from "node:crypto";
import { fortenv } from "fortenv";

export const signWebhook = fortenv(({ WEBHOOK_SECRET }, payload) => {
   // This callback receives WEBHOOK_SECRET; SESSION_SECRET is absent.
   if (WEBHOOK_SECRET === undefined) throw new Error("WEBHOOK_SECRET is required");
   return createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
});

export const signSession = fortenv(({ SESSION_SECRET }, sessionId) => {
   // This callback receives SESSION_SECRET; WEBHOOK_SECRET is absent.
   if (SESSION_SECRET === undefined) throw new Error("SESSION_SECRET is required");
   return createHmac("sha256", SESSION_SECRET).update(sessionId).digest("hex");
});
```

### 3. Make the grants explicit

```js
// fortenv.config.mjs
import { defineConfig } from "fortenv/config";
import { signSession, signWebhook } from "./signers.mjs";

export default defineConfig({
   secrets: {
      WEBHOOK_SECRET: [signWebhook],
      SESSION_SECRET: [signSession],
   },
});
```

### 4. Call it from your application

```js
// app.mjs
import { signSession, signWebhook } from "./signers.mjs";

// Fortenv supplies the secrets. Callers supply only business arguments.
console.log("Webhook signed:", signWebhook('{"event":"order.created"}').length === 64);
console.log("Session signed:", signSession("session-123").length === 64);

// Neither signing secret is exposed by this environment scan.
console.log("Webhook secret visible:", Object.keys(process.env).includes("WEBHOOK_SECRET"));
```

Provide the secret before Node starts, then preload Fortenv:

```sh
# POSIX shell; both values are fake and only for this demo.
WEBHOOK_SECRET=fake-webhook-secret SESSION_SECRET=fake-session-secret \
  node --import fortenv/register app.mjs
```

You should see:

```text
Webhook signed: true
Session signed: true
Webhook secret visible: false
```

Your deployment or secret manager supplies real values. Fortenv does not load `.env` files, fetch secrets, or validate their contents. These signing functions demonstrate secret delivery; they are not a complete webhook-verification or session-management system.

### Two mistakes worth seeing

**Calling a wrapper while config is still loading:**

```js
// signers.mjs — adding this after the function definitions above WILL FAIL.
export const startupSignature = signWebhook("ready");
// Config imports this module to obtain signWebhook's function reference.
// That import must finish before Fortenv can register the real functions.
// This call happens during the import, so registration is not complete.
// Move the call into app.mjs, which starts after the preload finishes.
```

This is an initialization-order constraint; it does not require a circular import. Keep app.mjs outside the config's dependency graph. Defining and calling a wrapper in the same module is fine when that module loads after bootstrap.

**Reading a protected secret directly:**

```js
// Add this to app.mjs to demonstrate a denial. It intentionally stops the app.
const secret = process.env.WEBHOOK_SECRET;
// Throws FortenvAccessError: unauthorized access to secret "WEBHOOK_SECRET".
// The same read also fails inside a registered callback.
// Use the injected { WEBHOOK_SECRET } parameter, as signWebhook does above.
```

The complete quick start works as written. These two snippets are deliberately failing examples.

## Permissions you can read

One secret can be granted to several functions. One function can receive several secrets. Register the exact function returned by `fortenv()`.

| Action                                              | Result                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| Call a registered wrapper after bootstrap           | Its callback receives a fresh, frozen object containing only its granted keys |
| Call an unregistered wrapper after bootstrap        | Its callback receives an empty secrets object                                 |
| Read a protected key through process.env            | Throws FortenvAccessError, including inside registered callbacks              |
| List environment keys or entries                    | Succeeds with protected names and values omitted                              |
| Grant a secret that is missing from the environment | The injected property contains undefined                                      |
| Configure a secret with an empty grant array        | Protects the key without delivering it to any wrapper                         |

Async callbacks work too. Business arguments, return values, Promises and callback errors retain their normal behavior. A nested wrapper receives its own grants. Helpers receive secrets only when you explicitly pass them.

See the [API and configuration guide](packages/fortenv/README.md) for TypeScript types, missing values, environment mutations and exact wrapper identity.

## How it works

Fortenv protects secrets before loading the config's real application dependencies:

1. **Discover.** Read the config, strip supported TypeScript syntax, rewrite static imports and evaluate a discovery copy using inert import placeholders.
2. **Protect.** Capture the configured values privately, remove them from the original environment and install the environment proxy.
3. **Register.** Import the original config with protection active and register the real wrapped function references.
4. **Run.** Start the application. Each wrapper call injects only its configured values.

The config body executes twice. Keep it trusted, deterministic and free of side effects. Use imported functions as grant references; do not derive secret names from imported values or environment state.

Config supports ESM `.ts`, `.mts`, `.js` and `.mjs`. Fortenv finds one `fortenv.config.*` file in the working directory, or uses the path in `FORTENV_CONFIG`. TypeScript uses Node's native type stripping. Config syntax has [documented restrictions](packages/fortenv/README.md#declarative-trusted-configuration).

ESM and CommonJS consumers are covered by integration tests; CommonJS applications should use an ESM config such as `fortenv.config.mjs`.

## See denied access in your existing tools

Core `fortenv/telemetry` is dependency-free. Connect any monitoring system through a subscription:

```js
import { subscribeSecurityEvents } from "fortenv/telemetry";

const disconnect = subscribeSecurityEvents((event) => {
   // Forward event.name, event.error and event metadata to your existing logger.
   // Denials carry the secret NAME, never its value.
});

// Call disconnect() when this observer is no longer needed.
```

Denied reads publish the same error that is thrown, before throwing it. Managed observer failures cannot replace the denial. Disconnect is idempotent.

### Optional adapters

| Package                                                    | Usage                          | Logger peer             |
| ---------------------------------------------------------- | ------------------------------ | ----------------------- |
| [@fortenv/pino](packages/pino/README.md)                   | connectFortenv(existingLogger) | pino                    |
| [@fortenv/opentelemetry](packages/opentelemetry/README.md) | connectFortenv(existingLogger) | @opentelemetry/api-logs |

For example, connect Pino during application startup:

```sh
npm install @fortenv/pino pino
```

```js
import { connectFortenv } from "@fortenv/pino";
import pino from "pino";

const disconnect = connectFortenv(pino());
```

Adapters use official logger types. Your application owns logger configuration, transports, providers, exporters and shutdown. OpenTelemetry forwarding preserves the caller's active context for trace/span correlation.

### Report environment scans

Add reporting options to your config:

```js
export default defineConfig({
   secrets: {
      WEBHOOK_SECRET: [signWebhook],
      SESSION_SECRET: [signSession],
   },
   telemetry: {
      enumeration: true,
      stderrFallback: false,
   },
});
```

Both flags default to false. Enumeration reporting records a warning and caller stack when code lists environment keys; listing still succeeds with secrets filtered out. A scan is an observation, not proof of malicious intent.

Enable `stderrFallback` to write a denial JSON record when no observer is connected. Connecting an observer suppresses that fallback. Node can still print an uncaught exception independently. Successful secret injection emits no event.

Observers receive events only after connection. An application-level logger cannot report earlier config-loading events; see the [telemetry guide](packages/fortenv/README.md#security-telemetry) for bootstrap observation and delivery limits.

## Security boundaries

Fortenv makes secret delivery explicit and denies protected environment reads. Its scope matters:

- **Delivered secrets remain ordinary strings.** A function or dependency can retain or leak a value deliberately passed to it.
- **Grants identify wrappers, not callers.** Code with a reference to a registered wrapper can call it.
- **Protection begins at preload.** Earlier tooling, copied values, native code, OS inspection and hostile runtime tampering are outside the guarantee. Linux startup environment data may remain accessible through `/proc/self/environ`.
- **Configuration is trusted.** Discovery is not a sandbox for malicious config.
- **Use one shared runtime instance.** Workers and child processes receive no automatic secret or grant transfer. Secret rotation and reload are not supported in V1.

Keep secret sharing narrow and use process or OS isolation where you need a stronger boundary. See the [full security model](packages/fortenv/README.md#security-boundary).

## Try it on one small part of your app

Start with a signing function or a client factory. Declare its grants, run with the preload, then try a direct environment read. Inspect the denial and decide where to connect your logger.

Feedback on the API, startup integration and security model is welcome. A small reproduction of a rough edge is especially useful. If Fortenv fits your workflow, star the repository to follow its progress.

## Contributing

Start with the [workspace context](CONTEXT.md), [design](packages/fortenv/docs/design.md) and [test guide](packages/fortenv/src/core/__tests__/CONTEXT.md). Agents must follow [AGENTS.md](AGENTS.md) and the nearest directory's CONTEXT.md.

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build:website
pnpm website:dev
```

Use test-driven development for behavior changes: express the contract, confirm the expected failure, implement it, then rerun the checks. Tests use real fixtures, named suites and executable transformation snapshots.

`pnpm test` builds and runs all configured projects. `pnpm test:integration` selects consumer integrations; `pnpm test:modules` selects the ESM/CommonJS matrix. Logger integrations test built public exports in a separate project.

### Repository map

| Area                                                        | Purpose                                                     |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| [apps/website](apps/website/CONTEXT.md)                     | Next.js marketing and documentation site                    |
| [packages/fortenv](packages/fortenv/CONTEXT.md)             | Dependency-free core, config, preload and generic telemetry |
| [packages/pino](packages/pino/CONTEXT.md)                   | Pino adapter                                                |
| [packages/opentelemetry](packages/opentelemetry/CONTEXT.md) | OpenTelemetry adapter                                       |
| [tests](tests/CONTEXT.md)                                   | Consumer, module and logger integration projects            |

## License

[Apache-2.0](LICENSE).
