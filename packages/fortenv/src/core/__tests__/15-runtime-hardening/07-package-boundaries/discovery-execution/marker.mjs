// If discovery ever EXECUTED application imports, this module's side effect would
// run during phase 1 (before protection is installed) and could read the secret
// ambiently. It records execution on a global marker and captures any ambient
// read it manages. Under correct discovery (mocked imports), this never runs in
// phase 1; it only runs later, in phase 2 real registration, when reads are
// already guarded.
const g = /** @type {Record<string, unknown>} */ (globalThis);
g.__fortenvMarkerExecuted = true;
try {
   g.__fortenvMarkerAmbientRead = process.env.DATABASE_URL;
} catch (error) {
   g.__fortenvMarkerAmbientReadThrew = error instanceof Error ? error.constructor.name : String(error);
}

export const sideEffectMarker = true;
