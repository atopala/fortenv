# Telemetry integration project

Read [test workspace context](../CONTEXT.md) and [scenario overview](README.md). This private project owns real Pino/OpenTelemetry integration tests. It consumes built public exports of fortenv, @fortenv/pino and @fortenv/opentelemetry through workspace dependencies.

## Files and scenarios

| Location                                        | Scope                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [01-pino](01-pino/CONTEXT.md)                   | Actual root/child logger JSON, error stacks, levels, bindings and fallback after disconnect       |
| [02-opentelemetry](02-opentelemetry/CONTEXT.md) | Actual SDK records, timestamps, active trace/span context across await and lifecycle cleanup      |
| [03-package](03-package/CONTEXT.md)             | Export ownership, dist resolution and core/adapter dependency boundaries                          |
| [04-adapters](04-adapters/CONTEXT.md)           | Exact record mapping, receiver/context preservation, disconnect independence and throwing loggers |
| fortenv.config.mjs, reader.mjs                  | Shared fake-secret grant with enumeration and stderr fallback enabled                             |
| package.json, tsconfig.json, vitest.config.ts   | Consumer dependencies, TypeScript/JavaScript checks and source-only test collection               |

Core event generation and recursion tests stay in [group 14](../../packages/fortenv/src/core/__tests__/14-telemetry/CONTEXT.md). This project does not import core internals or aliases to source.

Process fixtures run under the real preload with a minimal environment and an explicit fake DATABASE_URL. Assert outside managed observers: Fortenv intentionally catches observer exceptions and could otherwise swallow a failed assertion. Check both output streams for leaks and duplicate fallback records. Mapping tests publish synthetic public events to isolate adapter behavior.

From the repository root, `pnpm test:integration` builds before running the consumer projects. To select just this project, run `pnpm build` then `pnpm exec vitest run --project telemetry-integration`. From this directory, `pnpm test` and `pnpm typecheck` build their dependencies automatically. Each test has a named describe suite; process fixtures sit beside their tests.

The test application owns SDK providers, exporters, flush and shutdown. Tests verify installed versions in the lockfile, not network delivery, fatal-startup flushing, all logger versions or npm tarball installation.
