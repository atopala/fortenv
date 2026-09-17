# Fortenv agent instructions

These instructions apply to every file in this repository. A more deeply nested `AGENTS.md`, if one is added later, may provide additional rules for its subtree.

## Read context before working

Before inspecting, planning, editing, or testing code in a directory:

1. Read the repository root [CONTEXT.md](CONTEXT.md).
2. Read the closest `CONTEXT.md` in that directory or one of its ancestors.
3. When work spans directories, read the applicable `CONTEXT.md` for each area.
4. For library behavior, read [packages/fortenv/docs/design.md](packages/fortenv/docs/design.md). Treat it as the product contract.

Do this before making assumptions about a folder's purpose, execution model, fixtures, or test commands. Do not guess about new behavior or ambiguous requirements; clarify the contract with the user before changing production code. If code and context disagree, verify the code and tests, then correct the context in the same change. If the design, tests, and implementation disagree on intended behavior, stop and clarify which one should change. Do not rewrite the design during implementation merely to match existing behavior.

Keep context documents current. Adding, removing, moving, or repurposing files requires reviewing the nearest `CONTEXT.md` and its parent overview. Use uppercase `CONTEXT.md` consistently in filenames and links. Add a focused `CONTEXT.md` when a new substantial subsystem or test scenario would otherwise be difficult to understand from its parent.

## Development workflow

Use test driven development for behavior changes:

1. State the contract being tested and identify the relevant design section.
2. Add or update the smallest test that expresses that contract.
3. Run it and confirm it fails for the expected reason. A test crash, fixture error, or unrelated failure is not a valid red state.
4. When the user asks to review the failing contract before implementation, stop after the verified red run.
5. Make the smallest production change that satisfies the approved contract.
6. Run the focused test, then the relevant package or integration project, followed by the required workspace checks.
7. Refactor only after the tests are green, keeping behavior unchanged.

For documentation, tooling, or other changes that do not alter runtime behavior, use proportionate verification instead of manufacturing a failing test.

Before coding, search for the existing production boundary, house pattern, and related tests. Preserve exact public behavior unless the design change is explicit. Do not add speculative APIs, compatibility layers, dependencies, or validation beyond the agreed contract.

For multi-step work, state a short plan with a verification criterion for each step. Turn vague requests into concrete outcomes before implementation. When diagnosing a bug, identify the root cause and reproduce it with a focused failing test before proposing or applying a fix.

## Scope and change discipline

- Read the complete current contents of every file before editing it. Reload it from disk immediately before a substantial edit; do not rely on a cached copy from an earlier turn.
- Use targeted edits and preserve comments, documentation, exports, structure, and behavior unrelated to the task. Remove an import or helper when your own change makes it unused, but do not clean up pre-existing code without approval.
- Inspect the current worktree before changing files. Assume user and parallel-session changes are intentional. Never overwrite, revert, or reformat unrelated work.
- Solve the requested problem with the smallest clear change. Do not add single-use abstractions, speculative flexibility, compatibility paths, or “while here” refactors.
- Use names, values, APIs, and conventions exactly as specified. If one appears technically unsafe or incompatible, explain the concrete issue and clarify before substituting another design.
- Distinguish confirmed requirements, observed behavior, inferences, and new proposals. Do not present an inference as an agreed requirement or add a proposal to code, design documents, issues, or acceptance criteria without approval.
- A request to explain, compare, or explore an approach does not authorize implementation. Wait for an explicit implementation instruction when the conversation is in a clarification or design-review phase.
- Do not silently restore an approach the user rejected or replaced. If the current contract cannot be implemented without it, stop at that boundary and explain why.
- If repeated fixes fail for the same reason, stop making speculative changes. Re-read the evidence, state the unresolved root cause, and ask for the missing decision.

## Type safety

- Do not use `as any`, `as never`, double casts, `@ts-ignore`, or weakened public types to silence an error.
- Narrow `unknown` with runtime checks or a type guard. When an external type is incomplete, define the smallest accurate structural type needed at that boundary.
- Use `@ts-expect-error` only when the error itself is the tested contract or an intentional unsupported call is being demonstrated. Include a short reason and ensure the compiler verifies the directive.
- Read actual declarations and inferred types before creating fixtures or assertions. Do not guess the shape of a value from runtime examples alone.

## Test structure

