/** Capture every available frame without changing the application's stack limit. */
function captureStack(error: Error, constructor: Function): void {
   const limit = Error.stackTraceLimit;
   try {
      Error.stackTraceLimit = Infinity;
      Error.captureStackTrace(error, constructor);
   } finally {
      Error.stackTraceLimit = limit;
   }
}

export class FortenvAccessError extends Error {
   override readonly name = "FortenvAccessError";
   readonly code = "FORTENV_ACCESS_DENIED";
   readonly operation = "get";

   constructor(readonly secret: string) {
      super(`Fortenv: unauthorized access to secret ${JSON.stringify(secret)}.`);
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
