import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';

// This local statement must execute for the resulting config to have its secret.
const secrets = {};
Object.assign(secrets, { DATABASE_URL: [createDb] });

export default defineConfig({ secrets });
