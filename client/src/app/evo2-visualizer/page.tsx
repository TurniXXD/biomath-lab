"use client";

import { useMemo, useState } from "react";
import {
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
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from "@chakra-ui/react";
import DNASequenceWorkspace from "@/components/DNASequence/DNASequenceWorkspace";
import { useDNASequence } from "@/components/DNASequence/DNASequenceProvider";
import {
  useEvo2GenerateQuery,
} from "@/lib/api/generated/backend";

const DEFAULT_SEQUENCE = "ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG";

const countBases = (sequence: string) => {
  return [...sequence].reduce<Record<string, number>>(
    (counts, base) => {
      counts[base] = (counts[base] ?? 0) + 1;
      return counts;
    },
    { A: 0, C: 0, G: 0, T: 0, N: 0 },
  );
};

const gcContent = (sequence: string) => {
  if (!sequence.length) {
    return 0;
  }

  const gc = [...sequence].filter((base) => base === "G" || base === "C").length;
  return (gc / sequence.length) * 100;
};

const sparkPath = (values: number[], width: number, height: number) => {
  if (!values.length) {
    return "";
  }

  const maxValue = Math.max(...values, 1);

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - (value / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

const SequencePanel = ({
  title,
  sequence,
  accent,
}: {
  title: string;
  sequence: string;
  accent: string;
}) => {
  return (
    <Box
      p={5}
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="2xl"
      boxShadow="sm"
    >
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="600">{title}</Text>
        <Text fontSize="sm" color="gray.500">
          {sequence.length} nt
        </Text>
      </HStack>
      <Box
        fontFamily="mono"
        whiteSpace="pre-wrap"
        wordBreak="break-word"
        bgGradient={`linear(to-r, ${accent}, transparent)`}
        bgClip="text"
      >
        {sequence || "No sequence available yet."}
      </Box>
    </Box>
  );
};

export default function Evo2VisualizerPage() {
  const { sequence } = useDNASequence();
  const [numTokens, setNumTokens] = useState(120);
  const [temperature, setTemperature] = useState(0.7);
  const [topK, setTopK] = useState(3);
  const seedSequence = sequence || DEFAULT_SEQUENCE;
  const [submittedRequest, setSubmittedRequest] = useState<{
    sequence: string;
    num_tokens: number;
    temperature: number;
    top_k: number;
    enable_sampled_probs: boolean;
    enable_elapsed_ms_per_token: boolean;
  } | null>(null);
  const resultQuery = useEvo2GenerateQuery(submittedRequest, Boolean(submittedRequest));
  const result = resultQuery.data ?? null;
  const loading = resultQuery.isFetching;
  const error = resultQuery.error;

  const generatedComposition = useMemo(
    () => countBases(result?.generated_sequence ?? ""),
    [result],
  );

  const probabilityPath = useMemo(
    () => sparkPath(result?.sampled_probs ?? [], 920, 200),
    [result],
  );
  const latencyPath = useMemo(
    () => sparkPath(result?.elapsed_ms_per_token ?? [], 920, 200),
    [result],
  );

  const handleGenerate = () => {
    setSubmittedRequest({
      sequence: seedSequence,
      num_tokens: numTokens,
      temperature,
      top_k: topK,
      enable_sampled_probs: true,
      enable_elapsed_ms_per_token: true,
    });
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>Evo 2 Visualizer</Heading>
        <Text color="gray.600" maxW="4xl">
          Generate DNA continuations with NVIDIA Evo 2 through the Python backend,
          then inspect sequence composition, confidence, and token latency on one page.
        </Text>
      </Box>

      <DNASequenceWorkspace title="Shared DNA workspace" />

      <Grid templateColumns={{ base: "1fr", xl: "420px 1fr" }} gap={6} alignItems="start">
        <GridItem>
          <VStack
            align="stretch"
            spacing={5}
            p={5}
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="2xl"
            boxShadow="sm"
          >
            <Box p={4} bg="gray.50" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
              <Text fontWeight="600" mb={2}>
                Active seed
              </Text>
              <Text fontFamily="mono" fontSize="sm" wordBreak="break-word">
                {seedSequence}
              </Text>
              <Text fontSize="sm" color="gray.600" mt={2}>
                Edit the shared sequence workspace above to change the Evo 2 seed.
              </Text>
            </Box>

            <FormControl>
              <FormLabel>Generated tokens</FormLabel>
              <Slider min={10} max={500} step={10} value={numTokens} onChange={setNumTokens}>
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Text mt={2} fontSize="sm" color="gray.600">
                {numTokens} tokens
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Temperature</FormLabel>
              <Slider
                min={0}
                max={1.5}
                step={0.05}
                value={temperature}
                onChange={setTemperature}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Text mt={2} fontSize="sm" color="gray.600">
                {temperature.toFixed(2)}
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Top K</FormLabel>
              <Input
                type="number"
                min={1}
                max={6}
                value={topK}
                onChange={(event) => setTopK(Number(event.target.value) || 1)}
              />
            </FormControl>

            <Button colorScheme="green" onClick={handleGenerate} isLoading={loading}>
              Generate with Evo 2
            </Button>

            {error ? (
              <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl">
                <Text color="red.700">
                  {error instanceof Error ? error.message : "Failed to call Evo 2."}
                </Text>
              </Box>
            ) : null}

            <Box p={4} bg="gray.900" color="white" borderRadius="xl">
              <Text fontWeight="600" mb={2}>
                Backend note
              </Text>
              <Text fontSize="sm" color="whiteAlpha.900">
                The FastAPI server forwards this request to NVIDIA&apos;s Evo 2 endpoint.
                Set <code>NVIDIA_API_KEY</code> in the server environment before using it.
              </Text>
            </Box>
          </VStack>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={4}>
            <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={4}>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>Input length</StatLabel>
                <StatNumber>{result?.input_sequence.length ?? 0}</StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>Generated length</StatLabel>
                <StatNumber>{result?.generated_sequence.length ?? 0}</StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>GC content</StatLabel>
                <StatNumber>
                  {result ? `${gcContent(result.full_sequence).toFixed(1)}%` : "0%"}
                </StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>Elapsed</StatLabel>
                <StatNumber>{result?.elapsed_ms ?? 0} ms</StatNumber>
              </Stat>
            </SimpleGrid>

            <Grid templateColumns={{ base: "1fr", lg: "1.25fr 0.75fr" }} gap={4}>
              <SequencePanel
                title="Generated continuation"
                sequence={result?.generated_sequence ?? ""}
                accent="green.600"
              />

              <Box
                p={5}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="2xl"
                boxShadow="sm"
              >
                <Text fontWeight="600" mb={4}>
                  Base composition
                </Text>
                <VStack align="stretch" spacing={3}>
                  {(["A", "C", "G", "T", "N"] as const).map((base) => {
                    const count = generatedComposition[base] ?? 0;
                    const total = result?.generated_sequence.length ?? 0;
                    const width = total > 0 ? `${(count / total) * 100}%` : "0%";

                    return (
                      <Box key={base}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontFamily="mono">{base}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {count}
                          </Text>
                        </HStack>
                        <Box h="8px" bg="gray.100" borderRadius="full" overflow="hidden">
                          <Box h="100%" w={width} bg="green.500" />
                        </Box>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            </Grid>

            <SequencePanel
              title="Full sequence"
              sequence={result?.full_sequence ?? ""}
              accent="teal.600"
            />

            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
              <Box
                p={5}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="2xl"
                boxShadow="sm"
              >
                <Text fontWeight="600" mb={3}>
                  Sampled probability by generated token
                </Text>
                {result?.sampled_probs.length ? (
                  <svg width="100%" viewBox="0 0 920 220">
                    <defs>
                      <linearGradient id="probabilityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="920" height="200" rx="16" fill="#f8fafc" />
                    <path d={probabilityPath} fill="none" stroke="url(#probabilityGradient)" strokeWidth="4" />
                  </svg>
                ) : (
                  <Text color="gray.500">No probability trace returned by the model.</Text>
                )}
              </Box>

              <Box
                p={5}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="2xl"
                boxShadow="sm"
              >
                <Text fontWeight="600" mb={3}>
                  Token latency profile
                </Text>
                {result?.elapsed_ms_per_token.length ? (
                  <svg width="100%" viewBox="0 0 920 220">
                    <defs>
                      <linearGradient id="latencyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0f766e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="920" height="200" rx="16" fill="#f8fafc" />
                    <path d={latencyPath} fill="none" stroke="url(#latencyGradient)" strokeWidth="4" />
                  </svg>
                ) : (
                  <Text color="gray.500">No per-token timing trace returned by the model.</Text>
                )}
              </Box>
            </Grid>
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}
