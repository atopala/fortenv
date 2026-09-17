import "./early-call.js";

import { defineConfig } from "fortenv/config";

import { registered } from "./readers.js";
export default defineConfig({ secrets: { DATABASE_URL: [registered] } });
