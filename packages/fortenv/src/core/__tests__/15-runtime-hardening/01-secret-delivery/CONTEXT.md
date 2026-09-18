# 15.01 — Secret delivery

These fixtures replace one shared JavaScript operation after Fortenv has loaded, either while the real config dependency graph evaluates or after bootstrap. An authorized wrapper must still receive only `DATABASE_URL`; `PRIVATE_KEY` is protected with no grants. Replacement hooks must not observe either value or receive Fortenv's private backing store.

The secure assertion remains constant across the TDD cycle. The vulnerable implementation is expected to produce `intercepted: true` for the confirmed SEC-01, SEC-02, and SEC-03 cases.

The Set iteration and constructor fixtures extend this boundary for SEC-06 and SEC-07. Their replacements remain active through independent harmless controls, while captured construction, population, iterator creation, and iterator advancement keep private grant state away from those replacements. The SEC-08 array-argument fixture covers inherited index setters and replaced array iteration; both routes were already safe and are recorded as not reproduced.

## aggressive-collections (SEC-03/06, active-siphon methodology)

Replaces `Set.prototype[Symbol.iterator]` and `Map.prototype.get` with fully-functional-but-malicious versions that behave correctly while harvesting every value they touch, aimed at the injection path (grant-name Set iteration and private value Map reads). The app keeps working.

Disposition: held. The malicious methods are provably live (a harmless control bumps their counters), but they never run during Fortenv's injection (`ranDuringInjection: false`) and the harvest stays empty. `injectSecrets` routes through the eagerly captured Set iterator / `Map.get` intrinsics, so the secret never touches the replaced mutable prototype methods — there is nothing for the siphon to capture.
