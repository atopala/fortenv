# 01 — Locate configuration

Production boundary: `configPath(directory, override)` in `core/config-source.ts`; design §52, with the session's four-extension restriction.

## Scenarios

[config-path.test.ts](config-path.test.ts) tests one default per supported extension, no eligible default, ambiguous defaults, explicit relative and absolute selection, the FORTENV_CONFIG default, invalid/empty overrides, and a missing selected file. The returned path is compared with the filesystem's canonical path.

The `ts`, `mts`, `js`, and `mjs` directories each hold a real config that throws if executed: locating must not execute it. `ambiguous` contains two defaults. `none` contains only an unsupported CJS file. The optional directory/override parameters expose the existing selection behavior without changing process.cwd in tests.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/01-locate-config
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
