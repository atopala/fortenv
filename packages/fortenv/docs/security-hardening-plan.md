# Fortenv adversarial security investigation and hardening plan

Status: implementation in progress. SEC-01 through SEC-04 have passing regression coverage and fixes. Tested SEC-05 registry operations, SEC-06 Set and Map traversal, SEC-07 Set and WeakMap constructors, SEC-09 array/reflection config-registration paths, the SEC-10 Set-membership guard path, and SEC-12 JSON error formatting are fixed; the tested SEC-08 argument-array paths did not reproduce, and the SEC-18 prototype-pollution paths did not reproduce. SEC-20 (nondeterministic config) failed closed and did not reproduce; SEC-22 (secret-value leak assurance) passes; SEC-24 (process.env guard integrity) is verified robust by construction against ordinary-JS tampering. SEC-11 (early invocation), SEC-13 (hostile telemetry observers), and the SEC-10 guard-trap completion all held (not reproduced). SEC-07 Map/Proxy constructors held (constructor coverage complete). SEC-11a (isGeneratorFunction binding) and SEC-12a (stack-capture) are now fixed: `fortenv()` uses a captured `isGeneratorFunction` and denial-error construction is failure-tolerant, so both hold under tampering. A structured error taxonomy (`FortenvConfigError`/`FortenvStateError`/`FortenvUsageError` with stable codes, alongside `FortenvAccessError`) is exported from the root entry; see design §68. Uncovered operations within those IDs and all later backlog items remain investigation work, tracked with `[x]`/`[~]`/`[ ]` status markers and per-row Disposition notes in §6 (including the added named probes SEC-10a, SEC-11a, and SEC-12a, and the Priority 3 pre-release items SEC-18–24). The library follows a non-negotiable **fail-closed policy**: confidentiality outranks availability, and there is no toggle that relaxes enforcement (see §6 Priority 3). Detailed evidence is recorded in the runtime-hardening test context. This document does not change the [design contract](design.md). Sections 6–11 give the executing agent concrete attack investigations, evidence requirements, work order, a resume prompt, and an initial fixture specification.

## 1. Objective and scope

Harden Fortenv's handling of private values and grants against dependencies replacing shared JavaScript built-ins after Fortenv loads. Cover both real config dependency evaluation and application execution after bootstrap.

The proposed contract is that these replacements cannot receive private secret stores or injected values, forge wrapper identities, expand grants, or reopen protected environment access. Errors and telemetry must not expose captured values.

Preserve the public API, exact wrapper identity authorization, explicit injection, unconditional protected environment denial, and zero runtime dependencies. Preserve callback receivers, business arguments, results, Promise identity, and error identity.

Relevant existing design sections: security scope §§2–4; identity and grants §§11–14; bootstrap and protection §§28–51; telemetry §67; errors §68; acceptance criteria §96.

This is targeted hardening, not same-process isolation. Code running before Fortenv captures trusted references, arbitrary native/OS access, Linux startup environment retention, explicitly delivered secrets, and invocation of accessible authorized wrappers remain separate limitations. Configuration stays trusted and deterministic. Telemetry delivery cannot be guaranteed against arbitrary same-process interference.

## 2. Evidence already established

The earlier investigation reproduced these four bypasses against the built package in isolated processes with fake secrets. They now have permanent regression fixtures and passing fixes; the detailed red and green evidence is recorded in `src/core/__tests__/15-runtime-hardening/CONTEXT.md`.

| Replacement             | Observed weakness                                                             | Required regression outcome                                  |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `Object.freeze`         | Receives the populated injection object.                                      | Hook receives no injected values.                            |
| `Object.create`         | Returns a proxy that intercepts secret assignments.                           | Hook cannot observe secret population.                       |
| `Map.prototype.get`     | Receives the private backing map as its receiver and can read another secret. | Hook receives neither captured values nor the private store. |
| `WeakMap.prototype.get` | Supplies a forged grant set to an unregistered wrapper.                       | Unregistered wrapper still receives no secrets.              |

The existing `Reflect.apply` fix and its two timing regressions remain in place. Other operations listed below are audit candidates, not confirmed vulnerabilities.

## 3. Ordered work and verification gates

These steps describe the work categories. Section 8 is the authoritative execution order: investigate and fix in batches rather than completing the entire audit before fixing the four known bypasses.

### Step 1 — Review the contract

- [ ] Review the proposed scope above against the design.
- [ ] Agree on any additions before changing the design or production behavior.
- [ ] Record startup prerequisites and distinguish confidentiality, authorization, and diagnostic availability.

Gate: a reviewed contract with no implicit promise of sandboxing or guaranteed telemetry delivery.

### Step 2 — Add failing regressions for the four confirmed bypasses

- [ ] Create real adjacent config, dependency, reader, and application fixtures.
- [ ] Configure `DATABASE_URL` for one legitimate wrapper and `PRIVATE_KEY` for no wrappers.
- [ ] Test tampering during real config dependency loading and after bootstrap wherever applicable.
- [ ] Prove each hook is active through a harmless control operation.
- [ ] Assert legitimate calls still succeed, unauthorized grants stay empty, and neither secret reaches the attacker.
- [ ] Confirm failures come from demonstrated interception or forged grants, not fixture errors or startup crashes.

Gate: save the focused red-run results before production changes. Tests assert the secure outcome throughout: they fail before the fix and pass afterward. Do not reverse their assertions to make an exploit test fail after hardening.

### Step 3 — Audit the complete sensitive path

| Boundary                          | Files                                                        | Audit questions                                                                                          |
| --------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Config validation and consistency | `core/configuration.ts`, `core/bootstrap.ts`                 | Can tampered methods falsify validation or discovery/real-config name comparisons?                       |
| Wrapper identity and grants       | `core/runtime.ts`, `core/grants.ts`                          | Can methods, constructors, or iteration expose registries or forge membership and grants?                |
| Secret copying and invocation     | `core/injection.ts`, `core/runtime.ts`                       | Can object creation, assignments, iteration, argument construction, or invocation expose values?         |
| Capture and environment guard     | `runtime/node/environment.ts`                                | Can tampering alter key normalization, membership, enumeration, mutation rejection, or protection state? |
| Errors and telemetry              | `core/security-errors.ts`, `runtime/node/security-events.ts` | Can reporting expose sensitive objects, replace denial behavior, or break recursion containment?         |

