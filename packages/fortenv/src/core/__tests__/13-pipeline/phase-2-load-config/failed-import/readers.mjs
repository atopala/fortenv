import assert from "node:assert/strict";

import { fortenv } from "fortenv";

export const read = fortenv(({ DATABASE_URL }) => DATABASE_URL);

// Discovery must not execute this module. The real import must see a protected env.
assert.throws(() => process.env.DATABASE_URL, /unauthorized access.*DATABASE_URL/);
throw new Error("DEPENDENCY_FAILED_AFTER_PROTECTION");
