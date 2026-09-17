# 04 — Validate config values

The agreed contract now validates **values passed to defineConfig**, not the syntax used to construct them. Node parses the transformed JavaScript. Factories, computed keys, local config-building statements, and mocked static imports without bindings are accepted when they produce valid configuration.

Design §§9 and 34–38 specify runtime value validation and deterministic config construction. Folder numbers remain stable for navigation; group 04 now tests the value contract applied during execution in stage 07, not a separate pre-execution parsing pass.

## Scenarios

[define-config.test.ts](define-config.test.ts) calls the public helper directly. Valid constructed configs retain their identity; empty policies/grants are allowed. JavaScript callers passing an undefined/null/array config, missing or invalid secrets, non-array grants, non-function grants, or an empty secret name must receive a validation error at the call.

[discovery-config.test.ts](discovery-config.test.ts) reads the adjacent real fixtures and verifies:

- Computed names from variables, literals and function calls produce `DATABASE_URL`.
- A local factory can return a valid config.
- Static side-effect and empty imports remain mocked; application modules do not execute.
- A top-level statement may populate the config. The fixture's result depends on that statement executing.
- A thrown config exception is reported as an execution error with its original message.
- Invalid JavaScript, missing default exports, and unavailable native dynamic imports still fail. Native dynamic import is not the injected mock loader and must not load the application dependency.
- Factories returning invalid grant values and functions computing invalid secret names fail on their resulting values.
- Discovery rejects a locally created reader: grant references must still be imported placeholders.
- An invalid `defineConfig(...)` call must throw even when its result is discarded and a later call returns a valid default export.

The fixtures map directly to those assertions: `computed-name.config.mjs`, `computed-literal.config.mjs`, `computed-call.config.mjs`, `runtime-factory.config.mjs`, `side-effect-import.config.mjs`, `empty-import.config.mjs`, `top-level-call.config.mjs`, `top-level-throw.config.mjs`, `dynamic-import.config.mjs`, `missing-default.config.mjs`, `invalid-factory.config.mjs`, `invalid-computed-name.config.mjs`, `local-reader.config.mjs`, and `discarded-invalid-config.config.mjs`. The `malformed` directory holds the two intentionally invalid JavaScript inputs.

## Implementation

`defineConfig()` in `src/config.ts` calls the shared `readConfiguration()` validator on every invocation before returning the original input. Invalid arguments fail even when their result would be discarded. All 27 tests in this group pass: 11 direct helper tests and 16 discovery tests. Discovery still checks imported placeholder identity separately; real wrapper registration happens later when building the access-control map.

The shared application fixture records evaluation and throws if loaded. Successful discovery must leave its marker unset. Files in `malformed` contain intentional syntax errors and remain excluded from fixture typechecking.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/04-validate-config
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/04-validate-config/discovery-config.test.ts -t 'accepts valid config values'
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/04-validate-config/define-config.test.ts
```

All files use named describe suites for IDE execution. See the [pipeline test guide](../CONTEXT.md) for phase consistency and authorization boundaries.
