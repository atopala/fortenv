import "./styles.css";

import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
   metadataBase: new URL("https://410.com"),
   title: { default: "Fortenv — Boundaries for process.env secrets", template: "%s · Fortenv" },
   description:
      "Remove configured secrets from ambient process.env access and inject them only into explicitly registered functions.",
};

const navigation = [
   { href: "/docs/getting-started", label: "Docs" },
   { href: "/docs/security", label: "Security" },
   { href: "/examples", label: "Examples" },
];

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
   return (
      <html lang="en">
         <body>
            <header className="site-header">
               <Link className="wordmark" href="/" aria-label="Fortenv home">
                  <span className="wordmark-mark" aria-hidden="true">
                     F
                  </span>
                  <span>fortenv</span>
               </Link>
               <nav aria-label="Primary navigation">
                  {navigation.map((item) => (
                     <Link href={item.href} key={item.href}>
                        {item.label}
                     </Link>
                  ))}
               </nav>
               <a className="header-cta" href="https://github.com/atopala/fortenv">
                  View source <span aria-hidden="true">↗</span>
               </a>
            </header>
            {children}
            <footer className="site-footer">
               <div>
                  <Link className="wordmark" href="/">
                     <span className="wordmark-mark" aria-hidden="true">
                        F
                     </span>
                     <span>fortenv</span>
                  </Link>
                  <p>Explicit secret delivery for Node.js.</p>
               </div>
               <div className="footer-links">
                  <Link href="/docs/getting-started">Documentation</Link>
                  <Link href="/docs/security">Security model</Link>
                  <Link href="/examples">Examples</Link>
               </div>
               <p className="footer-meta">Apache-2.0 · Node.js 22.23.2+</p>
            </footer>
         </body>
      </html>
   );
}
