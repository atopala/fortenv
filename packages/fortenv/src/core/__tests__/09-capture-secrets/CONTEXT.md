# 09 — Capture values and scrub original environment

Production boundary: `captureSecrets(original, names)` in `runtime/node/environment.ts`; design §§27, 39–40.

## Scenarios

[capture.test.ts](capture.test.ts) checks private fake-value capture, empty-string versus absent values, scrubbing through a retained reference to the same original object, duplicate names, separation from later writes, unchanged normal variables for an empty policy, and host-dependent name normalization.

These tests use ordinary objects, not the test runner's environment. The captured map is accessible to the unit test because it calls an internal component; runtime composition retains that map privately. Node environment peculiarities and process installation are checked in stage 10 and the preload integration tests.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/09-capture-secrets
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
