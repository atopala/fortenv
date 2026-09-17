# 11 — Match names and build the real ACL

Production boundary: `matchingNames` in `core/bootstrap.ts`, `buildGrants` in `core/grants.ts`; design §§11–14, 48–51, 73–76.

## Scenarios

[grants.test.ts](grants.test.ts) checks one wrapper with multiple secrets, multiple wrappers for one secret, duplicate grants, two wrappers around the same original, original/bound identities receiving no inherited grant, input mutation isolation, invalid target rejection, preserved configured key spellings, and added/removed/renamed versus reordered secret sets.

The ACL builder accepts the runtime's identity-validation callback. Unit tests provide a controlled wrapper registry; the production runtime owns its actual WeakSet. Real config imports, forged/raw/original/bound targets, startup failure, and name consistency through the loader remain covered by the stage 13 preload fixtures.

Calls during real config loading are intentionally rejected. Unregistered wrappers execute with empty injection after initialization; group 13 tests standalone and nested sync/async calls.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/11-register-grants
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
