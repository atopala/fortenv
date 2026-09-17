# 06 — Create inert imported bindings

Production boundary: `createMockLoader(placeholders)` in `core/mock-imports.ts`; design §§31, 37–38, 72.

## Scenarios

[mock-imports.test.ts](mock-imports.test.ts) verifies the real defineConfig validating helper preserves the config reference, immutable helper namespace, lazy placeholders for even nonexistent modules, stable module/export identity, distinct identities for distinct imports, and rejection of calls, construction, property reads/writes and namespace assignment.

The `then` test verifies that awaiting `{ namespace }` does not call a mocked export named `then`. The same namespace must not be handed to a test helper that probes it as a promise; identity assertions compare with `===` before passing a boolean to Vitest.

These tests use the actual production loader. They do not authorize wrappers or read process.env.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/06-mock-imports
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
