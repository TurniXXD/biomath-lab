"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Input,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import AlgorithmDialogButton, {
  darkSecondaryButtonProps,
} from "@/components/Animations/AlgorithmDialogButton";

type Direction = "start" | "diag" | "up" | "left";
type AlignmentMode = "global" | "local";

type Cell = {
  score: number;
  direction: Direction;
};

type TraceStep = {
  fromI: number;
  fromJ: number;
  toI: number;
  toJ: number;
  move: Exclude<Direction, "start">;
  aChar: string;
  bChar: string;
};

type Scoring = {
  match: number;
  mismatch: number;
  gap: number;
};

type AlignmentResult = {
  table: Cell[][];
  traceCells: Array<{ i: number; j: number }>;
  traceSteps: TraceStep[];
  alignedA: string;
  alignedB: string;
  score: number;
  sequenceA: string;
  sequenceB: string;
  startCell: { i: number; j: number };
};

const defaultA = "GATTACA";
const defaultB = "GCATGCU";

const NEEDLEMAN_ALGO = {
  title: "Needleman-Wunsch / Smith-Waterman",
  summary:
    "The matrix is filled by dynamic programming. Each cell chooses between diagonal match/mismatch, vertical gap, and horizontal gap transitions. The traceback then reconstructs the alignment path.",
  steps: [
    "Initialize the score table for the chosen alignment mode.",
    "Fill each cell from already-computed neighbors.",
    "Store the best move for each cell so the traceback can replay it.",
    "Start traceback at the terminal cell for global alignment, or at the best local cell for Smith-Waterman.",
    "Animate the path through the matrix to show how the alignment is recovered.",
  ],
  code: `const score = Math.max(
  mode === "global" ? diagonal + matchOrMismatch : Math.max(0, diagonal + matchOrMismatch),
  up + gap,
  left + gap,
);`,
  note:
    "Global alignment traces from the bottom-right corner, while local alignment begins at the highest-scoring cell and stops at zero.",
};

const normalizeSequence = (value: string) => {
  return value.replace(/\s+/g, "").toUpperCase();
};

