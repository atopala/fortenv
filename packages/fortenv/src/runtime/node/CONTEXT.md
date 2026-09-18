# Node environment protection and telemetry

These two modules implement the Node-specific boundary. Read the [source guide](../../CONTEXT.md), [core pipeline map](../../core/CONTEXT.md) and design §§41–47 and 67.

## Files and execution

- `environment.ts` captures configured values, removes them from the original environment, installs the permanent proxy and synchronizes the named node:process env export. Windows key normalization happens here. The proxy knows protected names, not secret values.
- `security-events.ts` defines SecurityEvent, publishes on Node's fortenv.security diagnostics channel, provides managed subscriptions and implements optional stderr fallback.

A protected read creates FortenvAccessError, publishes the event synchronously, then throws that same error. Registered wrappers do not bypass the proxy; their values come from private injection. Successful injection emits nothing.

Protected-name membership uses the Set operation captured before real config dependencies load. A later `Set.prototype.has` replacement cannot turn protected reads into ordinary missing-value reads, admit mutations, or expose an inserted protected name through enumeration.

Enumeration always filters protected keys. With `telemetry.enumeration: true`, ownKeys also reports a warning with a captured stack. It does not throw merely for enumeration. Warning events contain no secret name. Mutations are rejected separately; they do not produce access-denied read events.

## Reporting invariants

- Both enumeration reporting and stderrFallback default to false; discovery supplies the flags before real config imports.
- Denial events contain the key name and error stack, never its value or an environment dump.
- Reporting preserves caller context. AsyncLocalStorage suppresses recursion, including work spawned by observers; it never confers authorization.
- Managed observer throws and Promise rejections are contained. Other observers still receive the event. Nested reads remain denied.
- Enabled fallback writes a denial JSON record synchronously only when no diagnostics-channel subscriber exists. It never writes enumeration warnings. Stderr failures cannot replace the access error.
- Error messages and fallback records use the JSON formatter captured before real config dependencies load. A later `JSON.stringify` replacement cannot substitute its own thrown value for the documented denial error.
- Subscriptions return an idempotent disconnect. Raw diagnostics-channel subscribers retain Node's own exception behavior.
- There is no buffering, replay, rate limit, exporter or logger lifecycle here. Observers see only events after connection.

## Tests

[09-capture-secrets](../../core/__tests__/09-capture-secrets/CONTEXT.md) and [10-guard-environment](../../core/__tests__/10-guard-environment/CONTEXT.md) cover capture/proxy behavior. [14-telemetry](../../core/__tests__/14-telemetry/CONTEXT.md) covers stacks, events, observer safety, startup reporting, options, enumeration and stderr. [Consumer integration](../../../../../tests/telemetry-integration/CONTEXT.md) checks the standalone adapters against built public exports.

Build from the repository root before direct Vitest or IDE runs. Never install the permanent process guard in a shared test worker: use the adjacent subprocess fixtures with explicit fake environments.
