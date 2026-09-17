// Tripwire: phase one must replace imports of this module without evaluating it.
export function createDb() {
   throw new Error('REAL_APPLICATION_FUNCTION_CALLED');
}

export function createStripe() {
   throw new Error('REAL_APPLICATION_FUNCTION_CALLED');
}

export { createDb as default, createDb as 'database-reader' };

Reflect.set(globalThis, Symbol.for('fortenv.test.phase-one.application-executed'), true);
throw new Error('REAL_APPLICATION_MODULE_EXECUTED');
