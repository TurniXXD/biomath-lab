"use client";

import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMetabolismProviderSearchQuery, type MetabolismProvider } from "@/lib/api/generated/backend";

type KnowledgeExplorerProps = {
  provider: MetabolismProvider;
  title: string;
  description: string;
  placeholder: string;
  hint: string;
  defaultQuery: string;
};

export default function KnowledgeExplorer({
  provider,
  title,
  description,
  placeholder,
  hint,
  defaultQuery,
}: KnowledgeExplorerProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [submittedQuery, setSubmittedQuery] = useState(defaultQuery);
  const resultQuery = useMetabolismProviderSearchQuery(
    provider,
    submittedQuery,
    Boolean(submittedQuery),
  );

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>{title}</Heading>
        <Text color="gray.600" maxW="4xl">
          {description}
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
        <VStack align="stretch" spacing={4}>
          <FormControl>
            <FormLabel>Search query</FormLabel>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
            />
          </FormControl>

          <Button
            colorScheme="green"
            onClick={() => setSubmittedQuery(query)}
            isLoading={resultQuery.isFetching}
          >
            Search {title}
          </Button>

          <Text fontSize="sm" color="gray.500">
            {hint}
          </Text>
        </VStack>
      </Box>

      {resultQuery.error ? (
        <Box p={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl">
          <Text color="red.700">
            {resultQuery.error instanceof Error
              ? resultQuery.error.message
              : `Failed to query ${provider}.`}
          </Text>
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
        <Text fontWeight="600" mb={4}>
          Results
        </Text>

        {resultQuery.data?.items.length ? (
          <VStack align="stretch" spacing={3}>
            {resultQuery.data.items.map((item) => {
              return (
                <Box key={`${item.source}-${item.id}`} py={2} borderBottomWidth="1px">
                  <Text fontWeight="600">{item.name}</Text>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    {item.id} · {item.source.toUpperCase()}
                  </Text>
                  {item.summary ? (
                    <Text fontSize="sm" color="gray.700" mb={2}>
                      {item.summary}
                    </Text>
                  ) : null}
                  {item.url ? (
                    <Link href={item.url} color="teal.600" isExternal>
                      Open source entry
                    </Link>
                  ) : null}
                </Box>
              );
            })}
          </VStack>
        ) : (
          <Text color="gray.500">
            Search for a pathway or metabolite to inspect matches from {title}.
          </Text>
        )}
      </Box>
    </VStack>
  );
}
