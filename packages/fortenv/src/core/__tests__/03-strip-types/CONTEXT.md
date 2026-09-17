# 03 — Strip TypeScript

Production boundary: `stripConfigTypes(source, filename)` in `core/typescript.ts`; design §53.

## Scenarios

[strip-types.test.ts](strip-types.test.ts) tests TS aliases/annotations/satisfies, MTS interfaces/as-const/satisfies, unchanged JS and MJS, and rejection of an enum requiring runtime transformation. Inputs are adjacent `.config.*` files; JavaScript outputs are [snapshot files](__snapshots__). Run those generated `.mjs` modules with Node to verify their syntax, or inspect them in an IDE.

The inputs are `typed.config.ts`, `typed.config.mts`, `plain.config.js`, `plain.config.mjs`, and the rejected `enum.config.ts`. The snapshot directory contains the generated outputs for the two typed inputs.

The stripper uses Node's native strip-only mode. It preserves source positions with spaces and is version-sensitive. These tests characterize stripping before config execution. The enum rejection comes from native strip-only mode; the local-variable example exercises stripping without depending on value validation.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/03-strip-types
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