Paths in this table are relative to `packages/fortenv/src`.

- [ ] Inventory explicit built-in calls and implicit operations: `for…of`, spread, iterator methods, inherited setters, and prototype lookups.
- [ ] Record each candidate's timing, prerequisites, private data reachable, and affected design invariant.
- [ ] Add a focused failing regression for each additional confirmed bypass before fixing it.
- [ ] Record candidates that cannot be reproduced and limitations outside the agreed scope separately.

Gate: an evidence-backed inventory covering every boundary above. A structural scan alone does not establish safety.

### Step 4 — Harden trusted operations in coherent slices

- [ ] Introduce a small internal module for the trusted built-in references actually needed by sensitive code.
- [ ] Ensure capture occurs before real config dependencies evaluate; verify import ordering with a regression.
- [ ] Capture necessary constructors and prototype methods as well as static functions.
- [ ] Invoke captured methods without consulting replaceable `.call`, `.apply`, or `.bind` at runtime.
- [ ] Avoid passing private collections or secret-bearing objects through attacker-controlled iteration or inherited hooks.
- [ ] Harden grant lookup, injection, and callback invocation first.
- [ ] Harden registration and real-config validation next.
- [ ] Harden environment protection, then error/reporting operations.
- [ ] Keep application globals mutable; do not freeze or replace them as a compatibility shortcut.
- [ ] Keep private state and trusted references outside public package exports.

Gate for each slice: its verified red regressions turn green, relevant existing tests pass, and no unrelated public behavior changes. Select concrete helpers from the audit rather than building an exhaustive speculative built-ins framework.

### Step 5 — Verify compatibility and reporting

- [ ] Exercise representative attacks through ESM and CommonJS dependencies consuming built public exports.
- [ ] Preserve receiver, arguments, return/Promise identity, and synchronous/asynchronous error identity.
- [ ] Verify direct protected reads remain denied inside and underneath authorized callbacks.
- [ ] Verify enumeration still hides protected names and values, with reporting controlled by the existing flag.
- [ ] Verify managed observer failures cannot grant access or expose captured values; preserve the documented raw diagnostics-channel subscriber behavior.
- [ ] Run existing Pino and OpenTelemetry integrations without adding dependencies to core.
- [ ] Verify supported platform behavior on actual platform runs; distinguish local evidence from untested coverage.

Gate: focused regressions, relevant consumers, and the required workspace checks pass on the supported Node baseline.

### Step 6 — Document verified guarantees and remaining limits

- [ ] Update the approved design wording and affected `CONTEXT.md` files to match verified behavior.
- [ ] Document prerequisites and commands for reproducing the security regressions.
- [ ] Review README claims against the tested scope.
- [ ] Add a developer/AI review checklist for startup ordering, grants, accessible wrappers, explicit secret handoffs, and logging.
- [ ] Require review output to distinguish evidence, unresolved findings, and limitations; do not present it as a security certification.

Gate: documentation identifies what was tested and what remains outside the guarantee.

## 4. Proposed test organization

Keep existing numbered groups and the existing `13-pipeline/reflect-apply` regressions in place. Add this cross-cutting security group under `src/core/__tests__`:

```text
15-runtime-hardening/
  CONTEXT.md
  01-secret-delivery/
  02-wrapper-grants/
  03-config-registration/
  04-environment-guard/
  05-error-reporting/
  06-bootstrap-boundaries/
  07-package-boundaries/
  08-prototype-pollution/
  09-environment-reacquisition/
  10-diagnostics-abuse/
  11-tamper-response/
```

Groups `08`–`11` hold the Priority 3 assessment fixtures (SEC-18–24): prototype pollution, environment re-acquisition routes, diagnostics-channel/reporting abuse and value-leak assurance, and bootstrap/guard tamper-response.

Each test file has a named `describe` suite and independently selectable cases. Fixture source lives beside its test, not in embedded program strings. Use fresh Node subprocesses for all global tampering and permanent environment guards, with explicit fake secrets and a minimal environment.

Restore patched built-ins in `finally` where possible. Keep verification independent from tampered APIs: check results after restoration and have the parent test verify exit status and output. Hooks record interception privately; they never print secrets. Check stdout, stderr, errors, and security events for leakage. Assert positive controls so an inactive attack cannot produce a false pass.

## 5. Final checks and completion criteria

Run focused tests after each slice. Before handing off production changes, run from the repository root:

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

Use `pnpm test:modules` and `pnpm test:integration` when isolating consumer failures. Direct IDE/Vitest runs against built exports require a fresh build after production edits.

The work is complete when all four confirmed bypasses are closed, every additional confirmed in-scope bypass has a passing regression, existing documented behavior remains intact, required checks pass, and the documentation accurately states the verified guarantees and residual limitations. Record actual commands and results rather than a fixed test total.

## 6. Attack backlog

Status markers: `[x]` = fixed or dispositioned with evidence in the [runtime-hardening evidence log](../src/core/__tests__/15-runtime-hardening/CONTEXT.md); `[~]` = investigated and not reproduced on the tested paths (coverage, not proof of safety); `[ ]` = pending. A row's second column carries a **Disposition** note when its coverage is partial, naming the operations still open. “Confirmed earlier” meant reproduced in the preceding investigation; “Hypothesis” means the agent must investigate before claiming a vulnerability or implementing a fix. Priorities describe work order, not a formal severity score. Do not mark a row `[x]` merely because a test file exists — it requires an evidence-backed disposition in the evidence log.

Use these timing labels in evidence:

- **T0:** before Fortenv captures trusted references. A startup prerequisite/limitation control, not an in-scope hardening success requirement.
- **T1:** during real config dependency evaluation, after environment shielding but before grants are installed.
- **T2:** after bootstrap, before an authorized or unauthorized wrapper call.
- **T3:** during a callback, observer, or asynchronous continuation, including nested calls.

Test each operation at the timings where production actually uses it. Do not multiply every case across every timing without a reason.

### Priority 0 — Private values and forged grants

