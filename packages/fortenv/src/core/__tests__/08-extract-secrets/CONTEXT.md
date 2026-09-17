# 08 — Validate the result and extract names

Production boundary: `readDiscoveryResult`, `readConfiguration`, `validateSecretName`; design §§8–9, 38 and the browser-exposure discussion in §58.

## Scenarios

[result.test.ts](result.test.ts) checks exact names, empty grants/policies, imported placeholder identity, rejection of real functions during discovery, copying of input arrays, invalid root/secrets/grant shapes, sparse arrays, accessors without getter execution, symbols/hidden properties/non-plain objects, null-prototype dictionaries, and accepted/rejected environment names.

[discovery-shape.test.ts](discovery-shape.test.ts) checks `missing-secrets.config.mjs`, `invalid-secrets.config.mjs`, and `invalid-result.config.mjs`. Those are final-result checks; stage 04 separately verifies validation when defineConfig receives its arguments.

This stage sees values, not syntax. A valid key may come from a literal, computed expression or runtime factory. Final-result validation alone cannot detect an earlier discarded invalid defineConfig call, which is tested in stage 04. Some strict shape/name checks are existing implementation policy beyond the design examples; the central guide records that distinction.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/08-extract-secrets
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
