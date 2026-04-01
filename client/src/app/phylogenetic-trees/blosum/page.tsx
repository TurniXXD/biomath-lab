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
import { BlockMath } from "react-katex";
import DNASequenceWorkspace from "@/components/DNASequence/DNASequenceWorkspace";

export default function BlosumPage() {
  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>BLOSUM</Heading>
        <Text color="gray.600">
          BLOSUM matrices score amino-acid substitutions from conserved blocks
          of protein families without assuming a fixed evolutionary path.
        </Text>
      </Box>

      <DNASequenceWorkspace title="Shared DNA workspace" />

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Built from</StatLabel>
          <StatNumber>Observed blocks</StatNumber>
        </Stat>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Common choice</StatLabel>
          <StatNumber>BLOSUM62</StatNumber>
        </Stat>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Use case</StatLabel>
          <StatNumber>Protein alignment</StatNumber>
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
              Mathematical Idea
            </Heading>
            <Text mb={3}>
              BLOSUM scores are log-odds values comparing observed substitution
              frequencies against random expectation.
            </Text>
            <BlockMath
              math={String.raw`s_{ij}=\lambda^{-1}\log\left(\frac{q_{ij}}{p_i p_j}\right)`}
            />
            <Text color="gray.700">
              Positive scores favor biologically plausible substitutions;
              negative scores penalize unlikely ones.
            </Text>
          </Box>
        </GridItem>

        <GridItem>
          <Box
            p={5}
            bg="gray.900"
            color="white"
            borderRadius="2xl"
            boxShadow="sm"
          >
            <Heading size="md" mb={4}>
              Practical Notes
            </Heading>
            <UnorderedList spacing={2}>
              <ListItem>
                Higher numbers like BLOSUM80 are stricter and favor close
                matches.
              </ListItem>
              <ListItem>
                Lower numbers like BLOSUM45 are looser and better for more
                distant proteins.
              </ListItem>
              <ListItem>
                BLOSUM62 is the common default in many alignment tools.
              </ListItem>
            </UnorderedList>
          </Box>
        </GridItem>
      </Grid>
    </VStack>
  );
}
