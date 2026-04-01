"use client";

import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  usePublicationsNewsLatestQuery,
  type PublicationsNewsLatestResponse,
  type PublicationsNewsSource,
} from "@/lib/api/generated/backend";

type PublicationItem = PublicationsNewsLatestResponse["groups"]["pubmed"][number];

const SourceSection = ({
  source,
  items,
}: {
  source: PublicationsNewsSource;
  items: PublicationItem[];
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
      <HStack justify="space-between" mb={4}>
        <Text fontWeight="700">{source === "pubmed" ? "PubMed" : "Europe PMC"}</Text>
        <Badge colorScheme={items.length ? "green" : "gray"}>{items.length}</Badge>
      </HStack>

      {items.length ? (
        <VStack align="stretch" spacing={4}>
          {items.map((item) => {
            const meta = [item.journal, item.pubdate, item.doi].filter(Boolean).join(" · ");
            return (
              <Box key={`${item.source}-${item.pmid}`} pb={3} borderBottomWidth="1px">
                <Text fontWeight="600" mb={1}>
                  {item.title}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={1}>
                  {item.authors.slice(0, 6).join(", ") || "Unknown authors"}
                </Text>
                {meta ? (
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    {meta}
                  </Text>
                ) : null}
                <Link href={item.url} color="teal.600" isExternal>
                  Open publication
                </Link>
              </Box>
            );
          })}
        </VStack>
      ) : (
        <Text color="gray.500">No items from this source for the selected day.</Text>
      )}
    </Box>
  );
};

export default function PublicationsPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");

  const todayQuery = usePublicationsNewsLatestQuery({
    query: submittedQuery,
    day_offset: 0,
    max_results_per_source: 10,
    sources: ["pubmed", "europepmc"],
  });
  const yesterdayQuery = usePublicationsNewsLatestQuery({
    query: submittedQuery,
    day_offset: 1,
    max_results_per_source: 10,
    sources: ["pubmed", "europepmc"],
  });

  const error = todayQuery.error ?? yesterdayQuery.error;
  const loading = todayQuery.isFetching || yesterdayQuery.isFetching;

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>Publications News</Heading>
        <Text color="gray.600" maxW="5xl">
          New publications grouped by source, with Today and Yesterday loaded by default.
          The current sources are PubMed and Europe PMC through the standalone publications microservice.
        </Text>
      </Box>

      <Box
        p={5}
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="2xl"
        boxShadow="sm"
      >
        <HStack align="end" spacing={4}>
          <FormControl>
            <FormLabel>Optional query</FormLabel>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Leave blank for latest general publications, or enter e.g. glycolysis"
            />
          </FormControl>
          <Button colorScheme="green" onClick={() => setSubmittedQuery(query)} isLoading={loading}>
            Refresh
          </Button>
        </HStack>
      </Box>

      {error ? (
        <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl">
          <Text color="red.700">
            {error instanceof Error ? error.message : "Failed to load publications."}
          </Text>
        </Box>
      ) : null}

      {[
        { label: "Today", payload: todayQuery.data },
        { label: "Yesterday", payload: yesterdayQuery.data },
      ].map((section) => {
        return (
          <Box key={section.label}>
            <HStack justify="space-between" mb={3}>
              <Heading size="md">{section.label}</Heading>
              <Badge colorScheme="blue">
                {(section.payload?.total_count ?? 0).toString()} publications
              </Badge>
            </HStack>
            <Text fontSize="sm" color="gray.500" mb={4}>
              {section.payload?.date_label ?? "Loading..."}
            </Text>

            <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={4}>
              <SourceSection
                source="pubmed"
                items={section.payload?.groups?.pubmed ?? []}
              />
              <SourceSection
                source="europepmc"
                items={section.payload?.groups?.europepmc ?? []}
              />
            </SimpleGrid>
          </Box>
        );
      })}
    </VStack>
  );
}
