import assert from "node:assert/strict";

import { FortenvAccessError } from "fortenv";

import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";
import { read } from "./reader.mjs";

if (process.argv[2] === "runtime") installInterceptor();
try {
   // Positive control: the attack is installed and forwards normal calls.
   assert.equal(
      Reflect.apply(() => 42, null, []),
      42,
   );
   assert.ok(observations().calls > 0);
   assert.throws(() => process.env.DATABASE_URL, FortenvAccessError);
   const reader = { label: "expected-receiver", read };
   const authorizedCallSucceeded = reader.read("business-argument");
   console.log(
      JSON.stringify({
         hookActive: observations().calls > 0,
         authorizedCallSucceeded,
         intercepted: observations().intercepted,
      }),
   );
} finally {
   restoreInterceptor();
}
