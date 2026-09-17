# 14.02 — Denial events from the actual guard

Subscribes to Node's `fortenv.security` diagnostics channel, then invokes the existing production environment proxy. It does not publish substitute events or mock the guard.

Tests require an event before the denied read throws, the same Error in the event and catch block, a bounded event timestamp, and no secret values. A caller catching the exception must not prevent notification. Configured-but-absent secrets still produce denial events. Ordinary environment reads do not produce denial events. Successful injection (including absent values) is checked for silence in group 13 and the separate consumer tests.

AsyncLocalStorage tags two requests and checks observers run in the corresponding current context. This is the context-preservation boundary needed by telemetry adapters; it is not a real OpenTelemetry SDK integration test.

`events.test.ts` contains this folder's diagnostics-channel contract suite.

Each observer is unsubscribed after its test. All four tests pass, including the negative control for successful reads.