| ID / status                                | Attack experiment                                                                                                                                                                                                                                                                                      | Secure result and possible fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x] SEC-01 — fixed                         | Replace `Object.freeze` at T1/T2 with a forwarding hook inspecting own data properties. Invoke the legitimate wrapper.                                                                                                                                                                                 | No injection object reaches the hook; callback still succeeds. Explore capturing the original freeze operation before dependencies load.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [x] SEC-02 — fixed                         | Replace `Object.create` at T1/T2; delegate creation but return a proxy recording assignments to the injected key.                                                                                                                                                                                      | No secret assignment reaches the replacement. Explore trusted object creation or an equivalent null-prototype construction preserving the documented shape.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| [x] SEC-03 — fixed                         | Replace `Map.prototype.get`; when Fortenv requests `DATABASE_URL`, use the saved original method on the hook receiver to attempt reading ungranted `PRIVATE_KEY`.                                                                                                                                      | Neither secret nor the backing map reaches the hook. Explore captured collection methods invoked through trusted application machinery.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| [x] SEC-04 — fixed                         | Replace `WeakMap.prototype.get` with a forged set containing `PRIVATE_KEY`; invoke an unregistered wrapper.                                                                                                                                                                                            | Wrapper receives an empty injection object. Explore captured lookup and construction operations; do not merely validate the forged set after exposing the registry.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| [x] SEC-05 — fixed (tested ops)            | Patch `WeakSet.has/add`, `WeakMap.set/get`, and `Set.add/has` individually at T1. Attempt registering a plain function or redirecting a legitimate grant to an unregistered wrapper.                                                                                                                   | Invalid identities remain rejected; legitimate grants attach only to configured wrappers. Explore trusted registry methods and atomic installation after complete validation. **Disposition:** fixed via captured `WeakMap.set`, `Set` constructor/`add`, `WeakSet.has/add`; covered by `02-wrapper-grants/{weakmap-set,weakset-add,weakset-has}` and `01-secret-delivery/set-add`. `WeakMap.get`/`Set.has` on this path are covered by SEC-04/SEC-10.                                                                                                                                                                                                                                                                                               |
| [x] SEC-06 — fixed                         | Patch `Map`/`Set` iteration methods, methods keyed by `Symbol.iterator`, and iterator-prototype `next` individually at T1/T2. Attempt capturing receivers or yielding an extra secret name.                                                                                                            | No private collection escapes and grants do not expand. Explore captured iterator creation plus captured `next`, or private indexed data with explicitly safe traversal. Capturing only the iterator factory is insufficient if `next` stays mutable. **Disposition:** fixed via captured Set iterator + iterator `next` (`01-secret-delivery/set-iterator`) and captured Map iterator + `next` (`03-config-registration/map-iterator`).                                                                                                                                                                                                                                                                                                             |
| [x] SEC-07 — fixed (Set/WeakMap/Map/Proxy) | Replace global `Map`, `Set`, `WeakMap`, `WeakSet`, and `Proxy` constructors individually at T1/T2. Forward ordinary construction while recording objects or altering returned objects.                                                                                                                 | Later registration, wrapper creation, and failure cleanup cannot expose state or forge authorization. Explore captured constructors. Check the constructors' subsequent method/iteration use too. **Disposition:** `Set` (`01-secret-delivery/set-constructor`) and `WeakMap` (`02-wrapper-grants/weakmap-constructor`) fixed via captured constructors. `Map`/`Proxy` (`02-wrapper-grants/map-proxy-constructor`) held: replacing global `Proxy` builds the wrapper through the attacker constructor but the `apply` trap still runs the captured `Reflect.apply` and enforces grants (no leak, no forged grant); Fortenv builds its own Maps via the captured constructor so a replaced global `Map` is never used. Constructor coverage complete. |
| [~] SEC-08 — not reproduced (tested ops)   | Patch array iteration and install carefully scoped inherited accessors on objects used for argument/descriptor construction. Probe nested wrapper calls and special valid secret names. Retain the existing Reflect.apply regression and probe `.call`/`.apply`/`.bind` routes used by any new helper. | No populated secret object or private store crosses an attacker-controlled hook. Preserve ordinary business argument semantics; attacker-owned caller arguments are not themselves private Fortenv data. Explore null-prototype internal records and trusted invocation/traversal. **Disposition:** the tested argument-array routes (`01-secret-delivery/array-argument`) did not reproduce — array-literal define semantics plus captured `Reflect.apply` avoid the hooks. Config-registration array append/traversal is separately fixed under SEC-09. Not proof for untested argument shapes.                                                                                                                                                    |

Implement SEC-01–04 first after a valid red run. Investigate SEC-05–08 before declaring the shared built-ins problem resolved. After individual fixes, add a representative combined attack so two patched operations cannot cooperate to defeat a fix that passes in isolation.

### Priority 1 — Bootstrap, environment, and diagnostics

