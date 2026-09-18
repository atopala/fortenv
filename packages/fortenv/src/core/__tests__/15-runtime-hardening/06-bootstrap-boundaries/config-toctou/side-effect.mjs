// This module's side effect runs only during the REAL config import. During
// phase-1 discovery, Fortenv rewrites imports to inert mocks, so this assignment
// never executes and the marker stays unset there.
/** @type {Record<string, unknown>} */ (globalThis).__fortenvRealImport = true;

export const marker = true;
