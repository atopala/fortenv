import { defineConfig } from '@fortenv/core/config';
import * as readers from './readers.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [readers.read] } });
