# 12 — Inject secrets

Production boundaries: `injectSecrets` in `core/injection.ts` and the public `fortenv` signature. Design §§10, 14–26 and 66.

`injection.test.ts` checks only granted keys, missing versus ungranted properties, frozen null-prototype objects, fresh snapshots, prototype-related names and normalized lookup with configured spelling.

`types.test.ts` checks callback inference, omission of the injected caller argument, optional business arguments, generic results, explicit `this`, async results and rejection of unsupported callback kinds. `pnpm typecheck` performs the actual compile-time assertions; Vitest runs the runtime assertions.

Real nested, concurrent, detached and error behavior lives in [group 13](../13-pipeline/CONTEXT.md), where isolated Node processes use the built public exports and a real config. Secret strings intentionally survive explicit closure capture; there is no ambient grant or revocation mechanism.

Run `pnpm --dir packages/fortenv exec vitest run src/core/__tests__/12-inject-secrets` or select either named describe suite in the IDE.
