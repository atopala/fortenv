# Real configuration loading integration tests

These tests check production preload behavior after discovery. See the [pipeline guide](../../CONTEXT.md) and [design](../../../../../docs/design.md), §§39–51 and 71–76.

| Directory           | Scenario                                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| loading             | All four config extensions. Capture and protection precede transitive dependency evaluation. Original references are scrubbed, ordinary environment survives, and actual wrappers get exact grants, including multiple and missing secrets. |
| validation          | Raw, original, bound, forged and object targets fail startup before the application runs.                                                                                                                                                   |
| consistency         | Loader-level matching/reordered/added/removed/renamed name sets. Only discovery's returned names are injected; the real declarative config is loaded. Direct name comparison is also tested in stage 11.                                    |
| failed-import       | Real dependency evaluation throws after protection. Values remain scrubbed and inaccessible.                                                                                                                                                |
| unregistered        | A second wrapper around the same original receives an empty object. Nested sync/async calls inherit no values; the outer injection stays unchanged.                                                                                         |
| unauthorized-access | A direct read of a discovered secret during real dependency evaluation throws, stops module initialization and prevents app startup. The error identifies the key without exposing its value.                                               |
| import-time-call    | A wrapper called while its module initializes fails before real registration. Config imports definitions; app code invokes factories after preload.                                                                                         |

Each test directly invokes Node with the corresponding real app fixture. Credentials come from test-values.mjs and an explicit child environment; actual user secret values and NODE_OPTIONS are not forwarded. The consistency unit test does not install a process guard.

Unauthorized reads and configured initialization-time calls have separate fixtures. Loading fixtures catch and assert unauthorized-read errors so they can also test subsequent registration. The unauthorized-access fixture leaves the error uncaught to verify startup aborts. Reads through scrubbed original references and injected absent values still return `undefined`.

```sh
pnpm build
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/13-pipeline/phase-2-load-config
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/13-pipeline/phase-2-load-config/import-time-call
```

Use the adjacent app/config/reader modules to debug each scenario. Post-bootstrap factory success is covered separately by the injection fixtures.
