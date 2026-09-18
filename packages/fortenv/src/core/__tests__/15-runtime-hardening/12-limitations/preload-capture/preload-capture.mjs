// T0 capture: this module runs via --import BEFORE fortenv/register, so it reads
// the secret from the unguarded environment before Fortenv scrubs and protects
// it. This is a documented architectural limitation (design §3/§4/§18): code that
// runs before Fortenv loads sees the raw environment, and a value it has already
// read cannot be revoked. Fortenv is defense-in-depth for code that loads AFTER
// it, not a same-process sandbox and not a guard against pre-load access.
//
// It records only a BOOLEAN of whether the pre-load read matched the fake value —
// never the value itself.
const g = /** @type {Record<string, unknown>} */ (globalThis);
g.__fortenvPreloadReadMatched = process.env.PRIVATE_KEY === "fake-hardening-private-key";
