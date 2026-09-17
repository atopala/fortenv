import Link from "next/link";

import { CodeBlock } from "./components/code-block";

const configCode = `export default defineConfig({
  secrets: {
    DATABASE_URL: [createDb],
    PRIVATE_KEY: [signPayload],
  },
});`;

const wrapperCode = `export const createDb = fortenv(
  ({ DATABASE_URL }) => {
    return new DatabaseClient(DATABASE_URL);
  }
);`;

export default function Home() {
   return (
      <main>
         <section className="hero">
            <div className="hero-copy">
               <div className="eyebrow">
                  <span className="status-pulse" aria-hidden="true" /> Zero runtime dependencies
               </div>
               <h1>
                  Protect your secrets from <span>ambient access.</span>
               </h1>
               <p className="hero-lede">
                  Fortenv removes configured secrets from unrestricted <code>process.env</code> access and injects each
                  value only into the functions you register.
               </p>
               <div className="hero-actions">
                  <Link className="button primary" href="/docs/getting-started">
                     Get started <span aria-hidden="true">→</span>
                  </Link>
                  <Link className="button secondary" href="/docs/security">
                     Read the security model
                  </Link>
               </div>
               <div className="install-command" aria-label="Installation command">
                  <span>$</span>
                  <code>npm install fortenv</code>
               </div>
            </div>

            <div className="boundary-card" aria-label="Fortenv authorization flow">
               <div className="boundary-head">
                  <span>Runtime boundary</span>
                  <span className="live-label">PROTECTED</span>
               </div>
               <div className="secret-source">
                  <span className="node-icon">01</span>
                  <div>
                     <small>CAPTURED AT STARTUP</small>
                     <strong>process.env</strong>
                  </div>
                  <span className="lock" aria-hidden="true">
                     ⌁
                  </span>
               </div>
               <div className="flow-line">
                  <span />
               </div>
               <div className="access-grid">
                  <div className="access-row allowed">
                     <span className="access-icon">✓</span>
                     <div>
                        <strong>createDb()</strong>
                        <small>DATABASE_URL injected</small>
                     </div>
                     <span className="access-state">ALLOW</span>
                  </div>
                  <div className="access-row denied">
                     <span className="access-icon">×</span>
                     <div>
                        <strong>dependency.js</strong>
                        <small>process.env.DATABASE_URL</small>
                     </div>
                     <span className="access-state">DENY</span>
                  </div>
                  <div className="access-row denied">
                     <span className="access-icon">×</span>
                     <div>
                        <strong>unknown code</strong>
                        <small>Object.values(process.env)</small>
                     </div>
                     <span className="access-state">HIDE</span>
                  </div>
               </div>
               <p className="boundary-note">
                  Every protected direct read throws and can emit a structured security event.
               </p>
            </div>
         </section>

         <section className="trust-strip" aria-label="Key properties">
            <span>NODE.JS 22</span>
            <span>ESM</span>
            <span>EXACT FUNCTION IDENTITY</span>
            <span>PINO + OPENTELEMETRY</span>
         </section>

         <section className="section problem-section">
            <div className="section-heading">
               <p className="kicker">THE AMBIENT ACCESS PROBLEM</p>
               <h2>Your process has one environment. Every dependency can ask for it.</h2>
            </div>
            <div className="problem-grid">
               <article className="problem-card danger-card">
                  <div className="card-number">WITHOUT FORTENV</div>
                  <CodeBlock
                     code={`// Any loaded code can attempt this
const url = process.env.DATABASE_URL;

// Or enumerate everything
const snapshot = { ...process.env };`}
                  />
                  <p>Environment variables are convenient, but their default access model is global to the process.</p>
               </article>
               <article className="problem-card safe-card">
                  <div className="card-number">WITH FORTENV</div>
                  <CodeBlock code={wrapperCode} />
                  <p>The registered wrapper receives its configured value. Direct access remains denied everywhere.</p>
               </article>
            </div>
         </section>

         <section className="section architecture-section">
            <div className="section-heading narrow">
               <p className="kicker">TWO-PHASE BOOTSTRAP</p>
               <h2>Know the names before application dependencies execute.</h2>
               <p>
                  Fortenv discovers configured names without loading application imports, protects the environment, then
                  loads the real config to register exact wrapper identities.
               </p>
            </div>
            <ol className="steps">
               <li>
                  <span>01</span>
                  <strong>Discover</strong>
                  <p>Rewrite static config imports to inert placeholders and extract protected names.</p>
               </li>
               <li>
                  <span>02</span>
                  <strong>Shield</strong>
                  <p>Capture values privately, scrub the original environment, and install the guard.</p>
               </li>
               <li>
                  <span>03</span>
                  <strong>Register</strong>
                  <p>Load real wrappers and build the exact-identity access map.</p>
               </li>
               <li>
                  <span>04</span>
                  <strong>Inject</strong>
                  <p>Give every invocation a fresh object containing only its granted keys.</p>
               </li>
            </ol>
         </section>

         <section className="section config-section">
            <div>
               <p className="kicker">SMALL, EXPLICIT CONFIG</p>
               <h2>Permissions stay readable in code review.</h2>
               <p className="section-copy">
                  One map shows which function receives each secret. An empty list protects a name without granting it
                  to anyone.
               </p>
               <ul className="check-list">
                  <li>One wrapper can receive several secrets</li>
                  <li>Several wrappers can share one secret</li>
                  <li>Wrapping a function alone grants nothing</li>
                  <li>Unregistered wrappers receive an empty object</li>
               </ul>
            </div>
            <div className="code-window">
               <div className="code-window-bar">
                  <span />
                  <span />
                  <span />
                  <small>fortenv.config.mjs</small>
               </div>
               <CodeBlock code={configCode} />
            </div>
         </section>

         <section className="section telemetry-section">
            <div className="telemetry-copy">
               <p className="kicker">OBSERVABLE DENIALS</p>
               <h2>See who tried to cross the boundary.</h2>
               <p>
                  Denied reads throw a structured error with the secret name and available caller stack—never the secret
                  value. Connect your existing Pino or OpenTelemetry logger through standalone adapters.
               </p>
               <Link className="text-link" href="/docs/security">
                  Explore telemetry and limitations →
               </Link>
            </div>
            <div className="event-card">
               <div className="event-top">
                  <span>fortenv.security</span>
                  <span>ERROR</span>
               </div>
               <dl>
                  <div>
                     <dt>event</dt>
                     <dd>fortenv.access.denied</dd>
                  </div>
                  <div>
                     <dt>operation</dt>
                     <dd>get</dd>
                  </div>
                  <div>
                     <dt>secret</dt>
                     <dd>DATABASE_URL</dd>
                  </div>
                  <div>
                     <dt>code</dt>
                     <dd>FORTENV_ACCESS_DENIED</dd>
                  </div>
               </dl>
            </div>
         </section>

         <section className="final-cta">
            <p className="kicker">START WITH ONE FACTORY</p>
            <h2>Give one secret a boundary today.</h2>
            <p>Wrap a signing function or database factory, declare its grant, then try a direct environment read.</p>
            <div className="hero-actions">
               <Link className="button primary" href="/docs/getting-started">
                  Read the quick start →
               </Link>
               <Link className="button secondary" href="/examples">
                  Browse examples
               </Link>
            </div>
         </section>
      </main>
   );
}
