import { observations, restoreInterceptor } from "./malicious.mjs";
import { authorized, smuggled } from "./reader.mjs";

// If matchingNames still threw despite the tamper, bootstrap failed and this file
// does not run. If it does run, report what the smuggled wrapper could obtain —
// which must be nothing, since the undiscovered PRIVATE_KEY was never captured.
console.log("APP_STARTED");

let smuggledSawSecret = false;
let authorizedOutcome = false;
try {
   smuggledSawSecret = smuggled();
} catch {
   smuggledSawSecret = false;
}
try {
   authorizedOutcome = authorized();
} catch {
   authorizedOutcome = false;
}

const seen = observations();
restoreInterceptor();

console.log(JSON.stringify({ someNeutralized: seen.someNeutralized, smuggledSawSecret, authorizedOutcome }));
