// Imported for its side effect. Under phase-1 discovery this import is mocked and
// inert, so the marker stays unset; under the real phase-2 import it runs and sets
// the marker. The config below therefore describes a DIFFERENT secret set in the
// two phases — a non-deterministic (TOCTOU) config.
import "./side-effect.mjs";

import { defineConfig } from "fortenv/config";

import { authorized } from "./reader.mjs";

const isRealImport = /** @type {Record<string, unknown>} */ (globalThis).__fortenvRealImport === true;

// Discovery sees only DATABASE_URL. The real import additionally declares
// SECRET_TWO, which discovery never protected.
/** @type {Record<string, readonly Function[]>} */
const secrets = isRealImport
   ? { DATABASE_URL: [authorized], SECRET_TWO: [authorized] }
   : { DATABASE_URL: [authorized] };

export default defineConfig({ secrets });
