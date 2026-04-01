"use client";

import { useMemo, useState } from "react";
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
  Select,
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
import {
  useMetabolismSimulationQuery,
  type ObjectiveMode,
} from "@/lib/api/generated/backend";

type PathwayLaneProps = {
  label: string;
  subtitle: string;
  equation: string;
  flux: number;
  maxFlux: number;
  color: string;
};

const pathwayColors = {
  glycolysis: "#22c55e",
  pentose_phosphate_pathway: "#f59e0b",
  pyruvate_oxidation: "#38bdf8",
  krebs_cycle: "#a855f7",
  electron_transport_chain: "#ef4444",
} as const;

const formatNumber = (value: number) => {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
};

const PathwayLane = ({
  label,
  subtitle,
  equation,
  flux,
  maxFlux,
  color,
}: PathwayLaneProps) => {
  const animationDuration = `${Math.max(1.2, 5 - Math.min(flux, 4))}s`;
  const pulseOpacity = flux > 0.02 ? 1 : 0.2;

  return (
    <Box
      p={4}
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="2xl"
      boxShadow="sm"
      overflow="hidden"
      position="relative"
      sx={{
        "@keyframes metaboliteFlow": {
          "0%": { transform: "translateX(0%)", opacity: 0.15 },
          "12%": { opacity: 1 },
          "100%": { transform: "translateX(730px)", opacity: 0.1 },
        },
      }}
    >
      <HStack justify="space-between" align="start" mb={3}>
        <Box>
          <Text fontWeight="700">{label}</Text>
          <Text fontSize="sm" color="gray.600">
            {subtitle}
          </Text>
        </Box>
        <Badge colorScheme={flux > 0.02 ? "green" : "gray"}>
          flux {formatNumber(flux)}
        </Badge>
      </HStack>

      <Text fontSize="sm" color="gray.500" mb={3}>
        {equation}
      </Text>

      <Box h="12px" bg="gray.100" borderRadius="full" position="relative" overflow="hidden">
        <Box
          h="100%"
          w={
            maxFlux <= 0
              ? "6%"
              : `${Math.max(6, Math.min(100, (flux / maxFlux) * 100))}%`
          }
          bg={color}
          borderRadius="full"
          opacity={pulseOpacity}
          transition="width 0.3s ease"
        />

        {flux > 0.02
          ? [0, 1, 2].map((index) => {
              return (
                <Box
                  key={index}
                  position="absolute"
                  top="-3px"
                  left="-20px"
                  w="18px"
                  h="18px"
                  borderRadius="full"
                  bg={color}
                  opacity={0.95}
                  boxShadow={`0 0 0 4px ${color}22`}
                  animation={`metaboliteFlow ${animationDuration} linear infinite`}
                  sx={{
                    animationDelay: `${index * 0.5}s`,
                  }}
                />
              );
            })
          : null}
      </Box>
    </Box>
  );
};

