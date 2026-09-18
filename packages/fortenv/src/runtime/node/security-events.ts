import { AsyncLocalStorage } from "node:async_hooks";
import { channel } from "node:diagnostics_channel";
import { writeSync } from "node:fs";

import { stringifyJson } from "../../core/intrinsics.js";
import type { FortenvAccessError, FortenvEnumerationError } from "../../core/security-errors.js";

export type SecurityEvent = Readonly<
   {
      version: 1;
      timestamp: number;
   } & (
      | {
           name: "fortenv.access.denied";
           severity: "error";
           operation: "get";
           secret: string;
           error: FortenvAccessError;
        }
      | {
           name: "fortenv.env.enumerated";
           severity: "warn";
           operation: "ownKeys";
           error: FortenvEnumerationError;
        }
   )
>;

const security = channel("fortenv.security");
// Work spawned by an observer also keeps this marker, without replacing caller context.
const reporting = new AsyncLocalStorage<boolean>();

/** Reporting is synchronous; nested observer reads are still denied but not reported again. */
export function reportSecurityEvent(event: SecurityEvent, stderrFallback: boolean): void {
   if (reporting.getStore()) return;
   reporting.run(true, () => {
      if (security.hasSubscribers) {
         security.publish(event);
      } else if (stderrFallback && event.name === "fortenv.access.denied") {
         try {
            // Write before throwing, even during fatal startup; never enumerate process.env.
            const error = event.error;
            writeSync(
               2,
               stringifyJson({
                  ...event,
                  error: {
                     name: error.name,
                     code: error.code,
                     message: error.message,
                     operation: error.operation,
                     secret: error.secret,
                     stack: error.stack,
                  },
               }) + "\n",
            );
         } catch {
            // An unavailable stderr must not replace the authorization error.
         }
      }
   });
}

/** Managed sinks cannot throw into diagnostics_channel or leave rejected promises unhandled. */
export function subscribeSecurityEvents(listener: (event: SecurityEvent) => unknown): () => void {
   const subscriber = (message: unknown): void => {
      reporting.run(true, () => {
         try {
            const result = listener(message as SecurityEvent);
            if (result !== undefined) void Promise.resolve(result).catch(() => {});
         } catch {
            // No recursive reporting of telemetry failures.
         }
      });
   };
   security.subscribe(subscriber);
   let connected = true;
   return () => {
      if (!connected) return;
      connected = false;
      security.unsubscribe(subscriber);
   };
}
