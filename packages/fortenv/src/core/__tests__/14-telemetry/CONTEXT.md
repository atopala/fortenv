# 14 — Security telemetry contract tests

These tests cover the implemented telemetry contract agreed in the session. They were verified failing before implementation, reviewed, and are now passing. The contract is recorded in design §67.

## Scenarios

| Group                                               | Boundary                                                       | Tests                                                                                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [01-error-stacks](01-error-stacks/CONTEXT.md)       | Existing environment guard → structured error and caller stack | Error fields, no secret values, deep synchronous callers with application stack limits of 0/2/10, restoration of the application's limit |
| [02-access-events](02-access-events/CONTEXT.md)     | Existing environment guard → Node diagnostics channel          | Reporting before a caught exception, caller context, absent configured secrets, no denial events for authorized/ordinary reads           |
| [03-subscriptions](03-subscriptions/CONTEXT.md)     | Public telemetry API → generic observers                       | Event identity, generic callbacks, disconnect, failing/recursive observers                                                               |
| [04-bootstrap](04-bootstrap/CONTEXT.md)             | Real preload → observer before app startup                     | Caught and uncaught unauthorized reads in real config dependencies                                                                       |
| [05-config-flags](05-config-flags/CONTEXT.md)       | defineConfig → telemetry option validation                     | Optional boolean enumeration/stderr flags, valid combinations, invalid values                                                            |
| [06-enumeration](06-enumeration/CONTEXT.md)         | Config discovery + real guard → enumeration events             | Keys/values/entries/spread/JSON/for-in, filtering even in authorized calls, enabled/disabled/default reporting                           |
| [07-stderr-fallback](07-stderr-fallback/CONTEXT.md) | Config discovery + denied read → optional stderr record        | Defaults off, writes when enabled without observers, suppresses fallback with observers, normal uncaught exception behavior              |

## Event and public API

Channel: `fortenv.security` using Node's `diagnostics_channel`.

Access-denied events contain `version: 1`, `name: "fortenv.access.denied"`, `severity: "error"`, `operation: "get"`, `secret`, a Unix-millisecond `timestamp`, and the same `error` object that is thrown. The error has `name: "FortenvAccessError"`, `code: "FORTENV_ACCESS_DENIED"`, `operation`, `secret`, and a captured stack. Event data must never include secret values or the environment object.

`FortenvAccessError` belongs to the root `fortenv` runtime API. The telemetry subpath does not re-export it. `FortenvEnumerationError` and `SecurityEvent` remain telemetry-specific exports.

The `fortenv/telemetry` export provides:

```ts
subscribeSecurityEvents(listener): () => void;
```

The function returns an idempotent unsubscribe. The test-only [event fixtures](03-subscriptions/contract.ts) use public event and error types. Logger-specific mapping tests live in the external consumer project and import the standalone adapter packages.
The separate `@fortenv/pino` and `@fortenv/opentelemetry` packages each expose `connectFortenv(logger)`. Pino records use `err` for the Error and `fortenv` for event metadata. OTel records use ERROR severity 17, epoch-millisecond timestamps, custom `fortenv.*` attributes and `exception.type/message/stacktrace`. No adapter creates an SDK, logger instance or exporter. Publishing and forwarding happen in the caller's active context.

Enumeration events use `name: "fortenv.env.enumerated"`, `operation: "ownKeys"` and warning severity, with a captured caller stack and no secret name or environment dump. Pino uses `warn`; OTel uses WARN severity 13.

## Agreed configuration and permissions

```ts
defineConfig({
   secrets: { DATABASE_URL: [readDatabase] },
   telemetry: {
      enumeration: false,
      stderrFallback: false,
   },
});
```

Both flags default to false and must be applied after discovery, before real dependency evaluation. Enumeration always hides protected keys and values, including inside an authorized wrapper. Enabling enumeration reporting adds events; it does not change visibility or throw merely because enumeration occurred. Successful injection returns values silently; all direct protected environment reads throw and publish to connected observers regardless of enumeration reporting.

Stderr fallback concerns denied reads with no observer. It is off by default. When enabled, one structured record is written before throwing; an attached observer suppresses Fortenv's fallback output. Node or application error handlers may still print an uncaught error separately. A caught denial with no observer and fallback disabled remains unlogged, though access is still denied.

## What is not settled or tested yet

- Enumeration warning limits/deduplication and their configuration.
- Durable export/flush on fatal startup, source-map resolution, arbitrary async call-history reconstruction, or hostile same-process tampering.

The enumeration and stderr defaults reflect the explicit session clarification. The bootstrap observer imports only Node built-ins; these tests do not initialize third-party telemetry before environment protection.

The separate [consumer integration project](../../../../../../tests/telemetry-integration/README.md) tests built dist output with real Pino and OpenTelemetry packages. It verifies serialization, SDK-exported records, active trace/span context, suppression of fallback while connected, and fallback reactivation after disconnect. All third-party SDK dependencies are confined to that private project; the library remains dependency-free.

The original design rejects stack inspection on the secret-read path. The agreed extension captures stacks for denied access diagnostics, not permission decisions. Successful injection uses exact wrapper identity and private stored values, without ambient permissions or stack inspection.

## Review of the tests

The review tightened recursive-sink assertions so they cannot be swallowed, checked that a failing sink does not block a second observer, and required complete warning-adapter metadata. Enumeration now checks report ordering around each actual scan, all operations with disabled/omitted flags, and enabled reporting without an observer. Stderr checks cover all twelve policy/outcome/observer combinations and reject duplicate plain-text output for caught denials. The shared observer retains enumerable error fields as well as the normal message/stack fields so output leak checks do not discard custom error data.

Generic subscription safety cases verify that async observer reads and observer enumeration do not recurse or block other observers. The external consumer suite verifies record mappings, real logger output, adapter failures and package dependency boundaries.

## Run

```sh
pnpm build
pnpm exec vitest run src/core/__tests__/14-telemetry
pnpm typecheck
```

Each file has a named `describe` for IDE execution. Real executable fixture files sit beside their tests. Bootstrap and sink-failure fixtures run in isolated Node children with explicit fake credentials.

The reviewed red baseline had 84 tests (80 failing, 4 passing). Passing controls preserved existing default behavior. See the parent test guide for the latest full-suite count and injection integration coverage.
