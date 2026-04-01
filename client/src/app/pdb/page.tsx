"use client";

import { ChangeEvent, useMemo, useState, useTransition } from "react";
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
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import PdbViewer from "@/components/PdbViewer/PdbViewer";
import DNASequenceWorkspace from "@/components/DNASequence/DNASequenceWorkspace";
import { parsePdb } from "@/utils/parsers/pdb";

const samplePdb = `HEADER    PLANT PROTEIN                           30-APR-81   1CRN
ATOM      1  N   THR A   1      17.047  14.099   3.625  1.00 13.79           N
ATOM      2  CA  THR A   1      16.967  12.784   4.338  1.00 10.80           C
ATOM      3  C   THR A   1      15.685  12.755   5.133  1.00  9.19           C
ATOM      4  O   THR A   1      15.268  13.825   5.594  1.00  9.85           O
ATOM      5  CB  THR A   1      18.170  12.703   5.337  1.00 13.02           C
ATOM      6  OG1 THR A   1      19.334  12.829   4.463  1.00 15.06           O
ATOM      7  CG2 THR A   1      18.150  11.546   6.304  1.00 14.23           C
ATOM      8  N   THR A   2      15.115  11.555   5.265  1.00  7.81           N
ATOM      9  CA  THR A   2      13.856  11.401   6.066  1.00  7.12           C
ATOM     10  C   THR A   2      14.164  10.843   7.461  1.00  6.89           C
ATOM     11  O   THR A   2      15.305  10.599   7.797  1.00  7.41           O
ATOM     12  CB  THR A   2      12.909  10.432   5.347  1.00  7.55           C
ATOM     13  OG1 THR A   2      13.522   9.955   4.148  1.00  8.70           O
ATOM     14  CG2 THR A   2      11.533  11.107   5.060  1.00  8.36           C
ATOM     15  N   CYS A   3      13.137  10.649   8.256  1.00  5.97           N
ATOM     16  CA  CYS A   3      13.269  10.057   9.598  1.00  5.76           C
ATOM     17  C   CYS A   3      12.063   9.156   9.782  1.00  5.70           C
ATOM     18  O   CYS A   3      10.926   9.576   9.545  1.00  6.32           O
ATOM     19  CB  CYS A   3      13.340  11.127  10.687  1.00  6.08           C
ATOM     20  SG  CYS A   3      14.879  11.995  10.834  1.00  7.89           S
ATOM     21  N   CYS A   4      12.331   7.922  10.234  1.00  5.66           N
ATOM     22  CA  CYS A   4      11.281   6.932  10.490  1.00  5.22           C
ATOM     23  C   CYS A   4      10.609   7.150  11.844  1.00  4.87           C
ATOM     24  O   CYS A   4      11.254   7.530  12.819  1.00  5.13           O
ATOM     25  CB  CYS A   4      11.873   5.520  10.404  1.00  5.59           C
ATOM     26  SG  CYS A   4      10.817   4.143  10.643  1.00  6.88           S
ATOM     27  N   PRO A   5       9.306   6.893  11.894  1.00  4.55           N
ATOM     28  CA  PRO A   5       8.570   6.979  13.160  1.00  4.50           C
ATOM     29  C   PRO A   5       8.376   5.614  13.838  1.00  4.48           C
ATOM     30  O   PRO A   5       8.163   4.590  13.189  1.00  4.76           O
ATOM     31  CB  PRO A   5       7.235   7.593  12.707  1.00  4.77           C
ATOM     32  CG  PRO A   5       6.927   6.763  11.482  1.00  4.95           C
ATOM     33  CD  PRO A   5       8.236   6.696  10.720  1.00  4.87           C
END`;

export default function PdbPage() {
  const [pdbText, setPdbText] = useState(samplePdb);
  const [pdbId, setPdbId] = useState("1CRN");
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const parsed = useMemo(() => {
    try {
      return { structure: parsePdb(pdbText), error: null };
    } catch (error) {
      return {
        structure: null,
        error: error instanceof Error ? error.message : "Failed to parse PDB data.",
      };
    }
  }, [pdbText]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    startTransition(() => {
      file
        .text()
        .then((text) => {
          setRemoteError(null);
          setPdbText(text);
        })
        .catch((error: unknown) => {
          setRemoteError(
            error instanceof Error ? error.message : "Failed to read file.",
          );
        });
    });
  };

  const handleLoadSample = () => {
    setRemoteError(null);
    setPdbText(samplePdb);
  };

  const handleFetchById = () => {
    const normalizedId = pdbId.trim().toUpperCase();

    if (!normalizedId) {
      return;
    }

    startTransition(() => {
      setRemoteError(null);
      fetch(`https://files.rcsb.org/download/${normalizedId}.pdb`)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`RCSB returned ${response.status}`);
          }

          const text = await response.text();
          setPdbText(text);
        })
        .catch((error: unknown) => {
          setRemoteError(
            error instanceof Error
              ? `Failed to load ${normalizedId}: ${error.message}`
              : `Failed to load ${normalizedId}.`,
          );
        });
    });
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>PDB Viewer</Heading>
        <Text color="gray.600">
          Load a Protein Data Bank file from disk, paste raw PDB text, or fetch
          a structure by PDB ID.
        </Text>
      </Box>

      <DNASequenceWorkspace title="Shared DNA workspace" />

      <Grid templateColumns={{ base: "1fr", xl: "360px 1fr" }} gap={6}>
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
              <FormLabel>Upload `.pdb` file</FormLabel>
              <Input
                type="file"
                accept=".pdb,.ent,text/plain"
                onChange={handleFileChange}
                bg="gray.50"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Fetch by PDB ID</FormLabel>
              <HStack>
                <Input
                  value={pdbId}
                  onChange={(event) => {
                    setPdbId(event.target.value);
                  }}
                  placeholder="1CRN"
                  bg="gray.50"
                />
                <Button onClick={handleFetchById} isLoading={isPending} colorScheme="blue">
                  Load
                </Button>
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>PDB text</FormLabel>
              <Textarea
                value={pdbText}
                onChange={(event) => {
                  setPdbText(event.target.value);
                }}
                minH="260px"
                fontFamily="mono"
                fontSize="sm"
                resize="vertical"
                bg="gray.50"
              />
            </FormControl>

            <HStack>
              <Button variant="outline" onClick={handleLoadSample}>
                Load sample
              </Button>
            </HStack>
          </VStack>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={4}>
            {remoteError ? (
              <Alert status="warning" borderRadius="xl">
                <AlertIcon />
                {remoteError}
              </Alert>
            ) : null}

            {parsed.error ? (
              <Alert status="error" borderRadius="xl">
                <AlertIcon />
                {parsed.error}
              </Alert>
            ) : null}

            {parsed.structure ? (
              <>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                    <StatLabel>Atoms</StatLabel>
                    <StatNumber>{parsed.structure.atoms.length}</StatNumber>
                  </Stat>
                  <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                    <StatLabel>Residues</StatLabel>
                    <StatNumber>{parsed.structure.residues}</StatNumber>
                  </Stat>
                  <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                    <StatLabel>Chains</StatLabel>
                    <StatNumber>{parsed.structure.chains.length}</StatNumber>
                  </Stat>
                  <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                    <StatLabel>Radius</StatLabel>
                    <StatNumber>{parsed.structure.radius.toFixed(1)} A</StatNumber>
                  </Stat>
                </SimpleGrid>

                <PdbViewer structure={parsed.structure} />
              </>
            ) : null}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}
