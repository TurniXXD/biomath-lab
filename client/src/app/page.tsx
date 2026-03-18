"use client";

import NextLink from "next/link";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";

export default function HomePage() {
  return (
    <VStack align="start" spacing={5}>
      <Badge colorScheme="orange">BioMath Lab</Badge>
      <Heading>Interactive math and biology playground</Heading>
      <Text>
        This is your Linear Algebra & Bioinformatics playground.
      </Text>
      <Text maxW="2xl" color="gray.600">
        Use the sidebar to explore PCA, SVD, BLAST, and the new 3D brain model
        for regional signal exploration.
      </Text>
      <HStack>
        <Button as={NextLink} href="/animations/brain-model" colorScheme="orange">
          Open brain model
        </Button>
        <Button as={NextLink} href="/animations" variant="outline">
          Browse animations
        </Button>
      </HStack>
      <Box
        mt={2}
        p={5}
        borderRadius="2xl"
        bg="white"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        boxShadow="md"
      >
        <Text fontWeight="semibold">Featured scene</Text>
        <Text color="gray.600" mt={1}>
          The interactive brain model combines hemisphere structure, lobe
          filtering, and animated neural activity in a manipulable 3D view.
        </Text>
      </Box>
    </VStack>
  );
}
