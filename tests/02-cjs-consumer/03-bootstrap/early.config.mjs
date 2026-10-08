import "./early-call.js";

import { defineConfig } from "@fortenv/core/config";

import { registered } from "./readers.js";
export default defineConfig({ secrets: { DATABASE_URL: [registered] } });
