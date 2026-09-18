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

### SEC-05 — grant registration operations fixed

Four fixtures cover the SEC-05 registration operations, all installed at T1 during config dependency evaluation:

- `02-wrapper-grants/weakmap-set` — replacing `WeakMap.prototype.set` to redirect an installed grant onto an unregistered wrapper.
- `01-secret-delivery/set-add` — replacing `Set.prototype.add` to expand a wrapper's grant name set.
- `02-wrapper-grants/weakset-add` and `02-wrapper-grants/weakset-has` — replacing `WeakSet.prototype.add`/`has` to forge or validate a raw (unwrapped) function as a grant target.

- Positive controls: each replacement remains active for a harmless control operation (or, for the WeakSet identity cases, bootstrap is exercised through the replaced membership path).
- Red evidence: against mutable built-ins, `WeakMap.prototype.set` redirection produced `forgedGrantDelivered: true`; `Set.prototype.add` expansion produced `intercepted: true`; the WeakSet cases allowed a raw function to register.
- Fix: grant installation uses the eagerly captured Set constructor, `Set.prototype.add`, `WeakMap.prototype.set`, and `WeakSet.prototype.has`/`add` through captured `Reflect.apply` (`intrinsics.ts` → `grants.ts`/`runtime.ts`).
- Green evidence: replacements stay active for their controls, never receive Fortenv's private registry, and unregistered/raw targets stay empty or are rejected with the documented `grant target ... is not wrapped with fortenv()` error.

### SEC-06 — Set iteration fixed

- Boundary: grant-name traversal in `injection.ts`; T1 and T2 replacement of `Set.prototype[Symbol.iterator]`.
- Positive control: a grant-shaped control Set reaches the replacement in both timing modes.
- Red evidence: the replacement appended `PRIVATE_KEY` while Fortenv traversed the legitimate wrapper's `DATABASE_URL` grant, and the wrapper received the ungranted value.
- Fix: `intrinsics.ts` captures both Set iterator creation and the Set iterator prototype's `next` operation before real config dependencies load. Injection traverses through those captured operations.
- Green evidence: both timing cases preserve the legitimate grant and never copy the appended name.

### SEC-07 — Set constructor fixed for grant creation

- Boundary: per-wrapper grant Set creation and population in `grants.ts`; T1 replacement of the global Set constructor.
- Positive control: a harmless Set construction reaches the replacement after bootstrap.
- Red evidence: Fortenv called the replacement, which returned a Set whose own `add` method inserted `PRIVATE_KEY`; the wrapper then received the ungranted value.
- Fix: grant Sets are created with the eagerly captured constructor and populated through captured `Set.prototype.add`.
- Green evidence: the replacement remains active for the harmless control but does not receive Fortenv's grant construction.
- Remaining scope: other global constructor replacements listed under SEC-07 remain pending.

### SEC-08 — argument-array hooks not reproduced

- Boundary: wrapper invocation in `runtime.ts`; T1 and T2 inherited array-index setter and `Array.prototype[Symbol.iterator]` replacements.
- Positive controls: ordinary index assignment and array spreading reach both hooks.
- Result: both cases passed on their first valid run. Neither hook observed the injected object; receiver, business argument, authorized value, and ambient denial behavior were preserved.
- Reason: the argument array is created by array literal semantics and passed through the previously captured `Reflect.apply`; that path does not use the replaced iterator or inherited index setter.
- Remaining scope: this is coverage for the two tested argument-array routes, not closure of every SEC-08 hypothesis.

### SEC-05 + SEC-06 — combined attack fixed

- Fixture: `02-wrapper-grants/combined`. At T1 it installs the `WeakMap.prototype.set` grant redirect (SEC-05) and the `Set.prototype[Symbol.iterator]` expansion (SEC-06) at the same time, so a fix that closed only one route could not let the other succeed.
- Positive controls: an independent `WeakMap.set` and an independent `Set` spread prove both replacements remain installed (`hookActive: true`).
- Red evidence: against mutable built-ins both routes fired and both succeeded — `grantRedirected`, `iterationExpanded`, `forgedGrantDelivered`, and `injectionExpanded` were all `true`.
- Green evidence: with the captured intrinsics, Fortenv routes through neither replacement (`grantRedirected: false`, `iterationExpanded: false`); the authorized wrapper keeps only `DATABASE_URL` (`injectionExpanded: false`) and the unregistered wrapper stays empty (`forgedGrantDelivered: false`).

