import { authorized } from "./reader.mjs";

const g = /** @type {Record<string, unknown>} */ (globalThis);

// The marker module runs during phase-2 real config import (after protection is
// installed), never during phase-1 discovery (imports are mocked/inert there).
// The security point: it must not have captured the ambient DATABASE_URL value —
// by phase 2 the guard is installed, so any read it attempted was denied.
const markerExecuted = g.__fortenvMarkerExecuted === true;
const markerCapturedValue = g.__fortenvMarkerAmbientRead === "fake-hardening-database";
const markerReadThrew = typeof g.__fortenvMarkerAmbientReadThrew === "string";

let authorizedCallSucceeded = false;
try {
   authorizedCallSucceeded = authorized();
} catch {
   authorizedCallSucceeded = false;
}

console.log(
   JSON.stringify({
      markerExecuted,
      markerCapturedValue,
      markerReadThrew,
      authorizedCallSucceeded,
   }),
);
