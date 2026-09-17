# Fortenv adversarial security investigation and hardening plan

Status: implementation in progress. SEC-01 through SEC-04 have passing regression coverage and fixes recorded in the runtime-hardening test context. SEC-05 onward remain investigation work. This document does not change the [design contract](design.md). Sections 6–11 give the executing agent concrete attack investigations, evidence requirements, work order, a resume prompt, and an initial fixture specification.

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
```

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

All unchecked items are pending. “Confirmed earlier” means reproduced in the preceding investigation, not newly verified by this document. “Hypothesis” means the agent must investigate before claiming a vulnerability or implementing a fix. Priorities describe work order, not a formal severity score.

Use these timing labels in evidence:

- **T0:** before Fortenv captures trusted references. A startup prerequisite/limitation control, not an in-scope hardening success requirement.
- **T1:** during real config dependency evaluation, after environment shielding but before grants are installed.
- **T2:** after bootstrap, before an authorized or unauthorized wrapper call.
- **T3:** during a callback, observer, or asynchronous continuation, including nested calls.

Test each operation at the timings where production actually uses it. Do not multiply every case across every timing without a reason.

### Priority 0 — Private values and forged grants

| ID / status                    | Attack experiment                                                                                                                                                                                                                                                                                      | Secure result and possible fix                                                                                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ ] SEC-01 — confirmed earlier | Replace `Object.freeze` at T1/T2 with a forwarding hook inspecting own data properties. Invoke the legitimate wrapper.                                                                                                                                                                                 | No injection object reaches the hook; callback still succeeds. Explore capturing the original freeze operation before dependencies load.                                                                                                                                           |
| [ ] SEC-02 — confirmed earlier | Replace `Object.create` at T1/T2; delegate creation but return a proxy recording assignments to the injected key.                                                                                                                                                                                      | No secret assignment reaches the replacement. Explore trusted object creation or an equivalent null-prototype construction preserving the documented shape.                                                                                                                        |
| [ ] SEC-03 — confirmed earlier | Replace `Map.prototype.get`; when Fortenv requests `DATABASE_URL`, use the saved original method on the hook receiver to attempt reading ungranted `PRIVATE_KEY`.                                                                                                                                      | Neither secret nor the backing map reaches the hook. Explore captured collection methods invoked through trusted application machinery.                                                                                                                                            |
| [ ] SEC-04 — confirmed earlier | Replace `WeakMap.prototype.get` with a forged set containing `PRIVATE_KEY`; invoke an unregistered wrapper.                                                                                                                                                                                            | Wrapper receives an empty injection object. Explore captured lookup and construction operations; do not merely validate the forged set after exposing the registry.                                                                                                                |
| [ ] SEC-05 — hypothesis        | Patch `WeakSet.has/add`, `WeakMap.set/get`, and `Set.add/has` individually at T1. Attempt registering a plain function or redirecting a legitimate grant to an unregistered wrapper.                                                                                                                   | Invalid identities remain rejected; legitimate grants attach only to configured wrappers. Explore trusted registry methods and atomic installation after complete validation.                                                                                                      |
| [ ] SEC-06 — hypothesis        | Patch `Map`/`Set` iteration methods, methods keyed by `Symbol.iterator`, and iterator-prototype `next` individually at T1/T2. Attempt capturing receivers or yielding an extra secret name.                                                                                                            | No private collection escapes and grants do not expand. Explore captured iterator creation plus captured `next`, or private indexed data with explicitly safe traversal. Capturing only the iterator factory is insufficient if `next` stays mutable.                              |
| [ ] SEC-07 — hypothesis        | Replace global `Map`, `Set`, `WeakMap`, `WeakSet`, and `Proxy` constructors individually at T1/T2. Forward ordinary construction while recording objects or altering returned objects.                                                                                                                 | Later registration, wrapper creation, and failure cleanup cannot expose state or forge authorization. Explore captured constructors. Check the constructors' subsequent method/iteration use too.                                                                                  |
| [ ] SEC-08 — hypothesis        | Patch array iteration and install carefully scoped inherited accessors on objects used for argument/descriptor construction. Probe nested wrapper calls and special valid secret names. Retain the existing Reflect.apply regression and probe `.call`/`.apply`/`.bind` routes used by any new helper. | No populated secret object or private store crosses an attacker-controlled hook. Preserve ordinary business argument semantics; attacker-owned caller arguments are not themselves private Fortenv data. Explore null-prototype internal records and trusted invocation/traversal. |

Implement SEC-01–04 first after a valid red run. Investigate SEC-05–08 before declaring the shared built-ins problem resolved. After individual fixes, add a representative combined attack so two patched operations cannot cooperate to defeat a fix that passes in isolation.

### Priority 1 — Bootstrap, environment, and diagnostics

| ID / status             | Attack experiment                                                                                                                                                                                                                                              | Secure result and possible fix                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ ] SEC-09 — hypothesis | At T1 patch reflection, descriptor access, array validation, map membership, or name-comparison operations used by `configuration.ts` and `bootstrap.ts`. Attempt admitting an invalid target or mismatched secret set through the real validation path.       | Actual validation is enforced and bootstrap does not become ready on failure. Explore trusted validation operations. Trusted config becoming nondeterministic is a separate limitation: a mismatch check cannot undo a read of a key discovery never protected.                                                                                       |
| [ ] SEC-10 — hypothesis | At T2 patch `Set.has`, reflection methods, array filtering, and string normalization used by the environment guard. Probe direct reads, `in`, descriptors, all enumeration forms, writes, deletion, and replacement. Include Windows case variants on Windows. | Protected names remain hidden and protected operations retain their contract. Distinguish retrieving a captured value from returning `undefined`, revealing a name, or exposing the sanitized original target. Explore trusted guard operations; report each outcome accurately.                                                                      |
| [ ] SEC-11 — hypothesis | At T1 schedule wrapper calls via microtasks and timers; force real config rejection after some wrapper definitions; retry bootstrap via supported imports and invoke any retained wrapper.                                                                     | No callback executes before readiness; failed initialization never installs partial grants or reopens the environment. Explore state-transition and cleanup fixes only after a valid reproducer. No deferred invocation queue.                                                                                                                        |
| [ ] SEC-12 — hypothesis | Patch `Error.captureStackTrace`, stack formatting, timestamp/serialization functions, and the reporting methods actually used. Trigger a denied read with reporting on/off and with a connected observer.                                                      | Separate secret disclosure, replacement of the documented error, suppressed diagnostics, and process termination. No reporting path gains access to private values. Explore trusted operations and narrowly scoped failure containment; any change to stack formatting or error semantics needs contract review.                                      |
| [ ] SEC-13 — hypothesis | Use managed observers that throw, reject, return hostile thenables, mutate the event/error, or attempt nested synchronous/asynchronous reads. Observe a second subscriber and stderr fallback behavior. Probe raw diagnostics-channel publication separately.  | Reads stay denied, recursion stays bounded under the agreed contract, and events contain no captured values. Determine whether event integrity between subscribers needs a new contract before freezing/copying events. Shared diagnostics channels are not authenticated security records. Do not promise unforgeable events or guaranteed delivery. |

For SEC-09, write the simplest malformed-config stage test as well as the real-preload attack if needed to localize the failure. For SEC-12/13, existing §67 behavior remains authoritative: managed observers are contained; raw subscribers retain Node's exception behavior. A malicious dependency can terminate or hang its process, so denial of service alone is not proof of secret theft.

Audit imported Node functions as well as global objects: an ESM import binding is not automatically a private immutable function snapshot. Where the code relies on a Node built-in export, investigate whether CommonJS export mutation followed by `syncBuiltinESMExports()` changes the function Fortenv calls. Keep this scoped to functions actually used, and distinguish tampering of an already-created instance's methods from replacement of its constructor.

### Priority 2 — Broader boundary checks and documented limits

| ID / status                        | Attack experiment                                                                                                                                                                                                                                                                                                       | Secure result and possible fix                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ ] SEC-14 — hypothesis            | Enumerate public exports; attempt package subpath and resolvable direct-file imports; load a second runtime copy where feasible. Inspect exported helpers and exposed objects for a path to the live store or grant installation.                                                                                       | No import exposes live private state or a registration backdoor. Export maps alone are not a security boundary against arbitrary filesystem paths. Standalone helpers operating on caller-supplied data are not a bypass. Explore removing live-state access if found; retain the existing duplicate-guard rejection. |
| [ ] SEC-15 — hypothesis            | Extend discovery fixtures with syntax variations around comments, strings, template literals, import attributes, re-exports, and dynamic import expressions supported or rejected by the current design. Use an imported module with an execution marker, then native Node execution as the supported-syntax reference. | Discovery does not execute application imports; unsupported constructs fail as documented rather than silently omitting required protection. This is a bounded transformer correctness investigation, not a hostile-config sandbox project. Parser expansion or new supported syntax needs approval.                  |
| [ ] SEC-16 — boundary verification | Probe retained original environment references, ESM/CommonJS process imports, ordinary child inheritance, and separately initialized workers using explicit fake secrets.                                                                                                                                               | Sanitized references and normal child environments do not reveal captured values. Workers have separate setup; do not add automatic secret/grant propagation. Reuse existing guard/consumer tests before adding new fixtures.                                                                                         |
| [ ] SEC-17 — limitation control    | Document T0 tampering, Linux initial environment retention, explicit credential handoff, and calls to accessible wrappers. Optional isolated demonstrations use only fake values and never log their content.                                                                                                           | Clearly label these as prerequisites or design limitations, not tests that should turn green after built-in capture. Process isolation or a launcher is separate future design work, not an automatic addition to this implementation.                                                                                |

Do not introduce inspector/native-addon probes, network exfiltration, or new infrastructure merely to demonstrate the already documented absence of same-process isolation. If future work needs to strengthen that boundary, propose a separate design and test scope.

## 7. Evidence and reproducibility protocol

Before each attack, read its nearest context and the complete production functions involved. Search existing fixtures so the test extends the real pipeline rather than recreating it. Prefer one replaceable operation per initial reproducer.

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

1. **Baseline:** read AGENTS/context/design, inspect current worktree, verify toolchain, build, run existing tests, and record pre-existing failures. Do not assume the prior session's results still apply.
2. **First red batch:** implement SEC-01–04 permanent regressions, verify the specific exploit observations, and retain the existing Reflect.apply tests. Produce a brief evidence summary before production changes. Stop here only if the user requests red-test review.
3. **First fix batch:** implement the smallest trusted-operation support that closes SEC-01–04; verify focused green and relevant compatibility. Avoid introducing unused wrappers for every JavaScript built-in.
4. **Identity and iteration batch:** investigate SEC-05–08, adding red tests and minimal fixes for confirmed findings. Add a combined attack after the individual regressions pass.
5. **Bootstrap and environment batch:** investigate SEC-09–11 and preserve existing stage tests and startup restrictions.
6. **Diagnostics batch:** investigate SEC-12–13; separate security enforcement from diagnostic integrity/availability. Bring new event immutability or reporting guarantees back for review before changing behavior.
7. **Boundary batch:** investigate SEC-14–16, document SEC-17, and run representative ESM/CommonJS consumer attacks against built output.
8. **Closeout:** run required checks, update evidence/context and approved design claims, and report fixed findings, unresolved hypotheses, platform gaps, and residual limits separately.

After each batch, update the evidence record with the next exact test or SEC ID. Do not commit, branch, push, add dependencies, broaden platform promises, freeze host globals, or implement a launcher without corresponding authorization.

Stop and ask a narrow question when a fix changes the public API or design contract, requires new dependencies, or conflicts with existing documented behavior. Routine internal implementation choices within approved scope do not need repeated permission. If repeated fixes fail, return to the reproducer and explain the unresolved cause rather than layering speculative patches.

## 9. Copyable implementation handoff

Use this prompt after switching models and deciding to start implementation:

> Implement the Fortenv security investigation and hardening plan in `packages/fortenv/docs/security-hardening-plan.md`. Read `AGENTS.md`, root and relevant `CONTEXT.md` files, and `packages/fortenv/docs/design.md` first. Follow the execution batches in section 8. The four findings SEC-01–04 were previously reproduced but need permanent red regressions before fixes; SEC-05–16 remain hypotheses or boundary checks. Preserve the existing Reflect.apply regression. Use real adjacent fixtures and isolated Node subprocesses with fake secrets, named describe suites, and built public exports. Keep a per-finding evidence record using section 7. Confirm the expected red failure before each production fix, then rebuild and demonstrate green. Preserve zero dependencies and the current public contract. Do not rewrite the design to justify an implementation shortcut. Ask before introducing a new behavioral contract; report limits honestly. Finish with the required checks and a concise summary of fixed, unresolved, and untested findings. If this takes multiple sessions, leave the exact next SEC ID and command in the evidence record.

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
