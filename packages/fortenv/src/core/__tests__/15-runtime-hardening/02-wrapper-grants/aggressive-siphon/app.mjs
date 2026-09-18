import { observations, restoreInterceptor } from "./malicious.mjs";
import { authorized } from "./reader.mjs";

// Call the authorized wrapper for real — the secret genuinely flows to the
// callback here. The malicious Proxy that wraps the wrapper's handler sees the
// apply trap's argument list ([secrets, ...args]) and tries to siphon the value.

let authorizedCallSucceeded = false;
try {
   authorizedCallSucceeded = authorized("business");
} catch {
   authorizedCallSucceeded = false;
}

// Also exercise the malicious Map/Proxy as controls so we know they are live.
const controlMap = new Map();
controlMap.set("k", "v");
const controlProxy = new Proxy({ x: 1 }, { get: (t, k) => Reflect.get(t, k) });
void controlProxy.x;

const seen = observations();

console.log(
   JSON.stringify({
      authorizedCallSucceeded,
      // Positive controls: the malicious constructors are installed and were used.
      hookActive: seen.installed && seen.proxyCalls > 0 && seen.mapCalls > 0,
      // Did the attacker's apply-trap wrapper actually see the wrapper's args?
      applyTrapArgsSeen: seen.applyTrapArgsSeen,
      // THE test: did the harvest ever capture a real secret value?
      harvestedSecret: seen.harvestedSecret,
      harvestSize: seen.harvestSize,
   }),
);

restoreInterceptor();
