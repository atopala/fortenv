# Fortenv workspace context

Fortenv removes ambient JavaScript access to configured environment secrets and injects values into configured wrapped functions. Agents must read [AGENTS.md](AGENTS.md) before working in this repository. Start technical work with the [design](packages/fortenv/docs/design.md), then the [implementation map](packages/fortenv/src/core/CONTEXT.md) and [numbered test guide](packages/fortenv/src/core/__tests__/CONTEXT.md).

## Workspace contents

The [root README](README.md) is the public introduction and runnable quick start. Package READMEs hold detailed consumer documentation; CONTEXT.md files explain implementation ownership, invariants and test locations for contributors and agents.

Package entry guides: [core Fortenv](packages/fortenv/CONTEXT.md), [Pino](packages/pino/CONTEXT.md), [OpenTelemetry](packages/opentelemetry/CONTEXT.md). Telemetry work continues through the [source API guide](packages/fortenv/src/CONTEXT.md), [Node reporting guide](packages/fortenv/src/runtime/node/CONTEXT.md), [core telemetry tests](packages/fortenv/src/core/__tests__/14-telemetry/CONTEXT.md) and [consumer telemetry context](tests/telemetry-integration/CONTEXT.md).

| Path                                                        | Purpose                                                                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                                 | Repository-wide instructions for agents, including context reading and test driven development.      |
| `packages/fortenv`                                          | The dependency-free published library, its design, source, package tests, and package documentation. |
| `apps/website`                                              | Private Next.js marketing and documentation site for Fortenv, statically exported for deployment.    |
| `tests`                                                     | Private consumer projects and controlled dependency packages that test built public exports.         |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`     | Workspace scripts, package membership, and reproducible development dependencies.                    |
| `vitest.config.ts`                                          | Root test project list for the library and three consumer projects.                                  |
| `eslint.config.ts`, `prettier.config.ts`, `.prettierignore` | Workspace linting, formatting, and syntax-sensitive fixture exclusions.                              |
| `.tool-versions`                                            | Local Node and pnpm toolchain versions.                                                              |
| `.gitignore`                                                | Generated dependency, build, cache, log, and local environment exclusions.                           |
| `LICENSE`                                                   | Workspace Apache-2.0 license text.                                                                   |
| `.idea`                                                     | Local WebStorm project metadata; CLI configuration remains authoritative.                            |

Generated `node_modules`, package `dist`, TypeScript build metadata, Vitest caches, and the local `.pnpm-store` are artifacts rather than source. Do not edit them as implementation files.

## Working contract

- Node 22 is the target. The package currently declares Node >=22.23.2. Config inputs are `.ts`, `.mts`, `.js`, and `.mjs` only, as explicitly agreed in the session.
- The published library has zero runtime dependencies. Node typings are a development dependency. The license is Apache-2.0.
- Work is test first. Use real source fixtures, focused tests beside their fixtures, and inspectable snapshots. Each scenario can be selected through Vitest.
- The numbered test folders are pipeline stages, not alternative meanings of bootstrap phase 1 and phase 2. Folder 13 verifies their composition.
- `fortenv.string(({ DATABASE_URL }, ...args) => ...)` injects granted keys as the first callback argument (type the keys with a `SecretValues<"DATABASE_URL">` parameter annotation or `new Fortenv<"DATABASE_URL">()`). Callers pass business arguments only; protected environment reads always throw.
- Do not rewrite the design to justify implementation behavior. Record mismatches and unresolved requirements in the test guide, and agree on changes before implementing them. The design now records the agreed explicit injection, runtime config validation and telemetry contracts.

## Commands

From this repository root:

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm lint:fix
pnpm format:check
pnpm format
pnpm test
pnpm test:integration
pnpm test:modules
```

`pnpm test` builds first. Integration fixtures and executable import snapshots use the built package. Most stage unit tests import production TypeScript through Vitest and can run without a build. Build output excludes test folders; test typechecking remains separate.

## ESLint and Prettier

The root configs use recommended JavaScript/TypeScript lint rules, sorted imports/exports, unused-import checks, and Prettier with semicolons, trailing commas, three-space indentation and a 120-column print width. Fortenv's config covers `.ts`, `.mts`, `.js` and `.mjs` with Node globals. `pnpm lint` checks the entire workspace; the library and consumer projects also have their own lint scripts. TypeScript compiler checks remain in `pnpm typecheck`.

Tooling dependencies live in the private workspace root. ESLint's parser uses the TypeScript 6 compiler API; package-local TypeScript 7 dependencies keep builds and typechecks on the existing compiler. `jiti` loads the TypeScript ESLint config on Node 22 without special CLI flags. The published library retains zero runtime dependencies.

Generated output, snapshots and syntax-sensitive discovery fixtures are excluded from lint/format rewriting. Their `.test.ts` suites remain checked. These exclusions preserve import order, escaped identifiers, malformed code and exact snapshot inputs. Runtime fixtures and consumer integration code are checked normally. The scoped `no-unsafe-function-type` exception supports Fortenv's function-identity registries; it does not relax other recommended rules.

In WebStorm, select automatic ESLint configuration and the workspace's `node_modules/prettier` package. The same root configs are used by the CLI. Prettier's ignore file protects syntax-sensitive fixtures when formatting the workspace.

## Current state

The explicit injection TDD cycle is complete: the revised tests failed against the previous implementation, then passed after implementation. The consumer suite now includes 34 ESM/CommonJS compatibility cases alongside the telemetry consumer suites. The module tests passed against the existing library without runtime changes. Build, all projects' typechecking, lint, formatting and the full test suite are the required checks.

Factories imported by config must only be defined during bootstrap. Calling them before registration throws; application code invokes them after preload. Group 13 tests this startup restriction separately from unauthorized raw import-time reads.

The [telemetry contract](packages/fortenv/src/core/__tests__/14-telemetry/CONTEXT.md) covers structured errors, available caller stacks, diagnostic events, logger adapters and config flags. Successful injection is silent. `telemetry.enumeration` and `telemetry.stderrFallback` default to false.

The library has zero runtime dependencies. `packages/pino` and `packages/opentelemetry` contain standalone logger adapters with official logger API peer dependencies. The separate [consumer project](tests/telemetry-integration/README.md) tests all three packages' built exports with actual loggers and SDKs. The adapters expose `connectFortenv(logger)`; the core telemetry subpath exposes generic subscriptions only. Root build compiles core first, then both adapters. `pnpm test` and root IDE tests run all four projects; `pnpm test:integration` selects all three consumers, and `pnpm test:modules` selects the ESM/CommonJS consumers. See [tests/CONTEXT.md](tests/CONTEXT.md) for the module matrix, fixture packages and individual run commands.

Fortenv does not grant ambient access to helpers or dependencies. Explicitly delivered credentials cannot be revoked. It is not a same-process sandbox and does not erase Linux startup environment data from `/proc/self/environ`.
