# 15.02 — Wrapper grants

These fixtures attack the exact-identity authorization registry after bootstrap. An unregistered `fortenv()` wrapper is accessible to the fixture but receives no configured grant. Replacing collection lookups must not create permission for it.

SEC-04 is initially tested at runtime because that is the timing previously reproduced. Config-loading tampering is investigated separately under the broader identity and registration batch.

The SEC-05 WeakMap write fixture installs its replacement during config dependency evaluation. A harmless post-bootstrap WeakMap write proves the replacement remains active, while the secure runtime must install grants through its captured write operation and leave the unregistered wrapper empty. The WeakSet `add` and `has` fixtures similarly prove that raw functions cannot be inserted into or accepted by the wrapper registry.

The SEC-07 WeakMap-constructor fixture replaces the constructor at T1 and attempts to capture the grant registry, then attach an authorized wrapper's grant Set to an unregistered wrapper with the saved native `set` operation. Fortenv creates the registry with the constructor captured before real config dependencies load, so only the harmless positive-control WeakMap reaches the replacement.

## aggressive-siphon (SEC-07/08, active-siphon methodology)

Unlike the observation-style fixtures, this one replaces `Map` and `Proxy` with fully-functional-but-malicious reimplementations: a `Map` subclass that stores real entries while copying every key/value into a private harvest, and a `Proxy` replacement that wraps the caller's handler so it can intercept the wrapper's own `apply` trap. The app keeps working; the attacker actively tries to capture anything secret-shaped.

Disposition: held. The attacker's wrapped handler provably intercepts the wrapper's `apply` trap (`applyTrapArgsSeen > 0`), yet the harvest stays empty. The wrapper trap injects `[secrets, ...args]` through Fortenv's eagerly captured `Reflect.apply` inside the trap, so the attacker's handler only ever sees the caller's ordinary business arguments — never the injected secrets object. This proves the captured-`Reflect.apply` design resists active siphoning, not merely passive observation.
