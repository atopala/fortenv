# 07 — Execute the synthetic configuration

Production boundary: `executeSyntheticConfig(transformed, filename, loader)` in `core/synthetic-execution.ts`; design §§37–38, 72.

## Scenarios

[execution.test.ts](execution.test.ts) feeds transformed adjacent source fixtures into the production VM with the production mock loader. The valid config returns a registered placeholder; [application.mjs](application.mjs) throws if its real module or reader runs.

Execution probes cover unavailable process, require and timers, unavailable native dynamic imports, disabled string code generation, propagation of a thrown error/rejected promise, and the synchronous execution timeout. Probe files test this stage's execution environment. Top-level code may execute under the updated contract; unavailable VM capabilities and code-generation restrictions remain independent checks.

`config.mjs` is the successful input. `process.mjs`, `require.mjs`, `timer.mjs`, `native-import.mjs`, `code-generation.mjs`, `throw.mjs`, `rejection.mjs`, and `loop.mjs` each isolate the correspondingly named failure boundary.

The VM is not a hostile-code sandbox. A synchronous timeout is not an asynchronous watchdog. The returned value remains unknown until stage 08 validates it.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/07-execute-config
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
