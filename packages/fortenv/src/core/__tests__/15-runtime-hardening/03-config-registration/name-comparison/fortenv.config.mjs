import "./side-effect.mjs";

import { defineConfig } from "fortenv/config";

import { authorized, smuggled } from "./reader.mjs";

// Discovery (imports mocked/inert) sees only DATABASE_URL. The real import adds
// PRIVATE_KEY granted to the attacker wrapper — a determinism mismatch that
// matchingNames should reject unless its name-comparison is tampered.
const isRealImport = /** @type {Record<string, unknown>} */ (globalThis).__fortenvRealImport === true;

/** @type {Record<string, readonly Function[]>} */
const secrets = isRealImport ? { DATABASE_URL: [authorized], PRIVATE_KEY: [smuggled] } : { DATABASE_URL: [authorized] };

export default defineConfig({ secrets });
