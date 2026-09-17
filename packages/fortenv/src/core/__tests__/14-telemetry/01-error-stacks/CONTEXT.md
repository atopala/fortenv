# 14.01 — Error information and complete available stacks

Calls the existing `createEnvironmentGuard` through [readers.ts](readers.ts). A direct denied read must throw a structured FortenvAccessError with a stable code and key, without a secret value.

`errors.test.ts` contains the four named Vitest cases for this folder.

The recursive fixture includes 21 `nestedRead` frames between the denied access and a named outermost caller. Tests temporarily set the application limit to 0, 2 or 10, require those caller frames in the error, and check the application setting was restored. Each test restores its own original limit in `finally`.

This checks all available synchronous caller frames, not a promise to reconstruct arbitrary prior asynchronous work. Tests assert caller names and a source location, not brittle absolute paths or fixed line numbers.

All four tests pass. Production throws FortenvAccessError, captures all available frames and restores the application's stack limit before reporting the error.
