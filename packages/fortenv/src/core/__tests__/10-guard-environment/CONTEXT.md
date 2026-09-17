# 10 — Guard process.env access

Production boundary: `createEnvironmentGuard` and `protectEnvironment`; design §§41–47, 67, 75, 84–86, 89.

## Scenarios

[guard.test.ts](guard.test.ts) tests unconditional denial on each protected read, wrong/missing secret behavior, normal reads, all enumeration forms, `in`/descriptors, protected assignment/deletion/defineProperty, ordinary mutation, retained-reference replacement values, and refusal of prototype changes/non-extensibility.

Unauthorized reads throw a Fortenv error naming the key, including configured keys with no value. Granted missing values appear as `undefined` only in injected objects (group 12). Scrubbed original references and ordinary unconfigured missing keys remain ordinary missing properties. Enumeration continues to hide protected keys. Design §42 requires unconditional protected-read denial.

[live-environment.mjs](live-environment.mjs) runs in a fresh Node child. It installs the real production process guard, verifies original-value scrubbing, named ESM and CommonJS process references, protected-read denial, process.env replacement/deletion resistance, duplicate installation, normal Node env mutation, and a [child process](child.mjs) receiving the sanitized environment. The test supplies fake credentials explicitly.

This child is necessary because installation makes process.env non-configurable. Never install the guard in a shared Vitest worker. Only the current host's Node/OS behavior is verified; Windows normalization and Linux startup environment retention require their own platform runs.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/10-guard-environment
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
