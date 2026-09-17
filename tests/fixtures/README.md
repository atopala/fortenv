# Controlled module dependencies

These private workspace packages are consumed by both integration projects through package names and export maps:

- [esm-dependency](esm-dependency/README.md): `type: module`, ESM exports.
- [cjs-dependency](cjs-dependency/README.md): `type: commonjs`, CommonJS exports.

They mirror the same behaviors in their respective native formats: wrapped client factories, explicit credential passing, optional ambient environment probes, sync/async failures and a separate import-time-read entry. The duplicate definitions are intentional so both module loaders execute real code independently. Neither package is published or added to the Fortenv library's dependencies. Typechecking is included in both consumer projects.
