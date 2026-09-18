import { FortenvAccessError } from "fortenv";
import { subscribeSecurityEvents } from "fortenv/telemetry";

// Attack: a hostile security-event observer that tries to (a) extract a secret
// VALUE from the event, (b) make a nested protected read succeed, (c) mutate the
// event to corrupt a second subscriber, (d) throw and return a rejecting thenable
// to crash the process or defeat the recursion guard. The test fails if any
// secret value is obtained, if denial stops holding, or if the process dies.

const hostile = {
   /** @type {string} */ eventSnapshot: "",
   nestedReadDenied: false,
   sawValueField: false,
};

/** @type {Array<{ name: string; secret: string | undefined }>} */
const secondSubscriberEvents = [];

// Well-behaved second subscriber to check event integrity/delivery.
subscribeSecurityEvents((event) => {
   secondSubscriberEvents.push({ name: event.name, secret: "secret" in event ? event.secret : undefined });
});

// Hostile subscriber.
subscribeSecurityEvents((event) => {
   // (a) look for any secret value on the event object.
   hostile.eventSnapshot = JSON.stringify(event);
   hostile.sawValueField =
      hostile.eventSnapshot.includes("fake-hardening-database") ||
      hostile.eventSnapshot.includes("fake-hardening-private-key");
   // (b) nested protected read from inside the observer.
   try {
      void process.env.DATABASE_URL;
   } catch (error) {
      hostile.nestedReadDenied = error instanceof FortenvAccessError;
   }
   // (c) try to mutate the event seen by other subscribers.
   try {
      /** @type {Record<string, unknown>} */ (event).secret = "TAMPERED";
      /** @type {Record<string, unknown>} */ (event).injected = "attacker";
   } catch {
      /* frozen event — fine */
   }
   // (d) misbehave: throw and (below) return a rejecting thenable.
   throw new Error("hostile observer throw");
});

// A second hostile subscriber that returns a rejecting thenable.
subscribeSecurityEvents(() => Promise.reject(new Error("hostile rejection")));

// Trigger a denied read to publish the event to all subscribers.
let triggerDenied = false;
try {
   void process.env.PRIVATE_KEY;
} catch (error) {
   triggerDenied = error instanceof FortenvAccessError && error.code === "FORTENV_ACCESS_DENIED";
}

// Let any microtasks (rejected thenables) settle so an unhandled rejection would surface.
await new Promise((resolve) => setTimeout(resolve, 20));

// Denial must still hold after all the observer misbehavior.
let stillDenied = false;
try {
   void process.env.PRIVATE_KEY;
} catch (error) {
   stillDenied = error instanceof FortenvAccessError;
}

console.log(
   JSON.stringify({
      triggerDenied,
      hostileSawValue: hostile.sawValueField,
      hostileNestedReadDenied: hostile.nestedReadDenied,
      secondSubscriberDelivered: secondSubscriberEvents.length > 0,
      secondSubscriberSecretName: secondSubscriberEvents[0]?.secret,
      stillDenied,
   }),
);
