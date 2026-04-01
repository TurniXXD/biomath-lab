"use client";

import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Code,
  HStack,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  OrderedList,
  Text,
  VStack,
} from "@chakra-ui/react";

export const darkSecondaryButtonProps = {
  variant: "outline" as const,
  color: "whiteAlpha.900",
  borderColor: "whiteAlpha.500",
  bg: "whiteAlpha.50",
  _hover: {
    bg: "whiteAlpha.100",
    borderColor: "whiteAlpha.700",
  },
  _active: {
    bg: "whiteAlpha.200",
  },
};

type AlgorithmDialogButtonProps = {
  label?: string;
  title: string;
  badgeLabel?: string;
  summary: string;
  steps: string[];
  code?: string;
  note?: string;
};

const AlgorithmDialogButton = ({
  label = "Show algorithm",
  title,
  badgeLabel = "Algorithm",
  summary,
  steps,
  code,
  note,
}: AlgorithmDialogButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} {...darkSecondaryButtonProps}>
        {label}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3} align="center">
              <Badge colorScheme="purple">{badgeLabel}</Badge>
              <Box>{title}</Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <Text color="gray.700">{summary}</Text>

              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Steps
                </Text>
                <OrderedList spacing={2} pl={5} color="gray.700">
                  {steps.map((step) => {
                    return <ListItem key={step}>{step}</ListItem>;
                  })}
                </OrderedList>
              </Box>

              {code ? (
                <Box>
                  <Text fontWeight="semibold" mb={2}>
                    Core logic
                  </Text>
                  <Code
                    display="block"
                    whiteSpace="pre"
                    overflowX="auto"
                    p={4}
                    borderRadius="lg"
                    w="100%"
                    fontSize="sm"
                  >
                    {code}
                  </Code>
                </Box>
              ) : null}

              {note ? <Text fontSize="sm" color="gray.600">{note}</Text> : null}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AlgorithmDialogButton;
