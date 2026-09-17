import { defineConfig } from 'fortenv/config';

function createConfig() {
   return { secrets: { DATABASE_URL: 42 } };
}

// @ts-expect-error Runtime validation must reject the value, not the use of a factory.
export default defineConfig(createConfig());
