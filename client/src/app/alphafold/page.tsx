"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Tag,
  Text,
  VStack,
  Link,
} from "@chakra-ui/react";
import PdbViewer from "@/components/PdbViewer/PdbViewer";
import DNASequenceWorkspace from "@/components/DNASequence/DNASequenceWorkspace";
import { parsePdb } from "@/utils/parsers/pdb";
import {
  useAlphaFoldLookupQuery,
  useAlphaFoldPdbQuery,
} from "@/lib/api/generated/backend";

const defaultAccession = "P69905";

const confidenceColor = (label?: string | null) => {
  switch (label) {
    case "Very high":
      return "green";
    case "High":
      return "teal";
    case "Low":
      return "orange";
    case "Very low":
      return "red";
    default:
      return "gray";
  }
};

export default function AlphaFoldPage() {
  const [accession, setAccession] = useState(defaultAccession);
  const [submittedAccession, setSubmittedAccession] = useState(defaultAccession);

  const lookupQuery = useAlphaFoldLookupQuery(submittedAccession, true);
  const pdbQuery = useAlphaFoldPdbQuery(submittedAccession, true);

  const lookup = lookupQuery.data ?? null;
  const prediction = lookup?.predictions?.[0] ?? null;
  const pdbText = pdbQuery.data ?? "";

  const structure = useMemo(() => {
    if (!pdbText) {
      return null;
    }

    try {
      return parsePdb(pdbText);
    } catch {
      return null;
    }
  }, [pdbText]);
  const loading = lookupQuery.isFetching || pdbQuery.isFetching;
  const error = lookupQuery.error;
  const pdbError = pdbQuery.error;

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>AlphaFold</Heading>
        <Text color="gray.600">
          Load an AlphaFold prediction by UniProt accession, inspect the
          confidence summary, and render the predicted structure directly in the
          viewer.
        </Text>
      </Box>

      <DNASequenceWorkspace title="Shared DNA workspace" />

      <Grid templateColumns={{ base: "1fr", xl: "360px 1fr" }} gap={6}>
        <GridItem>
          <VStack
            align="stretch"
            spacing={4}
            p={5}
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="2xl"
            boxShadow="sm"
          >
            <FormControl>
              <FormLabel>UniProt accession</FormLabel>
              <Input
                value={accession}
                onChange={(event) => setAccession(event.target.value)}
                placeholder="P69905"
                bg="gray.50"
              />
            </FormControl>

            <HStack>
              <Button
                colorScheme="blue"
                onClick={() => setSubmittedAccession(accession.trim().toUpperCase())}
                isLoading={loading}
              >
                Load AlphaFold
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAccession(defaultAccession);
                  setSubmittedAccession(defaultAccession);
                }}
              >
                Load sample
              </Button>
            </HStack>

            <Box p={4} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
              <Text fontSize="sm" color="gray.600" mb={1}>
                AlphaFold DB accepts UniProt accessions such as reviewed Swiss-Prot entries.
              </Text>
              <Text fontSize="sm" color="gray.800">
                Example: <Text as="span" fontWeight="600">P69905</Text> for hemoglobin subunit alpha.
              </Text>
            </Box>
          </VStack>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={4}>
            {error ? (
              <Alert status="error" borderRadius="xl">
                <AlertIcon />
                {error instanceof Error ? error.message : "Failed to reach the AlphaFold backend."}
              </Alert>
            ) : null}

            {pdbError ? (
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                {pdbError instanceof Error
                  ? pdbError.message
                  : "Failed to load the AlphaFold structure file."}
              </Alert>
            ) : null}

            {lookup ? (
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                  <StatLabel>Prediction</StatLabel>
                  <StatNumber>{lookup.count}</StatNumber>
                </Stat>
                <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                  <StatLabel>Average pLDDT</StatLabel>
                  <StatNumber>{prediction?.average_plddt?.toFixed(2) ?? "—"}</StatNumber>
                </Stat>
                <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                  <StatLabel>Sequence length</StatLabel>
                  <StatNumber>{prediction?.sequence_length ?? "—"}</StatNumber>
                </Stat>
                <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                  <StatLabel>Confidence</StatLabel>
                  <StatNumber>{prediction?.confidence_label ?? "—"}</StatNumber>
                </Stat>
              </SimpleGrid>
            ) : null}

            {prediction ? (
              <Box
                p={5}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="2xl"
                boxShadow="sm"
              >
                <HStack justify="space-between" align="start" mb={4} flexWrap="wrap">
                  <Box>
                    <Heading size="md" mb={1}>
                      {prediction.protein_name ?? prediction.entry_id ?? prediction.accession}
                    </Heading>
                    <Text color="gray.600">
                      {prediction.gene_name ?? "Unknown gene"} ·{" "}
                      {prediction.organism_name ?? "Unknown organism"}
                    </Text>
                  </Box>
                  <HStack spacing={2} flexWrap="wrap">
                    <Tag colorScheme={confidenceColor(prediction.confidence_label)}>
                      {prediction.confidence_label ?? "Unknown"}
                    </Tag>
                    {prediction.reviewed === true ? (
                      <Tag colorScheme="green">Reviewed</Tag>
                    ) : prediction.reviewed === false ? (
                      <Tag colorScheme="gray">Unreviewed</Tag>
                    ) : (
                      <Tag colorScheme="gray">Review status unknown</Tag>
                    )}
                  </HStack>
                </HStack>

                <Text color="gray.700" mb={4}>
                  AlphaFold entry:{" "}
                  <Link href={prediction.entry_url ?? "#"} color="blue.600" isExternal>
                    {prediction.entry_url ?? "Open AlphaFold"}
                  </Link>
                  {" · "}
                  UniProt:{" "}
                  <Link href={prediction.uniprot_url ?? "#"} color="blue.600" isExternal>
                    {prediction.uniprot_url ?? "Open UniProt"}
                  </Link>
                </Text>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box p={4} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                    <Text fontSize="sm" color="gray.500" mb={1}>Entry ID</Text>
                    <Text fontWeight="600">{prediction.entry_id ?? "—"}</Text>
                  </Box>
                  <Box p={4} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                    <Text fontSize="sm" color="gray.500" mb={1}>Accession</Text>
                    <Text fontWeight="600">{prediction.accession}</Text>
                  </Box>
                </SimpleGrid>
              </Box>
            ) : null}

            {prediction?.sequence ? (
              <Box
                p={5}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="2xl"
                boxShadow="sm"
              >
                <Text fontWeight="600" mb={3}>
                  Sequence
                </Text>
                <Text
                  fontFamily="mono"
                  fontSize="sm"
                  lineHeight="1.8"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                  color="gray.700"
                >
                  {prediction.sequence}
                </Text>
              </Box>
            ) : null}

            {structure ? (
              <PdbViewer structure={structure} />
            ) : null}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}
