import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';
import {} from '../13-pipeline/phase-1-discover/application.mjs';

// An import with no bindings is also mocked; its dependency must not execute.
export default defineConfig({ secrets: { DATABASE_URL: [createDb] } });
