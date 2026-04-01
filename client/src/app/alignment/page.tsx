"use client";

import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  useAlignmentAlignQuery,
  type AlignmentAlignRequest,
  type AlignmentMode,
} from "@/lib/api/alignment";

const SAMPLE_A = "GATTACA";
const SAMPLE_B = "GCATGCU";

const normalizeSequence = (value: string) => {
  return value.replace(/\s+/g, "").toUpperCase();
};

const prettyOperation = (value: string) => {
  return value.replace(/_/g, " ");
};

export default function AlignmentPage() {
  const [sequenceA, setSequenceA] = useState(SAMPLE_A);
  const [sequenceB, setSequenceB] = useState(SAMPLE_B);
  const [mode, setMode] = useState<AlignmentMode>("global");
  const [matchScore, setMatchScore] = useState(2);
  const [mismatchScore, setMismatchScore] = useState(-1);
  const [gapPenalty, setGapPenalty] = useState(-2);
  const [submittedRequest, setSubmittedRequest] = useState<AlignmentAlignRequest | null>(null);

  const resultQuery = useAlignmentAlignQuery(submittedRequest, Boolean(submittedRequest));
  const result = resultQuery.data ?? null;

  const handleRun = () => {
    setSubmittedRequest({
      sequence_a: normalizeSequence(sequenceA),
      sequence_b: normalizeSequence(sequenceB),
      mode,
      scoring: {
        match_score: matchScore,
        mismatch_score: mismatchScore,
        gap_penalty: gapPenalty,
      },
    });
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>Sequence Alignment</Heading>
        <Text color="gray.600" maxW="4xl">
          Run Needleman-Wunsch or Smith-Waterman through the FastAPI server. The
          server forwards each request to the Rust alignment service, so the client
          only talks to one backend.
        </Text>
      </Box>

      <Grid templateColumns={{ base: "1fr", xl: "420px 1fr" }} gap={6} alignItems="start">
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
              <FormLabel>Sequence A</FormLabel>
              <Textarea
                value={sequenceA}
                onChange={(event) => setSequenceA(event.target.value)}
                rows={4}
                fontFamily="mono"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Sequence B</FormLabel>
              <Textarea
                value={sequenceB}
                onChange={(event) => setSequenceB(event.target.value)}
                rows={4}
                fontFamily="mono"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Alignment mode</FormLabel>
              <Select value={mode} onChange={(event) => setMode(event.target.value as AlignmentMode)}>
                <option value="global">Global alignment</option>
                <option value="local">Local alignment</option>
              </Select>
            </FormControl>

            <SimpleGrid columns={3} spacing={3}>
              <FormControl>
                <FormLabel>Match</FormLabel>
                <Input
                  type="number"
                  value={matchScore}
                  onChange={(event) => setMatchScore(Number(event.target.value) || 0)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Mismatch</FormLabel>
                <Input
                  type="number"
                  value={mismatchScore}
                  onChange={(event) => setMismatchScore(Number(event.target.value) || 0)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Gap</FormLabel>
                <Input
                  type="number"
                  value={gapPenalty}
                  onChange={(event) => setGapPenalty(Number(event.target.value) || 0)}
                />
              </FormControl>
            </SimpleGrid>

            <Button colorScheme="green" onClick={handleRun} isLoading={resultQuery.isFetching}>
              Run alignment
            </Button>

            {resultQuery.error ? (
              <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl">
                <Text color="red.700">
                  {resultQuery.error instanceof Error
                    ? resultQuery.error.message
                    : "Failed to run alignment."}
                </Text>
              </Box>
            ) : null}

            <Box p={4} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
              <Text fontWeight="600" mb={2}>
                How it works
              </Text>
              <Text fontSize="sm" color="gray.600">
                The Rust service computes a dynamic-programming table, then
                reconstructs the alignment path during traceback. Global mode
                uses the bottom-right cell, while local mode starts at the best
                scoring cell and stops when the score returns to zero.
              </Text>
            </Box>
          </VStack>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={4}>
            {result ? (
              <>
                <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
                  <Box p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                    <Text fontSize="sm" color="gray.500">
                      Mode
                    </Text>
                    <Heading size="md" textTransform="capitalize">
                      {result.mode}
                    </Heading>
                  </Box>
                  <Box p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                    <Text fontSize="sm" color="gray.500">
                      Score
                    </Text>
                    <Heading size="md">{result.result.score}</Heading>
                  </Box>
                  <Box p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                    <Text fontSize="sm" color="gray.500">
                      Sequence A span
                    </Text>
                    <Heading size="md">
                      {result.result.start_a} - {result.result.end_a}
                    </Heading>
                  </Box>
                  <Box p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                    <Text fontSize="sm" color="gray.500">
                      Sequence B span
                    </Text>
                    <Heading size="md">
                      {result.result.start_b} - {result.result.end_b}
                    </Heading>
                  </Box>
                </SimpleGrid>

                <Box p={5} bg="gray.900" color="white" borderRadius="2xl" boxShadow="sm">
                  <HStack justify="space-between" mb={3}>
                    <Text fontWeight="600">Aligned sequences</Text>
                    <Badge colorScheme="pink">{result.result.operations.length} steps</Badge>
                  </HStack>
                  <VStack align="stretch" spacing={3} fontFamily="mono" fontSize="lg">
                    <Text whiteSpace="pre-wrap" wordBreak="break-word">
                      {result.result.aligned_a}
                    </Text>
                    <Text whiteSpace="pre-wrap" wordBreak="break-word">
                      {result.result.aligned_b}
                    </Text>
                  </VStack>
                </Box>

                <Box p={5} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl">
                  <Text fontWeight="600" mb={3}>
                    Traceback operations
                  </Text>
                  <HStack wrap="wrap" spacing={2}>
                    {result.result.operations.map((operation, index) => {
                      return (
                        <Badge key={`${operation}-${index}`} colorScheme="blue" px={2} py={1}>
                          {prettyOperation(operation)}
                        </Badge>
                      );
                    })}
                  </HStack>
                </Box>
              </>
            ) : (
              <Box p={5} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl">
                <Text color="gray.500">
                  Run an alignment to see the score, traceback path, and reconstructed strings.
                </Text>
              </Box>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}
