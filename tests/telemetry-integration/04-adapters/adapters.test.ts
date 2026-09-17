import { AsyncLocalStorage } from "node:async_hooks";
import { channel } from "node:diagnostics_channel";

import { connectFortenv as connectOpenTelemetry } from "@fortenv/opentelemetry";
import { connectFortenv as connectPino } from "@fortenv/pino";
import { type LogRecord } from "@opentelemetry/api-logs";
import { subscribeSecurityEvents } from "fortenv/telemetry";
import pino from "pino";
import { afterEach, describe, expect, it, vi } from "vitest";

import { deniedEvent, enumerationEvent } from "./events.js";

describe("04 — Logger and OpenTelemetry adapter contracts", () => {
   const security = channel("fortenv.security");
   const cleanups: (() => void)[] = [];
   afterEach(() => {
      for (const cleanup of cleanups.splice(0)) cleanup();
   });

   it("passes Pino the Error and metadata while retaining the receiver and caller context", async () => {
      const context = new AsyncLocalStorage<string>();
      const seen: (string | undefined)[] = [];
      const logger = pino({ enabled: false });
      vi.spyOn(logger, "error").mockImplementation(() => {
         seen.push(context.getStore());
      });
      vi.spyOn(logger, "warn");
      cleanups.push(connectPino(logger));
      const event = deniedEvent();

      context.run("request-with-active-span", () => security.publish(event));
      expect(logger.error).toHaveBeenCalledExactlyOnceWith(
         {
            err: event.error,
            fortenv: {
               version: 1,
               name: event.name,
               operation: event.operation,
               secret: event.secret,
               timestamp: event.timestamp,
            },
         },
         event.error.message,
      );
      expect(vi.mocked(logger.error).mock.contexts[0]).toBe(logger);
      const record = vi.mocked(logger.error).mock.calls[0]![0];
      if (typeof record !== "object" || record === null) throw new Error("Expected a Pino object record");
      expect(Reflect.get(record, "err")).toBe(event.error);
      expect(seen).toEqual(["request-with-active-span"]);
      expect(logger.warn).not.toHaveBeenCalled();
   });

   it("maps error and event fields to an OpenTelemetry log record while retaining active context", async () => {
      const context = new AsyncLocalStorage<string>();
      const seen: (string | undefined)[] = [];
      const logger = {
         enabled: () => true,
         emit: vi.fn((_record: LogRecord) => {
            seen.push(context.getStore());
         }),
      };
      cleanups.push(connectOpenTelemetry(logger));
      const event = deniedEvent();

      context.run("request-with-active-span", () => security.publish(event));
      expect(logger.emit).toHaveBeenCalledExactlyOnceWith({
         severityNumber: 17,
         severityText: "ERROR",
         body: event.error.message,
         timestamp: event.timestamp,
         attributes: {
            "fortenv.version": 1,
            "fortenv.event.name": event.name,
            "fortenv.operation": "get",
            "fortenv.secret": "DATABASE_URL",
            "exception.type": "FortenvAccessError",
            "exception.message": event.error.message,
            "exception.stacktrace": event.error.stack,
         },
      });
      expect(logger.emit.mock.contexts[0]).toBe(logger);
      expect(seen).toEqual(["request-with-active-span"]);
   });

   it("routes enumeration to Pino warn with its captured stack", async () => {
      const logger = pino({ enabled: false });
      vi.spyOn(logger, "error");
      vi.spyOn(logger, "warn");
      cleanups.push(connectPino(logger));
      const event = enumerationEvent();

      security.publish(event);
      expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
         {
            err: event.error,
            fortenv: {
               version: 1,
               name: "fortenv.env.enumerated",
               operation: "ownKeys",
               timestamp: event.timestamp,
            },
         },
         event.error.message,
      );
      expect(vi.mocked(logger.warn).mock.calls[0]?.[0]).toHaveProperty("err", event.error);
      expect(vi.mocked(logger.warn).mock.calls[0]?.[0]).not.toHaveProperty("fortenv.secret");
      expect(logger.error).not.toHaveBeenCalled();
   });

   it("maps enumeration to OpenTelemetry WARN without inventing a secret name", async () => {
      const logger = { enabled: () => true, emit: vi.fn((_record: LogRecord) => {}) };
      cleanups.push(connectOpenTelemetry(logger));
      const event = enumerationEvent();

      security.publish(event);
      expect(logger.emit).toHaveBeenCalledExactlyOnceWith({
         severityNumber: 13,
         severityText: "WARN",
         body: event.error.message,
         timestamp: event.timestamp,
         attributes: {
            "fortenv.version": 1,
            "fortenv.event.name": "fortenv.env.enumerated",
            "fortenv.operation": "ownKeys",
            "exception.type": event.error.name,
            "exception.message": event.error.message,
            "exception.stacktrace": event.error.stack,
         },
      });
      expect(logger.emit.mock.calls[0]?.[0].attributes).not.toHaveProperty("fortenv.secret");
   });

   it.each(["connectPino", "connectOpenTelemetry"] as const)(
      "disconnects %s without affecting other observers",
      async (method) => {
         const sink = vi.fn();
         const logger = pino({ enabled: false });
         vi.spyOn(logger, "error").mockImplementation(sink);
         vi.spyOn(logger, "warn").mockImplementation(sink);
         const disconnect =
            method === "connectPino" ? connectPino(logger) : connectOpenTelemetry({ emit: sink, enabled: () => true });
         const other = vi.fn();
         cleanups.push(disconnect, subscribeSecurityEvents(other));
         security.publish(deniedEvent());
         expect(sink).toHaveBeenCalledTimes(1);
         disconnect();
         disconnect();
         security.publish(deniedEvent());
         expect(sink).toHaveBeenCalledTimes(1);
         expect(other).toHaveBeenCalledTimes(2);
      },
   );
});
