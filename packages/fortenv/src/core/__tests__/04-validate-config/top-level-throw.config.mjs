import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';

// Config execution errors must be reported with their original cause.
(() => {
   throw new Error('CONFIG_EVALUATION_FAILED');
})();

export default defineConfig({ secrets: { DATABASE_URL: [createDb] } });
