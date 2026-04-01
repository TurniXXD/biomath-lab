"use client";

import { useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import { Providers } from "@/Providers";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import "katex/dist/katex.min.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    document.title = "Biomath Lab";
  }, [pathname]);

  return (
    <html lang="en">
      <body>
        <Providers>
          {isLoginPage ? children : <Layout>{children}</Layout>}
        </Providers>
      </body>
    </html>
  );
}
