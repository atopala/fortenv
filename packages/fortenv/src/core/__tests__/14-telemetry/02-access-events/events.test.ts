import { AsyncLocalStorage } from "node:async_hooks";
import { channel } from "node:diagnostics_channel";

import { afterEach, describe, expect, it } from "vitest";

import { createEnvironmentGuard } from "../../../../runtime/node/environment.js";

describe("14.02 — Access-denied diagnostic events", () => {
   const security = channel("fortenv.security");
   const cleanups: (() => void)[] = [];
   afterEach(() => {
      for (const cleanup of cleanups.splice(0)) cleanup();
   });

   function observe(listener: (event: unknown) => void): void {
      security.subscribe(listener);
      cleanups.push(() => {
         security.unsubscribe(listener);
      });
   }

   it("publishes before throwing even when the application catches the error", () => {
      const events: unknown[] = [];
      const order: string[] = [];
      observe((event) => {
         events.push(event);
         order.push("reported");
      });
      const guard = createEnvironmentGuard({}, new Set(["DATABASE_URL"]));
      const before = Date.now();
      let caught: unknown;
      try {
         void guard.DATABASE_URL;
      } catch (error) {
         caught = error;
         order.push("caught");
      }

      expect(order).toEqual(["reported", "caught"]);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
         version: 1,
         name: "fortenv.access.denied",
         severity: "error",
         operation: "get",
         secret: "DATABASE_URL",
         timestamp: expect.any(Number),
         error: caught,
      });
      const event = events[0] as { timestamp: number; error: Error };
      expect(event.timestamp).toBeGreaterThanOrEqual(before);
      expect(event.timestamp).toBeLessThanOrEqual(Date.now());
      expect(event.error).toBe(caught);
      expect(event.error.stack).toContain("events.test.ts:");
      expect(event.error.stack).not.toContain("fake-event-secret");
      expect(JSON.stringify(event)).not.toContain("fake-event-secret");
   });

   it("reports in the active caller context so adapters can correlate with a request or span", () => {
      const context = new AsyncLocalStorage<string>();
      const observed: (string | undefined)[] = [];
      observe(() => {
         observed.push(context.getStore());
      });
      const guard = createEnvironmentGuard({}, new Set(["DATABASE_URL"]));

      context.run("request-a", () => {
         expect(() => guard.DATABASE_URL).toThrow();
      });
      context.run("request-b", () => {
         expect(() => guard.DATABASE_URL).toThrow();
      });
      expect(observed).toEqual(["request-a", "request-b"]);
   });

   it("does not report ordinary reads as denials", () => {
      const events: unknown[] = [];
      observe((event) => {
         events.push(event);
      });
      const guard = createEnvironmentGuard({ NODE_ENV: "test" }, new Set(["DATABASE_URL", "MISSING_SECRET"]));
      expect(guard.NODE_ENV).toBe("test");
      expect(guard.UNKNOWN).toBeUndefined();
      expect(events).toEqual([]);
   });

   it("reports denial of a configured secret even when its value is absent", () => {
      const events: unknown[] = [];
      observe((event) => {
         events.push(event);
      });
      const guard = createEnvironmentGuard({}, new Set(["MISSING_SECRET"]));

      expect(() => guard.MISSING_SECRET).toThrow();
      expect(events).toEqual([
         expect.objectContaining({
            name: "fortenv.access.denied",
            secret: "MISSING_SECRET",
            error: expect.any(Error),
         }),
      ]);
   });
});
