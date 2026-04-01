"use client";

import {
  Badge,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { useDNASequence } from "./DNASequenceProvider";

const gcContent = (sequence: string) => {
  if (!sequence.length) {
    return 0;
  }

  const gc = [...sequence].filter((base) => base === "G" || base === "C").length;
  return (gc / sequence.length) * 100;
};

const sequencePreview = (sequence: string) => {
  if (sequence.length <= 48) {
    return sequence;
  }

  return `${sequence.slice(0, 24)}...${sequence.slice(-24)}`;
};

export default function DNASequenceWorkspace({
  title = "DNA workspace",
}: {
  title?: string;
}) {
  const {
    sequence,
    name,
    source,
    savedRecordId,
    savedAt,
    isLoadingRemote,
    isSaving,
    error,
    email,
    setSequence,
    setName,
    setSource,
    restoreFromFile,
    saveSequence,
    clearSequence,
  } = useDNASequence();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const stats = useMemo(() => {
    return {
      length: sequence.length,
      gc: gcContent(sequence),
      preview: sequencePreview(sequence),
    };
  }, [sequence]);

  return (
    <Box
      p={5}
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="2xl"
      boxShadow="sm"
    >
      <HStack justify="space-between" align="start" mb={4}>
        <Box>
          <Text fontWeight="700">{title}</Text>
          <Text fontSize="sm" color="gray.600">
            Upload once, reuse everywhere across the DNA and protein tools.
          </Text>
        </Box>
        <Badge colorScheme={sequence ? "green" : "gray"}>
          {sequence ? `${stats.length} nt` : "empty"}
        </Badge>
      </HStack>

      <Tabs variant="enclosed" size="sm" isFitted>
        <TabList>
          <Tab>Upload</Tab>
          <Tab>Shared sequence</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0} pt={4}>
            <VStack align="stretch" spacing={4}>
              <FormControl>
                <FormLabel>Upload FASTA or plain text</FormLabel>
                <Input
                  type="file"
                  accept=".fa,.fasta,.txt,.seq,text/plain"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }

                    setUploadError(null);
                    void restoreFromFile(file).catch((fileError: unknown) => {
                      setUploadError(
                        fileError instanceof Error
                          ? fileError.message
                          : "Failed to read the uploaded file.",
                      );
                    });
                  }}
                />
                <FormHelperText>
                  Headers starting with `&gt;` are ignored; only A, C, G, T, and N are kept.
                </FormHelperText>
              </FormControl>

              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Example sequence"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Sequence</FormLabel>
                <Textarea
                  value={sequence}
                  onChange={(event) => setSequence(event.target.value)}
                  minH="180px"
                  fontFamily="mono"
                  placeholder="Paste DNA here..."
                />
                <FormHelperText>{stats.length} nucleotides after sanitizing.</FormHelperText>
              </FormControl>

              {uploadError ? (
                <Box p={3} bg="red.50" borderRadius="lg" borderWidth="1px" borderColor="red.200">
                  <Text color="red.700" fontSize="sm">
                    {uploadError}
                  </Text>
                </Box>
              ) : null}
            </VStack>
          </TabPanel>

          <TabPanel px={0} pt={4}>
            <VStack align="stretch" spacing={4}>
              <Box
                p={4}
                bg="gray.50"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="xl"
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="600">Current sequence</Text>
                  <Badge colorScheme={sequence ? "green" : "gray"}>
                    {sequence ? "Ready" : "Empty"}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  {stats.preview || "No sequence uploaded yet."}
                </Text>
              </Box>

              <SimpleSummary label="Length" value={`${stats.length} nt`} />
              <SimpleSummary label="GC content" value={`${stats.gc.toFixed(1)}%`} />
              <SimpleSummary
                label="Saved record"
                value={savedRecordId ? `#${savedRecordId}` : "Not saved"}
              />
              <SimpleSummary label="Source" value={source || "Manual"} />
              <SimpleSummary
                label="Saved at"
                value={savedAt ? new Date(savedAt).toLocaleString() : "Not saved"}
              />

              {error ? (
                <Box p={3} bg="red.50" borderRadius="lg" borderWidth="1px" borderColor="red.200">
                  <Text color="red.700" fontSize="sm">
                    {error}
                  </Text>
                </Box>
              ) : null}

              <HStack wrap="wrap">
                <Button
                  colorScheme="green"
                  onClick={() => void saveSequence()}
                  isLoading={isSaving}
                  isDisabled={!sequence || !email}
                >
                  Save to DB
                </Button>
                <Button variant="outline" onClick={clearSequence}>
                  Clear
                </Button>
                {isLoadingRemote ? (
                  <Badge colorScheme="blue">Loading saved sequence...</Badge>
                ) : null}
                {!email ? (
                  <Badge colorScheme="orange">Sign in to persist</Badge>
                ) : null}
              </HStack>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

const SimpleSummary = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <HStack justify="space-between" p={3} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg">
      <Text fontSize="sm" color="gray.600">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="600" textAlign="right">
        {value}
      </Text>
    </HStack>
  );
};
