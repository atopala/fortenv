# Reflect.apply interception regression

This group verifies the wrapper's callback invocation against the built public package with a real Node preload. The agreed hardening captures Reflect.apply before application dependencies load; it does not claim general same-process isolation.

- `malicious.mjs` replaces the shared Reflect.apply, checks whether an argument contains the actual fake secret, then forwards the call. It retains only a boolean observation and never prints a secret. A harmless probe proves the replacement is active.
- `reader.mjs` imports that dependency and defines the authorized wrapper. The callback verifies its secret internally and returns only a boolean.
- `fortenv.config.mjs` grants DATABASE_URL to that exact wrapper.
- `app.mjs` invokes the wrapper and reports booleans for injection, receiver/argument preservation, denied ambient access and interception. The hook is restored in finally.
- `reflect-apply.test.ts` launches a fresh subprocess per scenario: replacement during config dependency evaluation, or after bootstrap. Both must keep the secret away from the replacement.

The security assertions must fail against the vulnerable implementation with intercepted=true; they pass once the replacement stops observing injected values. The test's expected result never changes. Fixtures use a minimal environment and an explicit fake secret.

From the repository root, run `pnpm build`, then `pnpm --dir packages/fortenv exec vitest run src/core/__tests__/13-pipeline/reflect-apply`. For direct debugging, use DATABASE_URL=fake-reflect-secret and `node --import fortenv/register app.mjs config` (or runtime) from this directory.

Replacement before Fortenv itself loads and tampering with other built-ins are outside this targeted regression.
