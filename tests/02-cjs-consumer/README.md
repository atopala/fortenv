# CJS Fortenv consumer

Private integration project with `"type": "commonjs"`. Applications use CommonJS require and consume Fortenv's built package exports. Config remains ESM `fortenv.config.mjs`; `.cjs` configs are not added to the library contract.

| Folder                                            | Coverage                                                       |
| ------------------------------------------------- | -------------------------------------------------------------- |
| [01-esm-dependency](01-esm-dependency/CONTEXT.md) | CJS consumer → actual ESM package                              |
| [02-cjs-dependency](02-cjs-dependency/CONTEXT.md) | CJS consumer → actual CommonJS package                         |
| [03-bootstrap](03-bootstrap/CONTEXT.md)           | Missing preload, early wrapper calls and unregistered wrappers |

Each dependency combination has seven named Vitest cases, and bootstrap adds three: **17 cases**. Vitest only orchestrates fresh Node processes and checks output/status; it never imports the application or dependency under test into its module runner. The apps contain real assertions and can be debugged directly. There are no source aliases, internal Fortenv imports or mocked loaders. Fixture packages live in `../fixtures` and are private test-only dependencies.

From the repository root:

```sh
pnpm --dir tests/02-cjs-consumer test
pnpm test:modules
```

Select any adjacent `.test.ts` suite/case in WebStorm. Build first after production changes. See each context file for standalone Node commands. Only source `.test.ts` files are collected; dist is excluded. The ESM Vitest config uses `.mts` independently of the application's module system.
