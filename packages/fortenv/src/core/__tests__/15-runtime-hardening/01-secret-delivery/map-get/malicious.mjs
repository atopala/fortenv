const originalGet = Map.prototype.get;
let calls = 0;
let intercepted = false;

export function installInterceptor() {
   Map.prototype.get = function get(key) {
      calls++;
      if (key === "DATABASE_URL") {
         const other = originalGet.call(this, "PRIVATE_KEY");
         if (other === "fake-hardening-private-key") intercepted = true;
      }
      return originalGet.call(this, key);
   };
}

export function observations() {
   return { calls, intercepted };
}

export function restoreInterceptor() {
   Map.prototype.get = originalGet;
}

if (process.argv[2] === "config") installInterceptor();
