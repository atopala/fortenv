import assert from "node:assert/strict";

import { connectFortenv } from "@fortenv/opentelemetry";
import { context, ROOT_CONTEXT, trace, TraceFlags } from "@opentelemetry/api";
import { logs } from "@opentelemetry/api-logs";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { InMemoryLogRecordExporter, LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { FortenvAccessError } from "fortenv";

import { readSecret } from "../reader.mjs";

assert.match(import.meta.resolve("@fortenv/opentelemetry"), /\/dist\/index\.js$/);
const manager = new AsyncLocalStorageContextManager().enable();
context.setGlobalContextManager(manager);
const exporter = new InMemoryLogRecordExporter();
const provider = new LoggerProvider({ processors: [new SimpleLogRecordProcessor({ exporter })] });
logs.setGlobalLoggerProvider(provider);
const disconnect = connectFortenv(logs.getLogger("fortenv-integration"));
const before = Date.now();
try {
   assert.equal(readSecret(), "fake-integration-secret");
   for (const digit of ["1", "2"]) {
      const active = trace.setSpanContext(ROOT_CONTEXT, {
         traceId: digit.repeat(32),
         spanId: digit.repeat(16),
         traceFlags: TraceFlags.SAMPLED,
      });
      await context.with(active, async () => {
         await Promise.resolve();
         assert.throws(() => process.env.DATABASE_URL, FortenvAccessError);
      });
   }
   assert.ok(!Object.keys(process.env).includes("DATABASE_URL"));
   await provider.forceFlush();
   const records = exporter.getFinishedLogRecords();
   assert.equal(records.length, 3);
   for (const [index, record] of records.entries()) {
      assert.equal(record.severityNumber, index < 2 ? 17 : 13);
      assert.equal(record.severityText, index < 2 ? "ERROR" : "WARN");
      assert.match(String(record.attributes["exception.stacktrace"]), /02-opentelemetry\/app\.mjs:/);
      const timestamp = record.hrTime[0] * 1000 + record.hrTime[1] / 1e6;
      assert.ok(timestamp >= before && timestamp <= Date.now());
      if (index < 2) {
         assert.equal(record.spanContext?.traceId, String(index + 1).repeat(32));
         assert.equal(record.spanContext?.spanId, String(index + 1).repeat(16));
         assert.equal(record.attributes["fortenv.secret"], "DATABASE_URL");
         assert.equal(record.attributes["exception.type"], "FortenvAccessError");
      } else {
         assert.equal(record.spanContext, undefined);
         assert.ok(!Object.hasOwn(record.attributes, "fortenv.secret"));
      }
      assert.ok(
         !JSON.stringify({ body: record.body, attributes: record.attributes }).includes("fake-integration-secret"),
      );
   }
   disconnect();
   disconnect();
   assert.throws(() => process.env.DATABASE_URL, FortenvAccessError);
   await provider.forceFlush();
   assert.equal(exporter.getFinishedLogRecords().length, 3);
   console.log("ok");
} finally {
   disconnect();
   await provider.shutdown();
   logs.disable();
   context.disable();
   manager.disable();
}