| ID / status                                                        | Attack experiment                                                                                                                                                                                                                                              | Secure result and possible fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [x] SEC-09 — fixed (tested ops); bootstrap pending                 | At T1 patch reflection, descriptor access, array validation, map membership, or name-comparison operations used by `configuration.ts` and `bootstrap.ts`. Attempt admitting an invalid target or mismatched secret set through the real validation path.       | Actual validation is enforced and bootstrap does not become ready on failure. Explore trusted validation operations. Trusted config becoming nondeterministic is a separate limitation: a mismatch check cannot undo a read of a key discovery never protected. **Disposition:** `configuration.ts` routed through captured `Array.isArray`/append/traversal, `Reflect.ownKeys`, `getOwnPropertyDescriptor`, `getPrototypeOf`, and Map ops; covered by `03-config-registration/{array-operations,property-descriptor,map-iterator}`. The `bootstrap.ts` real-vs-discovery name-comparison operations are not yet routed through captured intrinsics or probed.                                                                                                                                                                                                                      |
| [x] SEC-10 — fixed (`Set.has` + guard traps); Windows norm pending | At T2 patch `Set.has`, reflection methods, array filtering, and string normalization used by the environment guard. Probe direct reads, `in`, descriptors, all enumeration forms, writes, deletion, and replacement. Include Windows case variants on Windows. | Protected names remain hidden and protected operations retain their contract. Distinguish retrieving a captured value from returning `undefined`, revealing a name, or exposing the sanitized original target. Explore trusted guard operations; report each outcome accurately. **Disposition:** protected-name membership fixed via captured `Set.prototype.has` (`04-environment-guard/set-has`); the vulnerable read returned `undefined`, not the scrubbed value. Guard-trap completion (`04-environment-guard/trap-operations`) held: replacing global `Reflect.get`/`ownKeys` and `Array.prototype.filter` does not defeat denial or leak a protected name — the `protectedKey` decision runs on captured `Set.has`+`normalizeName` before any `Reflect.get`. Still untested: `String.prototype.toUpperCase` in `normalizeName` on an actual Windows run (non-Windows host). |
| [~] SEC-11 — held (not reproduced)                                 | At T1 schedule wrapper calls via microtasks and timers; force real config rejection after some wrapper definitions; retry bootstrap via supported imports and invoke any retained wrapper.                                                                     | No callback executes before readiness; failed initialization never installs partial grants or reopens the environment. Explore state-transition and cleanup fixes only after a valid reproducer. No deferred invocation queue. **Disposition:** held (`06-bootstrap-boundaries/early-invocation`). Sync and microtask wrapper calls during config loading are denied with the not-ready error and receive no secret; a call scheduled by a config-time timer only runs post-ready (a normal call, not an early one). No deferred-invocation queue replays calls with secrets.                                                                                                                                                                                                                                                                                                       |
| [x] SEC-12 — fixed (`JSON.stringify`); stack ops pending           | Patch `Error.captureStackTrace`, stack formatting, timestamp/serialization functions, and the reporting methods actually used. Trigger a denied read with reporting on/off and with a connected observer.                                                      | Separate secret disclosure, replacement of the documented error, suppressed diagnostics, and process termination. No reporting path gains access to private values. Explore trusted operations and narrowly scoped failure containment; any change to stack formatting or error semantics needs contract review. **Disposition:** `JSON.stringify` in error/validation/stderr serialization fixed via the captured formatter (`05-error-reporting/json-stringify`). Still untested: `Error.captureStackTrace` and the `Error.stackTraceLimit` get/set dance in `security-errors.ts`, `Date.now` timestamps, and observer/`console.error` reporting paths.                                                                                                                                                                                                                           |
| [~] SEC-13 — held (not reproduced)                                 | Use managed observers that throw, reject, return hostile thenables, mutate the event/error, or attempt nested synchronous/asynchronous reads. Observe a second subscriber and stderr fallback behavior. Probe raw diagnostics-channel publication separately.  | Reads stay denied, recursion stays bounded under the agreed contract, and events contain no captured values. Determine whether event integrity between subscribers needs a new contract before freezing/copying events. Shared diagnostics channels are not authenticated security records. Do not promise unforgeable events or guaranteed delivery. **Disposition:** held (`10-diagnostics-abuse/hostile-observer`). Hostile observers (throw, reject, mutate event, nested read) obtain no secret value, cannot make the nested read succeed, are contained without crashing the process, and a well-behaved second subscriber still receives a name-only event; denial holds afterward. Event carries the secret name only, never a value. Cross-subscriber event immutability (freezing events) remains an optional, separate contract, not a value-leak issue.                |

For SEC-09, write the simplest malformed-config stage test as well as the real-preload attack if needed to localize the failure. For SEC-12/13, existing §67 behavior remains authoritative: managed observers are contained; raw subscribers retain Node's exception behavior. A malicious dependency can terminate or hang its process, so denial of service alone is not proof of secret theft.

Audit imported Node functions as well as global objects: an ESM import binding is not automatically a private immutable function snapshot. Where the code relies on a Node built-in export, investigate whether CommonJS export mutation followed by `syncBuiltinESMExports()` changes the function Fortenv calls. Keep this scoped to functions actually used, and distinguish tampering of an already-created instance's methods from replacement of its constructor.

#### Priority 1 — additional named probes (added after the batch-4/5/6 implementation)

These specific operations the current code actually touches are called out so they are not left implicit inside the broader SEC IDs above:

- **SEC-11a — `isGeneratorFunction` import binding.** `runtime.ts` gates `fortenv()` on `isGeneratorFunction` imported from `node:util/types`. Probe CommonJS export mutation plus `syncBuiltinESMExports()` (and direct namespace replacement) to see whether a generator can be admitted, or an ordinary function rejected. **Status — fixed (`07-package-boundaries/util-types-binding`):** `fortenv()` now uses `isGeneratorFunction` captured at module load in `intrinsics.ts`, so the generator stays rejected (`generatorWasWrapped: false`) even under binding tampering; no secret ever escaped (an ungranted generator gets an empty injection).
- **SEC-12a — `Error.captureStackTrace` and `Error.stackTraceLimit`.** `security-errors.ts` writes and restores `Error.stackTraceLimit` and calls `Error.captureStackTrace`. Probe replacements that suppress the stack, throw, or read the surrounding state. **Status — fixed (`05-error-reporting/stack-capture`):** `security-errors.ts` captures `Error.captureStackTrace` at load and makes stack capture best-effort (wrapped so it never throws), so building a `FortenvAccessError` cannot be broken; a denied read still throws a proper `FortenvAccessError` (`deniedWithContractError: true`) under a throwing `captureStackTrace`, with no value leak. Documented in design §68.
- **SEC-10a — guard-handler and wrapper-handler immutability (fix technique).** As a defense-in-depth fix rather than an attack, evaluate freezing the `process.env` guard handler object and the `fortenv()` wrapper Proxy handler after install so a dependency cannot mutate individual trap functions post-installation. Confirm this does not change trap behavior or the public contract before adopting it. This does not replace capturing the traps' own `Reflect`/`filter` operations under SEC-10.

### Priority 2 — Broader boundary checks and documented limits

