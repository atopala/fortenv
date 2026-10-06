import { defineConfig } from '@fortenv/secrets/config';
import read, * as readers from './readers.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [read, readers.read] } });
