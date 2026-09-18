// A side-effecting application import. Discovery must NOT execute it; it is
// rewritten to an inert mock during phase 1 and only runs during the real
// phase-2 import, after protection is installed.
import "./marker.mjs";

import { defineConfig } from "fortenv/config";

import { authorized } from "./reader.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [authorized] } });
