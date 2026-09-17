import assert from "node:assert/strict";

import { connectFortenv as connectOpenTelemetry } from "@fortenv/opentelemetry";
import { connectFortenv as connectPino } from "@fortenv/pino";
import { LoggerProvider } from "@opentelemetry/sdk-logs";
import { FortenvAccessError } from "fortenv";
import { subscribeSecurityEvents } from "fortenv/telemetry";
import pino from "pino";

let calls = 0;
let independentCalls = 0;
function failingSink() {
   calls++;
   throw new Error("SINK_FAILED");
}
const provider = new LoggerProvider();
const pinoLogger = pino({ enabled: false });
const otelLogger = provider.getLogger("failing-sink");
pinoLogger.error = failingSink;
otelLogger.emit = failingSink;
const disconnect = process.argv[2] === "pino" ? connectPino(pinoLogger) : connectOpenTelemetry(otelLogger);
const disconnectIndependent = subscribeSecurityEvents(() => {
   independentCalls++;
});
try {
   for (let count = 1; count <= 2; count++) {
      assert.throws(() => process.env.DATABASE_URL, FortenvAccessError);
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(calls, count);
      assert.equal(independentCalls, count);
   }
   console.log("ok");
} finally {
   disconnect();
   disconnectIndependent();
   await provider.shutdown();
}
