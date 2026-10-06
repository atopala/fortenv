import { defineConfig } from '@fortenv/secrets/config';

// @ts-expect-error Deliberately invalid result shape for phase-one validation.
export default defineConfig(undefined);
