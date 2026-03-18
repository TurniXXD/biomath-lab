"use client";

import React, { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Box,
  Flex,
  Button,
  Heading,
  Stack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

import { ReadonlyMatrix } from "@/components/Matrix/ReadonlyMatrix/ReadonlyMatrix";
import { EditableMatrix } from "@/components/Matrix/EditableMatrix/EditableMatrix";
import { MatrixViewport } from "@/components/MatrixPage/MatrixViewport/MatrixViewport";
import { cloneMatrix } from "@/components/MatrixPage/MatrixViewport/utils/utils";
import { SavedMatrix, ViewItem } from "@/components/MatrixPage/types";
import { useMatrixStore } from "@/components/MatrixPage/store";

import { LatexMatrixModal } from "@/components/MatrixPage/modals/LatexToMatrixModal";
import { getNextAutoName } from "@/components/MatrixPage/utils";
import type { Matrix } from "@/lib/api/types";

import { math } from "@/lib/math";
import {
  parseFractionMatrix,
  fractionMatrixToMatrixCells,
} from "@/components/MatrixPage/MatrixViewport/utils/utils";

type MatrixTab = "matrix" | "transpose" | "inverse";

const transposeMatrix = (m: Matrix): Matrix => {
  const rows = m.length;
  const cols = m[0]?.length ?? 0;

  const out: Matrix = Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => ({
      value: m[r]?.[c]?.value ?? "0",
    })),
  );

  return out;
};

const invertMatrix = (
  m: Matrix,
): { ok: true; value: Matrix } | { ok: false; error: string } => {
  const parsed = parseFractionMatrix(m);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const A = parsed.value;
  const n = A.length;
  const mcols = A[0]?.length ?? 0;

  if (n === 0 || mcols === 0) {
    return { ok: false, error: "Empty matrix." };
  }

  if (n !== mcols) {
    return { ok: false, error: "Inverse requires a square matrix." };
  }

  try {
    // mathjs works with Fractions if provided; but inv() may return number or Fraction mix
    // We'll compute inv() on a matrix of Fractions, then format back to cells.
    const inv = math.inv(A as any) as any;

    // inv can be a 2D array-like
    const invArr: any[][] = Array.isArray(inv)
      ? inv
      : (inv?.toArray?.() ?? inv);

    const asFraction: any[][] = invArr.map((row) =>
      row.map((x) => {
        // normalize to Fraction via math.fraction when possible
        return math.fraction(x) as any;
      }),
    );

    const cells = fractionMatrixToMatrixCells(asFraction as any);
    return { ok: true, value: cells };
  } catch (e) {
    return {
      ok: false,
      error: "Matrix is not invertible (singular) or inversion failed.",
    };
  }
};

