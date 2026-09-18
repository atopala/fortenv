// Replace the stack-capture machinery Fortenv uses when building a denial error:
// Error.captureStackTrace (spied + made to throw) and Error.stackTraceLimit
// (accessor that records reads/writes). The probe then triggers a denied read
// and checks the denial contract still holds, no value leaks, process survives.

const originalCaptureStackTrace = Error.captureStackTrace;
const originalLimitDescriptor = Object.getOwnPropertyDescriptor(Error, "stackTraceLimit");
let captureCalls = 0;
let limitWrites = 0;
let installed = false;

export function installInterceptor() {
   Error.captureStackTrace = function captureStackTrace() {
      captureCalls++;
      // Hostile: refuse to capture and throw, to try to break error construction.
      throw new Error("hostile captureStackTrace");
   };
   let backing = 10;
   Object.defineProperty(Error, "stackTraceLimit", {
      configurable: true,
      get() {
         return backing;
      },
      set(value) {
         limitWrites++;
         backing = value;
      },
   });
   installed = true;
}

export function observations() {
   return { installed, captureCalls, limitWrites };
}

export function restoreInterceptor() {
   Error.captureStackTrace = originalCaptureStackTrace;
   if (originalLimitDescriptor) Object.defineProperty(Error, "stackTraceLimit", originalLimitDescriptor);
   installed = false;
}
