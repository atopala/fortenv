import Link from "next/link";
import type { ReactNode } from "react";

const docs = [
   { href: "/docs/getting-started", label: "Getting started" },
   { href: "/docs/security", label: "Security model" },
   { href: "/examples", label: "Examples" },
];

export default function DocsLayout({ children }: Readonly<{ children: ReactNode }>) {
   return (
      <main className="docs-shell">
         <aside className="docs-sidebar">
            <p className="sidebar-label">DOCUMENTATION</p>
            <nav aria-label="Documentation navigation">
               {docs.map((item) => (
                  <Link href={item.href} key={item.href}>
                     {item.label}
                  </Link>
               ))}
            </nav>
            <div className="version-card">
               <span>V1</span>
               <p>
                  Node.js 22.23.2+
                  <br />
                  ESM configuration
               </p>
            </div>
         </aside>
         <div className="docs-content">{children}</div>
      </main>
   );
}
