import { Matrix } from "@/lib/api/types";
import { Box, Text } from "@chakra-ui/react";

export const MatrixGrid = ({ m }: { m: Matrix }) => {
  const rows = m.length;
  const cols = m[0]?.length ?? 0;

  return (
    <Box
      display="inline-block"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      p={3}
    >
      <Box display="grid" gridTemplateColumns={`repeat(${cols}, 64px)`} gap={2}>
        {m.map((row, i) =>
          row.map((cell, j) => (
            <Box
              key={`${i}-${j}`}
              h="32px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderWidth="1px"
              borderColor="gray.100"
              borderRadius="lg"
              bg="gray.50"
              fontFamily='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
              title={`(${i + 1}, ${j + 1})`}
            >
              {cell.value}
            </Box>
          )),
        )}
      </Box>

      <Text mt={2} fontSize="sm" opacity={0.7}>
        {rows}×{cols}
      </Text>
    </Box>
  );
};
