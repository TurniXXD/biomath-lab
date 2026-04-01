"use client";

import NextLink from "next/link";
import { animationList } from "@/components/Animations/animationtsRegistry";
import {
  animationSectionMap,
  animationSections,
} from "@/components/Animations/animationSections";
import {
  Badge,
  Box,
  Heading,
  HStack,
  Link,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";

export default function AnimationsPage() {
  const groupedAnimations = animationSections.map((section) => {
    return {
      ...section,
      items: animationList.filter((animation) => {
        return animationSectionMap[animation.id] === section.id;
      }),
    };
  });

  return (
    <VStack align="stretch" spacing={8}>
      <Box>
        <Badge colorScheme="orange" mb={3}>
          Visual Lab
        </Badge>
        <Heading mb={3}>Interactive models and simulations</Heading>
        <Text maxW="3xl" color="gray.600">
          Open a scene to explore geometric systems, scientific simulations,
          and sequence-alignment visualizations for both global and local
          alignment.
        </Text>
      </Box>

      <HStack spacing={3} wrap="wrap">
        {animationSections.map((section) => {
          const count = animationList.filter((animation) => {
            return animationSectionMap[animation.id] === section.id;
          }).length;

          return (
            <Link
              key={section.id}
              href={`#${section.id}`}
              px={3}
              py={2}
              borderRadius="full"
              bg="white"
              borderWidth="1px"
              borderColor="blackAlpha.100"
              fontSize="sm"
              fontWeight="semibold"
              color="gray.700"
            >
              {section.title} {count}
            </Link>
          );
        })}
      </HStack>

      {groupedAnimations.map((section) => {
        if (section.items.length === 0) {
          return null;
        }

        return (
          <Box key={section.id} id={section.id} scrollMarginTop="24px">
            <Box mb={4}>
              <Heading size="lg" mb={1}>
                {section.title}
              </Heading>
              <Text color="gray.600">{section.description}</Text>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={5}>
              {section.items.map((animation, index) => {
                const isFeatured =
                  index === 0 ||
                  animation.id === "needleman-wunsch" ||
                  animation.id === "sierpinski-triangle-zoom" ||
                  animation.id === "cup-to-toroid-morph" ||
                  animation.id === "menger-sponge";

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
                    <Badge colorScheme={isFeatured ? "pink" : "gray"} mb={3}>
                      {isFeatured ? "New" : "Scene"}
                    </Badge>
                    <Heading size="md" mb={2}>
                      <LinkOverlay as={NextLink} href={animation.href}>
                        {animation.title}
                      </LinkOverlay>
                    </Heading>
                    <Text color="gray.600">
                      {animation.id === "brain-model"
                        ? "Inspect hemispheres, neural clusters, and animated signal pathways."
                        : animation.id === "cone-pine"
                          ? "Watch layered needle rings sway and spin into a conifer-like cone canopy."
                        : animation.id === "hyperbolic-paraboloid"
                          ? "Explore a saddle surface that curves up in one direction and down in the other."
                        : animation.id === "mandelbrot-set"
                          ? "Pan the complex plane, zoom into boundary detail, and watch escape-time color bands emerge."
                        : animation.id === "menger-sponge"
                          ? "Rotate a recursive cube fractal and inspect how each subdivision removes the center plus face cubes."
                            : animation.id === "needleman-wunsch"
                              ? "Watch dynamic programming fill the matrix, then compare global and local traceback."
                              : animation.id === "sierpinski-triangle-zoom"
                                ? "Zoom endlessly into the fractal and watch the same self-similar structure repeat at every scale."
                                : animation.id === "cup-to-toroid-morph"
                                  ? "Watch a cup-like form continuously deform into a toroid and back while the hole count stays unchanged."
                                  : animation.id === "succulent"
                                    ? "Follow the spiral leaf phyllotaxis as the rosette pulses and slowly turns."
                                  : animation.id === "game-of-life"
                                    ? "Paint cells, load classic patterns, and simulate emergent behavior."
                                    : animation.id === "golden-ratio"
                                      ? "See Fibonacci tiling converge toward phi with a geometric spiral."
                                      : "Open the scene and interact with the model in 3D."}
                    </Text>
                  </LinkBox>
                );
              })}
            </SimpleGrid>
          </Box>
        );
      })}
    </VStack>
  );
}
