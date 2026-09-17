# Public source entries

Read [package context](../CONTEXT.md) and [design](../docs/design.md). This directory contains the public entry modules; implementation details live under core and runtime/node.

| File         | Public entry      | Responsibility                                                       |
| ------------ | ----------------- | -------------------------------------------------------------------- |
| index.ts     | fortenv           | Wrapper, SecretValues type and FortenvAccessError                    |
| config.ts    | fortenv/config    | Configuration types and validating defineConfig helper               |
| register.ts  | fortenv/register  | Preload bootstrap                                                    |
| telemetry.ts | fortenv/telemetry | Generic subscription, SecurityEvent type and FortenvEnumerationError |

## Telemetry boundary

`telemetry.ts` is deliberately a small export surface. The subscription implementation and event union live in [runtime/node/security-events.ts](runtime/node/security-events.ts); error classes live in [core/security-errors.ts](core/security-errors.ts). FortenvAccessError belongs to the root entry and must not be re-exported from telemetry.

Core knows no logger-specific interfaces or mappings. [Pino](../../pino/CONTEXT.md) and [OpenTelemetry](../../opentelemetry/CONTEXT.md) adapters consume this public subscription API and return its idempotent unsubscribe. Adding a logger integration must not add dependencies to core.

Read [runtime reporting context](runtime/node/CONTEXT.md) for event ordering, recursion and fallback rules. [Core telemetry tests](core/__tests__/14-telemetry/CONTEXT.md) cover those rules; [consumer tests](../../../tests/telemetry-integration/CONTEXT.md) cover built exports, official logger types and real output.

For discovery and injection work, continue to the [core implementation map](core/CONTEXT.md). Preserve public entry ownership and keep ordinary imports free of bootstrap side effects.
