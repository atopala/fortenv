import type { Metadata } from "next";
import Link from "next/link";

import { CodeBlock } from "../../components/code-block";

export const metadata: Metadata = { title: "Getting started" };

export default function GettingStarted() {
   return (
      <article className="doc-article">
         <p className="kicker">GETTING STARTED</p>
         <h1>Protect your first environment secret.</h1>
         <p className="doc-lede">
            Start with a factory whose dependency needs one secret. The complete setup is three small files and one Node
            preload flag.
         </p>

         <div className="requirement-row">
            <span>Requires</span>
            <strong>Node.js 22.23.2 or later</strong>
            <span>Config</span>
            <strong>.ts · .mts · .js · .mjs</strong>
         </div>

         <h2 id="install">1. Install Fortenv</h2>
         <CodeBlock code="npm install fortenv" language="shell" />

         <h2 id="wrap">2. Wrap the function that needs the secret</h2>
         <p>The callback receives its granted values first. Callers pass only ordinary business arguments.</p>
         <CodeBlock
            code={`// db.mjs
import { fortenv } from "fortenv";
import { DatabaseClient } from "your-database-package";

export const createDb = fortenv(({ DATABASE_URL }, poolSize = 10) => {
  if (DATABASE_URL === undefined) {
    throw new Error("DATABASE_URL is required");
  }
  return new DatabaseClient(DATABASE_URL, { poolSize });
});`}
         />

         <h2 id="configure">3. Register the exact wrapper</h2>
         <p>The config imports definitions. It must not call the wrapper or initialize the database client.</p>
         <CodeBlock
            code={`// fortenv.config.mjs
import { defineConfig } from "fortenv/config";
import { createDb } from "./db.mjs";

export default defineConfig({
  secrets: {
    DATABASE_URL: [createDb],
  },
});`}
         />

         <h2 id="run">4. Start Node with the preload</h2>
         <CodeBlock
            code={`// app.mjs
import { createDb } from "./db.mjs";

const db = createDb(20);`}
         />
         <CodeBlock code="node --import fortenv/register app.mjs" language="shell" />

         <div className="callout important">
            <strong>Keep app startup outside the config dependency graph.</strong>
            <p>
               The config may import factory definitions, but application initialization happens only after preload
               completes.
            </p>
         </div>

         <h2 id="verify">5. Verify the boundary</h2>
         <p>
            A direct read of a configured name throws <code>FortenvAccessError</code>, including inside the registered
            callback or a dependency it calls.
         </p>
         <CodeBlock
            code={`process.env.DATABASE_URL;
// FortenvAccessError: unauthorized access to secret "DATABASE_URL".`}
         />

         <div className="doc-next">
            <span>NEXT</span>
            <Link href="/docs/security">Understand the security model →</Link>
         </div>
      </article>
   );
}
