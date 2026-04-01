"use client";

import { useState } from "react";
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
  Select,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  useReactomeAnalyzeGoalQuery,
} from "@/lib/api/generated/backend";

export function ReactomeChatPageContent() {
  const [organism, setOrganism] = useState("Homo sapiens");
  const [target, setTarget] = useState("glucose");
  const [goal, setGoal] = useState("find pathways related to glycolysis control");
  const [modelType, setModelType] = useState("content-service");
  const [submittedRequest, setSubmittedRequest] = useState<{
    organism: string;
    target_metabolite: string;
    goal: string;
    model_type: string;
  } | null>(null);

  const resultQuery = useReactomeAnalyzeGoalQuery(
    submittedRequest,
    Boolean(submittedRequest),
  );

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>Reactome Chat</Heading>
        <Text color="gray.600">
          Form-first Reactome exploration backed by your Python API. Start with
          organism, target, and goal, then inspect the returned pathways and
          reactions.
        </Text>
      </Box>

      <Grid templateColumns={{ base: "1fr", xl: "420px 1fr" }} gap={6}>
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
              <FormLabel>Organism</FormLabel>
              <Input value={organism} onChange={(event) => setOrganism(event.target.value)} />
            </FormControl>

            <FormControl>
              <FormLabel>Target metabolite / entity</FormLabel>
              <Input value={target} onChange={(event) => setTarget(event.target.value)} />
            </FormControl>

            <FormControl>
              <FormLabel>Goal</FormLabel>
              <Input value={goal} onChange={(event) => setGoal(event.target.value)} />
            </FormControl>

            <FormControl>
              <FormLabel>Model type</FormLabel>
              <Select value={modelType} onChange={(event) => setModelType(event.target.value)}>
                <option value="content-service">Content Service</option>
                <option value="heuristic-goal-analysis">Heuristic goal analysis</option>
              </Select>
            </FormControl>

            <Button
              colorScheme="green"
              onClick={() =>
                setSubmittedRequest({
                  organism,
                  target_metabolite: target,
                  goal,
                  model_type: modelType,
                })
              }
              isLoading={resultQuery.isFetching}
            >
              Analyze with Reactome
            </Button>
          </VStack>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={4}>
            {resultQuery.error ? (
              <Box
                p={4}
                bg="red.50"
                borderWidth="1px"
                borderColor="red.200"
                borderRadius="xl"
              >
                <Text color="red.700">
                  {resultQuery.error instanceof Error
                    ? resultQuery.error.message
                    : "Failed to reach the Reactome backend."}
                </Text>
              </Box>
            ) : null}

            {resultQuery.data ? (
              <>
                <Box p={5} bg="gray.900" color="white" borderRadius="2xl" boxShadow="sm">
                  <Text fontWeight="600" mb={2}>
                    Assistant summary
                  </Text>
                  <Text color="whiteAlpha.900">{resultQuery.data.narrative}</Text>
                </Box>

                {resultQuery.data.top_pathway ? (
                  <Box
                    p={5}
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="2xl"
                    boxShadow="sm"
                  >
                    <Text fontWeight="600" mb={2}>
                      Top pathway
                    </Text>
                    <Text fontSize="lg">{resultQuery.data.top_pathway.display_name}</Text>
                    <Text fontSize="sm" color="gray.500" mb={3}>
                      {resultQuery.data.top_pathway.st_id} · {resultQuery.data.top_pathway.species}
                    </Text>
                    <Text color="gray.700" mb={4}>
                      {resultQuery.data.top_pathway.summary || "No summary returned."}
                    </Text>

                    <HStack align="start" spacing={8}>
                      <Box flex="1">
                        <Text fontWeight="600" mb={2}>
                          Contained events
                        </Text>
                        {resultQuery.data.top_pathway.contained_events.slice(0, 8).map((item) => {
                          return (
                            <Text key={`${item.st_id ?? item.name}-event`} fontSize="sm" mb={1}>
                              {item.name}
                            </Text>
                          );
                        })}
                      </Box>
                      <Box flex="1">
                        <Text fontWeight="600" mb={2}>
                          Participants
                        </Text>
                        {resultQuery.data.top_pathway.participants.slice(0, 8).map((item) => {
                          return (
                            <Text key={`${item.st_id ?? item.name}-participant`} fontSize="sm" mb={1}>
                              {item.name}
                            </Text>
                          );
                        })}
                      </Box>
                    </HStack>
                  </Box>
                ) : null}

                <Box
                  p={5}
                  bg="white"
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="2xl"
                  boxShadow="sm"
                >
                  <Text fontWeight="600" mb={3}>
                    Pathway hits
                  </Text>
                  {resultQuery.data.pathway_hits.map((item) => {
                    return (
                      <Box key={`${item.st_id ?? item.name}-hit`} py={2} borderBottomWidth="1px">
                        <Text>{item.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {item.st_id} · {item.schema_class} · {item.species}
                        </Text>
                      </Box>
                    );
                  })}
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
                    Reactions
                  </Text>
                  {resultQuery.data.reactions.map((item) => {
                    return (
                      <Box key={`${item.st_id ?? item.display_name}-reaction`} py={2} borderBottomWidth="1px">
                        <Text>{item.display_name}</Text>
                        <Text fontSize="sm" color="gray.500" mb={1}>
                          {item.st_id} · {item.schema_class}
                        </Text>
                        <Text fontSize="sm" color="gray.700">
                          Inputs: {item.inputs.map((input) => input.name).join(", ") || "None"} ·
                          Outputs: {item.outputs.map((output) => output.name).join(", ") || "None"}
                        </Text>
                      </Box>
                    );
                  })}
                </Box>
              </>
            ) : (
              <Box p={5} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl">
                <Text color="gray.500">
                  Run an analysis to see pathways, reactions, and the generated narrative.
                </Text>
              </Box>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}

export default function ReactomeChatPage() {
  return <ReactomeChatPageContent />;
}
