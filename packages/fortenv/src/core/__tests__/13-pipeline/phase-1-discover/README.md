# Discovery integration tests

These fixtures exercise the composition of stages 03–08 through `discoverSecrets`. See the [pipeline guide](../../CONTEXT.md) and [design](../../../../../docs/design.md), §§30–38 and 72.

- `imports/imports.test.ts`: named/default/aliased/mixed/default-as-named/string-named/then imports, multiple readers and secrets, JavaScript, empty grants and empty policies.
- `formatting/formatting.test.ts`: comments, multiline/trailing-comma syntax, quoted keys, Unicode and escaped binding identifiers. Unicode and escaped binding identifiers are covered by passing syntax tests.
- `typescript/typescript.test.ts`: TS/MTS, type-only and mixed imports, assertions, as const and satisfies.

The shared `application.mjs`, `then-application.mjs` and `application-types.ts` record evaluation and throw if loaded. Discovery must use inert imports. Real application identity belongs to phase two.

Config construction and defineConfig argument tests live in [04-validate-config](../../04-validate-config/CONTEXT.md). They now accept factories and computed keys under the clarified value-validation contract. Invalid final result shapes remain in [08-extract-secrets](../../08-extract-secrets/CONTEXT.md).

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/13-pipeline/phase-1-discover
```

These tests run against source through Vitest and need no package build. Inputs are real adjacent code files read as text; importing hostile fixtures directly intentionally throws.
