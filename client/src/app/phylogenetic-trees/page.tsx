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
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { BlockMath } from "react-katex";
import DNASequenceWorkspace from "@/components/DNASequence/DNASequenceWorkspace";
import { useDNASequence } from "@/components/DNASequence/DNASequenceProvider";

type SequenceEntry = {
  id: string;
  label: string;
  sequence: string;
};

type ModelType = "jc69" | "k80";

type DistanceRow = {
  from: string;
  to: string;
  value: number;
};

type TreeNode = {
  label: string;
  height: number;
  size: number;
  left?: TreeNode;
  right?: TreeNode;
};

type PositionedNode = {
  node: TreeNode;
  x: number;
  y: number;
};

const defaultSequences: SequenceEntry[] = [
  { id: "seq-1", label: "Human", sequence: "ATGCTAGCTAGCTAACGTTACGTA" },
  { id: "seq-2", label: "Chimp", sequence: "ATGCTAGCTAGCTAACGCTACGTA" },
  { id: "seq-3", label: "Gorilla", sequence: "ATGCTAGCTTGCTAACGCTACATA" },
  { id: "seq-4", label: "Orangutan", sequence: "ATGCCAGCTTGCTAACACTACATA" },
];

const isTransition = (a: string, b: string) => {
  return (
    (a === "A" && b === "G") ||
    (a === "G" && b === "A") ||
    (a === "C" && b === "T") ||
    (a === "T" && b === "C")
  );
};

const sanitizeSequence = (value: string) => {
  return value.toUpperCase().replace(/[^ACGT]/g, "");
};

const computeDistance = (
  left: string,
  right: string,
  model: ModelType,
) => {
  let differences = 0;
  let transitions = 0;
  let transversions = 0;

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] === right[index]) {
      continue;
    }

    differences += 1;

    if (isTransition(left[index] ?? "", right[index] ?? "")) {
      transitions += 1;
    } else {
      transversions += 1;
    }
  }

  const length = left.length;
  const p = differences / length;

  if (model === "jc69") {
    const inner = 1 - (4 * p) / 3;
    if (inner <= 0) {
      return Number.POSITIVE_INFINITY;
    }

    return (-3 / 4) * Math.log(inner);
  }

  const P = transitions / length;
  const Q = transversions / length;
  const termOne = 1 - 2 * P - Q;
  const termTwo = 1 - 2 * Q;

  if (termOne <= 0 || termTwo <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return -0.5 * Math.log(termOne) - 0.25 * Math.log(termTwo);
};

const getNewick = (node: TreeNode, parentHeight = node.height): string => {
  const branchLength = Math.max(parentHeight - node.height, 0);

  if (!node.left || !node.right) {
    return `${node.label}:${branchLength.toFixed(3)}`;
  }

  return `(${getNewick(node.left, node.height)},${getNewick(node.right, node.height)}):${branchLength.toFixed(3)}`;
};

const buildUpgmaTree = (
  labels: string[],
  distanceRows: DistanceRow[],
) => {
  const nodeMap = new Map<string, TreeNode>();
  const distanceMap = new Map<string, number>();

  const makeKey = (left: string, right: string) => {
    return [left, right].sort().join("::");
  };

  labels.forEach((label) => {
    nodeMap.set(label, { label, height: 0, size: 1 });
  });

  distanceRows.forEach((row) => {
    distanceMap.set(makeKey(row.from, row.to), row.value);
  });

  let active = [...labels];
  let mergeIndex = 1;

  while (active.length > 1) {
    let bestPair: [string, string] | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < active.length; i += 1) {
      for (let j = i + 1; j < active.length; j += 1) {
        const distance =
          distanceMap.get(makeKey(active[i] ?? "", active[j] ?? "")) ??
          Number.POSITIVE_INFINITY;

        if (distance < bestDistance) {
          bestDistance = distance;
          bestPair = [active[i] ?? "", active[j] ?? ""];
        }
      }
    }

    if (!bestPair) {
      return null;
    }

    const left = nodeMap.get(bestPair[0]);
    const right = nodeMap.get(bestPair[1]);

    if (!left || !right) {
      return null;
    }

    const mergedLabel = `cluster-${mergeIndex}`;
    mergeIndex += 1;

    const mergedNode: TreeNode = {
      label: mergedLabel,
      height: bestDistance / 2,
      size: left.size + right.size,
      left,
      right,
    };

    nodeMap.set(mergedLabel, mergedNode);

    const remaining = active.filter((label) => {
      return label !== bestPair[0] && label !== bestPair[1];
    });

    remaining.forEach((label) => {
      const other = nodeMap.get(label);

      if (!other) {
        return;
      }

      const leftDistance =
        distanceMap.get(makeKey(bestPair[0], label)) ?? Number.POSITIVE_INFINITY;
      const rightDistance =
        distanceMap.get(makeKey(bestPair[1], label)) ?? Number.POSITIVE_INFINITY;

      const mergedDistance =
        (leftDistance * left.size + rightDistance * right.size) /
        (left.size + right.size);

      distanceMap.set(makeKey(mergedLabel, label), mergedDistance);
    });

    active = [...remaining, mergedLabel];
  }

  return nodeMap.get(active[0] ?? "") ?? null;
};

