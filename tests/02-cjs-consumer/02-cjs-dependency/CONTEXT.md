# CJS consumer with CJS dependency

`integration.test.ts` launches these real applications using the built Fortenv preload. The consumer's `.js` files use require; the dependency is the private `@fortenv-fixture/cjs-dependency` workspace package.

`fortenv.config.mjs` registers the dependency's exact wrappers for the normal cases; `import-time.config.mjs` adds its forbidden top-level-read entry point.

- `happy.js`: sync/async credential delivery, exact injected keys, missing and ungranted values, ordinary env access and filtered enumeration.
- `denied-read.js sync|async`: the dependency constructor's raw environment read must produce a structured FortenvAccessError even underneath a registered callback and after await.
- `callback-errors.js sync|async`: original callback errors propagate, later calls still work and direct reads remain denied.
- `identity.js`: config/import/require share exact wrapper identities and a single runtime, and the public entry resolves to dist.
- `import-time.config.mjs`: loads the dependency's forbidden top-level read; only the before-read marker may run. `app-not-started.js` must never execute.

Build the library first with `pnpm --filter fortenv build`. From this directory, run e.g. `DATABASE_URL=fake-module-secret OTHER_SECRET=fake-other-secret NODE_ENV=test node --import fortenv/register happy.js`. Run failure cases with `FORTENV_CONFIG=./import-time.config.mjs node --import fortenv/register app-not-started.js`. Vitest supplies a minimal environment with fake values and a timeout; it checks both output streams for value leakage.
