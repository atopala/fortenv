# 15.10 — Diagnostics abuse

These fixtures attack the security-event/telemetry surface: a dependency subscribes hostile observers to the public `fortenv.security` channel and tries to steal a secret value, make a nested protected read succeed, corrupt other subscribers, or crash the process. Each runs in a fresh subprocess with fake values.

## hostile-observer (SEC-13)

Four subscribers are registered, including hostile ones that throw, return a rejecting thenable, mutate the delivered event, and perform a nested `process.env` read. A denied read then publishes the event.

Disposition: held (not reproduced). The hostile observer obtains no secret value (events carry only the secret name), its nested protected read is still denied, the throwing and rejecting observers are contained (the process exits normally), a well-behaved second subscriber still receives the event with the name only, and protected reads remain denied afterward. `subscribeSecurityEvents` runs each managed observer inside the reporting reentrancy guard with its exceptions swallowed and returned thenables caught, so misbehavior cannot escalate to access or crash.
