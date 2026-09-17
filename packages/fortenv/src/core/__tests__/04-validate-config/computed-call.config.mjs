import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';

/** @returns {string} */
function getSecretName() {
   return 'DATABASE_URL';
}

// The config may execute its own function to construct a valid name.
export default defineConfig({ secrets: { [getSecretName()]: [createDb] } });
