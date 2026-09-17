import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';

function createConfigAtRuntime() {
   return { secrets: { DATABASE_URL: [createDb] } };
}

// A factory is accepted when it returns a valid config using imported references.
export default defineConfig(createConfigAtRuntime());
