import { observations } from "./malicious.mjs";
import { authorized, generatorWrapResult } from "./reader.mjs";

// Does the tampered binding let a generator through, and if so can it leak a
// secret? The generator is NOT in the config grant list, so even if wrapped it
// must receive no secret. The test fails only if a secret value escapes.

const seen = observations();

let generatorSawSecret = false;
if (!generatorWrapResult.threw && typeof generatorWrapResult.wrapped === "function") {
   try {
      // Invoke the wrapped generator and drain it; check nothing it yields/returns
      // equals the secret.
      const result = generatorWrapResult.wrapped();
      const iterator = result && typeof result.next === "function" ? result : null;
      if (iterator) {
         let step = iterator.next();
         while (!step.done) {
            if (step.value === "fake-hardening-database") generatorSawSecret = true;
            step = iterator.next();
         }
         if (step.value === "fake-hardening-database") generatorSawSecret = true;
      } else if (result === "fake-hardening-database") {
         generatorSawSecret = true;
      }
   } catch {
      generatorSawSecret = false;
   }
}

const authorizedCallSucceeded = authorized();

console.log(
   JSON.stringify({
      tamperActive: seen.installed && seen.currentlyReturnsFalse,
      generatorWasWrapped: !generatorWrapResult.threw,
      generatorSawSecret,
      authorizedCallSucceeded,
   }),
);
