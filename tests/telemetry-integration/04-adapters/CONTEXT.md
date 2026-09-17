# 04 — Adapter mappings and safety

`adapters.test.ts` imports built `@fortenv/pino` and `@fortenv/opentelemetry` exports. Synthetic events in `events.ts` use public Fortenv error and event types and are published through Node's diagnostics channel to isolate mapping from environment protection.

Tests preserve exact Error identity, metadata, warning/error severity, timestamps, method receivers and caller context. Pino uses real logger instances with method spies; OpenTelemetry uses a test logger implementing its official API. Real SDK output and trace/span correlation are covered in groups 01 and 02. Disconnecting twice must leave independent observers connected.

`safety.test.ts` runs the adjacent `sink-failure.mjs` under the real preload. Actual Pino and OpenTelemetry SDK logger methods are replaced with throwing sinks. Two separate reads must each throw FortenvAccessError while the independent observer still receives both events. The subprocess must exit successfully with no stderr output. All secrets are fake. Core subscription tests separately cover rejected promises and recursive observers.
