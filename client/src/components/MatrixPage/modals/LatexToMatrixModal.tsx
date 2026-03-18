"use client";

import React, { useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
} from "@chakra-ui/react";

import { latexToMatrix } from "@/utils/parsers/latexToMatrix";
import { Matrix } from "@/lib/api/types";

interface LatexMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (m: Matrix) => void;
}

export const LatexMatrixModal = ({
  isOpen,
  onClose,
  onInsert,
}: LatexMatrixModalProps) => {
  const [latex, setLatex] = useState("");
  const [error, setError] = useState<string | null>(null);

  const example = useMemo(() => {
    return String.raw`\begin{bmatrix}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{bmatrix}`;
  }, []);

  const onSubmit = () => {
    setError(null);

    const res = latexToMatrix(latex);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    onInsert(res.value);
    setLatex("");
    onClose();
  };

  const onCloseInternal = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onCloseInternal} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Insert LaTeX matrix</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <FormControl>
            <FormLabel>LaTeX</FormLabel>

            <Textarea
              value={latex}
              onChange={(e) => {
                setLatex(e.target.value);
                setError(null);
              }}
              placeholder={example}
              rows={10}
              fontFamily='ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            />

            <Box mt={3}>
              <Text fontSize="sm" opacity={0.7}>
                Supported: matrix, pmatrix, bmatrix, Bmatrix, vmatrix, Vmatrix.
                Values must be numeric (digits, -, /, ., ,). Whitespace inside
                cell values is rejected.
              </Text>
            </Box>

            {error && (
              <Alert status="error" mt={3} borderRadius="lg">
                <AlertIcon />
                {error}
              </Alert>
            )}
          </FormControl>
        </ModalBody>

        <ModalFooter display="flex" gap={2}>
          <Button variant="ghost" onClick={onCloseInternal}>
            Cancel
          </Button>
          <Button variant="solid" onClick={onSubmit}>
            Insert
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
