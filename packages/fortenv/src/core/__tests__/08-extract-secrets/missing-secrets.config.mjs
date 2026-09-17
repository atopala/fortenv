import { defineConfig } from 'fortenv/config';

// @ts-expect-error Deliberately missing the required secrets object.
export default defineConfig({});
