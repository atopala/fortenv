import { channel } from "node:diagnostics_channel";

import { subscribeSecurityEvents } from "fortenv/telemetry";
import { afterEach, describe, expect, it, vi } from "vitest";

import { deniedEvent } from "./contract.js";

describe("14.03 — Generic telemetry subscriptions", () => {
   const security = channel("fortenv.security");
   const cleanups: (() => void)[] = [];
   afterEach(() => {
      for (const cleanup of cleanups.splice(0)) cleanup();
   });

   it("offers an event callback for other loggers and returns an idempotent unsubscribe", async () => {
      const listener = vi.fn();
      const disconnect = subscribeSecurityEvents(listener);
      cleanups.push(disconnect);
      const event = deniedEvent();

      security.publish(event);
      expect(listener).toHaveBeenCalledExactlyOnceWith(event);
      expect(listener.mock.calls[0]?.[0]).toBe(event);
      disconnect();
      disconnect();
      security.publish(deniedEvent());
      expect(listener).toHaveBeenCalledTimes(1);
   });
});
