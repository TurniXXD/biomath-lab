"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { CacheProvider } from "@chakra-ui/next-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { DNASequenceProvider } from "@/components/DNASequence/DNASequenceProvider";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  // Throws hydration errors without cache provider
  return (
    <CacheProvider>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <ChakraProvider>
            <DNASequenceProvider>{children}</DNASequenceProvider>
          </ChakraProvider>
        </SessionProvider>
      </QueryClientProvider>
    </CacheProvider>
  );
}
