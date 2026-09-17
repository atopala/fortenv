import { subscribeSecurityEvents } from "fortenv/telemetry";
import { type Logger } from "pino";

/** Connect a caller-owned logger. Returns an idempotent disconnect. */
export function connectFortenv(logger: Logger): () => void {
   return subscribeSecurityEvents((event) => {
      const fortenv = {
         version: event.version,
         name: event.name,
         operation: event.operation,
         timestamp: event.timestamp,
         ...(event.name === "fortenv.access.denied" ? { secret: event.secret } : {}),
      };
      return logger[event.severity]({ err: event.error, fortenv }, event.error.message);
   });
}
