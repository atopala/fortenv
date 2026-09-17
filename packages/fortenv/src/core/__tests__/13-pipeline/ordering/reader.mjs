import { fortenv } from "fortenv";

// Only real phase-two evaluation can reach this marker.
Reflect.get(globalThis, Symbol.for("fortenv.test.pipeline-events"))?.push("11: real reader evaluated");
export const read = fortenv(({ DATABASE_URL }) => DATABASE_URL);
