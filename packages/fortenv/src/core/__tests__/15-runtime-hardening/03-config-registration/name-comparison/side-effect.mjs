// Side effect runs only during the real config import (mocked/inert during
// discovery), so the config can declare a different secret set per phase.
/** @type {Record<string, unknown>} */ (globalThis).__fortenvRealImport = true;

export const marker = true;
