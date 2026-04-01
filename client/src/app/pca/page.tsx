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

const samplePoints = [
  [2, 1],
  [3, 2],
  [4, 2],
  [5, 4],
  [6, 4],
];

export default function PcaPage() {
  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>PCA</Heading>
        <Text color="gray.600">
          Principal Component Analysis rotates data into orthogonal directions
          of maximal variance, then optionally drops the low-variance axes.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Sample size</StatLabel>
          <StatNumber>{samplePoints.length}</StatNumber>
        </Stat>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Dimensions</StatLabel>
          <StatNumber>2</StatNumber>
        </Stat>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Main idea</StatLabel>
          <StatNumber>Variance</StatNumber>
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
              Suppose we observe five 2D samples:
            </Text>

            <BlockMath
              math={String.raw`X=
              \begin{bmatrix}
              2 & 1\\
              3 & 2\\
              4 & 2\\
              5 & 4\\
              6 & 4
              \end{bmatrix}`}
            />

            <Text mb={3}>
              First center the data by subtracting the mean vector{" "}
              <InlineMath math={String.raw`\mu`} />. Then compute the covariance
              matrix:
            </Text>

            <BlockMath
              math={String.raw`C=\frac{1}{n-1}(X-\mu)^{\top}(X-\mu)
              \approx
              \begin{bmatrix}
              2.5 & 1.75\\
              1.75 & 1.5
              \end{bmatrix}`}
            />

            <Text mb={3}>
              PCA finds eigenvectors of <InlineMath math="C" />. The dominant
              eigenvector gives the first principal component:
            </Text>

            <BlockMath
              math={String.raw`v_1 \approx
              \begin{bmatrix}
              0.79\\
              0.61
              \end{bmatrix},
              \qquad
              z=(X-\mu)v_1`}
            />

            <Text color="gray.700">
              This says the strongest direction in the cloud is a positively
              sloped axis. Projecting onto <InlineMath math="v_1" /> compresses
              the 2D data into one coordinate while keeping most of the spread.
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
                Interpretation
              </Heading>

              <UnorderedList spacing={2}>
                <ListItem>
                  PC1 points along the direction of greatest variation.
                </ListItem>
                <ListItem>
                  PC2 is orthogonal to PC1 and explains the remaining variance.
                </ListItem>
                <ListItem>
                  Keeping only the first few PCs gives dimensionality reduction.
                </ListItem>
                <ListItem>
                  In biology, PCA is often used to summarize gene-expression or
                  genotype variation across samples.
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
                Core Formula
              </Heading>

              <BlockMath
                math={String.raw`\text{maximize } \mathrm{Var}(Xw)
                \quad \text{subject to } \|w\|=1`}
              />

              <Text fontSize="sm" color="whiteAlpha.800">
                The solution is the eigenvector of the covariance matrix with
                the largest eigenvalue.
              </Text>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}
