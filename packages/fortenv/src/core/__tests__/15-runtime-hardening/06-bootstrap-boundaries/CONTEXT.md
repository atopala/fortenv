# 15.06 — Bootstrap boundaries

These fixtures attack the transition between phase-1 discovery and phase-2 real registration, and the bootstrap state machine, rather than a replaced built-in. Discovery evaluates a synthetic copy of the config with imports mocked to inert namespaces; phase-2 imports the real config. The concern is whether that gap lets an undiscovered secret escape protection, or a callback run before Fortenv is ready.

Every scenario runs in a fresh subprocess with fake values and asserts no secret value reaches stdout or stderr.

## config-toctou (SEC-20)

The config declares only `DATABASE_URL` during discovery (where the imported `side-effect.mjs` is mocked and inert) but additionally declares `SECRET_TWO` during the real import (where the side effect runs and sets a `globalThis` marker). This is a non-deterministic (time-of-check/time-of-use) config.

Disposition: not reproduced (fail-closed). `matchingNames` detects that the real secret names differ from the discovered set and throws the deterministic-names error; the process exits non-zero before the application runs, and no value is leaked.

Residual limitation (documented, not a bug): the real-only `SECRET_TWO` was never part of the discovered set, so it was never scrubbed from `process.env`. If an application swallowed the bootstrap rejection instead of letting it fail the process, `SECRET_TWO` would remain ambiently readable. Per the design, a discovery/real mismatch check cannot undo the fact that a key discovery never saw was never protected. Secret names must be deterministic and independent of imported values.

## early-invocation (SEC-11)

A config-graph module invokes its wrapped function while Fortenv is still loading — synchronously during config evaluation and from a microtask that runs in the same loading window — and tries to obtain the secret before grants are installed.

Disposition: held (not reproduced). Every pre-ready invocation is denied with "wrapped functions cannot run while configuration is loading"; none receives the secret. Normal post-ready calls work and ambient reads stay denied. There is no deferred-invocation queue: a call is either denied (before ready) or served (after ready), never replayed with secrets once ready.
