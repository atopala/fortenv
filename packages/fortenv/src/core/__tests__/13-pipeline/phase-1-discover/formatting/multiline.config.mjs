import {
   defineConfig,
} from "fortenv/config"
import {
   createDb,
   createStripe as stripe,
} from '../application.mjs'

export default defineConfig({
   secrets: {
      DATABASE_URL: [
         createDb,
      ],
      STRIPE_SECRET_KEY: [stripe,],
   },
})
