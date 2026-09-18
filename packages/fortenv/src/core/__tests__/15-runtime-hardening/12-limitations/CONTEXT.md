# 15.12 — Documented limitations (SEC-17)

These are architectural limitations of a same-process library, **not bugs and not fixable in V1**. The fixtures here are limitation controls: they document a boundary with fake values, never print a secret, and assert the documented behavior rather than a "secure" outcome that hardening could turn green. See design §3, §4, §18, §90.

## preload-capture (SEC-17)

A module imported **before** `fortenv/register` (`--import preload.mjs --import fortenv/register`) reads the secret from the unguarded environment. The test documents the T0 boundary:

- `preloadReadMatched: true` — code that runs before Fortenv loads sees the raw value. Expected; this is the limitation.
- `postLoadAmbientReadDenied: true` — after Fortenv loads, the same ambient read is denied. This is the guarantee.

Fortenv is defense-in-depth for code that loads **after** it; it is not a same-process sandbox and cannot guard access that happens before it loads.

## Other SEC-17 limitations (documented, not separately fixtured)

- **Linux `/proc/self/environ`** (design §3): the initial process environment persists in that file; a dependency with filesystem read access can read the secret regardless of `process.env` scrubbing. Only a launcher mode (design §90) that starts the app without the secrets in its initial environment closes this. Not demonstrated with a fixture to avoid platform-specific, secret-adjacent probes.
- **Explicit credential handoff** (design §18): a value an authorized wrapper deliberately passes to a dependency, logs, stores, or returns has left Fortenv's control and cannot be revoked.
- **Accessible authorized wrappers**: any code that can call an authorized wrapper receives that wrapper's injected object; Fortenv authorizes by exact wrapper identity, not by caller.
- **Shared-heap access** (inspector/native addons/heap snapshots): once a secret is a JS string in memory it can be reached by mechanisms outside the environment API. Out of scope for a same-process library; no inspector/native probes are added.

These bound the honest guarantee: Fortenv removes configured secrets from ambient `process.env` access and injects them only into explicitly registered functions, with strong resistance to post-load built-in tampering — but it is not a sandbox and must never claim malicious dependencies cannot access secrets.
