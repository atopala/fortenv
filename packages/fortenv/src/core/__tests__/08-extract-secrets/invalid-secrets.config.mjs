import { defineConfig } from '@fortenv/core/config';

// @ts-expect-error Deliberately invalid result shape for phase-one validation.
export default defineConfig({ secrets: null });
