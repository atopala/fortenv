import { defineConfig } from '@fortenv/core/config';

// @ts-expect-error Deliberately missing the required secrets object.
export default defineConfig({});