const buildNeedlemanWunsch = (
  rawA: string,
  rawB: string,
  scoring: Scoring,
  mode: AlignmentMode,
): AlignmentResult => {
  const sequenceA = normalizeSequence(rawA);
  const sequenceB = normalizeSequence(rawB);

  const rows = sequenceA.length + 1;
  const cols = sequenceB.length + 1;

  const table: Cell[][] = Array.from({ length: rows }, () => {
    return Array.from({ length: cols }, () => {
      return { score: 0, direction: "start" as Direction };
    });
  });

  if (mode === "global") {
    // Initialize the top row and left column.
    // In global alignment, aligning against an empty prefix costs one gap per
    // character, so the first row/column are cumulative gap penalties.
    for (let j = 1; j < cols; j += 1) {
      table[0][j] = {
        score: table[0][j - 1].score + scoring.gap,
        direction: "left",
      };
    }

    for (let i = 1; i < rows; i += 1) {
      table[i][0] = {
        score: table[i - 1][0].score + scoring.gap,
        direction: "up",
      };
    }
  }

  // Fill the table cell by cell.
  // Each position asks: should we align the two characters, or insert a gap
  // in one of the sequences?
  let bestLocalScore = Number.NEGATIVE_INFINITY;
  let bestLocalCell = { i: rows - 1, j: cols - 1 };
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const aChar = sequenceA[i - 1];
      const bChar = sequenceB[j - 1];

      const diagonalScore =
        table[i - 1][j - 1].score +
        (aChar === bChar ? scoring.match : scoring.mismatch);
      const upScore = table[i - 1][j].score + scoring.gap;
      const leftScore = table[i][j - 1].score + scoring.gap;

      // Prefer diagonal moves on ties so the path feels stable and intuitive.
      let bestScore = diagonalScore;
      let direction: Direction = "diag";

      if (mode === "local") {
        // Local alignment allows the path to restart anywhere, so negative
        // scores are dropped back to zero.
        bestScore = 0;
        direction = "start";

        if (diagonalScore > bestScore) {
          bestScore = diagonalScore;
          direction = "diag";
        }

        if (upScore > bestScore) {
          bestScore = upScore;
          direction = "up";
        }

        if (leftScore > bestScore) {
          bestScore = leftScore;
          direction = "left";
        }

        if (bestScore > bestLocalScore) {
          bestLocalScore = bestScore;
          bestLocalCell = { i, j };
        }
      } else {
        if (upScore > bestScore) {
          bestScore = upScore;
          direction = "up";
        }

        if (leftScore > bestScore) {
          bestScore = leftScore;
          direction = "left";
        }
      }

      table[i][j] = { score: bestScore, direction };
    }
  }

  // Traceback starts in the bottom-right corner for global alignment.
  // For local alignment it starts at the best-scoring cell anywhere in the
  // table and stops as soon as the score reaches zero.
  let i = mode === "local" ? bestLocalCell.i : rows - 1;
  let j = mode === "local" ? bestLocalCell.j : cols - 1;
  const traceCells = [{ i, j }];
  const traceSteps: TraceStep[] = [];
  const alignedA: string[] = [];
  const alignedB: string[] = [];

  while (i > 0 || j > 0) {
    const current = table[i][j];

    if (mode === "local" && current.score === 0) {
      break;
    }

    if (current.direction === "diag" && i > 0 && j > 0) {
      const aChar = sequenceA[i - 1];
      const bChar = sequenceB[j - 1];

      traceSteps.push({
        fromI: i,
        fromJ: j,
        toI: i - 1,
        toJ: j - 1,
        move: "diag",
        aChar,
        bChar,
      });

      alignedA.unshift(aChar);
      alignedB.unshift(bChar);
      i -= 1;
      j -= 1;
    } else if (current.direction === "up" && i > 0) {
      const aChar = sequenceA[i - 1];

      traceSteps.push({
        fromI: i,
        fromJ: j,
        toI: i - 1,
        toJ: j,
        move: "up",
        aChar,
        bChar: "-",
      });

      alignedA.unshift(aChar);
      alignedB.unshift("-");
      i -= 1;
    } else if (j > 0) {
      const bChar = sequenceB[j - 1];

      traceSteps.push({
        fromI: i,
        fromJ: j,
        toI: i,
        toJ: j - 1,
        move: "left",
        aChar: "-",
        bChar,
      });

      alignedA.unshift("-");
      alignedB.unshift(bChar);
      j -= 1;
    } else {
      break;
    }

    traceCells.push({ i, j });
  }

  return {
    table,
    traceCells,
    traceSteps,
    alignedA: alignedA.join(""),
    alignedB: alignedB.join(""),
    score: mode === "local" ? bestLocalScore : table[rows - 1][cols - 1].score,
    sequenceA,
    sequenceB,
    startCell:
      mode === "local" ? bestLocalCell : { i: rows - 1, j: cols - 1 },
  };
};

const directionSymbol: Record<Direction, string> = {
  start: "·",
  diag: "↖",
  up: "↑",
  left: "←",
};

const moveLabel: Record<TraceStep["move"], string> = {
  diag: "Diagonal",
  up: "Up",
  left: "Left",
};

