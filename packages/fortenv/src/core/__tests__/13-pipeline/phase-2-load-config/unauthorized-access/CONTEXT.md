# Unauthorized import-time secret access

Discovery executes the config with mocked imports and identifies `DATABASE_URL` as protected. During real loading, `readers.mjs` attempts a direct `process.env.DATABASE_URL` read outside any authorized function call.

`unauthorized-access.test.ts` launches `app.mjs` with `fortenv.config.mjs` and supplies only an explicit fake secret.

The test requires that read to throw a Fortenv authorization error identifying the key without exposing its value. The `before-secret-read` marker proves the module reached the read. Neither `after-secret-read` nor `app-started` may execute; Node must exit with an error.

The configured wrapper is declared but never called. This isolates unauthorized direct access from the separate [configured-reader initialization test](../import-time-call/import-time-call.test.ts).

The guard now throws an unauthorized-access error, and this test passes. Older guard/runtime tests have been aligned with the same error policy. Missing granted values are injected as undefined; protected environment reads always throw. See design §§40–42.

```sh
pnpm build
pnpm exec vitest run src/core/__tests__/13-pipeline/phase-2-load-config/unauthorized-access
```
