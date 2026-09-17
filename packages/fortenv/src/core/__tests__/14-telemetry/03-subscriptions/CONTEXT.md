# 14.03 — Generic subscriptions and observer safety

[subscriptions.test.ts](subscriptions.test.ts) checks the built `fortenv/telemetry` subscription API: event identity and idempotent unsubscribe. [contract.ts](contract.ts) provides synthetic public events for these tests and public event typing for the bootstrap observer.

[safety.test.ts](safety.test.ts) runs [sink-failure.mjs](sink-failure.mjs) in fresh Node processes. Throwing callbacks, rejected promises, synchronous and asynchronous recursive reads, and observer enumeration cannot change authorization, recursively report, crash the process or suppress independent observers. Assertions on nested errors run outside the managed callback so Fortenv cannot swallow a failed assertion. A second independent access must report again.

Logger-specific record mappings and failures belong in [consumer adapter tests](../../../../../../../tests/telemetry-integration/04-adapters/CONTEXT.md). The core package has no logger dependencies. Direct raw diagnostics-channel subscribers remain governed by Node's exception behavior.
