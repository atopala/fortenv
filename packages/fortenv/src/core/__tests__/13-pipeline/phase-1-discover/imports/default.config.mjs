import { defineConfig } from '@fortenv/core/config';
import createDb from '../application.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [createDb] } });
