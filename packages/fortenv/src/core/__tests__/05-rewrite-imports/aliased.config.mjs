import { defineConfig as config } from '@fortenv/core/config';
import { read as readDatabase, default as defaultReader } from './readers.mjs';

export default config({ secrets: { DATABASE_URL: [readDatabase, defaultReader] } });
