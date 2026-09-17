# Executable import snapshots

Read [CONTEXT.md](CONTEXT.md) for scenarios and contract boundaries. Compare [named.config.mjs](named.config.mjs) with [its executable snapshot](__snapshots__/named.config.mjs).

From the repository root:

```sh
pnpm build
node packages/fortenv/src/core/__tests__/05-rewrite-imports/__snapshots__/named.config.mjs
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/05-rewrite-imports
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/05-rewrite-imports -t 'transforms named.config.mjs'
```

The generated module uses the built production mock loader. Open it in your IDE and run/debug it as a Node module. Update generated files through Vitest and review the output:

```sh
pnpm --dir packages/fortenv exec vitest run src/core/__tests__/05-rewrite-imports --update
```

The exact transformed body sits inside an async execution harness, followed by console.dir of the config. This uses ordinary Node execution; the production VM is covered by stage 07. The snapshots retain whitespace and capture current transformer behavior, not universal config-grammar acceptance.
