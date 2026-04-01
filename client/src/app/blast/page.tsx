import DNASequenceWorkspace from "@/components/DNASequence/DNASequenceWorkspace";
import { Heading, Text, VStack } from "@chakra-ui/react";

export default function BlastPage() {
  return (
    <VStack align="stretch" spacing={4}>
      <Heading>BLAST</Heading>
      <Text>
        BLAST searches biological sequence databases using heuristics for fast
        alignment.
      </Text>
      <DNASequenceWorkspace title="Shared DNA workspace" />
    </VStack>
  );
}
