# @fortenv/opentelemetry

Forward Fortenv security events to an existing OpenTelemetry logger.

```sh
pnpm add fortenv @fortenv/opentelemetry @opentelemetry/api-logs
```

```ts
import { connectFortenv } from "@fortenv/opentelemetry";
import { logs } from "@opentelemetry/api-logs";

// Register your application-owned LoggerProvider before connecting.
const logger = logs.getLogger("application-security");
const disconnect = connectFortenv(logger);

// Later: stop forwarding to this logger.
disconnect();
```

`connectFortenv(logger): () => void` accepts the official OpenTelemetry `Logger` type and returns an idempotent disconnect function. It does not bootstrap Fortenv; start your application with `node --import fortenv/register` and its configured grants.

Denied reads forward the captured error stack and secret name, never the secret value. Enumeration warnings are forwarded only when enabled in `defineConfig`. Successful injection is silent. Forwarding happens synchronously in the caller's context. Observer failures and recursion are contained by the core subscription API.

Records use ERROR/WARN severity, epoch timestamps, `exception.*` and `fortenv.*` attributes. The caller's active context supplies trace/span correlation. Without a configured provider the OpenTelemetry API can be a no-op; connecting still counts as an observer and suppresses Fortenv's optional stderr fallback.

The application owns logger configuration, flush, shutdown and any provider, transport or exporter. The adapter creates none of those resources. Fortenv and @opentelemetry/api-logs are peer dependencies. Core `fortenv/telemetry` remains dependency-free and supports other loggers through `subscribeSecurityEvents`.

Node.js 22.23.2 or later. Apache-2.0.