const NeedlemanWunschAlignment = () => {
  const [sequenceA, setSequenceA] = useState(defaultA);
  const [sequenceB, setSequenceB] = useState(defaultB);
  const [mode, setMode] = useState<AlignmentMode>("global");
  const [matchScore, setMatchScore] = useState(2);
  const [mismatchScore, setMismatchScore] = useState(-1);
  const [gapPenalty, setGapPenalty] = useState(-2);
  const [playing, setPlaying] = useState(false);
  const [stepDelayMs, setStepDelayMs] = useState(900);
  const [stepIndex, setStepIndex] = useState(0);

  const result = useMemo(() => {
    return buildNeedlemanWunsch(sequenceA, sequenceB, {
      match: matchScore,
      mismatch: mismatchScore,
      gap: gapPenalty,
    }, mode);
  }, [gapPenalty, matchScore, mismatchScore, mode, sequenceA, sequenceB]);

  // Any change to the sequences or scoring should restart the animation.
  useEffect(() => {
    setPlaying(false);
    setStepIndex(0);
  }, [gapPenalty, matchScore, mismatchScore, mode, sequenceA, sequenceB]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    const timer = window.setInterval(() => {
      setStepIndex((current) => {
        if (current >= result.traceSteps.length) {
          window.clearInterval(timer);
          setPlaying(false);
          return current;
        }

        const next = current + 1;

        if (next >= result.traceSteps.length) {
          window.clearInterval(timer);
          setPlaying(false);
        }

        return next;
      });
    }, stepDelayMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [playing, result.traceSteps.length, stepDelayMs]);

  const traceProgress = result.traceSteps.length === 0 ? 1 : stepIndex / result.traceSteps.length;
  const currentCell = result.traceCells[Math.min(stepIndex, result.traceCells.length - 1)];
  const currentStep = stepIndex > 0 ? result.traceSteps[stepIndex - 1] : undefined;

  const visitedCells = useMemo(() => {
    const cells = new Set<string>();

    for (let idx = 0; idx <= Math.min(stepIndex, result.traceCells.length - 1); idx += 1) {
      const cell = result.traceCells[idx];
      cells.add(`${cell.i}:${cell.j}`);
    }

    return cells;
  }, [result.traceCells, stepIndex]);

  const partialAlignment = useMemo(() => {
    const alignedA: string[] = [];
    const alignedB: string[] = [];

    for (let idx = 0; idx < Math.min(stepIndex, result.traceSteps.length); idx += 1) {
      const step = result.traceSteps[idx];

      if (step.move === "diag") {
        alignedA.unshift(step.aChar);
        alignedB.unshift(step.bChar);
      } else if (step.move === "up") {
        alignedA.unshift(step.aChar);
        alignedB.unshift("-");
      } else {
        alignedA.unshift("-");
        alignedB.unshift(step.bChar);
      }
    }

    return {
      a: alignedA.join(""),
      b: alignedB.join(""),
    };
  }, [result.traceSteps, stepIndex]);

  const cols = sequenceB.length + 1;
  const rows = sequenceA.length + 1;

  const reset = () => {
    setPlaying(false);
    setStepIndex(0);
  };

  const switchMode = (nextMode: AlignmentMode) => {
    setPlaying(false);
    setStepIndex(0);
    setMode(nextMode);
  };

  const togglePlayback = () => {
    if (playing) {
      setPlaying(false);
      return;
    }

    if (stepIndex >= result.traceSteps.length) {
      setStepIndex(0);
    }

    setPlaying(true);
  };

  const stepOnce = () => {
    setPlaying(false);
    setStepIndex((current) => {
      return Math.min(current + 1, result.traceSteps.length);
    });
  };

  return (
    <Stack
      direction={{ base: "column", xl: "row" }}
      spacing={6}
      align="stretch"
      w="100%"
    >
      <Box
        flex="1"
        p={{ base: 4, md: 6 }}
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        bg="linear-gradient(160deg, #0f172a 0%, #111827 46%, #1e293b 100%)"
        color="white"
        boxShadow="0 30px 90px rgba(15, 23, 42, 0.35)"
      >
        <VStack align="stretch" spacing={4}>
          <Box>
            <HStack spacing={3} mb={3} wrap="wrap">
              <Badge colorScheme="orange" px={3} py={1} borderRadius="full">
                Sequence alignment
              </Badge>
              <Badge
                colorScheme={mode === "global" ? "cyan" : "green"}
                px={3}
                py={1}
                borderRadius="full"
              >
                {mode === "global" ? "Global" : "Local"}
              </Badge>
            </HStack>
            <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
              {mode === "global" ? "Needleman-Wunsch" : "Smith-Waterman"}
            </Text>
            <Text opacity={0.8} maxW="3xl">
              {mode === "global"
                ? "Fill the dynamic-programming table, then watch the traceback walk slowly from the bottom-right corner back to the origin."
                : "Fill the local-alignment table, then watch the traceback begin at the best-scoring cell and stop at zero."}
            </Text>
          </Box>

          <Box
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            bg="rgba(255,255,255,0.04)"
            p={4}
          >
            <HStack justify="space-between" align="start" wrap="wrap" spacing={4}>
              <Box>
                <Text fontSize="sm" opacity={0.7}>
                  Current cell
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  ({currentCell?.i ?? 0}, {currentCell?.j ?? 0})
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" opacity={0.7}>
                  Traceback score
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {result.score}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" opacity={0.7}>
                  Progress
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {Math.round(traceProgress * 100)}%
                </Text>
              </Box>
            </HStack>
          </Box>

          <Box
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            bg="rgba(255,255,255,0.03)"
            p={3}
            overflowX="auto"
          >
            <Box
              display="grid"
              w="fit-content"
              gridTemplateColumns={`repeat(${cols}, 3.75rem)`}
              gridAutoRows="3.75rem"
              gap="0.35rem"
              minH="min-content"
            >
              {Array.from({ length: rows }, (_, i) =>
                Array.from({ length: cols }, (_, j) => {
                  const isHeader = i === 0 || j === 0;
                  const cell = result.table[i][j];
                  const key = `${i}:${j}`;
                  const isVisited = visitedCells.has(key);
                  const isCurrent = currentCell?.i === i && currentCell?.j === j;
                  const isOrigin = i === 0 && j === 0;
                  const rowLabel = i > 0 ? result.sequenceA[i - 1] : "∅";
                  const columnLabel = j > 0 ? result.sequenceB[j - 1] : "∅";

                  const background = isOrigin
                    ? "rgba(251, 191, 36, 0.35)"
                    : isCurrent
                      ? "rgba(251, 146, 60, 0.85)"
                      : isVisited
                        ? "rgba(56, 189, 248, 0.22)"
                        : isHeader
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(255,255,255,0.03)";

                  const borderColor = isCurrent
                    ? "#fdba74"
                    : isVisited
                      ? "rgba(125, 211, 252, 0.75)"
                      : "rgba(255,255,255,0.10)";

                  return (
                    <Box
                      key={key}
                      position="relative"
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={background}
                      color={isHeader ? "whiteAlpha.900" : "white"}
                      p={2}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      textAlign="center"
                      boxShadow={
                        isCurrent
                          ? "0 0 0 1px rgba(255,255,255,0.2), 0 14px 40px rgba(249, 115, 22, 0.32)"
                          : "none"
                      }
                    >
                      {i === 0 && j === 0 ? (
                        <Text fontSize="xs" fontWeight="bold" opacity={0.8}>
                          ∅ / ∅
                        </Text>
                      ) : i === 0 ? (
                        <Box>
                          <Text fontSize="xs" opacity={0.7}>
                            B
                          </Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {columnLabel}
                          </Text>
                        </Box>
                      ) : j === 0 ? (
                        <Box>
                          <Text fontSize="xs" opacity={0.7}>
                            A
                          </Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {rowLabel}
                          </Text>
                        </Box>
                      ) : (
                        <Box>
                          <Text fontSize="xs" opacity={0.75} mb={1}>
                            {directionSymbol[cell.direction]}
                          </Text>
                          <Text fontSize="md" fontWeight="bold" lineHeight="1">
                            {cell.score}
                          </Text>
                        </Box>
                      )}

                      {!isHeader && isVisited ? (
                        <Text
                          position="absolute"
                          bottom="0.18rem"
                          right="0.3rem"
                          fontSize="xs"
                          opacity={0.55}
                        >
                          {Math.max(
                            0,
                            result.traceCells.findIndex(
                              (entry) => entry.i === i && entry.j === j,
                            ),
                          )}
                        </Text>
                      ) : null}
                    </Box>
                  );
                }),
              )}
            </Box>
          </Box>

          <Box>
            <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize="sm" opacity={0.8}>
              Backtracking speed
            </Text>
              <Text fontSize="sm" fontFamily="mono" opacity={0.75}>
                {stepDelayMs} ms per move
              </Text>
            </HStack>
            <Slider
              min={250}
              max={1500}
              step={50}
              value={stepDelayMs}
              onChange={setStepDelayMs}
            >
              <SliderTrack bg="whiteAlpha.200">
                <SliderFilledTrack bg="orange.300" />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
          </Box>
        </VStack>
      </Box>

      <Box
        w={{ base: "100%", xl: "380px" }}
        p={{ base: 4, md: 6 }}
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="white"
        boxShadow="0 20px 60px rgba(15, 23, 42, 0.08)"
      >
        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              Controls
            </Text>
            <Text fontSize="sm" color="gray.600">
              Edit sequences or scores, then replay the traceback step by step.
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              Alignment mode
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme={mode === "global" ? "orange" : "gray"}
                variant={mode === "global" ? "solid" : "outline"}
                onClick={() => switchMode("global")}
              >
                Global
              </Button>
              <Button
                size="sm"
                colorScheme={mode === "local" ? "green" : "gray"}
                variant={mode === "local" ? "solid" : "outline"}
                onClick={() => switchMode("local")}
              >
                Local
              </Button>
            </HStack>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              Sequence A
            </Text>
            <Input
              value={sequenceA}
              onChange={(event) => setSequenceA(event.target.value)}
              fontFamily="mono"
              textTransform="uppercase"
              placeholder="GATTACA"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              Sequence B
            </Text>
            <Input
              value={sequenceB}
              onChange={(event) => setSequenceB(event.target.value)}
              fontFamily="mono"
              textTransform="uppercase"
              placeholder="GCATGCU"
            />
          </Box>

          <Divider />

          <Stack direction="row" spacing={3}>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Match
              </Text>
              <Input
                type="number"
                value={matchScore}
                onChange={(event) => setMatchScore(Number(event.target.value) || 0)}
              />
            </Box>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Mismatch
              </Text>
              <Input
                type="number"
                value={mismatchScore}
                onChange={(event) => setMismatchScore(Number(event.target.value) || 0)}
              />
            </Box>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Gap
              </Text>
              <Input
                type="number"
                value={gapPenalty}
                onChange={(event) => setGapPenalty(Number(event.target.value) || 0)}
              />
            </Box>
          </Stack>

          <Divider />

          <Box
            p={4}
            borderRadius="2xl"
            bg="gray.50"
            borderWidth="1px"
            borderColor="blackAlpha.100"
          >
            <Text fontSize="sm" color="gray.500" mb={2}>
              Recurrence
            </Text>
            <Text fontFamily="mono" fontSize="sm" lineHeight="1.8">
              {mode === "global" ? (
                <>
                  dp[i][j] = max(
                  <br />
                  &nbsp;&nbsp;dp[i-1][j-1] + s(a, b),
                  <br />
                  &nbsp;&nbsp;dp[i-1][j] + gap,
                  <br />
                  &nbsp;&nbsp;dp[i][j-1] + gap
                  <br />
                  )
                </>
              ) : (
                <>
                  dp[i][j] = max(0,
                  <br />
                  &nbsp;&nbsp;dp[i-1][j-1] + s(a, b),
                  <br />
                  &nbsp;&nbsp;dp[i-1][j] + gap,
                  <br />
                  &nbsp;&nbsp;dp[i][j-1] + gap
                  <br />
                  )
                </>
              )}
            </Text>
            <Text fontSize="xs" color="gray.500" mt={3}>
              {mode === "global"
                ? "Traceback starts at the bottom-right cell and walks to the origin."
                : "Traceback starts at the highest-scoring cell and stops when the score reaches zero."}
            </Text>
          </Box>

          <Box>
            <HStack spacing={3} wrap="wrap">
              <Button colorScheme="orange" onClick={togglePlayback}>
                {playing ? "Pause" : stepIndex >= result.traceSteps.length ? "Replay" : "Play"}
              </Button>
              <Button onClick={stepOnce} {...darkSecondaryButtonProps}>
                Step
              </Button>
              <Button onClick={reset} {...darkSecondaryButtonProps}>
                Reset
              </Button>
              <AlgorithmDialogButton
                title={NEEDLEMAN_ALGO.title}
                summary={NEEDLEMAN_ALGO.summary}
                steps={NEEDLEMAN_ALGO.steps}
                code={NEEDLEMAN_ALGO.code}
                note={NEEDLEMAN_ALGO.note}
              />
            </HStack>
          </Box>

          <Box
            p={4}
            borderRadius="2xl"
            bg="linear-gradient(160deg, #fff7ed 0%, #ffedd5 100%)"
            borderWidth="1px"
            borderColor="orange.100"
          >
            <Text fontSize="sm" color="orange.700" fontWeight="semibold" mb={2}>
              Current move
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {currentStep ? moveLabel[currentStep.move] : "Start"}
            </Text>
            <Text fontSize="sm" color="gray.600" mt={2}>
              {currentStep
                ? `${currentStep.fromI},${currentStep.fromJ} -> ${currentStep.toI},${currentStep.toJ}`
                : "Traceback has not started yet."}
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              Partial alignment
            </Text>
            <Box
              p={4}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="blackAlpha.100"
              bg="gray.50"
              fontFamily="mono"
              fontSize="sm"
              overflowX="auto"
            >
              <Text>Seq A: {partialAlignment.a || "..."}</Text>
              <Text mt={2}>Seq B: {partialAlignment.b || "..."}</Text>
            </Box>
          </Box>

          <Box>
            <Text fontSize="sm" color="gray.500">
              Final alignment
            </Text>
            <Box
              mt={2}
              p={4}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="blackAlpha.100"
              bg="white"
              fontFamily="mono"
              fontSize="sm"
            >
              <Text>{result.alignedA}</Text>
              <Text mt={2}>{result.alignedB}</Text>
            </Box>
          </Box>

          <Box>
            <Text fontSize="sm" color="gray.500">
              Final score: <strong>{result.score}</strong>
            </Text>
            {mode === "local" ? (
              <Text fontSize="sm" color="gray.500" mt={1}>
                Best local start cell: ({result.startCell.i}, {result.startCell.j})
              </Text>
            ) : null}
          </Box>
        </VStack>
      </Box>
    </Stack>
  );
};

export default NeedlemanWunschAlignment;
