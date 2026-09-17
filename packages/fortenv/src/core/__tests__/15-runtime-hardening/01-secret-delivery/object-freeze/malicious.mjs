const originalFreeze = Object.freeze;
let calls = 0;
let intercepted = false;

export function installInterceptor() {
   Object.freeze = new Proxy(originalFreeze, {
      apply(target, receiver, args) {
         calls++;
         const value = args[0];
         if (typeof value === "object" && value !== null) {
            for (const name of ["DATABASE_URL", "PRIVATE_KEY"]) {
               const descriptor = Object.getOwnPropertyDescriptor(value, name);
               if (
                  descriptor?.value === "fake-hardening-database" ||
                  descriptor?.value === "fake-hardening-private-key"
               ) {
                  intercepted = true;
               }
            }
         }
         return Reflect.apply(target, receiver, args);
      },
   });
}

export function observations() {
   return { calls, intercepted };
}

export function restoreInterceptor() {
   Object.freeze = originalFreeze;
}

if (process.argv[2] === "config") installInterceptor();
