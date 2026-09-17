# 14.06 — Enumeration permission and reporting

Each test runs a real Node preload with a config fixture selecting `telemetry.enumeration: true`, `false`, or an omitted telemetry object. Observer-connected cases subscribe through a dependency-free observer before Fortenv starts. The reader scans process.env during config dependency initialization, and the application repeats the scan inside a registered wrapper after startup. Markers surrounding each scan require reports to arrive during that scan; counting two reports alone would not establish bootstrap timing.

`enumeration.test.ts` launches `app.mjs` and `readers.mjs` with `enabled.config.mjs`, `disabled.config.mjs`, or `omitted.config.mjs` for the policy matrix.

Enabled cases cover Object.keys, Object.values, Object.entries, Reflect.ownKeys, object spread, JSON.stringify and for-in. All return only unprotected keys/values, including when the caller has direct-read permission. Each scan emits an observed-enumeration event with `operation: ownKeys`, warning severity, and the scan caller's stack. The event must not claim a particular secret was read or include environment contents.

Disabled and omitted cases cover all seven operations with no enumeration event. Enabled cases also run without an observer. Every case verifies that ordinary keys/values remain available, a registered wrapper receives its injected value, and a direct protected environment read throws. When an observer is connected, the denial emits an access-denied event regardless of the enumeration flag.

The fixtures leave stderr fallback disabled. Stderr must stay empty with or without an observer. All 28 cases pass.
