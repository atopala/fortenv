import { installInterceptor, observations, restoreInterceptor } from "./malicious.mjs";
import { read } from "./reader.mjs";

// Install at runtime (T2) so the malicious Set/Map methods are live during the
// per-call injection that builds and reads the secret object.
installInterceptor();

let authorizedCallSucceeded = false;
try {
   authorizedCallSucceeded = read();
} catch {
   authorizedCallSucceeded = false;
}

// Snapshot immediately after Fortenv's injection so the harvest reflects only
// what flowed through Fortenv, not any attacker-owned control collection.
const afterInjection = observations();

// Liveness proof that does NOT carry a secret: a control Set/Map with harmless
// values must still bump the counters, proving the malicious methods are active
// without contaminating the secret harvest.
const controlSet = new Set(["harmless"]);
for (const v of controlSet) void v;
const controlMap = new Map([["k", "harmless"]]);
void controlMap.get("k");
const afterControl = observations();

restoreInterceptor();

console.log(
   JSON.stringify({
      authorizedCallSucceeded,
      // Methods are live: the control bumped the counters.
      hookActive:
         afterControl.setIterations > afterInjection.setIterations || afterControl.mapGets > afterInjection.mapGets,
      // Methods ran DURING Fortenv's injection too (counters were already > 0).
      ranDuringInjection: afterInjection.setIterations > 0 || afterInjection.mapGets > 0,
      // THE test: did harvesting capture a real secret from Fortenv's injection path?
      harvestedSecret: afterInjection.harvestedSecret,
      harvestSize: afterInjection.harvestSize,
   }),
);
