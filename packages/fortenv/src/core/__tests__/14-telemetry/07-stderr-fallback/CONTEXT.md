# 14.07 — Stderr fallback without duplicate Fortenv output

`telemetry.stderrFallback` defaults to false. With no observer and a caught denial, an omitted or false flag produces no stderr output. With the flag enabled and no observer, Fortenv must write one JSON security record, including error information and stack, before throwing. With an observer connected, Fortenv publishes to it and produces no additional fallback record.

Caught and uncaught reads are separate real fixtures reused from group 04. For uncaught errors, Node's normal exception output still appears and startup fails. Enabling fallback can therefore produce a JSON audit record plus Node's exception output; the test does not promise cross-layer deduplication or alter Node's global error handlers.

`fallback.test.ts` selects `disabled-caught.config.mjs`, `disabled-uncaught.config.mjs`, `enabled-caught.config.mjs`, and `enabled-uncaught.config.mjs`; those configs reuse the group 04 readers and application.

All twelve combinations of omitted/disabled/enabled policy, caught/uncaught denial, and observer present/absent are exercised and pass. For caught denials with fallback enabled, stderr must contain exactly one JSON line; extra plain-text logging also fails. For uncaught denials, the test parses JSON lines separately from Node's plain exception text. Neither stream may expose the secret.
