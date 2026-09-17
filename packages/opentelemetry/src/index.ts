import { type Logger, SeverityNumber } from "@opentelemetry/api-logs";
import { subscribeSecurityEvents } from "fortenv/telemetry";

/** Connect a caller-owned logger. Returns an idempotent disconnect. */
export function connectFortenv(logger: Logger): () => void {
   return subscribeSecurityEvents((event) => {
      const attributes: Record<string, string | number> = {
         "fortenv.version": event.version,
         "fortenv.event.name": event.name,
         "fortenv.operation": event.operation,
         "exception.type": event.error.name,
         "exception.message": event.error.message,
      };
      if (event.error.stack !== undefined) attributes["exception.stacktrace"] = event.error.stack;
      if (event.name === "fortenv.access.denied") attributes["fortenv.secret"] = event.secret;
      return logger.emit({
         severityNumber: event.severity === "error" ? SeverityNumber.ERROR : SeverityNumber.WARN,
         severityText: event.severity === "error" ? "ERROR" : "WARN",
         body: event.error.message,
         timestamp: event.timestamp,
         attributes,
      });
   });
}
