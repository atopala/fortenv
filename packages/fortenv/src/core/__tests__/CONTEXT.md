# Numbered pipeline tests

This is the entry point for tracing Fortenv from config source to protected runtime reads. Read [the implementation map](../CONTEXT.md) and [the design](../../../docs/design.md) together. The design records the agreed injection and telemetry contracts.

## Organization and design mapping

Every numbered folder has its own `CONTEXT.md`. Inputs are real code files or ordinary test data, not generated config strings. Generated snapshots are outputs, saved for inspection. Folder numbers are stable navigation groups. Following the latest clarification, group 04 covers the defineConfig value contract used during execution (07), not a separate syntax-validation pass. Phase 1 still discovers names and phase 2 loads real references after protection.

| Folder                                                  | Input → output / assertion                                                                                      | Design                              | Test level                                                           |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| [01-locate-config](01-locate-config/CONTEXT.md)         | directory/override → canonical filename; missing/ambiguous/unsupported selection fails                          | §§52–54 + session's four extensions | filesystem stage                                                     |
| [02-read-config](02-read-config/CONTEXT.md)             | selected path → verbatim UTF-8 source, without execution                                                        | §§30–31                             | filesystem stage + text snapshot                                     |
| [03-strip-types](03-strip-types/CONTEXT.md)             | TS/MTS → JS snapshots; JS/MJS unchanged; transform-only syntax rejected                                         | §53                                 | native stripping stage                                               |
| [04-validate-config](04-validate-config/CONTEXT.md)     | defineConfig arguments must be valid; computed/factory-built values are allowed                                 | §§9, 34–38                          | direct helper tests + discovery integration                          |
| [05-rewrite-imports](05-rewrite-imports/CONTEXT.md)     | static imports → exact mock-loader calls, bindings, and captured default export                                 | §§31–32                             | transformer snapshots; runnable modules                              |
| [06-mock-imports](06-mock-imports/CONTEXT.md)           | stable placeholders, validating helper, inert operations, thenable-safe envelope                                | §§31, 37–38, 72                     | production loader unit tests                                         |
| [07-execute-config](07-execute-config/CONTEXT.md)       | rewritten source + loader → evaluated config; execution failures remain visible                                 | §§37–38, 72                         | production VM and loader                                             |
| [08-extract-secrets](08-extract-secrets/CONTEXT.md)     | result → exact names and copied placeholder arrays; malformed values fail                                       | §§8–9, 38, 58                       | result and shape validation                                          |
| [09-capture-secrets](09-capture-secrets/CONTEXT.md)     | fake env → stored values/absence, original keys removed                                                         | §§27, 39–40                         | capture stage                                                        |
| [10-guard-environment](10-guard-environment/CONTEXT.md) | protected names → unconditional read denial; reflection/mutation/replacement cannot expose values               | §§41–47, 67, 75, 84–86, 89          | guard unit tests + isolated real Node process                        |
| [11-register-grants](11-register-grants/CONTEXT.md)     | matching names + real wrapper identities → copied ACL with exact grants                                         | §§11–14, 48–51, 73–76               | ACL and name-comparison stages                                       |
| [12-inject-secrets](12-inject-secrets/CONTEXT.md)       | grants + stored values → readonly per-call object and public callback types                                     | §§10, 15–26, 66                     | production injection helper + compile-time contract                  |
| [13-pipeline](13-pipeline/CONTEXT.md)                   | stages compose correctly; real config dependencies see protection; actual wrappers use the actual process guard | §§28–51, 71–83                      | trace + existing discovery/preload integration + runtime integration |
| [14-telemetry](14-telemetry/CONTEXT.md)                 | denied reads → error stacks, diagnostic events and generic subscriptions                                        | §67                                 | passing contract tests + isolated bootstrap fixtures                 |
| [15-runtime-hardening](15-runtime-hardening/CONTEXT.md) | shared built-in tampering → private-state, grant, guard and reporting regressions                               | Security hardening plan             | isolated built-package adversarial fixtures                          |

## Run and debug

From the repository root:

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

Each test file has a named `describe` suite. Use its IDE run/debug action to execute every case in that file, or select an individual `it` case. Setup and cleanup hooks are scoped to their suite.

The repository-root `vitest.config.ts` includes four projects: this library's `src/**/*.test.ts` tests plus ESM, CommonJS and telemetry consumer projects under `tests/`. Root-level `pnpm test` and the IDE's repository-root All Tests action cover all four. Package-level runs cover the library only. All projects explicitly exclude `**/dist/**` and preserve Vitest's default exclusions. Direct Vitest/IDE runs require `pnpm build` after production changes because child-process fixtures use built exports; `pnpm test` and `pnpm test:integration` build automatically. Logger-specific tests live in the separate consumer project and consume built adapter packages; core contains no logger dependencies.

