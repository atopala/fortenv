# 02 — OpenTelemetry SDK output

`opentelemetry.test.ts` runs the adjacent `app.mjs` with the actual log API, AsyncLocalStorage context manager, SDK provider, simple processor and in-memory exporter. Two denied reads run after await in distinct span contexts. A later enumeration warning has no span. The fixture checks exported severity, epoch timestamps, exception attributes, caller stacks and trace/span correlation.

The fixture owns provider flush/shutdown. Fortenv only forwards to its logger. After disconnecting twice, a new denied read must produce the one stderr fallback record checked by the parent, with no additional exported record. No network exporter is involved.
