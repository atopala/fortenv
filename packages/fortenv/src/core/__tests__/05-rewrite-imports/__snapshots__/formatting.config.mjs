// Generated snapshot. Update through Vitest; see ../README.md.
import { createMockLoader } from "../../../../../dist/core/mock-imports.js";

const config = await (async (__fortenv_import) => {
const __fortenv_module0 = (await __fortenv_import("fortenv/config")).namespace;
const { defineConfig: defineConfig } = __fortenv_module0;
const __fortenv_module1 = (await __fortenv_import("./readers.mjs")).namespace;
const { read: read, readStripe: payment } = __fortenv_module1;
// import { ignored } from './not-an-import.mjs';



/* export default 'not the config'; */
const __fortenv_default = defineConfig({
   secrets: {
      DATABASE_URL: [read],
      STRIPE_SECRET_KEY: [payment],
   },
})

;return __fortenv_default;
})(createMockLoader(new WeakSet()));

console.dir(config, { depth: null });
export default config;
