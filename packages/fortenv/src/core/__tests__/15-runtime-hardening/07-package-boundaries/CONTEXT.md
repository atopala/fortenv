# 15.07 — Package boundaries

These fixtures probe boundaries other than replaced globals: mutation of the Node built-in module bindings Fortenv imports, and (later) package-export surfaces. Each runs in a fresh subprocess with fake values and asserts the confidentiality invariant (no secret value leaks).

## util-types-binding (SEC-11a)

`runtime.ts` imports `isGeneratorFunction` from `node:util/types` and uses it in `fortenv()` to reject generator functions. This fixture mutates that CommonJS export and calls `syncBuiltinESMExports()` to force it to return `false`, then tries to wrap a generator and leak a secret through it.

Finding: the tamper reaches the validation layer, but Fortenv now captures `isGeneratorFunction` at module load (in `intrinsics.ts`) before real config dependencies run, so `fortenv()` still rejects the generator (`generatorWasWrapped: false`) despite the mutated import binding — and no secret ever escaped. **There was no confidentiality impact even before this hardening** (an ungranted generator receives an empty injection); capturing the reference additionally preserves the generator-rejection guarantee under binding tampering.

Disposition: fixed. `runtime.ts` imports `isGeneratorFunction` from `intrinsics.js` (the captured reference) instead of directly from `node:util/types`. The regression asserts the generator stays rejected under tampering.
