// import { ignored } from './not-an-import.mjs';
import {
   defineConfig,
} from "fortenv/config"
import {
   read /* keep this binding */, // comment inside an import
   readStripe as payment,
} from "./readers.mjs"

/* export default 'not the config'; */
export default defineConfig({
   secrets: {
      DATABASE_URL: [read],
      STRIPE_SECRET_KEY: [payment],
   },
})
