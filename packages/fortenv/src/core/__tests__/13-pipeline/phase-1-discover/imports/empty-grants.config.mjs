import { defineConfig } from 'fortenv/config';

// A declared secret is still discovered when its reader list is empty.
export default defineConfig({ secrets: { DATABASE_URL: [] } });
