# Pino adapter

Read the root [agent rules](../../AGENTS.md) and [workspace context](../../CONTEXT.md) first. The core subscription boundary is documented in [Fortenv source context](../fortenv/src/CONTEXT.md); the event contract is design §67.

`src/index.ts` exports `connectFortenv(logger)`. It subscribes through the public `fortenv/telemetry` API, maps events to the official Pino logger API and returns the core unsubscribe function. It owns no guard, authorization, recursion handling or logger lifecycle.

`package.json` declares Fortenv and pino as peers and development dependencies. `tsconfig.json` builds the ESM implementation and declarations into `dist`. README documents consumer usage; LICENSE is Apache-2.0.

The root build compiles core before this package. Run `pnpm build`, `pnpm typecheck` and `pnpm test:integration` from the workspace root. Tests live in [the separate consumer project](../../tests/telemetry-integration/README.md) and import built exports, never source internals. That project owns SDK providers and exporters for testing; this package uses the caller's existing logger.

## Mapping and tests

Denied reads call logger.error; enumeration calls logger.warn. Both receive the original Error under err, namespaced fortenv metadata, and the error message. Metadata includes version, event name, operation and timestamp; only denial events include a secret name. Calls retain the logger receiver and current caller context.

[Real Pino output tests](../../tests/telemetry-integration/01-pino/CONTEXT.md) check root/child loggers, serialization, bindings, leak prevention and fallback after disconnect. [Adapter contract tests](../../tests/telemetry-integration/04-adapters/CONTEXT.md) check field mapping, Error identity, independent subscriptions and throwing sinks. [Package tests](../../tests/telemetry-integration/03-package/CONTEXT.md) enforce exports and peer dependencies.

Keep this adapter thin. Core owns observer exception containment and recursion suppression. Connecting does not bootstrap protection; the application owns the logger and any transport lifecycle.