Run one stage or a single case:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/06-mock-imports
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/05-rewrite-imports -t 'transforms named.config.mjs'
```

Run generated JavaScript directly in Node or with your IDE's Node debugger:

```sh
node packages/fortenv/src/core/__tests__/05-rewrite-imports/__snapshots__/named.config.mjs
```

Step 05 uses the **built production mock loader**, not a parallel demonstration implementation. Rebuild after production changes. The transformed function body is unchanged inside the generated executable harness. It prints a config with inert functions, not real reader functions or secret values. Step 03's snapshots contain standalone stripped JavaScript too. Step 02 intentionally saves raw source as `.txt`, because its input throws if executed.

Update only the snapshots you intentionally changed, then inspect their diffs:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/05-rewrite-imports --update
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/13-pipeline/ordering --update
```

The [saved order trace](13-pipeline/ordering/__snapshots__/order.json) records actual production-stage calls. It has no separate step 04: defineConfig is invoked inside synthetic execution, and its call-time validation is tested directly in group 04. Its protection callback is observed rather than installed in the test runner; the separate real-process integration tests verify the actual environment installation.

## Diagnosing a failure

1. Selection/read failure: inspect stages 01–02 and the fixture path.
2. Wrong generated JavaScript: compare the source and snapshots in stages 03/05.
3. An imported value behaves unexpectedly: run stage 06 against the production loader.
4. An invalid config value is accepted: check defineConfig arguments (04), then execution errors (07) and final-result validation (08). Factories and config-building statements are allowed; their use alone is not an error.
5. A secret is visible outside a grant: first check capture (09), then the guard's unconditional denial and reflection behavior (10).
6. A configured reader has the wrong permissions: check names and exact wrapper identities (11), then current phase and injection contents (12).
7. Stages pass individually but startup fails: inspect stage 13's trace and real preload fixtures.

Failures at an early stage can invalidate assumptions at later stages. Passing snapshots characterize output; they are not blanket approval of every config form or the complete security model.

## Contract decisions and verification

The full suite includes core pipeline tests, 34 module-compatibility cases and telemetry consumer tests against built exports. The new ESM/CommonJS matrix passed on its first runtime run without library changes; see [consumer coverage](../../../../../tests/CONTEXT.md). The red run before implementation had 67 failures and an injection suite load failure because its production helper did not exist. The implementation then replaced ambient grants with explicit injection. The old import-time-call success expectation was changed to early rejection to reflect the agreed factory startup rule, not hidden or skipped.

- Groups 01–08 retain discovery coverage. Valid factories/computed names are accepted; invalid defineConfig arguments are rejected.
- Group 10 denies every protected environment read and hides keys/values from reflection.
- Group 11 registers exact identities and preserves configured spelling.
- Group 12 tests injection shape, grant isolation, missing values, readonly data, prototype-related names and public argument/result/this types.
- Group 13 tests the real factory DX, startup ordering, nested/concurrent/async calls, callback errors, original Promise identity and explicit captured-value lifetime. Direct import-time reads and early wrapper calls have separate failure fixtures.
- Group 14 covers generic telemetry behavior; logger mapping and adapter failure cases run in the consumer project. Successful injection is silent; the pipeline and real SDK consumer tests verify this.

## What the tests do not establish

A host Node/OS run does not certify every supported platform, Windows environment behavior, workers, bundlers or other runtimes. The injected-key normalization adapter is unit tested; full Windows integration still needs its own run. Child-environment scrubbing is tested. Linux initial-environment retention remains a documented limitation. Configuration must be trusted and deterministic; the VM is not a sandbox and its timeout only bounds synchronous execution. Explicitly delivered credentials can be retained or leaked.

Ripwire comparison gates require a Git HEAD or saved baseline; this repository currently has neither. No clean delta result is claimed. Compiler checks and actual test runs provide the available verification evidence.

## Fixture and isolation conventions

- Stage tests import actual internal production functions. There are no public test-only grant setters.
- Tests that install the real process guard run a fresh Node child, because the guard intentionally makes `process.env` non-configurable. Unit guard tests use ordinary fake env objects and the actual production guard constructor.
- Subprocess fixtures receive explicit fake secrets and a minimal environment, not the user's secret values or NODE_OPTIONS.
- Snapshot files are generated JavaScript with dynamic mock namespaces, so they are excluded from TypeScript fixture checking; they are verified by snapshot comparison and direct Node execution. Deliberately malformed source under `04-validate-config/malformed` is also excluded. All other valid fixture code participates in the test typecheck.
- Tests are excluded from the production TypeScript build. This does not automatically remove artifacts left by older builds from an existing dist directory.
- There is no custom central test runner. Vitest discovers the numbered folders; every `.test.ts` file and named case can be run independently.
