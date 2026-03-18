"use client";

import { Flex, Box } from "@chakra-ui/react";
import Sidebar from "./Sidebar";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Flex minH="100vh">
      <Sidebar />
      <Box flex="1" p={8} bg="gray.50">
        {children}
      </Box>
    </Flex>
  );
}