// Type-only imports must not cause this module to execute either.
export interface ApplicationOptions {
   readonly host: string;
}

export type Reader = () => string;

export function createDb(): string {
   throw new Error('REAL_APPLICATION_FUNCTION_CALLED');
}

Reflect.set(globalThis, Symbol.for('fortenv.test.phase-one.application-executed'), true);
throw new Error('REAL_APPLICATION_MODULE_EXECUTED');
