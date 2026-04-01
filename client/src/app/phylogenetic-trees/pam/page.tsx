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

export default function PamPage() {
  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>PAM</Heading>
        <Text color="gray.600">
          Point Accepted Mutation matrices model amino-acid substitution by
          extrapolating from closely related proteins.
        </Text>
      </Box>

      <DNASequenceWorkspace title="Shared DNA workspace" />

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Built from</StatLabel>
          <StatNumber>Accepted mutations</StatNumber>
        </Stat>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Reference matrix</StatLabel>
          <StatNumber>PAM1</StatNumber>
        </Stat>
        <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
          <StatLabel>Use case</StatLabel>
          <StatNumber>Close homologs</StatNumber>
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
              PAM starts with a one-step substitution probability matrix and
              projects it forward in evolutionary time.
            </Text>
            <BlockMath math={String.raw`PAM_n = (PAM_1)^n`} />
            <Text color="gray.700">
              Larger PAM numbers correspond to more evolutionary change. For
              example, PAM250 represents a much longer divergence than PAM30.
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
              <ListItem>PAM30 or PAM70 often suit short, close alignments.</ListItem>
              <ListItem>PAM250 is more permissive for distant similarity.</ListItem>
              <ListItem>
                Scores come from log-odds comparisons between observed and
                background substitutions.
              </ListItem>
            </UnorderedList>
          </Box>
        </GridItem>
      </Grid>
    </VStack>
  );
}
