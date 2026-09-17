# 15 — Runtime hardening

Production boundary: grant registration, private secret storage, per-call injection, environment protection, and reporting after Fortenv has loaded. The investigation follows [the hardening plan](../../../docs/security-hardening-plan.md) and the existing design contract.

Every attack runs against the built public package in a fresh Node process. Fixtures use only explicit fake values, prove the replacement hook is active, and report booleans after restoring the modified built-in. Parent tests reject either fake value in stdout or stderr.

## Evidence log

### SEC-01 — fixed

- Runtime/platform and source state: Node 22.23.2, vulnerable implementation before trusted intrinsic changes.
- Boundary: `injection.ts`; T1 config dependency and T2 runtime replacement.
- Command: `pnpm --dir packages/fortenv exec vitest run src/core/__tests__/15-runtime-hardening` after `pnpm build`.
- Positive control: the forwarding `Object.freeze` hook handled a harmless freeze and the authorized wrapper succeeded.
- Red evidence: both cases returned `intercepted: true`; the secure expectation was false. No fake value appeared in stdout/stderr.
- Root cause: `injectSecrets()` resolved the mutable global `Object.freeze` after the dependency installed its replacement.
- Fix: `intrinsics.ts` captures the operation before real config dependencies load; `injection.ts` uses that private reference.
- Green evidence: both timing cases passed in the focused seven-test run after rebuilding.

### SEC-02 — fixed

- Runtime/platform and source state: Node 22.23.2, vulnerable implementation before trusted intrinsic changes.
- Boundary: `injection.ts`; T1 config dependency and T2 runtime replacement.
- Command: same focused run as SEC-01.
- Positive control: the forwarding `Object.create` hook created a working null-prototype control object and the authorized wrapper succeeded.
- Red evidence: both cases returned `intercepted: true`; the secure expectation was false. No fake value appeared in stdout/stderr.
- Root cause: `injectSecrets()` resolved mutable `Object.create`, allowing the replacement to return a proxy that observed secret assignments.
- Fix: null-prototype injection records are created through the eagerly captured operation.
- Green evidence: both timing cases passed in the focused seven-test run after rebuilding.

### SEC-03 — fixed

- Runtime/platform and source state: Node 22.23.2, vulnerable implementation before trusted intrinsic changes.
- Boundary: private value lookup in `injection.ts`; T1 config dependency and T2 runtime replacement.
- Command: same focused run as SEC-01.
- Positive control: the forwarding `Map.prototype.get` hook returned the expected value for a harmless map and the authorized wrapper succeeded.
- Red evidence: both cases returned `intercepted: true` after reading the ungranted `PRIVATE_KEY` from the hook receiver. No fake value appeared in stdout/stderr.
- Root cause: `values.get()` dispatched through the mutable prototype and passed the complete private map as its receiver.
- Fix: private map reads use an eagerly captured prototype method and captured `Reflect.apply`.
- Green evidence: both timing cases passed in the focused seven-test run after rebuilding.

### SEC-04 — fixed

- Runtime/platform and source state: Node 22.23.2, vulnerable implementation before trusted intrinsic changes.
- Boundary: authorization lookup in `runtime.ts`; T2 runtime replacement.
- Command: same focused run as SEC-01.
- Positive control: the selective `WeakMap.prototype.get` hook observed the exact unregistered wrapper while the legitimate wrapper had already succeeded.
- Red evidence: `forgedGrantDelivered: true`; the secure expectation was false. Ambient reads stayed denied and no fake value appeared in stdout/stderr.
- Root cause: `grants.get(wrapper)` dispatched through the mutable prototype and trusted the replacement's forged set.
- Fix: authorization lookup and grant construction use the captured WeakMap lookup operation.
- Green evidence: the hook remained active through an independent WeakMap control, Fortenv never reached its targeted replacement, and the unregistered wrapper received no secret. The focused seven-test run passed after rebuilding.

Focused green command:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/15-runtime-hardening
```

Result: four files and seven tests passed. The existing two-case Reflect.apply regression and package typecheck also passed.

## Run

From the repository root, build before invoking the focused tests:

```sh
pnpm build
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/15-runtime-hardening
```
