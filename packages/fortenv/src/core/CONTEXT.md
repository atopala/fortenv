# Core implementation map

Read the [design](../../docs/design.md) alongside the [numbered tests](./__tests__/CONTEXT.md). Stage functions are internal source-module exports for composition and testing. The root `fortenv` entry exports the wrapper, `FortenvAccessError`, and injection types. Config, preload, and telemetry use `fortenv/config`, `fortenv/register`, and `fortenv/telemetry`; the private secret map and installed ACL are not public APIs.

## Current call path

```text
register.ts → runtime.bootstrap() → runtime.initialize()
  beginBootstrap(): phase = loading
  bootstrap.loadConfiguration(protect callback)
    01 config-source.configPath()
    02 config-source.readConfigSource()
    discovery.discoverConfiguration()
      03 typescript.stripConfigTypes()
      05 imports.transformImports()
      06 mock-imports.createMockLoader()
      07 synthetic-execution.executeSyntheticConfig()
         04 defineConfig() validates the constructed value
      08 discovery-result.readDiscoveryResult()
         configuration.readConfiguration()
      configuration.readTelemetryOptions(): copied reporting flags
    09 environment.captureSecrets()
    10 environment.createEnvironmentGuard() + protectEnvironment() installation, with reporting flags
    11 native import(real config)
       configuration.readConfiguration() + bootstrap.matchingNames()
  11 grants.buildGrants() → install ACL → phase = ready
  application entry point can start
  12 fortenv wrapper → injection.injectSecrets(own grants, private values) → callback(secrets, ...args)
```

Steps 09–10 run synchronously in the protection callback before native config imports. Step 12 is runtime behavior, not another bootstrap pass. A failure during initialization sets phase to `failed` and clears grants; captured values stay inaccessible through the protected environment.

`discoverSecrets()` remains an internal convenience entry for name-focused tests; it delegates to `discoverConfiguration()`. Discovery supplies both the names and telemetry flags to protection before real imports execute. Flags are validated through defineConfig, copied, and installed per guard; calling defineConfig later does not change the installed guard.

Denied reads construct `FortenvAccessError`, publish synchronously on `fortenv.security`, then throw the same error. Enabled enumeration constructs a diagnostic error with a caller stack and publishes a warning while still hiding protected names. `runtime/node/security-events.ts` owns diagnostics-channel publication, optional synchronous stderr fallback, and an independent AsyncLocalStorage marker to prevent reporting recursion, including observer-spawned async work. `telemetry.ts` exposes generic subscriptions and event types; it has no logger-specific code or third-party dependencies. The separate `@fortenv/pino` and `@fortenv/opentelemetry` packages forward those events to caller-owned loggers. Error stacks are diagnostic only and never decide authorization.

## Files in this directory

| Files                                                     | Responsibility                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `config-source.ts`, `typescript.ts`                       | Locate/read supported config files and strip native TypeScript syntax.                      |
| `imports.ts`, `mock-imports.ts`, `synthetic-execution.ts` | Rewrite static imports, supply inert discovery namespaces, and evaluate the discovery copy. |
| `configuration.ts`, `discovery-result.ts`, `discovery.ts` | Validate constructed values, extract protected names/options, and compose discovery.        |
| `bootstrap.ts`, `grants.ts`                               | Load the protected real config, compare names, and construct the exact-identity ACL.        |
| `runtime.ts`, `injection.ts`                              | Track bootstrap state/wrappers and create per-call secret objects.                          |
| `security-errors.ts`                                      | Define structured denied-access and enumeration diagnostics.                                |
| `__tests__`                                               | Numbered stage, pipeline, and telemetry tests documented in its own `CONTEXT.md`.           |

## Data at the boundaries

| Stage | Production entry                                                              | Input → output                                                                       |
| ----- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 01    | [configPath](config-source.ts)                                                | cwd/override → canonical config path                                                 |
| 02    | [readConfigSource](config-source.ts)                                          | path → original UTF-8 source                                                         |
| 03    | [stripConfigTypes](typescript.ts)                                             | source/filename → JavaScript source                                                  |
| 04    | [defineConfig](../config.ts)                                                  | validate config shape, secret names and function arrays → return the original config |
| 05    | [transformImports](imports.ts)                                                | JavaScript → mock-loader calls and a captured default export                         |
| 06    | [createMockLoader](mock-imports.ts)                                           | specifier → `{ namespace }`; exported members become inert functions                 |
| 07    | [executeSyntheticConfig](synthetic-execution.ts)                              | transformed body + loader → evaluated unknown result                                 |
| 08    | [readDiscoveryResult](discovery-result.ts)                                    | result + placeholder registry → copied secret-name/placeholder map                   |
| 09    | [captureSecrets](../runtime/node/environment.ts)                              | original env + names → private values; original keys deleted                         |
| 10    | [createEnvironmentGuard / protectEnvironment](../runtime/node/environment.ts) | sanitized env + protected names + telemetry flags → permanently guarded env          |
| 11    | [loadConfiguration / matchingNames](bootstrap.ts), [buildGrants](grants.ts)   | real config → validated exact identities → ACL                                       |
| 12    | [injectSecrets](injection.ts), [fortenv](runtime.ts)                          | allowed names + captured values → frozen injection → callback result                 |

The loader is synchronous, but rewritten imports await its envelope. The envelope prevents a mocked export called `then` from being treated as a promise's `then` method. `fortenv/config` receives the real validating helper, which preserves the config's identity; application exports receive placeholders. Phase-one placeholders are never real ACL identities.

## Boundaries and limitations

- `defineConfig()` validates values, including computed keys and local factories; Node validates JavaScript syntax. The import scanner has documented limitations in design §§34–37.
- Discovery requires placeholder grant references. Phase 2 requires real exact wrapper identities. The configuration must be trusted and deterministic: the later name comparison cannot undo an earlier read of an undiscovered key.
- The VM is not a hostile-code sandbox. Its timeout covers synchronous execution, not infinite asynchronous work.
- Calls require phase `ready`. Config imports factory definitions; the application invokes them after preload. No timer or deferred call queue resolves early invocations.
- Each invocation copies only its wrapper's grants. Nested unregistered wrappers get empty objects. No ambient permission context exists. All direct protected environment reads throw.
- Frozen injected objects retain configured key spellings and own missing-value properties. Delivered strings have normal lifetimes and cannot be revoked.
- AsyncLocalStorage remains only in telemetry recursion suppression, never secret authorization.
- Callback invocation uses a private Reflect.apply reference captured when this runtime module loads, before real config dependencies execute. Later replacements of the shared Reflect.apply cannot intercept the injected argument through this call site. This targeted hardening does not protect against tampering before Fortenv loads or changes to other built-ins.
- `intrinsics.ts` captures the object creation/freezing and Map/WeakMap lookup operations currently used on secret-bearing injection records, the private value map, and the grant registry. Tests in group 15 verify that replacements installed during config loading or after bootstrap cannot intercept those values or forge a runtime lookup. Additional constructor, membership, iteration, guard, and reporting operations remain tracked by the hardening plan rather than implied safe by these focused fixes.

Use the tests to inspect these boundaries. An executable transformer snapshot alone does not prove the entire pipeline.
