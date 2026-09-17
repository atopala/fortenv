// Generated snapshot. Update through Vitest; see ../README.md.
import { createMockLoader } from "../../../../../dist/core/mock-imports.js";

const config = await (async (__fortenv_import) => {
const __fortenv_module0 = (await __fortenv_import('fortenv/config')).namespace;
const { defineConfig: defineConfig } = __fortenv_module0;
const __fortenv_module1 = (await __fortenv_import('./readers.mjs')).namespace;
const { then: then } = __fortenv_module1;



const __fortenv_default = defineConfig({ secrets: { DATABASE_URL: [then] } });

;return __fortenv_default;
})(createMockLoader(new WeakSet()));

console.dir(config, { depth: null });
export default config;
