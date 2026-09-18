# 15.08 — Prototype pollution

These fixtures pollute `Object.prototype` and `Array.prototype` during config dependency evaluation (T1), before Fortenv validates the real config and builds grants. Prototype pollution is the most common real-world dependency attack, so the question is whether an inherited property can be read as configuration, injected into a wrapper, or treated as a grant.

Each case runs in a fresh subprocess with fake values, proves the pollution is active through an ordinary inherited property read (positive control), and restores the prototypes before reporting booleans. Parent tests reject either fake value in stdout or stderr.

- `objectData` — `Object.prototype.DATABASE_URL` (data) and `Object.prototype.PRIVATE_KEY` (accessor). Fortenv reads configuration and secret objects through own-property and own-descriptor operations only, so neither inherited property is seen as config or injected. The authorized wrapper still receives only `DATABASE_URL`; the injected object is null-prototype.
- `arrayIndex` — a writable `Array.prototype[0]` data property of `"PRIVATE_KEY"`. The empty `PRIVATE_KEY: []` grant never reads index 0, so it stays empty and the unregistered wrapper receives nothing.

Disposition: not reproduced. Both vectors are safe against the current implementation with no production change.

Scope note: an **accessor** at `Array.prototype[0]` (a getter) crashes Node's own ESM module loader before Fortenv runs, so it is a Node-level denial of service, not a Fortenv-reachable secret leak. Per the hardening plan's evidence protocol, the probe was refined to a data property rather than weakening the security assertion. Denial of service alone is not secret theft, and confidentiality is preserved (the process dies before any grant is installed).
