import { defineConfig } from "@fortenv/secrets/config";

import { nested, nestedAsync, registered } from "./readers.mjs";

export default defineConfig({ secrets: { DATABASE_URL: [registered, nested, nestedAsync] } });
