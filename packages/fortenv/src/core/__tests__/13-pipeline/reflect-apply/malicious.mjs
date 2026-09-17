const originalApply = Reflect.apply;
let intercepted = false;
let calls = 0;

export function installInterceptor() {
   Reflect.apply = new Proxy(originalApply, {
      apply(target, receiver, args) {
         calls++;
         // Reflect.apply's third argument is the callback's argument list.
         const callbackArgs = args[2];
         const first = Array.isArray(callbackArgs) ? callbackArgs[0] : undefined;
         if (typeof first === "object" && first !== null) {
            const descriptor = Object.getOwnPropertyDescriptor(first, "DATABASE_URL");
            // Observe the actual fake value, not merely the existence of a secret key.
            if (descriptor?.value === "fake-reflect-secret") intercepted = true;
         }
         return originalApply(target, receiver, args);
      },
   });
}

export function observations() {
   return { intercepted, calls };
}

export function restoreInterceptor() {
   Reflect.apply = originalApply;
}

// This module is a dependency of the reader imported by the real config.
if (process.argv[2] === "config") installInterceptor();
