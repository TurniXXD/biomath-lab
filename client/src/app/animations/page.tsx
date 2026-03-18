"use client";

import NextLink from "next/link";
import { animationList } from "@/components/Animations/animationtsRegistry";
import {
  Badge,
  Box,
  Heading,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";

export default function AnimationsPage() {
  return (
    <VStack align="stretch" spacing={8}>
      <Box>
        <Badge colorScheme="orange" mb={3}>
          Visual Lab
        </Badge>
        <Heading mb={3}>Interactive models and simulations</Heading>
        <Text maxW="3xl" color="gray.600">
          Open a scene to explore geometric systems, scientific simulations,
          and now an interactive brain model with region-level filtering.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
        {animationList.map((animation, index) => {
          return (
            <LinkBox
              key={animation.id}
              p={5}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="blackAlpha.100"
              bg="white"
              boxShadow="md"
              transition="transform 0.18s ease, box-shadow 0.18s ease"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "xl",
              }}
            >
              <Badge colorScheme={index === 0 ? "pink" : "gray"} mb={3}>
                {index === 0 ? "New" : "Scene"}
              </Badge>
              <Heading size="md" mb={2}>
                <LinkOverlay as={NextLink} href={animation.href}>
                  {animation.title}
                </LinkOverlay>
              </Heading>
              <Text color="gray.600">
                {animation.id === "brain-model"
                  ? "Inspect hemispheres, neural clusters, and animated signal pathways."
                  : "Open the scene and interact with the model in 3D."}
              </Text>
            </LinkBox>
          );
        })}
      </SimpleGrid>
    </VStack>
  );
}
