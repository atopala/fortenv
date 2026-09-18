# 15.11 — Tamper response (exploratory)

These fixtures are **exploratory**: they validate assumptions about how the current library behaves when ordinary dependency code tries to replace, redefine, delete, or bypass the installed `process.env` guard after bootstrap. They do not assert an agreed tamper-response contract — the SEC-23/SEC-24 enforcement behavior is still pending design review. The only hard assertions are the confidentiality invariants already committed to: no secret value leaks, and a protected read stays denied after every attempt. Per-attempt outcomes are printed for human review.

## guard-integrity (SEC-24, exploratory)

Attempts, all ordinary post-bootstrap JavaScript, and the observed outcome against the current build:

| Attempt                                               | Observed outcome        | Denial held after |
| ----------------------------------------------------- | ----------------------- | ----------------- |
| `process.env = {…}`                                   | `TypeError`             | yes               |
| `Object.defineProperty(process, "env", {…})`          | `TypeError`             | yes               |
| `delete process.env` (`Reflect.deleteProperty`)       | returns `false` (no-op) | yes               |
| read a protected key through the descriptor's `value` | `FortenvAccessError`    | yes               |
| `process.env.DATABASE_URL = x`                        | `TypeError`             | yes               |
| `Reflect.defineProperty(process, "env", {…})`         | returns `false` (no-op) | yes               |

Finding: the guard is robust against every ordinary-JS route. It is installed with `writable: false, configurable: false`, so the binding cannot be reassigned, redefined, or deleted; the descriptor's `value` is the enforcing guard Proxy itself, so reaching it grants no bypass; and protected mutations throw. **SEC-24 is guaranteed by construction — no new enforcement code is required.** This mirrors the SEC-18 result: a verified property, not a fix.

## SEC-23 note (intrinsic tamper-detection)

No separate SEC-23 detection fixture is built. Detection by comparing Fortenv's captured intrinsics against a "pristine" reference is inherently weak: if a dependency replaced a built-in **before** Fortenv loaded (T0), Fortenv captured the already-poisoned function, and any in-process comparison would compare a poisoned reference against itself. T0 tampering is a documented architectural limitation, not something detectable from inside the process. The after-load (T1/T2) built-in-replacement window is already covered by the SEC-01–13 captured-intrinsic regressions.
