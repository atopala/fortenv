import { defineConfig } from 'fortenv/config';
import type { ApplicationOptions } from '../application-types.ts';
import { createDb, type Reader } from '../application-types.ts';

// Type names must not become runtime imports, grant entries, or secret names.
export default defineConfig({
   secrets: { DATABASE_URL: [createDb as Reader & ((options?: ApplicationOptions) => string)] },
});
