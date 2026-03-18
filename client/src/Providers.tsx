"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { CacheProvider } from "@chakra-ui/next-js";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Throws hydration errors without cache provider
  return (
    <CacheProvider>
      <ChakraProvider>{children}</ChakraProvider>
    </CacheProvider>
  );
}