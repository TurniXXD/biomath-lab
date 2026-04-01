"use client";

import {
  Box,
  Grid,
  GridItem,
  Heading,
  ListItem,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  UnorderedList,
  VStack,
} from "@chakra-ui/react";
import { BlockMath, InlineMath } from "react-katex";

export default function SvdPage() {
  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>SVD</Heading>
        <Text color="gray.600">
          Singular Value Decomposition factorizes any matrix into orthogonal
          input directions, orthogonal output directions, and nonnegative
          scaling strengths.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Factorization</StatLabel>
          <StatNumber>A = UΣVᵀ</StatNumber>
        </Stat>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Works for</StatLabel>
          <StatNumber>Any matrix</StatNumber>
        </Stat>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Main use</StatLabel>
          <StatNumber>Low rank</StatNumber>
        </Stat>
      </SimpleGrid>

      <Grid templateColumns={{ base: "1fr", xl: "1.1fr 0.9fr" }} gap={6}>
        <GridItem>
          <Box
            p={5}
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="2xl"
            boxShadow="sm"
          >
            <Heading size="md" mb={4}>
              Worked Example
            </Heading>

            <Text mb={3}>
              Consider the matrix
            </Text>

            <BlockMath
              math={String.raw`A=
              \begin{bmatrix}
              3 & 1\\
              1 & 3
              \end{bmatrix}`}
            />

            <Text mb={3}>
              Its singular value decomposition has the form
            </Text>

            <BlockMath
              math={String.raw`A=U\Sigma V^{\top},
              \qquad
              \Sigma=
              \begin{bmatrix}
              4 & 0\\
              0 & 2
              \end{bmatrix}`}
            />

            <Text mb={3}>
              Because this matrix is symmetric, the left and right singular
              vectors align with the same rotated basis:
            </Text>

            <BlockMath
              math={String.raw`U=V=
              \frac{1}{\sqrt{2}}
              \begin{bmatrix}
              1 & 1\\
              1 & -1
              \end{bmatrix}`}
            />

            <Text color="gray.700">
              Geometrically, <InlineMath math="V^{\top}" /> rotates the input,
              <InlineMath math="\Sigma" /> stretches by factors 4 and 2, and{" "}
              <InlineMath math="U" /> rotates again into the output basis.
            </Text>
          </Box>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={6}>
            <Box
              p={5}
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="2xl"
              boxShadow="sm"
            >
              <Heading size="md" mb={4}>
                Why It Matters
              </Heading>

              <UnorderedList spacing={2}>
                <ListItem>
                  Truncated SVD gives the best low-rank approximation in least
                  squares error.
                </ListItem>
                <ListItem>
                  It powers compression, denoising, latent semantic analysis,
                  and many bioinformatics pipelines.
                </ListItem>
                <ListItem>
                  Small singular values often correspond to weak or noisy
                  directions in the data.
                </ListItem>
              </UnorderedList>
            </Box>

            <Box
              p={5}
              bg="gray.900"
              color="white"
              borderRadius="2xl"
              boxShadow="sm"
            >
              <Heading size="md" mb={4}>
                Rank-1 Approximation
              </Heading>

              <BlockMath
                math={String.raw`A \approx \sigma_1 u_1 v_1^{\top}`}
              />

              <Text fontSize="sm" color="whiteAlpha.800" mb={3}>
                Keeping only the largest singular value and its vectors captures
                the strongest structure in the matrix.
              </Text>

              <BlockMath
                math={String.raw`A_k = \sum_{i=1}^{k}\sigma_i u_i v_i^{\top}`}
              />
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}
