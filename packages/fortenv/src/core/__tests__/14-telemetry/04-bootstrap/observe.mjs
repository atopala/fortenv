import { subscribe } from "node:diagnostics_channel";

// This observer uses only Node built-ins, before Fortenv loads real dependencies.
subscribe("fortenv.security", (message) => {
   const event = /** @type {import('../03-subscriptions/contract.js').SecurityEvent} */ (message);
   console.log(
      "security-event:" +
         JSON.stringify({
            ...event,
            error: {
               ...event.error,
               name: event.error.name,
               code: event.error.code,
               message: event.error.message,
               stack: event.error.stack,
            },
         }),
   );
});