export default function MatrixPageContent() {
  const { editor, setEditor, library, setLibrary, dropProgrammatic, viewport } =
    useMatrixStore();

  const [latexOpen, setLatexOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    library[0]?.id ?? null,
  );
  const [selectedTab, setSelectedTab] = useState<MatrixTab>("matrix");

  const selected = useMemo(() => {
    if (selectedId === null) {
      return null;
    }
    return library.find((x) => x.id === selectedId) ?? null;
  }, [library, selectedId]);

  const saveToLibrary = () => {
    const name = getNextAutoName(library);
    const id = uuidv4();

    setLibrary([{ id, name, data: cloneMatrix(editor) }, ...library]);
    setSelectedId(id);
  };

  const insertLatexMatrix = (matrix: Matrix) => {
    const name = getNextAutoName(library);
    const id = uuidv4();

    setLibrary([{ id, name, data: cloneMatrix(matrix) }, ...library]);
    setSelectedId(id);
  };

  const loadFromLibrary = (m: SavedMatrix) => {
    setEditor(cloneMatrix(m.data));
  };

  const onDragStart = (e: React.DragEvent, m: SavedMatrix) => {
    e.dataTransfer.setData("application/x-matrix-id", m.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  const appendFromEditor = () => {
    const item: ViewItem = {
      id: uuidv4(),
      sourceId: "editor",
      name: "Editor",
      data: cloneMatrix(editor),
    };

    dropProgrammatic(viewport.length, item);
  };

  // Approx. height so library can match editor block height
  // You can tweak this; it’s just a practical fixed height container.
  const topRowHeight = "520px";

  const selectedMatrixView = useMemo(() => {
    if (!selected) {
      return { kind: "empty" as const };
    }

    const base = selected.data;

    if (selectedTab === "matrix") {
      return { kind: "ok" as const, value: base };
    }

    if (selectedTab === "transpose") {
      return { kind: "ok" as const, value: transposeMatrix(base) };
    }

    const inv = invertMatrix(base);
    if (!inv.ok) {
      return { kind: "error" as const, error: inv.error };
    }

    return { kind: "ok" as const, value: inv.value };
  }, [selected, selectedTab]);

  return (
    <>
      <LatexMatrixModal
        isOpen={latexOpen}
        onClose={() => setLatexOpen(false)}
        onInsert={insertLatexMatrix}
      />

      <Stack spacing={6}>
        {/* TOP ROW: Editor + Library side by side */}
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={6}>
          {/* Editor */}
          <Box
            borderWidth="1px"
            borderRadius="xl"
            p={4}
            bg="white"
            h={topRowHeight}
          >
            <Flex
              justify="space-between"
              align="center"
              mb={4}
              gap={3}
              wrap="wrap"
            >
              <Heading size="sm">Editor</Heading>

              <Flex gap={2} wrap="wrap">
                <Button size="sm" variant="outline" onClick={saveToLibrary}>
                  Save to library
                </Button>
                <Button size="sm" variant="solid" onClick={appendFromEditor}>
                  → Add to viewport
                </Button>
              </Flex>
            </Flex>

            <EditableMatrix
              value={editor}
              onChange={setEditor}
              initialRows={3}
              initialCols={4}
            />

            <Box mt={4} opacity={0.8}>
              <Text fontWeight="600" mb={2}>
                TODO
              </Text>
              <ul>
                <li>inverse matrix</li>
                <li>transpose matrix</li>
                <li>REF</li>
                <li>
                  2D rotations, arrows to rotate shape, live update of according
                  matrix
                </li>
                <li>2D reflections</li>
                <li>
                  3D rotations, 3D rotatable cube to rotate according element in
                  plane
                </li>
              </ul>
            </Box>
          </Box>

          {/* Library */}
          <Box
            borderWidth="1px"
            borderRadius="xl"
            p={4}
            bg="white"
            h={topRowHeight}
          >
            <Flex
              justify="space-between"
              align="center"
              mb={4}
              gap={3}
              wrap="wrap"
            >
              <Box>
                <Heading size="sm">Saved matrices</Heading>
                <Text fontSize="sm" opacity={0.6}>
                  Click to load • Drag to viewport
                </Text>
              </Box>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setLatexOpen(true)}
              >
                Insert LaTeX matrix
              </Button>
            </Flex>

            <Box overflowY="auto" pr={1} h={`calc(${topRowHeight} - 72px)`}>
              <Stack spacing={3}>
                {library.map((m) => {
                  const isSelected = selectedId === m.id;

                  return (
                    <Box
                      key={m.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, m)}
                      onClick={() => setSelectedId(m.id)}
                      borderWidth={isSelected ? "2px" : "1px"}
                      borderColor={isSelected ? "gray.800" : "gray.200"}
                      borderRadius="lg"
                      p={3}
                      bg="white"
                      cursor="pointer"
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={3}
                      _hover={{ bg: "gray.50" }}
                    >
                      <Box minW="80px">
                        <Text fontWeight="600">{m.name}</Text>
                        <Text fontSize="sm" opacity={0.6}>
                          {m.data.length}×{m.data[0]?.length ?? 0}
                        </Text>

                        <Button
                          mt={2}
                          size="xs"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadFromLibrary(m);
                          }}
                        >
                          Load → Editor
                        </Button>
                      </Box>

                      <Box overflowX="auto" maxW="70%">
                        <ReadonlyMatrix m={m.data} />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Box>
        </Box>

        {/* BOTTOM: Tabs with MatrixViewport under "Matrix operations" */}
        <Box borderWidth="1px" borderRadius="xl" bg="white" p={4}>
          <Tabs isFitted variant="enclosed" size="sm">
            <TabList>
              <Tab>Matrix operations</Tab>
              <Tab>Selected matrix</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <MatrixViewport />
              </TabPanel>

              <TabPanel>
                {!selected && (
                  <Text opacity={0.7}>
                    No matrix selected. Click a matrix in the library.
                  </Text>
                )}

                {selected && (
                  <Stack spacing={4}>
                    <Flex
                      align="baseline"
                      justify="space-between"
                      wrap="wrap"
                      gap={3}
                    >
                      <Box>
                        <Heading size="sm">{selected.name}</Heading>
                        <Text fontSize="sm" opacity={0.6}>
                          {selected.data.length}×{selected.data[0]?.length ?? 0}
                        </Text>
                      </Box>
                      <Text fontSize="sm" opacity={0.6}>
                        View:{" "}
                        {selectedTab === "matrix"
                          ? "Matrix"
                          : selectedTab === "transpose"
                            ? "Transpose"
                            : "Inverse"}
                      </Text>
                    </Flex>

                    <Divider />

                    <Tabs
                      index={
                        selectedTab === "matrix"
                          ? 0
                          : selectedTab === "transpose"
                            ? 1
                            : 2
                      }
                      onChange={(i) => {
                        if (i === 0) setSelectedTab("matrix");
                        if (i === 1) setSelectedTab("transpose");
                        if (i === 2) setSelectedTab("inverse");
                      }}
                      variant="soft-rounded"
                      colorScheme="gray"
                      size="sm"
                    >
                      <TabList>
                        <Tab>Matrix</Tab>
                        <Tab>Transpose</Tab>
                        <Tab>Inverse</Tab>
                      </TabList>

                      <TabPanels>
                        <TabPanel px={0}>
                          {selectedMatrixView.kind === "ok" && (
                            <ReadonlyMatrix
                              m={selectedMatrixView.value}
                              showActionsTabs
                            />
                          )}
                          {selectedMatrixView.kind === "error" && (
                            <Alert status="error" borderRadius="lg">
                              <AlertIcon />
                              {selectedMatrixView.error}
                            </Alert>
                          )}
                        </TabPanel>

                        <TabPanel px={0}>
                          {selectedMatrixView.kind === "ok" && (
                            <ReadonlyMatrix
                              m={selectedMatrixView.value}
                              showActionsTabs
                            />
                          )}
                          {selectedMatrixView.kind === "error" && (
                            <Alert status="error" borderRadius="lg">
                              <AlertIcon />
                              {selectedMatrixView.error}
                            </Alert>
                          )}
                        </TabPanel>

                        <TabPanel px={0}>
                          {selectedMatrixView.kind === "ok" && (
                            <ReadonlyMatrix
                              m={selectedMatrixView.value}
                              showActionsTabs
                            />
                          )}
                          {selectedMatrixView.kind === "error" && (
                            <Alert status="error" borderRadius="lg">
                              <AlertIcon />
                              {selectedMatrixView.error}
                            </Alert>
                          )}
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </Stack>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Stack>
    </>
  );
}
