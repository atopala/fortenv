import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';
import '../13-pipeline/phase-1-discover/application.mjs';

// Static side-effect imports must remain mocked during discovery.
export default defineConfig({ secrets: { DATABASE_URL: [createDb] } });
