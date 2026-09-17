// import { fake } from './DO_NOT_LOAD.mjs'; export default { secrets: { FAKE: [] } };
/* A parser must ignore: import('missing'); secrets: { ALSO_FAKE: [] }; /[{}]/ */
import /* helper */ { defineConfig } from /* package */ 'fortenv/config';
import { createDb /* actual grant */ } from '../application.mjs';

export default defineConfig({
   // FAKE_SECRET: [fake],
   secrets: { DATABASE_URL: [createDb] },
});
