import { defineConfig } from 'fortenv/config';
import { then } from '../then-application.mjs';

// An export named 'then' must remain an inert binding, not be awaited as a thenable.
export default defineConfig({ secrets: { DATABASE_URL: [then] } });
