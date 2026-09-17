import { defineConfig as config } from 'fortenv/config';
import { read as readDatabase, default as defaultReader } from './readers.mjs';

export default config({ secrets: { DATABASE_URL: [readDatabase, defaultReader] } });
