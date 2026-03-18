"use client";

import React, { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Box,
  Button,
  Flex,
  Heading,
  Select,
  Stack,
  Text,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";

import { ReadonlyMatrix } from "@/components/Matrix/ReadonlyMatrix/ReadonlyMatrix";
import { DropZone } from "@/components/UI/DropZone/DropZone";
import {
  cloneMatrix,
  parseFractionMatrix,
  addFractions,
  fractionMatrixToMatrixCells,
  multiplyFractions,
} from "@/components/MatrixPage/MatrixViewport/utils/utils";
import { MatrixOperation, ViewItem } from "@/components/MatrixPage/types";
import { useMatrixStore } from "@/components/MatrixPage/store";
import { insertViewportAt } from "@/components/MatrixPage/utils";

export const MatrixViewport = () => {
  const {
    viewport,
    setViewport,
    operations,
    setOperations,
    library,
    editor,
    dropProgrammatic,
  } = useMatrixStore();

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const rebuildOperationsAfterInsert = (positionIndex: number) => {
    if (viewport.length === 0) {
      return [];
    }

    const newLen = viewport.length + 1;
    const rebuilt: MatrixOperation[] = Array.from(
      { length: Math.max(0, newLen - 1) },
      () => "×",
    );

    for (let i = 0; i < operations.length; i++) {
      const newOpIndex = i >= positionIndex ? i + 1 : i;

      if (rebuilt[newOpIndex] !== undefined) {
        rebuilt[newOpIndex] = operations[i];
      }
    }

    return rebuilt;
  };

  const dropAt = (positionIndex: number, e: React.DragEvent) => {
    e.preventDefault();

    const id = e.dataTransfer.getData("application/x-matrix-id");
    if (!id) {
      return;
    }

    const m = library.find((x) => x.id === id);
    if (!m) {
      return;
    }

    const item: ViewItem = {
      id: uuidv4(),
      sourceId: m.id,
      name: m.name,
      data: cloneMatrix(m.data),
    };

    const nextViewport = insertViewportAt(viewport, positionIndex, item);
    const nextOperations = rebuildOperationsAfterInsert(positionIndex);

    setViewport(nextViewport);
    setOperations(nextOperations);
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const removeViewportItem = (index: number) => {
    const nextViewport = viewport.filter((_, idx) => idx !== index);

    const nextOperations = operations.slice();
    if (index === 0) {
      nextOperations.splice(0, 1);
    } else {
      nextOperations.splice(index - 1, 1);
    }

    setViewport(nextViewport);
    setOperations(nextOperations);

    setSelectedIndex((cur) => {
      if (cur === null) {
        return null;
      }

      if (cur === index) {
        return null;
      }

      if (cur > index) {
        return cur - 1;
      }

      return cur;
    });
  };

  const setOp = (index: number, op: MatrixOperation) => {
    const nextOperations = operations.map((x, i) => (i === index ? op : x));
    setOperations(nextOperations);
  };

  const insertBeforeSelectedFromEditor = () => {
    if (selectedIndex === null) {
      return;
    }

    const item: ViewItem = {
      id: uuidv4(),
      sourceId: "editor",
      name: "Editor",
      data: cloneMatrix(editor),
    };

    dropProgrammatic(selectedIndex, item);
  };

  const insertAfterSelectedFromEditor = () => {
    if (selectedIndex === null) {
      return;
    }

    const item: ViewItem = {
      id: uuidv4(),
      sourceId: "editor",
      name: "Editor",
      data: cloneMatrix(editor),
    };

    dropProgrammatic(selectedIndex + 1, item);
  };

  const computed = useMemo(() => {
    if (viewport.length === 0) {
      return { kind: "empty" as const };
    }

    const p0 = parseFractionMatrix(viewport[0].data);
    if (!p0.ok) {
      return {
        kind: "error" as const,
        error: `Matrix ${viewport[0].name}: ${p0.error}`,
      };
    }

    let acc = p0.value;

    for (let i = 1; i < viewport.length; i++) {
      const pi = parseFractionMatrix(viewport[i].data);
      if (!pi.ok) {
        return {
          kind: "error" as const,
          error: `Matrix ${viewport[i].name}: ${pi.error}`,
        };
      }

      const op = operations[i - 1] ?? "×";
      const step =
        op === "+"
          ? addFractions(acc, pi.value)
          : multiplyFractions(acc, pi.value);

      if (!step.ok) {
        return {
          kind: "error" as const,
          error: `Step ${i} (${op}): ${step.error}`,
        };
      }

      acc = step.value;
    }

    return { kind: "ok" as const, value: fractionMatrixToMatrixCells(acc) };
  }, [viewport, operations]);

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      p={4}
      bg="white"
    >
      <Flex justify="space-between" align="center" mb={3} gap={3} wrap="wrap">
        <Heading size="sm">Viewport</Heading>

        <Flex gap={2} wrap="wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={insertBeforeSelectedFromEditor}
            isDisabled={selectedIndex === null}
          >
            Insert Editor Before
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={insertAfterSelectedFromEditor}
            isDisabled={selectedIndex === null}
          >
            Insert Editor After
          </Button>
        </Flex>
      </Flex>

      <Box mb={3}>
        <DropZone
          label="Drop here to start"
          onDrop={(e) => dropAt(0, e)}
          onDragOver={allowDrop}
        />
      </Box>

      <Stack spacing={3}>
        {viewport.map((item, i) => {
          const isSelected = selectedIndex === i;

          return (
            <Box key={item.id}>
              <Box
                borderWidth={isSelected ? "2px" : "1px"}
                borderColor={isSelected ? "gray.900" : "gray.200"}
                borderRadius="xl"
                p={3}
                bg="white"
                cursor="pointer"
                onClick={() => setSelectedIndex(i)}
              >
                <Flex
                  justify="space-between"
                  align="center"
                  gap={3}
                  wrap="wrap"
                >
                  <Box>
                    <Text fontWeight="700">{item.name}</Text>
                    <Text fontSize="sm" opacity={0.7}>
                      {item.data.length}×{item.data[0]?.length ?? 0}
                    </Text>
                  </Box>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeViewportItem(i);
                    }}
                  >
                    Remove
                  </Button>
                </Flex>

                <Box mt={3}>
                  <ReadonlyMatrix m={item.data} />
                </Box>
              </Box>

              {i < viewport.length - 1 && (
                <Flex align="center" gap={3} mt={3}>
                  <Select
                    value={operations[i] ?? "×"}
                    onChange={(e) =>
                      setOp(i, e.target.value as MatrixOperation)
                    }
                    maxW="220px"
                    fontWeight="700"
                    bg="white"
                  >
                    <option value="×">× Multiply</option>
                    <option value="+">+ Add</option>
                  </Select>

                  <Box flex="1">
                    <DropZone
                      label={`Drop here to insert at position ${i + 1}`}
                      onDrop={(e) => dropAt(i + 1, e)}
                      onDragOver={allowDrop}
                      compact
                    />
                  </Box>
                </Flex>
              )}
            </Box>
          );
        })}
      </Stack>

      {viewport.length > 0 && (
        <Box mt={3}>
          <DropZone
            label="Drop here to append"
            onDrop={(e) => dropAt(viewport.length, e)}
            onDragOver={allowDrop}
          />
        </Box>
      )}

      <Box mt={5} pt={3} borderTopWidth="1px" borderTopColor="gray.200">
        <Heading size="xs" mb={2}>
          Result
        </Heading>

        {computed.kind === "empty" && (
          <Text opacity={0.7}>Drop matrices into the viewport to compute.</Text>
        )}

        {computed.kind === "error" && (
          <Box
            borderWidth="1px"
            borderColor="pink.400"
            bg="pink.50"
            borderRadius="xl"
            p={3}
          >
            <Text fontWeight="700" mb={1}>
              Cannot compute
            </Text>
            <Text fontFamily='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'>
              {computed.error}
            </Text>
          </Box>
        )}

        {computed.kind === "ok" && (
          <ReadonlyMatrix showActionsTabs m={computed.value} />
        )}

        <Box mt={3}>
          <Text fontWeight="700" mb={1}>
            TODO
          </Text>
          <UnorderedList>
            <ListItem>
              step by step animation that will explain steps configured in the
              DND
            </ListItem>
          </UnorderedList>
        </Box>
      </Box>
    </Box>
  );
};
