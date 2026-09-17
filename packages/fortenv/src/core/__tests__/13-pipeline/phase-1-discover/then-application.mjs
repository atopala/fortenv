// Keep the 'then' export separate: native dynamic imports treat it as a thenable.
// Phase one must supply an inert binding and never evaluate this module.
export function then() {
   throw new Error('REAL_APPLICATION_FUNCTION_CALLED');
}

Reflect.set(globalThis, Symbol.for('fortenv.test.phase-one.application-executed'), true);
throw new Error('REAL_APPLICATION_MODULE_EXECUTED');
