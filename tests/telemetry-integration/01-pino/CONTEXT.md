# 01 — Pino output

`pino.test.ts` runs the adjacent `app.mjs` against a real Pino logger and its child logger. A writable stream captures actual JSON output. The fixture checks Error serialization, stable denial fields, caller stacks, error/warning levels, preserved child bindings, and omission of protected values. Its callback assertions run outside Fortenv's managed observer so a failed assertion cannot be swallowed.

Disconnecting twice must stop forwarding and reactivate the configured stderr fallback. The parent requires exactly one fallback line, proving connected denials did not also write stderr.
