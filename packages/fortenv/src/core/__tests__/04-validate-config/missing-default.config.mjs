import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';

// A config expression without a default export does not provide a module result.
defineConfig({ secrets: { DATABASE_URL: [createDb] } });
