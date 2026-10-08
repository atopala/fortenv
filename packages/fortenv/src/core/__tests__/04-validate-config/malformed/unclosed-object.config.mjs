// Deliberately invalid JavaScript: the config object is never closed.
import { defineConfig } from '@fortenv/core/config';
import { createDb } from '../../13-pipeline/phase-1-discover/application.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [createDb] });
