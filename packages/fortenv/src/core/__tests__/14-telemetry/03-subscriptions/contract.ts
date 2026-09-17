import { FortenvAccessError } from "fortenv";
import { FortenvEnumerationError, type SecurityEvent } from "fortenv/telemetry";

export function deniedEvent(): Extract<SecurityEvent, { name: "fortenv.access.denied" }> {
   return {
      version: 1,
      name: "fortenv.access.denied",
      severity: "error",
      operation: "get",
      secret: "DATABASE_URL",
      timestamp: 1_700_000_000_123,
      error: new FortenvAccessError("DATABASE_URL"),
   };
}
export function enumerationEvent(): Extract<SecurityEvent, { name: "fortenv.env.enumerated" }> {
   return {
      version: 1,
      name: "fortenv.env.enumerated",
      severity: "warn",
      operation: "ownKeys",
      timestamp: 1_700_000_000_123,
      error: new FortenvEnumerationError(),
   };
}
export type { SecurityEvent } from "fortenv/telemetry";
