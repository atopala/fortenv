# @fortenv/pino

Forward Fortenv security events to an existing Pino logger.

```sh
pnpm add fortenv @fortenv/pino pino
```

```ts
import { connectFortenv } from "@fortenv/pino";
import pino from "pino";

const logger = pino();
const disconnect = connectFortenv(logger);

// Later: stop forwarding to this logger.
disconnect();
```

`connectFortenv(logger): () => void` accepts the official Pino `Logger` type and returns an idempotent disconnect function. It does not bootstrap Fortenv; start your application with `node --import fortenv/register` and its configured grants.

Denied reads forward the captured error stack and secret name, never the secret value. Enumeration warnings are forwarded only when enabled in `defineConfig`. Successful injection is silent. Forwarding happens synchronously in the caller's context. Observer failures and recursion are contained by the core subscription API.

Errors use Pino's `err` field and namespaced `fortenv` metadata, at error/warn level. Root and child loggers are supported.

The application owns logger configuration, flush, shutdown and any provider, transport or exporter. The adapter creates none of those resources. Fortenv and pino are peer dependencies. Core `fortenv/telemetry` remains dependency-free and supports other loggers through `subscribeSecurityEvents`.

Node.js 22.23.2 or later. Apache-2.0.