| ID / status                        | Attack experiment                                                                                                                                                                                                                                                                                                       | Secure result and possible fix                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ ] SEC-14 — hypothesis            | Enumerate public exports; attempt package subpath and resolvable direct-file imports; load a second runtime copy where feasible. Inspect exported helpers and exposed objects for a path to the live store or grant installation.                                                                                       | No import exposes live private state or a registration backdoor. Export maps alone are not a security boundary against arbitrary filesystem paths. Standalone helpers operating on caller-supplied data are not a bypass. Explore removing live-state access if found; retain the existing duplicate-guard rejection. |
| [ ] SEC-15 — hypothesis            | Extend discovery fixtures with syntax variations around comments, strings, template literals, import attributes, re-exports, and dynamic import expressions supported or rejected by the current design. Use an imported module with an execution marker, then native Node execution as the supported-syntax reference. | Discovery does not execute application imports; unsupported constructs fail as documented rather than silently omitting required protection. This is a bounded transformer correctness investigation, not a hostile-config sandbox project. Parser expansion or new supported syntax needs approval.                  |
| [ ] SEC-16 — boundary verification | Probe retained original environment references, ESM/CommonJS process imports, ordinary child inheritance, and separately initialized workers using explicit fake secrets.                                                                                                                                               | Sanitized references and normal child environments do not reveal captured values. Workers have separate setup; do not add automatic secret/grant propagation. Reuse existing guard/consumer tests before adding new fixtures.                                                                                         |
| [ ] SEC-17 — limitation control    | Document T0 tampering, Linux initial environment retention, explicit credential handoff, and calls to accessible wrappers. Optional isolated demonstrations use only fake values and never log their content.                                                                                                           | Clearly label these as prerequisites or design limitations, not tests that should turn green after built-in capture. Process isolation or a launcher is separate future design work, not an automatic addition to this implementation.                                                                                |

Do not introduce inspector/native-addon probes, network exfiltration, or new infrastructure merely to demonstrate the already documented absence of same-process isolation. If future work needs to strengthen that boundary, propose a separate design and test scope.

### Priority 3 — pre-release threat assessment and fail-closed policy

This priority answers the release question directly: **can Fortenv keep secrets away from any same-process library, and what are the honest limits?** It also fixes the enforcement posture the whole library follows.

#### Fail-closed policy (non-negotiable)

Confidentiality outranks availability. When Fortenv cannot prove a secret will stay protected, the correct outcome is to **deny, refuse to become ready, or terminate — never to serve the secret**. It is acceptable — preferred — for a wrapped call to throw, bootstrap to fail, or the process to crash rather than let a configured secret reach an unauthorized reader.

Rules:

- No configuration option, environment variable, or API relaxes denial, grant checks, or tamper response. There is **no strict/relaxed toggle**. The only supported knobs are the diagnostic flags `telemetry.enumeration` and `telemetry.stderrFallback`, which change _reporting verbosity only_ and can never downgrade an enforcement decision.
- A reporting or telemetry failure must never convert a denial into an allow.
- Enforcement decisions must not depend on any operation an attacker can replace; a detected inconsistency is resolved by failing closed, not by best-effort continuation.
- Tamper detection must be **narrow and deterministic**: it triggers only when tampering actually intersects Fortenv's own captured operations, private state, or the installed guard's integrity — never on unrelated application monkey-patching. Fail-closed is only safe if it does not fire on benign code; imprecise detection is itself a defect.

Any change to error semantics, throwing, or process termination behavior needs a design-contract review (§68 errors, §67 telemetry) before implementation.

#### New attack and assurance items

| ID / status                                         | Attack experiment                                                                                                                                                                                                                                                                                  | Secure (fail-closed) result and possible fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [~] SEC-18 — not reproduced                         | Pollute `Object.prototype`/`Array.prototype` (data and accessor properties, `__proto__`, numeric indices) at T0/T1 before Fortenv validates config and builds grants. Attempt to leak a value, forge a grant, or satisfy a membership/own-key check.                                               | No polluted inherited property is read as configuration, injected, or treated as a grant. Injection stays null-prototype; validation reads own enumerable data properties only. **Disposition:** not reproduced (`08-prototype-pollution`, `objectData`/`arrayIndex`) — own-only config reads and null-prototype injection already hold; no production change. An accessor at `Array.prototype[0]` crashes Node's own ESM loader before Fortenv runs, so it is a Node-level DoS/limitation, not a Fortenv leak; the probe was refined to a data property rather than weakening the assertion.                                                                                                                                                                                                                                                                                                                               |
| [ ] SEC-19 — limitation control                     | Re-acquire the environment through routes other than the guarded reference: `require('node:process').env`, `import { env }`, `globalThis.process.env`, a reference captured before preload, `--env-file`, `worker_threads`, `child_process` env inheritance, `vm` contexts, and internal bindings. | Guarded routes deny protected reads; syncBuiltinESMExports keeps ESM/CJS `process.env` on the guard. References captured before preload and OS-level inheritance are documented T0 limitations, not failures to fix. Enumerate every route with its disposition.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| [~] SEC-20 — not reproduced (fail-closed)           | Supply a trusted-but-nondeterministic config whose `secrets` entries or grant arrays are getters/proxies returning one shape to phase-1 discovery and another to phase-2 real registration (a TOCTOU between discovery and real import).                                                           | Real registration validates the value it actually uses; a name never discovered was never protected, which is a documented determinism limitation, not a silent grant. Copy config through captured own-property reads; do not re-invoke attacker accessors. **Disposition:** not reproduced (`06-bootstrap-boundaries/config-toctou`). A config that declares an extra `SECRET_TWO` only at real import (its side effect is inert under mocked discovery) is caught by `matchingNames`, which throws the deterministic-names error and fails the process before the app runs; no value leaks. Residual documented limitation: the real-only name was never scrubbed, so an app that swallowed the bootstrap rejection could read it ambiently — the mismatch check cannot undo a key discovery never protected. Getter/accessor-keyed configs are separately rejected at validation (own enumerable data properties only). |
| [ ] SEC-21 — hypothesis                             | Subscribe directly to the public `fortenv.security` diagnostics channel and to the raw channel; use observers to harvest denied secret _names_, defeat the `AsyncLocalStorage` recursion guard, or keep the process alive to mine the event stream.                                                | Events never carry secret values; denial happens regardless of subscribers; recursion stays bounded. Name disclosure through opt-in diagnostics is a documented property, not a value leak. Raw channels are not authenticated security records (§67).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [x] SEC-22 — assurance passes                       | Assert no error message, `error.stack`, telemetry event, or validation string ever embeds a secret _value_ (only its name where documented). Trigger denial, mutation rejection, enumeration, and config-validation failures with fake values set.                                                 | Every diagnostic path is value-free. This is a positive assurance test across the reporting surface, complementing SEC-12/SEC-12a. Any value found is a fail-closed defect. **Disposition:** passes (`05-error-reporting/value-leak`). Denied read, protected-mutation TypeError, enumeration and config validation all disclose the secret name only; neither fake value appears in stdout, stderr, the serialized stderr event, or `error.stack`. Positive controls confirm each path ran.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| [ ] SEC-23 — hypothesis (weak by nature)            | At bootstrap, compare each captured intrinsic against a pristine reference; simulate a mismatch (an operation already replaced before capture, or a captured reference that no longer matches). Attempt to reach `ready`.                                                                          | On detected capture-time tampering, Fortenv refuses to become `ready`, installs no grants, and leaves the environment scrubbed — it does not continue best-effort. Needs a narrow, deterministic check and a design-contract review before implementation. **Note:** in-process comparison cannot detect T0 pre-load poisoning — if a built-in was replaced before Fortenv loaded, the captured reference is already poisoned and would compare equal to itself. The after-load (T1/T2) replacement window is already covered by SEC-01–13. Consider whether SEC-23 adds value beyond those before building detection.                                                                                                                                                                                                                                                                                                      |
| [~] SEC-24 — verified by construction (exploratory) | After bootstrap, replace `process.env`, mutate the guard's handler traps, or `defineProperty` over the guarded reference. Attempt a subsequent protected read/enumeration through the tampered guard.                                                                                              | The guard detects replacement/handler mutation and fails closed (throws or terminates) rather than serving; the `Symbol.for` duplicate marker and a non-configurable, non-writable `process.env` binding back this. Consider freezing the handler (SEC-10a). **Disposition:** exploratory fixtures (`11-tamper-response/guard-integrity`) show the guard already resists every ordinary-JS route — assign/`defineProperty` throw `TypeError`, delete/`Reflect.defineProperty` no-op, the descriptor's value is the enforcing guard Proxy, and mutation throws; denial holds after every attempt and no value leaks. Guaranteed by construction (`writable:false, configurable:false` binding + mutation trap + Proxy identity); **no new enforcement code required.** Handler objects are unreachable closures, so trap mutation is only a heap/inspector concern (an architectural limitation, not ordinary JS).           |

