// Generated snapshot. Update through Vitest; see ../README.md.
import { createMockLoader } from "../../../../../dist/core/mock-imports.js";

const config = await (async (__fortenv_import) => {
const __fortenv_module0 = (await __fortenv_import('fortenv/config')).namespace;
const { defineConfig: defineConfig } = __fortenv_module0;
const __fortenv_module1 = (await __fortenv_import('./readers.mjs')).namespace;
const { read: 𐐀reader, read: read𐐀, read: read𝟘 } = __fortenv_module1;



// Astral letters can start or continue a name; an astral digit can continue it.
const __fortenv_default = defineConfig({ secrets: { DATABASE_URL: [𐐀reader, read𐐀, read𝟘] } });

;return __fortenv_default;
})(createMockLoader(new WeakSet()));

console.dir(config, { depth: null });
export default config;