export default function MetabolismPage() {
  const [glucose, setGlucose] = useState(10);
  const [oxygen, setOxygen] = useState(30);
  const [adp, setAdp] = useState(60);
  const [nad, setNad] = useState(40);
  const [nadp, setNadp] = useState(15);
  const [fad, setFad] = useState(10);
  const [objectiveMode, setObjectiveMode] = useState<ObjectiveMode>("balanced");
  const [submittedRequest, setSubmittedRequest] = useState({
    glucose: 10,
    oxygen: 30,
    adp: 60,
    nad: 40,
    nadp: 15,
    fad: 10,
    objective_mode: "balanced" as ObjectiveMode,
  });

  const resultQuery = useMetabolismSimulationQuery(submittedRequest, true);
  const result = resultQuery.data;
  const loading = resultQuery.isFetching;
  const error = resultQuery.error;

  const maxFlux = useMemo(() => {
    if (!result) {
      return 0;
    }

    return Math.max(
      result.pathway_fluxes.glycolysis,
      result.pathway_fluxes.pentose_phosphate_pathway,
      result.pathway_fluxes.pyruvate_oxidation,
      result.pathway_fluxes.krebs_cycle,
      result.pathway_fluxes.electron_transport_chain,
    );
  }, [result]);

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>Metabolism Simulator</Heading>
        <Text color="gray.600" maxW="5xl">
          Explore a toy steady-state metabolic network solved with COBRApy. The page
          links glycolysis, the pentose phosphate pathway, pyruvate oxidation, the
          Krebs cycle, and the electron transport chain, then shows how ATP and reducing
          equivalent outputs respond when you change the available substrates.
        </Text>
      </Box>

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
            <FormControl>
              <FormLabel>Objective mode</FormLabel>
              <Select
                value={objectiveMode}
                onChange={(event) => setObjectiveMode(event.target.value as ObjectiveMode)}
              >
                <option value="balanced">Balanced energy</option>
                <option value="atp">Max ATP</option>
                <option value="nadph">Max NADPH / biosynthesis</option>
              </Select>
            </FormControl>

            {[
              { label: "Glucose", value: glucose, setValue: setGlucose, max: 40 },
              { label: "Oxygen", value: oxygen, setValue: setOxygen, max: 120 },
              { label: "ADP", value: adp, setValue: setAdp, max: 160 },
              { label: "NAD+", value: nad, setValue: setNad, max: 120 },
              { label: "NADP+", value: nadp, setValue: setNadp, max: 80 },
              { label: "FAD", value: fad, setValue: setFad, max: 60 },
            ].map((control) => {
              return (
                <FormControl key={control.label}>
                  <FormLabel>{control.label}</FormLabel>
                  <Slider
                    min={0}
                    max={control.max}
                    step={1}
                    value={control.value}
                    onChange={control.setValue}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <Text mt={2} fontSize="sm" color="gray.600">
                    {control.value}
                  </Text>
                </FormControl>
              );
            })}

            <Button
              colorScheme="green"
              onClick={() =>
                setSubmittedRequest({
                  glucose,
                  oxygen,
                  adp,
                  nad,
                  nadp,
                  fad,
                  objective_mode: objectiveMode,
                })
              }
              isLoading={loading}
            >
              Run COBRApy simulation
            </Button>

            <Box p={4} bg="gray.900" color="white" borderRadius="xl">
              <Text fontWeight="600" mb={2}>
                Model note
              </Text>
              <Text fontSize="sm" color="whiteAlpha.900">
                This is a compact teaching model, not a genome-scale reconstruction.
                It uses COBRApy steady-state flux balance to route available glucose and
                cofactors through the core carbon-energy pathways.
              </Text>
            </Box>
          </VStack>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={4}>
            {error ? (
              <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl">
                <Text color="red.700">
                  {error instanceof Error
                    ? error.message
                    : "Failed to reach the metabolism backend."}
                </Text>
              </Box>
            ) : null}

            <SimpleGrid columns={{ base: 2, lg: 3 }} spacing={4}>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>ATP</StatLabel>
                <StatNumber>{formatNumber(result?.outputs.atp ?? 0)}</StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>NADH</StatLabel>
                <StatNumber>{formatNumber(result?.outputs.nadh ?? 0)}</StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>NADPH</StatLabel>
                <StatNumber>{formatNumber(result?.outputs.nadph ?? 0)}</StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>FADH2</StatLabel>
                <StatNumber>{formatNumber(result?.outputs.fadh2 ?? 0)}</StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>CO2</StatLabel>
                <StatNumber>{formatNumber(result?.outputs.co2 ?? 0)}</StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>Ribose-5P</StatLabel>
                <StatNumber>{formatNumber(result?.outputs.ribose5p ?? 0)}</StatNumber>
              </Stat>
            </SimpleGrid>

            <Box p={5} bg="gray.900" color="white" borderRadius="2xl" boxShadow="sm">
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontWeight="600" mb={1}>
                    Solver summary
                  </Text>
                  <Text color="whiteAlpha.900">{result?.message ?? "Waiting for simulation."}</Text>
                </Box>
                <Badge colorScheme={result?.solver_status === "optimal" ? "green" : "yellow"}>
                  {result?.solver_status ?? "idle"}
                </Badge>
              </HStack>
            </Box>

            <VStack align="stretch" spacing={4}>
              <PathwayLane
                label="Glycolysis"
                subtitle="Glucose to pyruvate with ATP and NADH generation"
                equation="Glucose + 2 ADP + 2 NAD+ -> 2 Pyruvate + 2 ATP + 2 NADH"
                flux={result?.pathway_fluxes.glycolysis ?? 0}
                maxFlux={maxFlux}
                color={pathwayColors.glycolysis}
              />
              <PathwayLane
                label="Pentose Phosphate Pathway"
                subtitle="Redox and ribose branch"
                equation="Glucose + 2 NADP+ -> Ribose-5P + 2 NADPH + CO2"
                flux={result?.pathway_fluxes.pentose_phosphate_pathway ?? 0}
                maxFlux={maxFlux}
                color={pathwayColors.pentose_phosphate_pathway}
              />
              <PathwayLane
                label="Pyruvate Oxidation"
                subtitle="Mitochondrial feed into acetyl-CoA"
                equation="2 Pyruvate + 2 NAD+ -> 2 Acetyl-CoA + 2 NADH + 2 CO2"
                flux={result?.pathway_fluxes.pyruvate_oxidation ?? 0}
                maxFlux={maxFlux}
                color={pathwayColors.pyruvate_oxidation}
              />
              <PathwayLane
                label="Krebs Cycle"
                subtitle="TCA energy extraction from acetyl-CoA"
                equation="2 Acetyl-CoA + 2 ADP + 6 NAD+ + 2 FAD -> 2 ATP + 6 NADH + 2 FADH2 + 4 CO2"
                flux={result?.pathway_fluxes.krebs_cycle ?? 0}
                maxFlux={maxFlux}
                color={pathwayColors.krebs_cycle}
              />
              <PathwayLane
                label="Electron Transport Chain"
                subtitle="Oxidative phosphorylation"
                equation="10 NADH + 2 FADH2 + 26 ADP + 6 O2 -> 26 ATP + regenerated cofactors"
                flux={result?.pathway_fluxes.electron_transport_chain ?? 0}
                maxFlux={maxFlux}
                color={pathwayColors.electron_transport_chain}
              />
            </VStack>

            <Box p={5} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm">
              <Text fontWeight="600" mb={3}>
                Flux interpretation
              </Text>
              <Text color="gray.700" mb={2}>
                The brightest lanes are the pathways carrying the most steady-state flux under the
                current substrate limits. Increase oxygen to strengthen ETC and ATP yield, or shift
                the objective toward NADPH to redirect more glucose into the pentose phosphate pathway.
              </Text>
              <Text fontSize="sm" color="gray.500">
                Peak displayed pathway width is normalized against the current maximum flux of{" "}
                {formatNumber(maxFlux)}.
              </Text>
            </Box>

            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
              <Box p={5} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm">
                <HStack justify="space-between" mb={4}>
                  <Text fontWeight="600">Flux balance analysis</Text>
                  <Badge colorScheme="teal">
                    {result?.flux_balance_analysis?.objective_sense ?? "maximize"}
                  </Badge>
                </HStack>
                <Text color="gray.700" mb={3}>
                  Objective reaction:{" "}
                  <Text as="span" fontWeight="600">
                    {result?.flux_balance_analysis?.objective_reaction ?? "None"}
                  </Text>
                </Text>
                <SimpleGrid columns={2} spacing={3}>
                  {Object.entries(result?.flux_balance_analysis?.constrained_uptakes ?? {}).map(
                    ([key, value]) => {
                      return (
                        <Box key={key} p={3} bg="gray.50" borderRadius="xl">
                          <Text fontSize="sm" color="gray.500" textTransform="capitalize">
                            {key}
                          </Text>
                          <Text fontWeight="700">{formatNumber(value)}</Text>
                        </Box>
                      );
                    },
                  )}
                </SimpleGrid>
              </Box>

              <Box p={5} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm">
                <Text fontWeight="600" mb={4}>
                  Shadow prices
                </Text>
                <VStack align="stretch" spacing={3}>
                  {(result?.flux_balance_analysis?.shadow_prices ?? []).map((entry) => {
                    const magnitude = Math.min(100, Math.abs(entry.value) * 100);
                    return (
                      <Box key={entry.metabolite_id}>
                        <HStack justify="space-between" mb={1}>
                          <Text>{entry.label}</Text>
                          <Text fontWeight="600">{formatNumber(entry.value)}</Text>
                        </HStack>
                        <Box h="8px" bg="gray.100" borderRadius="full" overflow="hidden">
                          <Box
                            h="100%"
                            w={`${magnitude}%`}
                            bg={entry.value >= 0 ? "cyan.500" : "orange.400"}
                            borderRadius="full"
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
            </Grid>

            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
              <Box p={5} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm">
                <HStack justify="space-between" mb={4}>
                  <Text fontWeight="600">Metabolic flux analysis</Text>
                  <Badge colorScheme="purple">
                    dominant {result?.flux_analysis.dominant_pathway ?? "None"}
                  </Badge>
                </HStack>

                <VStack align="stretch" spacing={3}>
                  {[
                    ["glycolysis", "Glycolysis"],
                    ["pentose_phosphate_pathway", "PPP"],
                    ["pyruvate_oxidation", "Pyruvate Oxidation"],
                    ["krebs_cycle", "Krebs"],
                    ["electron_transport_chain", "ETC"],
                  ].map(([key, label]) => {
                    const value = (result?.flux_analysis.glucose_partition?.[key] ?? 0) * 100;

                    return (
                      <Box key={key}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm">{label}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {formatNumber(value)}%
                          </Text>
                        </HStack>
                        <Box h="9px" bg="gray.100" borderRadius="full" overflow="hidden">
                          <Box
                            h="100%"
                            w={`${Math.max(0, Math.min(100, value))}%`}
                            bg={pathwayColors[key as keyof typeof pathwayColors]}
                            borderRadius="full"
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>

              <Box p={5} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm">
                <Text fontWeight="600" mb={4}>
                  Yield metrics
                </Text>
                <SimpleGrid columns={2} spacing={4}>
                  <Stat>
                    <StatLabel>ATP / glucose</StatLabel>
                    <StatNumber fontSize="xl">
                      {formatNumber(result?.flux_analysis.yield_metrics.atp_per_glucose ?? 0)}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>NADH / glucose</StatLabel>
                    <StatNumber fontSize="xl">
                      {formatNumber(result?.flux_analysis.yield_metrics.nadh_per_glucose ?? 0)}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>NADPH / glucose</StatLabel>
                    <StatNumber fontSize="xl">
                      {formatNumber(result?.flux_analysis.yield_metrics.nadph_per_glucose ?? 0)}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>O2 utilization</StatLabel>
                    <StatNumber fontSize="xl">
                      {formatNumber((result?.flux_analysis.yield_metrics.oxygen_utilization ?? 0) * 100)}%
                    </StatNumber>
                  </Stat>
                </SimpleGrid>
              </Box>
            </Grid>

            <Box p={5} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm">
              <Text fontWeight="600" mb={4}>
                Reaction flux table
              </Text>
              <VStack align="stretch" spacing={3}>
                {(result?.flux_analysis.reaction_fluxes ?? []).map((entry) => {
                  return (
                    <Box key={entry.reaction_id}>
                      <HStack justify="space-between" mb={1}>
                        <Box>
                          <Text>{entry.label}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {entry.reaction_id}
                          </Text>
                        </Box>
                        <Text fontWeight="600">{formatNumber(entry.flux)}</Text>
                      </HStack>
                      <Box h="8px" bg="gray.100" borderRadius="full" overflow="hidden">
                        <Box
                          h="100%"
                          w={`${Math.max(0, Math.min(100, entry.normalized_flux * 100))}%`}
                          bg="teal.500"
                          borderRadius="full"
                        />
                      </Box>
                    </Box>
                  );
                })}
              </VStack>
            </Box>

            <Box p={5} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm">
              <Text fontWeight="600" mb={4}>
                Reduced costs
              </Text>
              <VStack align="stretch" spacing={3}>
                {(result?.flux_balance_analysis?.reduced_costs ?? []).map((entry) => {
                  const magnitude = Math.min(100, Math.abs(entry.value) * 100);
                  return (
                    <Box key={entry.reaction_id}>
                      <HStack justify="space-between" mb={1}>
                        <Box>
                          <Text>{entry.label}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {entry.reaction_id}
                          </Text>
                        </Box>
                        <Text fontWeight="600">{formatNumber(entry.value)}</Text>
                      </HStack>
                      <Box h="8px" bg="gray.100" borderRadius="full" overflow="hidden">
                        <Box
                          h="100%"
                          w={`${magnitude}%`}
                          bg={entry.value >= 0 ? "purple.500" : "pink.400"}
                          borderRadius="full"
                        />
                      </Box>
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}
