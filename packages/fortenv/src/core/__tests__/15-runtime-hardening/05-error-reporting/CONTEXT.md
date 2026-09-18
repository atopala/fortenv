# 15.05 — Error reporting

These fixtures replace operations used while Fortenv constructs denial errors and diagnostic events at T2. A replacement must not substitute another thrown value for the documented access or mutation error, receive captured secret values, or turn reporting failure into access.

Every scenario uses a fresh subprocess and fake environment values. Hooks have harmless positive controls and are restored before observations are serialized.

The JSON fixture replaces `JSON.stringify` and throws a sentinel when Fortenv formats `DATABASE_URL`. Before the fix, the sentinel replaced both the documented access error and the mutation TypeError. Error construction, validation messages and stderr event serialization now use the formatter captured before real config dependencies load. The replacement remains active for its harmless control and does not receive the protected name through these paths.

The value-leak fixture (SEC-22) is a positive assurance sweep rather than a tampering attack. With `telemetry.enumeration` and `telemetry.stderrFallback` enabled, it triggers a denied read, a protected-mutation rejection, environment enumeration, and a config-validation failure, then asserts that no secret value appears in any error message, `error.stack`, serialized stderr event, or validation string. Secret names are disclosed where documented; values are not. Disposition: assurance passes — every diagnostic path is value-free.

## stack-capture (SEC-12a)

`security-errors.ts` sets `Error.stackTraceLimit` and calls `Error.captureStackTrace` while constructing a `FortenvAccessError`. This fixture replaces both after bootstrap — `captureStackTrace` made to throw, `stackTraceLimit` an accessor — then triggers a denied read.

Finding: **confidentiality holds** — the denied read fails closed and no secret value appears in any error message, stack, or output. The denial error contract is now also preserved: `security-errors.ts` captures `Error.captureStackTrace` at module load and makes stack capture best-effort (wrapped so it never throws), so building a `FortenvAccessError` cannot be broken by a replaced `Error.captureStackTrace`/`Error.stackTraceLimit`. A denied read therefore still throws a proper `FortenvAccessError` (`deniedWithContractError: true`) even under the hostile replacement.

Disposition: fixed. Stack capture is diagnostic-only and failure-tolerant; the denial error type and code are preserved under tampering. Any change to error/stack semantics is governed by design §68.
