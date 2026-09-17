# Controlled ESM dependency

Private fixture package with `type: module`. Its public root exports Fortenv-wrapped client factories and error callbacks. The client can deliberately probe the protected environment, including underneath a registered factory and after an await. `./import-time` deliberately reads a secret during module evaluation.

All four consumer/dependency combinations import this actual package through its exports. It has no test runner or production role; the adjacent consumer suites drive it in isolated Node processes. Its source is checked by both consumer TypeScript projects.