Implement SEC-18–24 red-tests-first like the earlier batches. SEC-23/SEC-24 introduce active tamper-response behavior and therefore require design-contract review (§68) before their production changes land. SEC-19 and the value side of SEC-21 are documented limitation/property controls, not green-after-fix targets.

#### Honest limitations — what Fortenv V1 cannot protect against (architectural, not bugs)

These are inherent to same-process JavaScript and are **not** closed by any built-in hardening. They must be stated in the README and design, never hidden:

1. **Linux `/proc/self/environ` (design §3).** The initial process environment persists in that file; a dependency with filesystem read access reads the secret directly regardless of `process.env` scrubbing. Only a launcher mode (design §90) that starts the app without the secrets in its initial environment closes this.
2. **Shared-heap access.** Once a secret is a JS string in memory, `--inspect`/the inspector protocol, native addons, `v8.getHeapSnapshot()`, or buffer scanning can reach it. Fortenv guards the environment API, not process memory. Fail-closed does not help here — the value is already resident.
3. **T0 pre-load tampering.** Code that runs before `--import fortenv/register` can capture trusted references (`process`, `process.env`, `Reflect`, built-ins) Fortenv never controls. Startup ordering is a prerequisite, not something Fortenv can enforce from inside.
4. **Explicitly handed-out values.** A secret an authorized wrapper deliberately passes to a dependency, logs, stores, or returns has left Fortenv's control and cannot be revoked (design §18).
5. **Accessible authorized wrappers.** Any code that can call an authorized wrapper gets that wrapper's injected object; Fortenv authorizes by exact wrapper identity, not by caller.
6. **Denial of service.** A malicious dependency can crash or hang its own process. Under this policy that is an accepted outcome; DoS alone is never evidence of secret theft.

The truthful one-line guarantee stays: _Fortenv removes configured secrets from ambient `process.env` access and injects them only into explicitly registered functions._ It is strong same-process defense-in-depth plus fail-closed tamper response — **not** a sandbox, and it must never claim malicious dependencies cannot access secrets.

#### Pre-release go/no-go checklist

- [ ] All confirmed in-scope bypasses (SEC-01–13 tested operations, plus SEC-18/20/22/23/24) have passing fail-closed regressions.
- [ ] SEC-19 route table and SEC-17/SEC-21 limitation controls are documented with explicit dispositions.
- [ ] No enforcement toggle exists; only diagnostic-verbosity flags are configurable.
- [x] No diagnostic path leaks a secret value (SEC-22 green).
- [ ] README/design state the six architectural limitations above and make no absolute-protection claim.
- [ ] Required workspace checks pass on the supported Node baseline; platform-specific behavior (Linux `/proc`, Windows case-folding) is labeled tested or untested honestly.

Accepted residual risk at V1 release: the six architectural limitations above. Everything else must be either fixed with a regression or documented as an explicit, deterministic limitation control — not left implicit.

## 7. Evidence and reproducibility protocol

Before each attack, read its nearest context and the complete production functions involved. Search existing fixtures so the test extends the real pipeline rather than recreating it. Prefer one replaceable operation per initial reproducer.

Escalate from passive observation to **active siphoning** where a built-in is replaced. Do not merely forward to the original and record that the hook ran; reimplement the built-in as a fully-functional-but-malicious version that keeps the application working (real backing behavior) while copying every key, value, argument, and handler interaction it touches into a private harvest and scanning it for the fake secret. Assert the harvest never captures a real secret value. This distinguishes "the hook ran" from "the hook stole something," and tests the design the way an actual malicious dependency would — keeping the feature working so nothing looks broken while trying to exfiltrate. Prove liveness with a harmless control that carries no secret, so a genuine capture is attributable to Fortenv's own data flow rather than the attacker's own collections.

