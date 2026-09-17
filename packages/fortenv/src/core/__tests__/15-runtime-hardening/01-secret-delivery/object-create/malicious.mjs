const originalCreate = Object.create;
let calls = 0;
let intercepted = false;

export function installInterceptor() {
   Object.create = new Proxy(originalCreate, {
      apply(target, receiver, args) {
         calls++;
         const created = Reflect.apply(target, receiver, args);
         if (args[0] !== null) return created;
         return new Proxy(created, {
            set(object, key, value, assignmentReceiver) {
               if (value === "fake-hardening-database" || value === "fake-hardening-private-key") {
                  intercepted = true;
               }
               return Reflect.set(object, key, value, assignmentReceiver);
            },
         });
      },
   });
}

export function observations() {
   return { calls, intercepted };
}

export function restoreInterceptor() {
   Object.create = originalCreate;
}

if (process.argv[2] === "config") installInterceptor();
