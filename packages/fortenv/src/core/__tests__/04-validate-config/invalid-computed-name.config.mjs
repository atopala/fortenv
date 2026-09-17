import { defineConfig } from 'fortenv/config';
import { createDb } from '../13-pipeline/phase-1-discover/application.mjs';

function secretName() { return ''; }

// Computing a name is allowed, but the resulting name must be valid.
export default defineConfig({ secrets: { [secretName()]: [createDb] } });
