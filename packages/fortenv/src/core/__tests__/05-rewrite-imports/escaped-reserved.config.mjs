import { defineConfig } from 'fortenv/config';
import { read as \u005f_fortenv_module0 } from './readers.mjs';

export default defineConfig({ secrets: { DATABASE_URL: [__fortenv_module0] } });
