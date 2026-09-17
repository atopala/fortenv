import { defineConfig } from 'fortenv/config';
import { createDb } from '../application.mjs';

export default defineConfig({
   secrets: {
      "MY-SPECIAL-SECRET": [createDb],
      'TOKEN_\u0032': [createDb],
      'import export secrets': [createDb],
      '密钥': [createDb],
   },
});
