# 05 — Rewrite static imports

Production boundary: `transformImports(source)` in `core/imports.ts`; design §§31–32.

## Scenarios

[imports.test.ts](imports.test.ts) covers named imports, default imports, aliases and default-as-named, mixed default/named, namespace, default-plus-namespace, string-named exports, `then`, declarations after the default export, comments/multiline formatting, and Unicode code points outside the BMP at the start and inside identifier names (including a digit in a continuation position).

The matching source fixtures are `named.config.mjs`, `default.config.mjs`, `aliased.config.mjs`, `mixed.config.mjs`, `namespace.config.mjs`, `default-and-namespace.config.mjs`, `quoted-export.config.mjs`, `then-export.config.mjs`, `hoisted.config.mjs`, `formatting.config.mjs`, and `unicode-bindings.config.mjs`. `readers.mjs` is their real import target and must not execute during transformation. [README.md](README.md) provides the short entry point for inspecting this folder.

Each input has an [executable snapshot](__snapshots__) with the same filename. The exact transformed body is inside a small async harness that imports the built **production** `createMockLoader`. There is no separate demonstration loader. Run `pnpm build` first, then open the generated `.mjs` in an IDE, run it, and set breakpoints. `console.dir` prints the resulting placeholder config. This is ordinary Node execution of the output; production VM behavior is tested in stage 07.

[escaped-bindings.config.mjs](escaped-bindings.config.mjs) covers `\uXXXX` and `\u{...}` escapes in named exports, aliases, default and namespace imports, and identifier start/continuation positions including astral letters and digits. Its snapshot preserves the source spelling. [escaped-bindings.check.mjs](escaped-bindings.check.mjs) executes that snapshot in Node and asserts that escaped and unescaped references resolve to the same placeholders. [escaped-reserved.config.mjs](escaped-reserved.config.mjs) verifies that escaping the `__fortenv_` prefix cannot bypass the generated-name collision check.

The snapshots reveal `.namespace`, generated bindings, hoisting and default-export capture. Namespace output is current transformer behavior, not an agreement that discovery must accept namespace grant references. This stage takes JavaScript; TypeScript stripping is stage 03.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/05-rewrite-imports
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
