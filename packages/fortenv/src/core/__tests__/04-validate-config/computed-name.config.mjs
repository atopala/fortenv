import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';

const name = 'DATABASE_URL';

// Validate the resulting name, regardless of how it was obtained.
export default defineConfig({ secrets: { [name]: [createDb] } });
