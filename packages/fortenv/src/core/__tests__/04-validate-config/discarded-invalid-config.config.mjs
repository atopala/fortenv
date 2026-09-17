import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';

// Every defineConfig call must validate its argument, including a discarded result.
// @ts-expect-error Deliberately invalid grants to test call-time validation.
defineConfig({ secrets: { DATABASE_URL: 42 } });

export default defineConfig({ secrets: { DATABASE_URL: [createDb] } });
