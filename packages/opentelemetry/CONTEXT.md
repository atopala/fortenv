# OpenTelemetry adapter

Read the root [agent rules](../../AGENTS.md) and [workspace context](../../CONTEXT.md) first. The core subscription boundary is documented in [Fortenv source context](../fortenv/src/CONTEXT.md); the event contract is design §67.

`src/index.ts` exports `connectFortenv(logger)`. It subscribes through the public `fortenv/telemetry` API, maps events to the official OpenTelemetry logger API and returns the core unsubscribe function. It owns no guard, authorization, recursion handling or logger lifecycle.

`package.json` declares Fortenv and @opentelemetry/api-logs as peers and development dependencies. `tsconfig.json` builds the ESM implementation and declarations into `dist`. README documents consumer usage; LICENSE is Apache-2.0.

The root build compiles core before this package. Run `pnpm build`, `pnpm typecheck` and `pnpm test:integration` from the workspace root. Tests live in [the separate consumer project](../../tests/telemetry-integration/README.md) and import built exports, never source internals. That project owns SDK providers and exporters for testing; this package uses the caller's existing logger.

## Mapping and tests

Denied reads emit ERROR (17); enumeration emits WARN (13), using the API's SeverityNumber constants. Records carry the event timestamp, error message as body, fortenv metadata and exception.type/message/stacktrace attributes. Only denials include fortenv.secret. Emit runs in the caller's context; the configured SDK supplies trace/span correlation.

[Real SDK output tests](../../tests/telemetry-integration/02-opentelemetry/CONTEXT.md) check exported records and distinct active spans across await. [Adapter contract tests](../../tests/telemetry-integration/04-adapters/CONTEXT.md) check exact mappings, receiver/context preservation, disconnect and throwing sinks. [Package tests](../../tests/telemetry-integration/03-package/CONTEXT.md) enforce exports and peer dependencies.

Keep provider/context-manager/exporter setup in the consumer, never here. A no-op or disabled logger still counts as a connected observer and suppresses Fortenv's optional stderr fallback. Core owns observer failure containment and recursion suppression; the caller owns flush/shutdown and delivery.
