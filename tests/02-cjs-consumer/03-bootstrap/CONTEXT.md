# Bootstrap boundaries

These cases run once per consumer format. `missing-preload.js` verifies wrapper calls fail without initialization. `early.config.mjs` imports a module that invokes a wrapper before registration; the loading error must prevent the after-call and application markers. `unregistered.js` verifies a valid registered wrapper receives its value while another wrapper receives a frozen empty object, and direct environment access remains denied.

`readers.js` defines the registered and unregistered wrappers. `fortenv.config.mjs` grants the registered wrapper, while `early-call.js` triggers the invalid loading-time call and `app-not-started.js` detects accidental application startup.

Select individual cases or the named describe suite in `bootstrap.test.ts`. Each scenario uses a fresh real Node process. These are distinct from the dependency-format matrix in folders 01 and 02.