Record one entry per SEC ID using this template in the new test group's `CONTEXT.md` when that group is created:

```text
ID and status: hypothesis | reproduced | fixed | not reproduced | limitation | blocked
Runtime/platform and source state:
Design invariant and production file/function:
Attacker capability and timing:
Fixture/test path and exact command:
Positive control proving the hook ran:
Observed outcome: secret read | private reference | forged grant | key disclosure |
                  error-contract failure | reporting failure | availability only
Expected safe outcome:
Red evidence and root cause:
Fix applied or proposed, with tradeoffs:
Green command/result and regression scope:
Residual limits or next question:
```

“Not reproduced” is not proof of safety. “Blocked” must state the missing condition, such as an unavailable platform, rather than silently skipping the case. Do not mark a checkbox complete merely because a test file exists.

Use recognizable fake values only. Prefer recording booleans inside hooks over retaining secret strings. An authorized fixture callback should return a boolean verifying injection, not the injected object. The parent process checks structured results, exit status, and absence of fake values in output. A timeout or unrelated exception is inconclusive until localized.

For descriptor/prototype patches, save exact original descriptors before installation and restore them after the observation interval. Limit hooks to the relevant fake keys/targets so unrelated Node startup does not dominate the test. If broad tampering prevents Node itself from running, refine the probe rather than weakening the security assertion.

After a fix, rebuild before rerunning subprocess fixtures. Keep each patch focused enough that its red-to-green evidence is attributable. Never temporarily expose private production state or add public test-only grant setters to make a regression easier to write.

An investigation may pass on its first run because the code was already safe or an earlier batch closed that path. Record this honestly as coverage with no new reproducer. Do not weaken production code to manufacture a red result. If a confirmed earlier finding no longer reproduces, compare the current source with the earlier evidence and explain the difference before proceeding.

Treat partial information separately: learning a protected key name is different from reading its value; accepting an invalid plain function as a config target does not alone prove that it receives injected values. A patched dependency seeing a secret deliberately handed to it by application code is outside the injection-interception finding. Tests must attribute observations to the correct path.

## 8. Execution batches for the next agent

Batches 1–4 are complete, and batches 5–6 are partially complete (see §6 status markers and the evidence log). Remaining work is summarized after the list.

1. **Baseline:** read AGENTS/context/design, inspect current worktree, verify toolchain, build, run existing tests, and record pre-existing failures. Do not assume the prior session's results still apply. — done.
2. **First red batch:** implement SEC-01–04 permanent regressions, verify the specific exploit observations, and retain the existing Reflect.apply tests. Produce a brief evidence summary before production changes. Stop here only if the user requests red-test review. — done.
3. **First fix batch:** implement the smallest trusted-operation support that closes SEC-01–04; verify focused green and relevant compatibility. Avoid introducing unused wrappers for every JavaScript built-in. — done.
4. **Identity and iteration batch:** investigate SEC-05–08, adding red tests and minimal fixes for confirmed findings. Add a combined attack after the individual regressions pass. — done (SEC-05/06 fixed with combined attack; SEC-07 Set/WeakMap fixed; SEC-08 not reproduced).
5. **Bootstrap and environment batch:** investigate SEC-09–11 and preserve existing stage tests and startup restrictions. — partial (SEC-09 config paths and SEC-10 `Set.has` fixed; **SEC-11 bootstrap state machine and the rest of the SEC-10 guard operations remain open**).
6. **Diagnostics batch:** investigate SEC-12–13; separate security enforcement from diagnostic integrity/availability. Bring new event immutability or reporting guarantees back for review before changing behavior. — partial (SEC-12 `JSON.stringify` fixed; **SEC-12a stack operations and SEC-13 observers remain open**).
7. **Boundary batch:** investigate SEC-14–16, document SEC-17, and run representative ESM/CommonJS consumer attacks against built output. — open.
8. **Pre-release assessment batch (Priority 3):** enforce the fail-closed policy; implement SEC-18 (prototype pollution), SEC-20 (config TOCTOU/determinism), SEC-22 (value-leak assurance), SEC-23 (bootstrap tamper-response) and SEC-24 (guard self-integrity) red-tests-first; document SEC-19 (env re-acquisition routes) and the SEC-21 diagnostics properties as limitation controls; complete the go/no-go checklist. SEC-23/24 change enforcement behavior and need a §68 design-contract review before their production changes land. — open.
9. **Closeout:** run required checks, update evidence/context and approved design claims, and report fixed findings, unresolved hypotheses, platform gaps, and residual limits separately.

