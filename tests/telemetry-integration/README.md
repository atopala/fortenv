# Telemetry consumer integration tests

For implementation ownership, fixture rules and focused commands, read [CONTEXT.md](CONTEXT.md).

This private test project tests the standalone `@fortenv/pino` and `@fortenv/opentelemetry` adapters with real loggers and SDKs. The Fortenv library has no runtime, peer, optional, Pino or OpenTelemetry dependencies. Its development dependencies are Node typings and TypeScript.

Workspace dependencies resolve public exports to the core and adapter packages' `dist` directories. Child processes use native Node imports and `--import fortenv/register`, without Vitest transforms or source aliases. The application fixtures can also be run directly from this directory after running the root build and setting a fake `DATABASE_URL`.

## Scenarios

| Folder                                          | Checks                                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [01-pino](01-pino/CONTEXT.md)                   | Real root and child loggers serialize denied-read errors and enumeration warnings, including stacks and metadata.                                      |
| [02-opentelemetry](02-opentelemetry/CONTEXT.md) | Real API, context manager, log SDK and in-memory exporter preserve error fields, severity, timestamps and distinct active trace/span IDs across await. |
| [03-package](03-package/CONTEXT.md)             | Core and adapters resolve to dist; core stays logger-neutral and dependency-free; adapters declare their logger peers.                                 |

Both logger fixtures connect after protection is installed, verify successful injection is silent, and disconnect twice. Their parent tests require exactly one stderr fallback record for the denial after disconnect; earlier connected denials must not produce fallback output. All credentials are fake, and neither logs nor stderr may contain their values.

The logger fixtures import `FortenvAccessError` from the root `fortenv` entry and `connectFortenv` from the corresponding standalone adapter package. The package-boundary suite requires that ownership and rejects a telemetry compatibility re-export.

These tests verify the versions pinned in the workspace lockfile, not every historical logger release. They do not verify remote export delivery during fatal startup. The existing built-in-only bootstrap observer tests remain in library group 14.

## Run

```sh
# From the repository root:
pnpm test:integration
pnpm typecheck

# From this project:
pnpm test
pnpm typecheck
```

Each test file has a named describe block. Process tests run adjacent real `.mjs` fixtures; mapping tests publish synthetic events to isolate record mapping. No fixtures are generated from code strings.

[04-adapters](04-adapters/CONTEXT.md) checks exact record mappings, caller context, method receivers, error identity, independent disconnects and logger failure isolation.