Current focused green command for the implemented slices:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/15-runtime-hardening
```

Result for the earlier slices: twelve files and seventeen tests passed after rebuilding; workspace typecheck also passed.

### SEC-06/SEC-07/SEC-10 follow-up fixes

Three further subprocess fixtures established valid red results before their production fixes:

- `02-wrapper-grants/weakmap-constructor`: the T1 replacement captured the live grant registry and forged a working grant. Grant registries now use the eagerly captured WeakMap constructor.
- `03-config-registration/map-iterator`: the T1 replacement rewrote the copied `PRIVATE_KEY` targets and granted an unconfigured wrapper. Config copying and grant construction now use captured Map operations and traversal.
- `04-environment-guard/set-has`: the T2 replacement disabled protected reads and writes and exposed an inserted protected name during enumeration. The guard now uses captured Set membership. The vulnerable read returned `undefined` for the already-scrubbed startup value; it did not recover that value.

All three hooks have independent positive controls, all fixture processes exit normally, and parent assertions reject either fake startup value in stdout or stderr. The complete group currently passes fifteen files and twenty tests after rebuilding.

### SEC-08/SEC-09 config-registration fixes

Three more individual operation attacks established valid red results before their fixes:

- replacing `Array.prototype.push` while targets were copied appended an attacker wrapper to a grant;
- replacing array iteration while grants were installed yielded an additional attacker wrapper;
- replacing `Object.getOwnPropertyDescriptor` substituted an attacker wrapper for the empty `PRIVATE_KEY` target list.

Configuration validation and grant construction now use captured array append/traversal and captured reflection operations. Each hook remains active for an independent control, but Fortenv no longer reaches its targeted replacement. The complete hardening group currently passes seventeen files and twenty-three tests after rebuilding.

### SEC-12 error-formatting fix

Replacing `JSON.stringify` at T2 previously replaced both `FortenvAccessError` and the protected-mutation TypeError with an attacker-controlled sentinel error. Error construction and diagnostic serialization now use the formatter captured before real config dependencies load. The hook stays active for its control but no longer receives the protected name from these paths.

### SEC-18 — prototype pollution not reproduced

Fixtures under `08-prototype-pollution` pollute `Object.prototype` and `Array.prototype` at T1, before config validation and grant construction.

- `objectData`: `Object.prototype.DATABASE_URL` (data) and `Object.prototype.PRIVATE_KEY` (accessor) are never read as configuration or injected — the config path uses own-key/own-descriptor reads (`Reflect.ownKeys`, `getOwnPropertyDescriptor`, enumerable data properties only) and injection is null-prototype. Positive control: an ordinary `{}` inherited read returns the fake value, proving the pollution is active.
- `arrayIndex`: a writable `Array.prototype[0]` data property does not enter the empty `PRIVATE_KEY: []` grant, which never reads index 0. Positive control: `[][0]` returns the polluted value.

Both cases: `pollutionActive: true`, `authorizedCallSucceeded: true`, `ambientReadDenied: true`, `injectionExpanded: false`, `forgedGrantDelivered: false`, exit 0, no fake value in output. No production change was needed; a speculative `appendArrayValue` change was investigated and reverted because the only scenario requiring it (an accessor at `Array.prototype[0]`) crashes Node's own ESM loader before Fortenv runs — a Node-level denial of service documented as a limitation, not a Fortenv-reachable leak.

### SEC-20 — nondeterministic config not reproduced (fail-closed)

Fixture `06-bootstrap-boundaries/config-toctou` declares only `DATABASE_URL` during phase-1 discovery (imports mocked/inert) and additionally `SECRET_TWO` during the real phase-2 import (an imported side effect sets a `globalThis` marker).

- Outcome: `matchingNames` detects the discovery/real name mismatch and throws the deterministic-names error; the process exits non-zero before the application runs, and no value is leaked. Fail-closed.
- Residual limitation (documented): the real-only `SECRET_TWO` was never in the discovered set, so it was never scrubbed from `process.env`. A mismatch check cannot undo the fact that a key discovery never saw was never protected; an application that swallowed the bootstrap rejection could still read it ambiently. Secret names must be deterministic and independent of imported values.

### SEC-22 — no diagnostic leaks a secret value (assurance passes)

Fixture `05-error-reporting/value-leak` enables `telemetry.enumeration` and `telemetry.stderrFallback`, then triggers a denied read, a protected-mutation rejection, enumeration, and a config-validation failure.

- Positive controls: each path ran and disclosed the secret **name** (`deniedName: "PRIVATE_KEY"`, mutation message names `DATABASE_URL`, enumeration hides `PRIVATE_KEY`, validation message present).
- Assurance: neither `fake-hardening-database` nor `fake-hardening-private-key` appears in stdout, stderr, the serialized stderr event, or `error.stack`. Every diagnostic path is value-free.

### SEC-24 — guard integrity verified by construction (exploratory)

Exploratory fixtures under `11-tamper-response/guard-integrity` attempt to defeat the installed `process.env` guard with ordinary post-bootstrap JavaScript. All six routes fail: `process.env = {…}` and `Object.defineProperty(process, "env", …)` throw `TypeError`; `delete`/`Reflect.defineProperty` return `false` (no-op); reading a protected key through the descriptor's `value` throws `FortenvAccessError` (the descriptor value is the enforcing guard Proxy); protected mutation throws `TypeError`. A protected read stays denied after every attempt and no value leaks.

Disposition: verified by construction (`writable: false, configurable: false` binding + mutation trap + guard Proxy identity). No new enforcement code required — a verified property, like SEC-18. These tests are labelled exploratory because the broader SEC-23/SEC-24 tamper-response contract is still pending design review; they assert only the confidentiality invariants.

SEC-23 (intrinsic tamper-detection) has no separate fixture: in-process comparison against a pristine reference cannot detect T0 pre-load poisoning (the captured reference would already be poisoned), and the after-load replacement window is covered by SEC-01–13.

### SEC-11 — early invocation held

Fixture `06-bootstrap-boundaries/early-invocation` invokes a wrapped function while Fortenv is still loading (synchronously during config evaluation and from a microtask in the same window). Every pre-ready call is denied with the not-ready error and none receives the secret; normal post-ready calls work and ambient reads stay denied. No deferred-invocation queue replays calls with secrets once ready.

### SEC-13 — hostile telemetry observers held

Fixture `10-diagnostics-abuse/hostile-observer` registers observers that throw, return a rejecting thenable, mutate the event, and perform a nested protected read. The hostile observer obtains no secret value (events carry the name only), its nested read stays denied, the throwing/rejecting observers are contained (process exits 0), a well-behaved second subscriber still receives a name-only event, and denial holds afterward.

### SEC-10 (completion) — guard-trap operations held

Fixture `04-environment-guard/trap-operations` replaces the global `Reflect.get`, `Reflect.ownKeys`, and `Array.prototype.filter` the guard traps use, after bootstrap. With all three provably active, the protected read still throws `FortenvAccessError` (never the attacker substitute), enumeration still hides the protected name, and the authorized path works. The guard's `protectedKey` decision uses captured `Set.prototype.has` + `normalizeName` before any `Reflect.get`, so global-`Reflect` replacement only affects harmless non-secret keys. This closes the SEC-10 operations left open after the `Set.has` slice.

### SEC-07 (completion) — Map/Proxy constructors held

Fixture `02-wrapper-grants/map-proxy-constructor` replaces the global `Map` and `Proxy` constructors at config time. The wrapper Proxies are built through the replaced `Proxy` (attack provably active), yet the authorized call still works, the unregistered wrapper gets nothing, denial holds, and no value leaks. The attacker's replacement can only wrap the handler; the wrapper's `apply` trap still runs Fortenv's captured `Reflect.apply` and enforces `injectSecrets`/`invocationGrants`. Fortenv's own Maps use the captured `Map` constructor, so the global replacement never touches them (proven via an independent control). Completes the SEC-07 constructor coverage after `Set`/`WeakMap`.

### SEC-11a — isGeneratorFunction binding: fixed

Fixture `07-package-boundaries/util-types-binding` mutates the `node:util/types` `isGeneratorFunction` export (`syncBuiltinESMExports`). `fortenv()` now uses a reference captured at module load (`intrinsics.ts`), so the generator is still rejected (`generatorWasWrapped: false`) despite the tamper, and no secret escapes. Confidentiality held before the fix (an ungranted generator gets an empty injection); the fix additionally preserves the generator-rejection guarantee under binding tampering.

### SEC-12a — stack-capture tampering: fixed

Fixture `05-error-reporting/stack-capture` replaces `Error.captureStackTrace` (throwing) and `Error.stackTraceLimit` (accessor), then triggers a denied read. `security-errors.ts` now captures `Error.captureStackTrace` at load and makes stack capture best-effort (never throws), so building a `FortenvAccessError` cannot be broken: the denied read still throws a proper `FortenvAccessError` (`deniedWithContractError: true`), no value leaks, and the process survives. Stack capture is diagnostic-only.

### Active-siphon methodology (aggressive re-audit)

Later fixtures escalate from passive observation to **active siphoning**: they replace a built-in with a fully-functional-but-malicious reimplementation that keeps the application working while copying every value it touches into a private harvest and scanning for the secret. The test fails if the harvest ever captures a real secret value.

- `02-wrapper-grants/aggressive-siphon` (SEC-07/08): a working `Map` subclass and a `Proxy` replacement that wraps the caller's handler and intercepts the wrapper's own `apply` trap. The attacker provably sees the apply trap (`applyTrapArgsSeen > 0`) but harvests nothing — the injected `[secrets, ...args]` goes through the captured `Reflect.apply` inside the trap, so the attacker only sees ordinary business arguments, never the secrets object.
- `01-secret-delivery/aggressive-collections` (SEC-03/06): working-but-harvesting `Set` iterator and `Map.get`. Provably live, but never invoked during injection (`ranDuringInjection: false`) because injection routes through captured intrinsics; the harvest stays empty.

These confirm the captured-intrinsic and captured-`Reflect.apply` design defeats an active, siphoning attacker, not merely a passive observer.

### SEC-09 (completion) — name-comparison layered guard held

Fixture `03-config-registration/name-comparison` neutralizes the `Array.prototype.some` membership predicate that `bootstrap.matchingNames` uses, then presents a real config whose secret set differs from discovery. `matchingNames` is layered (size check → membership → case-uniqueness); neutralizing only membership does not bypass it — the size check throws `FortenvConfigError` first, so bootstrap fails closed before the app runs and no secret leaks. A real-only name was never captured at phase 1, so it is absent from the private value map regardless.

### SEC-14 — package export surface held

Fixture `07-package-boundaries/export-surface` deep-scans every public namespace (`fortenv`, `fortenv/config`, `fortenv/telemetry`) and finds no secret value or live store; internal dist subpath imports (`fortenv/dist/core/runtime.js`, etc.) are refused by the exports map; no exported helper installs a grant for an attacker wrapper. Root exports are exactly the intended API.

### SEC-15 — discovery does not execute app imports before protection

Fixture `07-package-boundaries/discovery-execution` imports a side-effecting module that records execution and attempts an ambient read. It runs only in phase-2 real import (after the guard), where its read is denied and it captures nothing — proving discovery did not execute it in phase 1 before protection. Unit-level syntax/non-execution coverage lives in `13-pipeline/phase-1-discover`.

### SEC-16 — environment re-acquisition routes held

Fixture `09-environment-reacquisition/routes` confirms every route to the environment after bootstrap is the guarded object and denies the protected read: `process.env`, `globalThis.process.env`, `require("node:process").env`, and `import { env }`. A spawned child process does not inherit the protected value (scrubbed at capture). References captured before preload and separately-initialized workers are documented limitations (SEC-17), not leaks.

### SEC-17 — documented limitations (control)

Fixture `12-limitations/preload-capture` documents the T0 boundary: a module imported before `fortenv/register` reads the raw value (the limitation), while the post-load ambient read is denied (the guarantee). See `12-limitations/CONTEXT.md` for the Linux `/proc/self/environ`, explicit-handoff, accessible-wrapper, and shared-heap limitations. These are architectural, not fixable in V1.

### SEC-10a — not implemented (by design)

Freezing the `process.env` guard handler and the `fortenv()` wrapper Proxy handler was considered and intentionally not done: those handler objects are module-scoped closures with no external reference (SEC-24), so freezing them defends against a threat that requires a reference no code can obtain. It would add speculative code with no security benefit.

### SEC-10 Windows — untested on this host

The `normalizeName` `toUpperCase` case-folding path for Windows protected-name matching cannot be verified on the macOS/Linux development host; it requires a Windows CI run. Recorded as untested, not as held.

## Run

From the repository root, build before invoking the focused tests:

```sh
pnpm build
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/15-runtime-hardening
```
