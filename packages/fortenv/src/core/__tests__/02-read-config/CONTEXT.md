# 02 — Read configuration source

Production boundary: `readConfigSource(filename)` in `core/config-source.ts`; design §§30–31.

## Scenarios

[read-source.test.ts](read-source.test.ts) reads [source.config.mjs](source.config.mjs), which throws if executed. The [raw-source snapshot](__snapshots__/source.txt) preserves comments, Unicode, spacing, and the final newline. A separate test checks the ENOENT read failure.

This stage returns text. It performs no import rewriting, evaluation, validation, or secret discovery. Its snapshot is deliberately text, not an executable discovery output.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/02-read-config
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
