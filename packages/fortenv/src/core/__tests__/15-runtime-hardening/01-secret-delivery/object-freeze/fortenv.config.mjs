import { defineConfig } from "@fortenv/secrets/config";

import { read } from "./reader.mjs";

export default defineConfig({
   secrets: {
      DATABASE_URL: [read],
      PRIVATE_KEY: [],
   },
});
