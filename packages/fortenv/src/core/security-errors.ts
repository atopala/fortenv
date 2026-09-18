import { stringifyJson } from "./intrinsics.js";

// Capture the stack-capture function before real config dependencies load, so a
// later replacement of Error.captureStackTrace cannot make building a Fortenv
// error throw. Stack capture is best-effort and never throws.
const errorCaptureStackTrace = Error.captureStackTrace;

/** Best-effort: capture every available frame without changing the app's stack limit; never throw. */
function captureStack(error: Error, constructor: Function): void {
   try {
      const limit = Error.stackTraceLimit;
      try {
         Error.stackTraceLimit = Infinity;
         errorCaptureStackTrace(error, constructor);
      } finally {
         Error.stackTraceLimit = limit;
      }
   } catch {
      // A tampered Error.captureStackTrace / stackTraceLimit must never prevent a
      // Fortenv error from being constructed and thrown. The stack is diagnostic only.
   }
}

export class FortenvAccessError extends Error {
   override readonly name = "FortenvAccessError";
   readonly code = "FORTENV_ACCESS_DENIED";
   readonly operation = "get";

   constructor(readonly secret: string) {
      super(`Fortenv: unauthorized access to secret ${stringifyJson(secret)}.`);
      captureStack(this, FortenvAccessError);
   }
}

export class FortenvEnumerationError extends Error {
   override readonly name = "FortenvEnumerationError";
   readonly code = "FORTENV_ENV_ENUMERATED";
   readonly operation = "ownKeys";

   constructor() {
      super("Fortenv: process.env enumeration observed.");
      captureStack(this, FortenvEnumerationError);
   }
}

/** Invalid configuration or discovery input: shape, secret names, grants, config file. */
export class FortenvConfigError extends Error {
   override readonly name = "FortenvConfigError";
   readonly code = "FORTENV_CONFIG_INVALID";

   constructor(message: string) {
      super(message);
      captureStack(this, FortenvConfigError);
   }
}

/** Invalid runtime lifecycle state: not initialized, not ready, or initialized twice. */
export class FortenvStateError extends Error {
   override readonly name = "FortenvStateError";
   readonly code = "FORTENV_INVALID_STATE";

   constructor(message: string) {
      super(message);
      captureStack(this, FortenvStateError);
   }
}

/** Invalid caller usage: an unsupported wrapped-function kind or a forbidden operation. */
export class FortenvUsageError extends TypeError {
   override readonly name = "FortenvUsageError";
   readonly code = "FORTENV_INVALID_USAGE";

   constructor(message: string) {
      super(message);
      captureStack(this, FortenvUsageError);
   }
}
