# Wrapper call before registration

Design §§7, 14 and 48: config dependencies define factories; application code calls them after preload. `readers.mjs` intentionally violates this by invoking its wrapper at module scope. The test requires a loading error, no application output and no secret value in the error.

`import-time-call.test.ts` launches `app.mjs` with `fortenv.config.mjs`; the config imports the violating reader before the application can start.

This is different from a direct unauthorized environment read, tested in [unauthorized-access](../unauthorized-access/CONTEXT.md). Successful post-bootstrap factory calls are covered by [injection](../../injection/CONTEXT.md).