const layoutTree = (root: TreeNode) => {
  const positioned = new Map<string, PositionedNode>();
  const leaves: PositionedNode[] = [];

  let nextLeafIndex = 0;
  const maxHeight = root.height || 1;

  const walk = (node: TreeNode): PositionedNode => {
    if (!node.left || !node.right) {
      const leaf: PositionedNode = {
        node,
        x: nextLeafIndex * 150,
        y: 360,
      };

      nextLeafIndex += 1;
      positioned.set(node.label, leaf);
      leaves.push(leaf);
      return leaf;
    }

    const left = walk(node.left);
    const right = walk(node.right);
    const current: PositionedNode = {
      node,
      x: (left.x + right.x) / 2,
      y: 40 + (1 - node.height / maxHeight) * 260,
    };

    positioned.set(node.label, current);
    return current;
  };

  const rootPosition = walk(root);
  return { positioned, rootPosition, leaves };
};

export default function PhylogeneticTreesPage() {
  const [model, setModel] = useState<ModelType>("jc69");
  const [sequences, setSequences] = useState<SequenceEntry[]>(defaultSequences);
  const { sequence: sharedSequence } = useDNASequence();

  const analysis = useMemo(() => {
    const cleaned = sequences
      .map((entry) => ({
        ...entry,
        label: entry.label.trim() || "Unnamed",
        sequence: sanitizeSequence(entry.sequence),
      }))
      .filter((entry) => entry.sequence.length > 0);

    if (cleaned.length < 2) {
      return { error: "Enter at least two DNA sequences.", cleaned };
    }

    const sequenceLength = cleaned[0]?.sequence.length ?? 0;
    const sameLength = cleaned.every((entry) => entry.sequence.length === sequenceLength);

    if (!sameLength) {
      return { error: "All sequences must have the same length.", cleaned };
    }

    const rows: DistanceRow[] = [];

    for (let i = 0; i < cleaned.length; i += 1) {
      for (let j = i + 1; j < cleaned.length; j += 1) {
        const left = cleaned[i];
        const right = cleaned[j];

        if (!left || !right) {
          continue;
        }

        rows.push({
          from: left.label,
          to: right.label,
          value: computeDistance(left.sequence, right.sequence, model),
        });
      }
    }

    const tree = buildUpgmaTree(
      cleaned.map((entry) => entry.label),
      rows,
    );

    if (!tree) {
      return { error: "Failed to construct a phylogenetic tree.", cleaned };
    }

    const layout = layoutTree(tree);

    return {
      error: null,
      cleaned,
      rows,
      tree,
      layout,
      sequenceLength,
      newick: `${getNewick(tree)};`,
    };
  }, [model, sequences]);

  const addSequence = () => {
    setSequences((current) => {
      return [
        ...current,
        {
          id: `seq-${current.length + 1}`,
          label: `Sequence ${current.length + 1}`,
          sequence: "",
        },
      ];
    });
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>Phylogenetic Trees</Heading>
        <Text color="gray.600">
          Compare DNA sequences with a continuous-time Markov substitution model
          and build a phylogenetic tree using UPGMA clustering.
        </Text>
      </Box>

      <DNASequenceWorkspace title="Shared DNA workspace" />

      <Grid templateColumns={{ base: "1fr", xl: "420px 1fr" }} gap={6}>
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
              <FormLabel>Markov model</FormLabel>
              <Select
                value={model}
                onChange={(event) => {
                  setModel(event.target.value as ModelType);
                }}
              >
                <option value="jc69">Jukes-Cantor (JC69)</option>
                <option value="k80">Kimura 2-parameter (K80)</option>
              </Select>
            </FormControl>

            <BlockMath
              math={
                model === "jc69"
                  ? String.raw`d_{JC69}=-\frac{3}{4}\ln\left(1-\frac{4p}{3}\right)`
                  : String.raw`d_{K80}=-\frac{1}{2}\ln(1-2P-Q)-\frac{1}{4}\ln(1-2Q)`
              }
            />

            {sharedSequence ? (
              <Box
                p={4}
                bg="blue.50"
                borderWidth="1px"
                borderColor="blue.200"
                borderRadius="xl"
              >
                <Text fontWeight="600" mb={2}>
                  Shared sequence available
                </Text>
                <Text fontSize="sm" color="gray.700" mb={3} wordBreak="break-word">
                  {sharedSequence}
                </Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => {
                    setSequences((current) => {
                      if (!current.length) {
                        return current;
                      }

                      return current.map((entry, index) => {
                        return index === 0 ? { ...entry, sequence: sharedSequence } : entry;
                      });
                    });
                  }}
                >
                  Use as first sequence
                </Button>
              </Box>
            ) : null}

            {sequences.map((entry, index) => {
              return (
                <Box
                  key={entry.id}
                  p={4}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="xl"
                >
                  <VStack align="stretch" spacing={3}>
                    <Input
                      value={entry.label}
                      placeholder={`Sequence ${index + 1} label`}
                      onChange={(event) => {
                        const nextLabel = event.target.value;
                        setSequences((current) => {
                          return current.map((item) => {
                            return item.id === entry.id
                              ? { ...item, label: nextLabel }
                              : item;
                          });
                        });
                      }}
                    />
                    <Textarea
                      value={entry.sequence}
                      placeholder="ACGT..."
                      fontFamily="mono"
                      onChange={(event) => {
                        const nextSequence = event.target.value;
                        setSequences((current) => {
                          return current.map((item) => {
                            return item.id === entry.id
                              ? { ...item, sequence: nextSequence }
                              : item;
                          });
                        });
                      }}
                    />
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">
                        Length: {sanitizeSequence(entry.sequence).length}
                      </Text>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => {
                          setSequences((current) => {
                            return current.filter((item) => item.id !== entry.id);
                          });
                        }}
                        isDisabled={sequences.length <= 2}
                      >
                        Remove
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              );
            })}

            <Button onClick={addSequence} colorScheme="green" variant="outline">
              Add sequence
            </Button>
          </VStack>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={4}>
            {analysis.error ? (
              <Box
                p={4}
                bg="orange.50"
                borderWidth="1px"
                borderColor="orange.200"
                borderRadius="xl"
              >
                <Text color="orange.800">{analysis.error}</Text>
              </Box>
            ) : null}

            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>Sequences</StatLabel>
                <StatNumber>{analysis.cleaned.length}</StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>Length</StatLabel>
                <StatNumber>{"sequenceLength" in analysis ? analysis.sequenceLength : 0}</StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>Model</StatLabel>
                <StatNumber>{model.toUpperCase()}</StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>Method</StatLabel>
                <StatNumber>UPGMA</StatNumber>
              </Stat>
            </SimpleGrid>

            {"tree" in analysis && analysis.tree ? (
              <Box
                p={5}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="2xl"
                boxShadow="sm"
                overflowX="auto"
              >
                <Text mb={4} fontWeight="600">
                  Tree
                </Text>
                <svg
                  width={Math.max(analysis.layout.leaves.length * 150, 640)}
                  height={420}
                  viewBox={`0 0 ${Math.max(analysis.layout.leaves.length * 150, 640)} 420`}
                >
                  {Array.from(analysis.layout.positioned.values()).map((item) => {
                    const { node, x, y } = item;

                    if (!node.left || !node.right) {
                      return (
                        <g key={node.label}>
                          <text x={x} y={392} textAnchor="middle" fontSize="14">
                            {node.label}
                          </text>
                        </g>
                      );
                    }

                    const left = analysis.layout.positioned.get(node.left.label);
                    const right = analysis.layout.positioned.get(node.right.label);

                    if (!left || !right) {
                      return null;
                    }

                    return (
                      <g key={node.label}>
                        <line x1={left.x} y1={left.y} x2={left.x} y2={y} stroke="#1f2937" strokeWidth="2" />
                        <line x1={right.x} y1={right.y} x2={right.x} y2={y} stroke="#1f2937" strokeWidth="2" />
                        <line x1={left.x} y1={y} x2={right.x} y2={y} stroke="#1f2937" strokeWidth="2" />
                      </g>
                    );
                  })}
                </svg>
              </Box>
            ) : null}

            {"rows" in analysis && analysis.rows ? (
              <Box
                p={5}
                bg="white"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="2xl"
                boxShadow="sm"
              >
                <Text mb={4} fontWeight="600">
                  Pairwise distances
                </Text>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>From</Th>
                      <Th>To</Th>
                      <Th isNumeric>Distance</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {analysis.rows.map((row) => {
                      return (
                        <Tr key={`${row.from}-${row.to}`}>
                          <Td>{row.from}</Td>
                          <Td>{row.to}</Td>
                          <Td isNumeric>
                            {Number.isFinite(row.value) ? row.value.toFixed(4) : "inf"}
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            ) : null}

            {"newick" in analysis && analysis.newick ? (
              <Box
                p={5}
                bg="gray.900"
                color="white"
                borderRadius="2xl"
                boxShadow="sm"
              >
                <Text mb={2} fontWeight="600">
                  Newick
                </Text>
                <Text fontFamily="mono" fontSize="sm" wordBreak="break-word">
                  {analysis.newick}
                </Text>
              </Box>
            ) : null}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
}
