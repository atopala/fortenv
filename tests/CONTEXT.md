# Separate consumer test projects

Consumer integrations live in private projects here. Each uses Fortenv's public package exports, which resolve to the built `packages/fortenv/dist` files. No source aliases or imports of Fortenv internals are permitted. Library unit and pipeline tests remain under `packages/fortenv/src/core/__tests__`.

For logger work, read the [telemetry project context](telemetry-integration/CONTEXT.md) before its numbered scenario guides. It also consumes built standalone adapter exports; core telemetry unit tests remain in the library.

| Project                                                  | Coverage                                                                |
| -------------------------------------------------------- | ----------------------------------------------------------------------- |
| [01-esm-consumer](01-esm-consumer/README.md)             | ESM application with ESM and CommonJS dependencies; 17 cases            |
| [02-cjs-consumer](02-cjs-consumer/README.md)             | CommonJS application with ESM and CommonJS dependencies; 17 cases       |
| [telemetry-integration](telemetry-integration/README.md) | Real Pino and OpenTelemetry SDKs against built core and adapter exports |

The two controlled dependency packages in [fixtures](fixtures/README.md) are private test-only workspaces. They deliberately expose client factories, denied environment probes and throwing/rejecting callbacks. Each consumer/dependency combination verifies happy paths, structured denials before/after await, import-time rejection, original callback error identity and shared config/import/require function identity. Each consumer also tests missing preload, calls before registration and unregistered wrappers.

Applications run in fresh native Node processes with explicit fake values and no inherited NODE_OPTIONS. Vitest orchestrates the processes, enforces timeouts and checks status, markers and both output streams for secret leakage. App files contain node:assert assertions and can be run or debugged independently; adjacent `CONTEXT.md` files show commands. An intentionally failing startup passes its Vitest test only if it fails for the expected reason before the application starts.

CommonJS application/dependency support uses Node 22's require interoperation with the existing ESM Fortenv build. Both consumer configs remain `.mjs`. No CommonJS config format, separate CJS Fortenv build, extra runtime dependencies or early-call queue is introduced.

## Commands

```sh
pnpm test                 # Build, then all four Vitest projects
pnpm test:integration     # Build, then all three consumer projects
pnpm test:modules         # Build, then the ESM/CommonJS matrix and bootstrap cases
pnpm typecheck            # Library and all consumers, including controlled dependency source
pnpm lint
pnpm format:check
```

Each consumer also supports `pnpm --dir tests/<project> test`. All projects collect source `.test.ts` files and exclude dist; the root config exposes them to IDE Run All. For direct Vitest/IDE runs, build after library changes. Every test file has a named describe suite.

## Baseline

All 34 module integration cases passed against the existing build on Node 22.23.2 before any library implementation change. No runtime fix was needed. This verifies the tested Node/module combinations, not all historical Node versions, bundlers, hostile same-process isolation or npm tarball installation.
