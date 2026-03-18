import { Heading, Text, VStack } from "@chakra-ui/react";

export default function PcaPage() {
  return (
    <VStack align="start" spacing={4}>
      <Heading>PCA</Heading>
      <Text>
        Principal Component Analysis reduces dimensionality by finding
        directions of maximum variance.
      </Text>
    </VStack>
  );
}