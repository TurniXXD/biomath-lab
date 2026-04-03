import { Badge, Box, Container, Heading, HStack, SimpleGrid, Stack, Text, VStack } from "@chakra-ui/react";
import type { Metadata } from "next";
import { ArrowRight, Beaker, Radar, Sparkles } from "lucide-react";
import LoginButtons from "./login-buttons";

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl = Array.isArray(searchParams?.callbackUrl)
    ? searchParams?.callbackUrl[0]
    : searchParams?.callbackUrl ?? "/";

  return (
    <Box
      minH="100vh"
      position="relative"
      overflow="hidden"
      bg="gray.950"
      color="white"
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 32%), radial-gradient(circle at right center, rgba(236, 72, 153, 0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #0f172a 54%, #111827 100%)",
        pointerEvents: "none",
      }}
    >
      <Container maxW="7xl" position="relative" zIndex={1} py={{ base: 8, md: 14 }}>
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={{ base: 8, xl: 12 }} alignItems="center">
          <VStack align="stretch" spacing={6}>
            <Badge
              alignSelf="start"
              colorScheme="cyan"
              px={3}
              py={1}
              borderRadius="full"
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Biomath Lab
            </Badge>

            <VStack align="stretch" spacing={4} maxW="2xl">
              <Heading
                size="2xl"
                lineHeight="1.05"
                bgGradient="linear(to-r, white, cyan.200)"
                bgClip="text"
              >
                Sign in to explore simulations, alignments, and interactive biology.
              </Heading>
              <Text fontSize="lg" color="whiteAlpha.800" maxW="2xl">
                One account unlocks the full lab: sequence tools, visualizations,
                publications, and the scientific playground built around them.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box p={4} borderRadius="2xl" bg="whiteAlpha.100" borderWidth="1px" borderColor="whiteAlpha.200">
                <Sparkles size={18} color="#67e8f9" />
                <Text fontWeight="600" mt={3} mb={1}>
                  Interactive scenes
                </Text>
                <Text fontSize="sm" color="whiteAlpha.700">
                  Fractals, 3D systems, and step-by-step algorithm visualizers.
                </Text>
              </Box>

              <Box p={4} borderRadius="2xl" bg="whiteAlpha.100" borderWidth="1px" borderColor="whiteAlpha.200">
                <Radar size={18} color="#f9a8d4" />
                <Text fontWeight="600" mt={3} mb={1}>
                  Bioinformatics tools
                </Text>
                <Text fontSize="sm" color="whiteAlpha.700">
                  Alignment, DNA workspaces, and reusable sequence workflows.
                </Text>
              </Box>

              <Box p={4} borderRadius="2xl" bg="whiteAlpha.100" borderWidth="1px" borderColor="whiteAlpha.200">
                <Beaker size={18} color="#fbbf24" />
                <Text fontWeight="600" mt={3} mb={1}>
                  Science dashboard
                </Text>
                <Text fontSize="sm" color="whiteAlpha.700">
                  Publications, metabolism, and other experimental utilities.
                </Text>
              </Box>
            </SimpleGrid>

            <HStack spacing={4} color="whiteAlpha.700" fontSize="sm" wrap="wrap">
              <HStack spacing={2}>
                <ArrowRight size={14} />
                <Text>Protected access</Text>
              </HStack>
              <HStack spacing={2}>
                <ArrowRight size={14} />
                <Text>Session-based login</Text>
              </HStack>
              <HStack spacing={2}>
                <ArrowRight size={14} />
                <Text>Built for desktop and mobile</Text>
              </HStack>
            </HStack>
          </VStack>

          <Box
            position="relative"
            p={{ base: 4, md: 6 }}
            borderRadius="3xl"
            bg="whiteAlpha.100"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            boxShadow="2xl"
            backdropFilter="blur(18px)"
          >
            <Box
              position="absolute"
              inset="-1px"
              borderRadius="3xl"
              bgGradient="linear(to-br, cyan.400, pink.400, orange.300)"
              opacity={0.16}
              pointerEvents="none"
            />
            <Stack
              position="relative"
              zIndex={1}
              spacing={5}
              p={{ base: 5, md: 7 }}
              borderRadius="2xl"
              bg="gray.950"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
            >
              <Stack spacing={2}>
                <Text fontSize="sm" color="whiteAlpha.600" textTransform="uppercase" letterSpacing="0.12em">
                  Authentication
                </Text>
                <Heading size="lg">Continue with your account</Heading>
                <Text color="whiteAlpha.700">
                  Use one of the providers below to enter the lab and continue
                  where you left off.
                </Text>
              </Stack>

              <LoginButtons callbackUrl={callbackUrl} />

              <Box p={4} borderRadius="2xl" bg="whiteAlpha.50" borderWidth="1px" borderColor="whiteAlpha.200">
                <Text fontSize="sm" color="whiteAlpha.700">
                  Your session is managed by NextAuth. After login, the app returns
                  you to the page you originally requested.
                </Text>
              </Box>
            </Stack>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
