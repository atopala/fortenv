const originalHas = Set.prototype.has;
let calls = 0;

export function installInterceptor() {
   Set.prototype.has = function has(value) {
      calls++;
      if (value === "DATABASE_URL" && originalHas.call(this, value)) return false;
      return originalHas.call(this, value);
   };
}

export function observations() {
   return { calls };
}

export function restoreInterceptor() {
   Set.prototype.has = originalHas;
}
