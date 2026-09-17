// This test preload saves the actual environment object before Fortenv scrubs it.
// Keep register dynamic: a static import would run before the assignment below.
export const originalEnvironment = process.env;
await import("fortenv/register");
