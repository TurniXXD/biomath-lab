"use client";

import Layout from "@/components/Layout/Layout";
import { Providers } from "@/Providers";
import type { ReactNode } from "react";

import "katex/dist/katex.min.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