Remaining in-scope work, roughly in order: SEC-11 (bootstrap boundaries), SEC-13 (managed observers), SEC-10 completion (capture the guard traps' `Reflect`/`Array.filter`/`toUpperCase`; full probe matrix), SEC-12a (`Error.captureStackTrace`/`stackTraceLimit`), SEC-07 completion (`Map` and `Proxy` constructors), SEC-09 completion (`bootstrap.ts` name comparison), SEC-11a (`isGeneratorFunction` import binding), SEC-14–17 (boundaries and documented limits), the SEC-10a handler-immutability fix technique, and the Priority 3 pre-release items SEC-18–24 with the fail-closed policy. The launcher mode (design §90) that would close the Linux `/proc/self/environ` limitation stays separate future design work.

After each batch, update the evidence record with the next exact test or SEC ID. Do not commit, branch, push, add dependencies, broaden platform promises, freeze host globals, or implement a launcher without corresponding authorization.

Stop and ask a narrow question when a fix changes the public API or design contract, requires new dependencies, or conflicts with existing documented behavior. Routine internal implementation choices within approved scope do not need repeated permission. If repeated fixes fail, return to the reproducer and explain the unresolved cause rather than layering speculative patches.

## 9. Copyable implementation handoff

Use this prompt after switching models and deciding to start implementation:

> Implement the Fortenv security investigation and hardening plan in `packages/fortenv/docs/security-hardening-plan.md`. Read `AGENTS.md`, root and relevant `CONTEXT.md` files, and `packages/fortenv/docs/design.md` first. Follow the execution batches in section 8 and the §6 status markers. SEC-01–07 and SEC-09/10/12 have evidence-backed fixes on their tested operations (SEC-08 did not reproduce); the open work is SEC-11, SEC-13, the SEC-10/SEC-12 completions, the SEC-07 `Map`/`Proxy` constructors, the SEC-09 `bootstrap.ts` comparison, SEC-11a/SEC-10a, and SEC-14–17. Preserve the existing Reflect.apply regression and all passing group-15 regressions. Use real adjacent fixtures and isolated Node subprocesses with fake secrets, named describe suites, and built public exports. Keep a per-finding evidence record using section 7. Confirm the expected red failure before each production fix, then rebuild and demonstrate green. Preserve zero dependencies and the current public contract. Do not rewrite the design to justify an implementation shortcut. Ask before introducing a new behavioral contract; report limits honestly. Finish with the required checks and a concise summary of fixed, unresolved, and untested findings. If this takes multiple sessions, leave the exact next SEC ID and command in the evidence record.

The handoff authorizes work only when the user actually sends it as an implementation instruction. The existence of this planning document alone is not an instruction to start coding.

## 10. Concrete first fixture specification

Start with SEC-01. Use [the existing Reflect.apply fixture](../src/core/__tests__/13-pipeline/reflect-apply/CONTEXT.md) as the house pattern, not as a program to copy without adapting its assertions.

Proposed files under `src/core/__tests__/15-runtime-hardening/01-secret-delivery/object-freeze/`:

| File                    | Exact responsibility                                                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `object-freeze.test.ts` | Named `describe`; two individually selectable cases for `config` and `runtime`; spawn the real Node preload; check process status, output, and leak absence.                                                                                  |
| `fortenv.config.mjs`    | Import the legitimate wrapper and grant `DATABASE_URL` only to it. Protect `PRIVATE_KEY` with an empty grant list.                                                                                                                            |
| `reader.mjs`            | Import `malicious.mjs` for its T1 side effect; define the legitimate wrapper, preserving a receiver and one business argument. Return a boolean verifying the granted fake value and absence of `PRIVATE_KEY`. Do not call the wrapper here.  |
| `malicious.mjs`         | Save original operations, expose install/restore/observations, and install only in `config` mode during evaluation. The freeze hook checks own data properties for the fake value, records a boolean, and delegates to the original function. |
| `app.mjs`               | In `runtime` mode install the hook now. Execute a harmless freeze control; attempt raw reads; invoke the legitimate wrapper; restore operations; then print only structured boolean observations.                                             |

Use these explicit fake values in the child environment: `DATABASE_URL=fake-hardening-database` and `PRIVATE_KEY=fake-hardening-private-key`. Use `process.execPath`, inherit only the minimal platform variables from the existing subprocess pattern, and set the fixture directory as `cwd`. Do not inherit `NODE_OPTIONS` or the full parent environment. Use a bounded subprocess timeout.

Expected secure output, with no extra stdout:

```json
{
   "hookActive": true,
   "authorizedCallSucceeded": true,
   "ambientReadDenied": true,
   "intercepted": false
}
```

Expected vulnerable observation for this case is `intercepted: true` while the positive control and legitimate call both succeed. The parent test must reject this result. Check denial of both protected keys with the expected error class/code. Do not let child assertions print actual injected objects when a check fails; emit booleans and have the parent assert them after checking output for fake values.

For SEC-02 and SEC-03, reuse the fixture roles but create separate attack modules and selectable tests. SEC-03 must specifically check interception of the ungranted second value, not merely whether a Map hook ran. For SEC-04, add a separately defined unregistered wrapper returning whether it received `PRIVATE_KEY`; the secure expected result is false. In T1, make the forged WeakMap lookup selective enough that registration still completes, so the test demonstrates unauthorized delivery instead of an unrelated config crash. Record each scenario's actual red result, not an assumed one.

First focused commands, from the repository root once these files exist:

```sh
pnpm build
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/15-runtime-hardening/01-secret-delivery/object-freeze
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/13-pipeline/reflect-apply
```

Check `.tool-versions` and package engines rather than upgrading the toolchain. Fixtures participate in JavaScript/TypeScript typechecking: use accurate JSDoc or inferred types, and do not introduce `any`, double casts, or ignored errors to force a test hook through the compiler.

## 11. Implementation review checklist

Before marking any fix complete, answer all applicable questions:

- [ ] Does the test reach the actual built Fortenv implementation rather than a copied algorithm?
- [ ] Is the attack installed before the relevant operation and independently proven active?
- [ ] Does the evidence demonstrate the claimed outcome rather than only a timeout, crash, missing value, or key-name disclosure?
- [ ] Are trusted references captured eagerly before the attacking dependency runs, across the actual module graph?
- [ ] Do captured methods avoid later mutable `.call`/`.apply`/`.bind`, constructors, accessors, and iterator `next` lookups?
- [ ] If using a captured collection constructor with an iterable, have its iterable protocol and prototype method lookups also been considered? Capturing a constructor alone does not prove its entire construction path is safe.
- [ ] Are private store/registry receivers kept away from hooks even if the hook cannot immediately read a value?
- [ ] Do frozen injection objects remain fresh, null-prototype, and limited to the exact wrapper's configured keys, including missing values and unusual valid names such as `__proto__`, `constructor`, and `toString`?
- [ ] Do grant arrays/config mutations after registration fail to change the installed grants? Reuse or extend existing copy-isolation coverage.
- [ ] Do nested and async wrappers retain independent grants, without treating return or Promise settlement as revoking already delivered strings?
- [ ] Do normal environment access and ordinary application monkey patches still work outside Fortenv's private operations?
- [ ] Is the environment still protected after startup failure, without relying on a timer or promise to finish registration later?
- [ ] Are the docs/evidence clear about current-host coverage, untested platforms, and anything outside the security contract?

At each batch boundary, report: SEC IDs attempted, exact red/green commands and outcomes, production files changed, remaining findings, and the next action. Report a batch as complete only when its assigned IDs have evidence-backed dispositions and its applicable checks pass. An explicitly documented external blocker remains outstanding rather than being counted as completed work.
