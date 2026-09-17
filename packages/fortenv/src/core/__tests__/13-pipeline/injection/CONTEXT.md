# Explicit injection integration

Design §§7, 10, 14–26, 67 and 74–83. These fixtures use public built exports and a real Node preload. `factories.ts` is imported by config but only defines wrappers; each app runs after registration.

`injection.test.ts` launches the three applications using `fortenv.config.mjs` and checks their process status and output.

- `factory.mjs`: real factory DX, only granted keys, missing values, immutable fresh objects, attempted caller spoofing, nested errors/unregistered calls and silent successful injection. The Db constructor checks that even the caller's granted environment key is denied.
- `returns.mjs`: exact return/Promise/error identity and overlapping calls to the same wrapper.
- `captured.mjs`: explicit closure capture survives return/throw/resolve/reject; the environment stays denied.

Run each named Vitest case, or start an app with `DATABASE_URL=fake-db OTHER_SECRET=fake-other node --import fortenv/register factory.mjs` from this directory after building.