- Put tests beside the real fixtures they exercise. Use real `.ts`, `.mts`, `.js`, and `.mjs` fixture files instead of embedding programs in source strings.
- Give every test file a named `describe` suite so the whole file can be run from an IDE. Keep individual scenarios independently selectable.
- Keep numbered pipeline groups stable. Their meaning and boundaries are documented in the [numbered test guide](packages/fortenv/src/core/__tests__/CONTEXT.md).
- Use snapshots when the exact transformed source is part of the contract. Save executable JavaScript snapshots as real files so they can be inspected and debugged in Node.
- Integration tests must consume built public package exports. Do not import Fortenv source internals or use aliases that bypass package exports.
- Run irreversible process changes, including installation of the permanent `process.env` guard, in fresh Node subprocesses rather than shared Vitest workers.
- Give subprocesses explicit fake secrets and a minimal environment. Never use or print the developer's actual environment values. Check stdout, stderr, errors, and telemetry for secret leakage.
- A failure-path integration test passes only when the process fails for the expected Fortenv reason at the expected point. Assert that later application markers did not run.
- Keep intentionally malformed fixtures and syntax-sensitive transformer inputs out of automatic rewrites, while continuing to test their surrounding suites.
- Do not collect tests from generated `dist` output.
- Keep snapshots deterministic. If output contains a value that varies by run, assert that value's shape or range separately instead of recording unstable output.

## Design and package constraints

- Target Node.js 22.23.2 and later. Node 22 is the tested baseline.
- Config files support ESM `.ts`, `.mts`, `.js`, and `.mjs` only.
- The published `fortenv` package must have zero runtime, peer, and optional dependencies. Node built-ins are the runtime foundation.
- Keep Node typings, TypeScript, test runners, lint tools, and formatters as development dependencies.
- The core `fortenv` package must not depend on Pino or OpenTelemetry, including development dependencies. Standalone `@fortenv/pino` and `@fortenv/opentelemetry` adapters use the official logger types, with Fortenv and logger APIs as peer dependencies and workspace development dependencies. SDKs and compatibility tests belong in private integration projects under `tests/`.
- Preserve the explicit injection API: `fortenv((secrets, ...businessArguments) => result)`. All direct reads of configured keys through `process.env` are denied, including inside registered callbacks.
- Authorization uses exact wrapper function identity. Do not infer permission from names, source text, modules, paths, stack traces, or async context.
- Config discovery happens before the real config import. Discovery uses transformed static imports and inert placeholders; real registration uses the original config and exact wrappers after the environment is protected.
- Treat configuration as trusted and deterministic. The discovery VM is not a hostile-code sandbox.
- `fortenv/telemetry` remains dependency-free and exposes generic subscriptions. Logger-specific mappings belong in standalone adapter packages. Adapters accept caller-owned loggers and never create or manage providers, transports or exporters. Successful injection is silent.
- Do not claim same-process isolation. Explicitly delivered strings can be retained, and Linux startup environment data may remain available through `/proc/self/environ`.

## Code and documentation quality

- Keep production changes narrow and readable. Reuse existing boundaries before creating new helpers.
- Preserve synchronous throws, asynchronous rejection identity, return and Promise identity, `this`, and caller business arguments where the API promises them.
- Avoid global mutable test state. Restore temporary settings in `finally` and isolate permanent runtime effects in subprocesses.
- Update design references, README files, snapshots, and `CONTEXT.md` documents when their claims change.
- Do not hard-code volatile test totals unless the count communicates a reviewed contract; verify any retained totals before updating them.
- Do not edit generated build output as source. Rebuild it through package scripts.
- Preserve unrelated user changes in the working tree.

## Public repository hygiene

- Treat this repository, its Git history, issues, pull requests, CI logs, test output, and published artifacts as public.
- Never copy credentials, private environment values, customer data, proprietary source, private repository paths, or private domain identifiers into code, fixtures, snapshots, documentation, branch names, commits, issues, or pull requests.
- Reproduce bugs from private applications with the smallest synthetic, domain-neutral fixture that preserves the relevant behavior. Do not copy private schemas, prompts, names, or sample records.
- Before publishing or pushing, inspect the staged diff and proposed public metadata for secrets, machine-specific paths, and private terminology.
- Use obviously fake secret values in tests. Assertions and diagnostic output must prove those values are absent from stdout, stderr, errors, events, and snapshots.

## Git and issue workflow

- Do not create commits, branches, pull requests, issue comments, or pushes unless the user asks for that workflow.
- Ask first before commiting or pushing directly to `main` about creating a focused feature branch and a pull request for review.
- Before committing, inspect the complete staged diff and run the relevant validation commands. Never claim a check passed unless its current run completed successfully.
- When work is tied to a GitHub issue, read the full issue and relevant comments before implementation. Refer to it with both its number and title, and do not create or update an issue when the association is uncertain.
- Keep commit and pull-request descriptions factual: describe the final behavior, the reason for the change, validation performed, and material limitations. Do not include abandoned approaches unless they explain a reviewer-relevant tradeoff.

## Required commands

Run focused commands while developing. Before handing off a code change, run from the repository root:

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

Use these narrower integration commands when relevant:

```sh
pnpm test:modules
pnpm test:integration
```

`pnpm test` builds before running all configured Vitest projects. Direct Vitest or IDE runs that launch fixtures against package exports require a fresh build after production changes.
