# Core Fortenv package

This is the dependency-free runtime package. Read the repository [agent rules](../../AGENTS.md) and [workspace context](../../CONTEXT.md), then [the design](docs/design.md) before changing behavior.

## Where to start

| Area                                            | Guide                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| Consumer API, startup and limitations           | [README](README.md)                                                      |
| Public entries, including fortenv/telemetry     | [Source context](src/CONTEXT.md)                                         |
| Discovery, registration and injection           | [Core implementation map](src/core/CONTEXT.md)                           |
| Environment proxy and security reporting        | [Node runtime context](src/runtime/node/CONTEXT.md)                      |
| Stage and end-to-end tests                      | [Numbered test guide](src/core/__tests__/CONTEXT.md)                     |
| Error stacks, subscriptions and reporting flags | [Telemetry tests](src/core/__tests__/14-telemetry/CONTEXT.md)            |
| Actual logger adapters and SDK output           | [External telemetry tests](../../tests/telemetry-integration/CONTEXT.md) |

`package.json` defines four public entries: root, config, register and telemetry. Only register bootstraps the process. `tsconfig.json` builds source and declarations into dist, excluding tests; `tsconfig.test.json` typechecks test code too. `vitest.config.ts` collects source tests, never dist. Generated files are not implementation sources.

The [runtime security hardening plan](docs/security-hardening-plan.md) proposes a test-first audit and fixes for shared built-in tampering. It records confirmed findings, investigation scope, implementation order, and verification gates; it does not supersede the design or claim that the proposed work is complete.

Core must have no runtime, peer or optional dependencies, and no Pino/OpenTelemetry development dependencies. Logger adapters belong in separate packages. Authorization uses exact wrapper identity and explicit injection; telemetry can never grant environment access.

From the repository root, `pnpm test` builds all packages before running all projects. For a focused core run, use `pnpm --dir packages/fortenv test`. Follow the test-first workflow in AGENTS.md; permanent environment changes require isolated subprocesses.
