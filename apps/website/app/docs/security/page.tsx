import type { Metadata } from "next";

import { CodeBlock } from "../../components/code-block";

export const metadata: Metadata = { title: "Security model" };

export default function SecurityModel() {
   return (
      <article className="doc-article">
         <p className="kicker">SECURITY MODEL</p>
         <h1>Useful boundaries, stated precisely.</h1>
         <p className="doc-lede">
            Fortenv reduces ambient access through Node’s environment API. It does not turn a JavaScript process into a
            sandbox.
         </p>

         <div className="security-summary">
            <div>
               <span>PROTECTS</span>
               <strong>Configured process.env names</strong>
               <p>Direct reads throw; enumeration hides protected names and values.</p>
            </div>
            <div>
               <span>DELIVERS</span>
               <strong>Explicit per-call values</strong>
               <p>Every wrapper receives only the keys assigned to its exact identity.</p>
            </div>
            <div>
               <span>REPORTS</span>
               <strong>Denied access attempts</strong>
               <p>Structured errors and optional security events include caller stacks, never values.</p>
            </div>
         </div>

         <h2>What Fortenv enforces</h2>
         <ul>
            <li>Protection is installed before the real config dependency graph executes.</li>
            <li>Every direct read of a configured key throws, even under an authorized wrapper.</li>
            <li>Enumeration, descriptors, spread, and serialization hide configured keys.</li>
            <li>Only exact wrappers named in the loaded configuration receive grants.</li>
            <li>Each invocation receives a fresh, frozen, null-prototype object.</li>
            <li>Assignment, deletion, and redefinition of protected names are rejected.</li>
         </ul>

         <h2>What remains your responsibility</h2>
         <div className="limitation-list">
            <div>
               <span>01</span>
               <p>
                  <strong>Explicit delivery is a trust decision.</strong> A dependency can retain or leak a value
                  deliberately handed to it.
               </p>
            </div>
            <div>
               <span>02</span>
               <p>
                  <strong>Accessible wrappers can be invoked.</strong> Fortenv authorizes wrapper identity; it does not
                  authenticate the caller.
               </p>
            </div>
            <div>
               <span>03</span>
               <p>
                  <strong>Same-process native and OS access is outside V1.</strong> Fortenv is not a replacement for
                  process or container isolation.
               </p>
            </div>
            <div>
               <span>04</span>
               <p>
                  <strong>Linux may retain the startup environment.</strong> Values present at process launch can remain
                  readable through <code>/proc/self/environ</code>.
               </p>
            </div>
            <div>
               <span>05</span>
               <p>
                  <strong>One module identity matters.</strong> Config and application must use the same wrapper objects
                  and Fortenv runtime instance.
               </p>
            </div>
         </div>

         <h2>Monitoring denied reads</h2>
         <p>
            Connect any observer through the dependency-free telemetry entry, or use the standalone Pino and
            OpenTelemetry adapters.
         </p>
         <CodeBlock
            code={`import { subscribeSecurityEvents } from "fortenv/telemetry";

const disconnect = subscribeSecurityEvents((event) => {
  securityLogger.log(event);
});`}
         />
         <p>
            Set <code>telemetry.enumeration: true</code> to report environment enumeration. Enumeration continues but
            protected keys remain filtered.
         </p>

         <div className="callout">
            <strong>Accurate claim</strong>
            <p>
               Fortenv removes configured secrets from ambient <code>process.env</code> access and injects them only
               into explicitly registered functions.
            </p>
         </div>
      </article>
   );
}
