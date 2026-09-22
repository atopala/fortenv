import type { Metadata } from "next";

import { CodeBlock } from "../components/code-block";

export const metadata: Metadata = { title: "Examples" };

const examples = [
   {
      number: "01",
      title: "Database factory",
      description: "Give a client constructor its URL without leaving that URL available through process.env.",
      code: `export const createDb = fortenv.string(({ DATABASE_URL }: SecretValues<"DATABASE_URL">) => {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is required");
  return new DatabaseClient(DATABASE_URL);
});`,
   },
   {
      number: "02",
      title: "Payload signing",
      description: "Keep a private signing key scoped to one explicit operation.",
      code: `export const signPayload = fortenv.string(
  ({ PRIVATE_KEY }: SecretValues<"PRIVATE_KEY">, payload) => {
    if (!PRIVATE_KEY) throw new Error("PRIVATE_KEY is required");
    return sign(payload, PRIVATE_KEY);
  }
);`,
   },
   {
      number: "03",
      title: "Pino security events",
      description: "Forward denied reads to an existing logger without adding Pino to Fortenv core.",
      code: `import { connectFortenv } from "@fortenv/pino";
import pino from "pino";

const logger = pino();
const disconnect = connectFortenv(logger);`,
   },
   {
      number: "04",
      title: "Protect without granting",
      description: "An empty array removes ambient access while delivering the value to no wrapper.",
      code: `export default defineConfig({
  secrets: {
    LEGACY_ADMIN_TOKEN: [],
  },
});`,
   },
];

export default function Examples() {
   return (
      <main className="examples-page">
         <header className="examples-header">
            <p className="kicker">PATTERNS</p>
            <h1>Small boundaries for familiar Node.js code.</h1>
            <p>
               Each pattern keeps the permission visible beside the function that uses it. These snippets assume startup
               with <code>node --import fortenv/register</code>.
            </p>
         </header>
         <div className="example-list">
            {examples.map((example) => (
               <article className="example-row" key={example.number}>
                  <div className="example-copy">
                     <span>{example.number}</span>
                     <h2>{example.title}</h2>
                     <p>{example.description}</p>
                  </div>
                  <CodeBlock code={example.code} />
               </article>
            ))}
         </div>
         <div className="sandbox-note">
            <span>INTERACTIVE EXAMPLES</span>
            <div>
               <h2>Browser sandboxes come after runtime verification.</h2>
               <p>
                  Fortenv relies on Node 22 preload and environment behavior. StackBlitz or another hosted runner will
                  be linked only after it passes the same integration assertions as local Node.
               </p>
            </div>
         </div>
      </main>
   );
}
