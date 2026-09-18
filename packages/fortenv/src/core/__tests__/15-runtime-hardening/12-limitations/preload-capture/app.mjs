import { FortenvAccessError } from "fortenv";

const g = /** @type {Record<string, unknown>} */ (globalThis);

// The pre-load module read the secret before Fortenv loaded — a documented
// limitation. After Fortenv loaded, the same ambient read is denied. This fixture
// asserts BOTH: the limitation holds (pre-load read matched) and the post-load
// guarantee holds (ambient read denied). No value is ever printed.
const preloadReadMatched = g.__fortenvPreloadReadMatched === true;

let postLoadAmbientReadDenied = false;
try {
   void process.env.PRIVATE_KEY;
} catch (error) {
   postLoadAmbientReadDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
}

console.log(JSON.stringify({ preloadReadMatched, postLoadAmbientReadDenied }));
