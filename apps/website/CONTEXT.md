# Fortenv website

This private Next.js workspace powers the marketing and documentation site intended for `410.com`. It is deployed independently and is never published with the `fortenv` npm package. Website dependencies do not alter the core package's zero-dependency contract.

The site uses the App Router and a static export. Content must stay consistent with `packages/fortenv/docs/design.md`, the package README, and verified behavior. Do not claim sandboxing, immunity to malicious same-process code, protection after explicit secret delivery, or Linux startup-environment erasure.

Code examples use the dependency-free `app/components/code-block.tsx` server component. It tokenizes JavaScript, TypeScript, and shell snippets into styled spans during rendering, so syntax highlighting adds no browser JavaScript or runtime package.

Routes:

- `/` introduces the problem, the explicit-injection model, and the bootstrap boundary.
- `/docs/getting-started` provides a complete first integration.
- `/docs/security` explains guarantees, responsibilities, and known limitations.
- `/examples` provides copyable, inspectable patterns. Interactive sandboxes require validation of Node 22 preload behavior before linking them.

Run `pnpm website:dev` from the repository root for development and `pnpm build:website` for the static production build.
