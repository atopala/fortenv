# 13 — Verify pipeline composition

Production boundary: The stage components together; design §§28–51, 71–83.

## Scenarios

- [ordering/ordering.test.ts](ordering/ordering.test.ts) observes the actual production functions and saves [order.json](ordering/__snapshots__/order.json). It checks protection callback ordering before real reader evaluation. It does not install a process guard in Vitest. Group 04 now tests the defineConfig value contract during execution; there is no separate source-grammar validation pass in the updated contract.
- [phase-1-discover](phase-1-discover/README.md) retains the original discovery integration coverage: static import variants, formatting, type-only imports and TS stripping, plus hostile application fixtures that must remain unevaluated. Config construction and helper-argument tests live in group 04; final-result shape fixtures live in stage 08.
- [phase-2-load-config](phase-2-load-config/README.md) retains real Node preload coverage for all four extensions, transitive import-time reads, actual wrappers and grants, invalid identities, name consistency, failed imports, unregistered wrappers and rejection of wrapper calls before registration. A separate [unauthorized-access test](phase-2-load-config/unauthorized-access/CONTEXT.md) requires a direct secret read to throw and stop startup; the configured-reader fixture contains no unauthorized direct reads.
- [runtime/runtime.test.ts](runtime/runtime.test.ts) runs [runtime/app.mjs](runtime/app.mjs) with the real preload: argument/receiver preservation, injected values across nested/concurrent/async calls, and denial in helpers and detached work.

The runtime fixture captures individual read errors and passes them to the assertion app. The app verifies their exact error type/message alongside authorized values, including in detached callbacks after completion. Loading fixtures assert caught denial errors so startup can continue; the dedicated unauthorized-access fixture verifies an uncaught denial stops startup.

Run any test file individually. The app fixtures use bare package imports and therefore need `pnpm build`. All subprocess credentials are explicit fake values. Each process gets a fresh guard and ACL; no central runner copies or synthesizes application source.

- [injection](injection/CONTEXT.md) checks the new factory DX, readonly snapshots, explicit credential passing, return identities and captured-value lifetime against the built package.
- [reflect-apply](reflect-apply/CONTEXT.md) replaces Reflect.apply during real config dependency loading and after bootstrap. Both cases require an active interception hook to receive no injected secret while the authorized callback still receives its grant, receiver and business argument. These regressions were confirmed failing before the private invocation reference was introduced.

## Run

From the repository root:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/13-pipeline
```

Use `-t` to select a named case. See the [pipeline test guide](../CONTEXT.md) for build requirements, snapshot updates, isolation rules and documented limitations.
