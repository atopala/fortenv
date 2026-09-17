# 14.05 — defineConfig telemetry flags

The agreed options are `telemetry.enumeration` and `telemetry.stderrFallback`. Both are optional booleans and default to false when omitted. An omitted or empty `telemetry` object is valid. This group checks acceptance of either flag and all explicit boolean combinations, returning the original configuration object, and rejection of non-boolean flags or a non-object telemetry value.

Validation is tested through the public helper. Invalid JavaScript values are passed through Reflect.apply to bypass TypeScript intentionally. The tests require a telemetry-specific diagnostic, so the current rejection of every extra root property cannot accidentally satisfy them.

`config.test.ts` contains all direct `defineConfig` flag validation cases in this folder.

Each invalid flag/value pair is its own parameterized test, so one failure does not prevent the remaining inputs from being exercised and each case can be selected in the IDE.

Actual omitted/default behavior is verified in groups 06 and 07. The options must be discovered and applied before real config dependencies load; these tests do not prescribe an internal representation or initialize telemetry merely by calling defineConfig.
