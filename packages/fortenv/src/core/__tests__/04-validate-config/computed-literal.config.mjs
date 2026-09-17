import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';

// This computed property produces an ordinary, valid secret name.
export default defineConfig({ secrets: { ['DATABASE_URL']: [createDb] } });
