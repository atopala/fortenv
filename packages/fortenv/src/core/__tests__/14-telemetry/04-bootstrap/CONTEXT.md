# 14.04 — Reporting during bootstrap

Runs a real Node process with the built Fortenv preload and [observe.mjs](observe.mjs), which uses only Node diagnostics_channel and stdout. Separate config/reader fixtures perform caught and uncaught direct reads of the fake `DATABASE_URL` secret during real config loading.

`bootstrap.test.ts` launches `app.mjs` with `caught.config.mjs`/`caught-reader.mjs` and `uncaught.config.mjs`/`uncaught-reader.mjs` as the two isolated scenarios.

Both cases must publish exactly one event with a stack pointing to the offending reader before application startup. The caught case then prints `denial-caught` and starts the application; the uncaught case exits with an authorization error before the application starts. Neither output stream may expose the fake value.

Both tests pass. An early dependency-free observer receives bootstrap failures; asynchronous network export surviving process termination is outside this test's scope.
