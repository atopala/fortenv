// Generated snapshot. Update through Vitest; see ../README.md.
import { createMockLoader } from "../../../../../dist/core/mock-imports.js";

const config = await (async (__fortenv_import) => {
const __fortenv_module0 = (await __fortenv_import('fortenv/config')).namespace;
const { defineConfig: \u0063onfig } = __fortenv_module0;
const __fortenv_module1 = (await __fortenv_import('./readers.mjs')).namespace;
const { default: \u0064efaultReader } = __fortenv_module1;
const __fortenv_module2 = (await __fortenv_import('./readers.mjs')).namespace;
const \u{72}eaders = __fortenv_module2;
const __fortenv_module3 = (await __fortenv_import('./readers.mjs')).namespace;
const { \u0072ead: \u0072ead, read: r\u0065ader, read: \u{10400}reader, read: read\u{1D7D8} } = __fortenv_module3;
const __fortenv_module4 = (await __fortenv_import('./readers.mjs')).namespace;
const { default: def\u0061ultAlias, '\u0072ead': quotedReader } = __fortenv_module4;






// Both escape forms preserve the same bindings and imported function identities.
const __fortenv_default = config({ secrets: { DATABASE_URL: [
   defaultReader, defaultAlias, readers.default,
   read, reader, 𐐀reader, read𝟘, quotedReader, readers.read,
] } });

;return __fortenv_default;
})(createMockLoader(new WeakSet()));

console.dir(config, { depth: null });
export default config;
