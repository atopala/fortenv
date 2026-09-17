import { defineConfig } from 'fortenv/config';

function localReader() { return undefined; }

// Discovery grant references must be imported placeholders, even in computed configs.
export default defineConfig({ secrets: { DATABASE_URL: [localReader] } });
