"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";

type Square = {
  x: number;
  y: number;
  size: number;
  arcPath: string;
  value: number;
};

const phi = (1 + Math.sqrt(5)) / 2;

const colors = [
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#ec4899",
];

const fibonacci = (count: number) => {
  const values = [1, 1];

  while (values.length < count) {
    const next = values[values.length - 1] + values[values.length - 2];
    values.push(next);
  }

  return values.slice(0, count);
};

const buildGoldenSquares = (count: number) => {
  const values = fibonacci(count);
  const squares: Square[] = [
    {
      x: 0,
      y: 0,
      size: values[0],
      arcPath: "",
      value: values[0],
    },
    {
      x: values[0],
      y: 0,
      size: values[1],
      arcPath: `M ${values[0]} ${values[1]} A ${values[1]} ${values[1]} 0 0 1 ${
        values[0] * 2
      } 0`,
      value: values[1],
    },
  ];

  let minX = 0;
  let minY = 0;
  let maxX = values[0] + values[1];
  let maxY = values[0];

  for (let i = 2; i < values.length; i += 1) {
    const size = values[i];
    const direction = (i - 2) % 4;
    let x = 0;
    let y = 0;
    let arcPath = "";

    if (direction === 0) {
      x = minX;
      y = maxY;
      arcPath = `M ${x} ${y} A ${size} ${size} 0 0 1 ${x + size} ${y + size}`;
      maxY += size;
    } else if (direction === 1) {
      x = minX - size;
      y = minY;
      arcPath = `M ${x + size} ${y} A ${size} ${size} 0 0 1 ${x} ${y + size}`;
      minX -= size;
    } else if (direction === 2) {
      x = minX;
      y = minY - size;
      arcPath = `M ${x + size} ${y + size} A ${size} ${size} 0 0 1 ${x} ${y}`;
      minY -= size;
    } else {
      x = maxX;
      y = minY;
      arcPath = `M ${x} ${y + size} A ${size} ${size} 0 0 1 ${x + size} ${y}`;
      maxX += size;
    }

    squares.push({ x, y, size, arcPath, value: size });
  }

  return {
    squares,
    bounds: {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
};

const GoldenRatio = () => {
  const [steps, setSteps] = useState(7);
  const [playing, setPlaying] = useState(true);
  const [showSpiral, setShowSpiral] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    if (!playing) {
      return;
    }

    const timer = window.setInterval(() => {
      setSteps((value) => {
        return value >= 10 ? 3 : value + 1;
      });
    }, 1400);

    return () => {
      window.clearInterval(timer);
    };
  }, [playing]);

  const fib = useMemo(() => {
    return fibonacci(steps + 1);
  }, [steps]);

  const ratio = fib[fib.length - 1] / fib[fib.length - 2];
  const ratioError = Math.abs(phi - ratio);

  const tiling = useMemo(() => {
    return buildGoldenSquares(steps);
  }, [steps]);

  const spiralPath = tiling.squares
    .map((square) => square.arcPath)
    .filter(Boolean)
    .join(" ");

  const viewBox = `${tiling.bounds.minX - 1} ${tiling.bounds.minY - 1} ${
    tiling.bounds.width + 2
  } ${tiling.bounds.height + 2}`;

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
        borderColor="blackAlpha.100"
        bg="linear-gradient(160deg, #fff9ed 0%, #f5e6cb 100%)"
        boxShadow="0 30px 80px rgba(128, 88, 33, 0.14)"
      >
        <Box
          borderRadius="2xl"
          bg="rgba(255,255,255,0.7)"
          borderWidth="1px"
          borderColor="blackAlpha.100"
          p={4}
        >
          <svg viewBox={viewBox} width="100%" style={{ display: "block" }}>
            {tiling.squares.map((square, index) => {
              const color = colors[index % colors.length];
              return (
                <g key={`${square.x}-${square.y}-${square.size}`}>
                  <rect
                    x={square.x}
                    y={square.y}
                    width={square.size}
                    height={square.size}
                    fill={color}
                    fillOpacity="0.18"
                    stroke={color}
                    strokeWidth="0.12"
                    rx="0.18"
                  />
                  {showLabels ? (
                    <text
                      x={square.x + square.size / 2}
                      y={square.y + square.size / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={Math.max(square.size * 0.18, 0.65)}
                      fill="#111827"
                    >
                      {square.value}
                    </text>
                  ) : null}
                </g>
              );
            })}

            {showSpiral ? (
              <path
                d={spiralPath}
                fill="none"
                stroke="#111827"
                strokeWidth="0.18"
                strokeLinecap="round"
              />
            ) : null}
          </svg>
        </Box>

        <Text mt={4} color="gray.700">
          Each new square has side length equal to the sum of the previous two.
          As the tiling grows, the enclosing rectangle approaches a golden
          rectangle, and the quarter-circle arcs trace the familiar spiral.
        </Text>
      </Box>

      <VStack
        align="stretch"
        spacing={5}
        w={{ base: "100%", xl: "370px" }}
        p={5}
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="white"
        boxShadow="lg"
      >
        <Box>
          <Badge colorScheme="orange" mb={3}>
            Number Pattern
          </Badge>
          <Text fontSize="2xl" fontWeight="bold" lineHeight="1.1">
            Explaining the golden ratio
          </Text>
          <Text color="gray.600" mt={2}>
            The ratio emerges from Fibonacci growth: consecutive terms settle
            toward the constant φ.
          </Text>
        </Box>

        <Divider />

        <Box>
          <Text fontSize="sm" color="gray.600">
            Current approximation
          </Text>
          <Text fontSize="3xl" fontWeight="bold">
            {ratio.toFixed(6)}
          </Text>
          <Text color="gray.600" mt={1}>
            φ = {(phi).toFixed(6)}
          </Text>
          <Text color="gray.600">absolute error = {ratioError.toFixed(6)}</Text>
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Fibonacci steps
          </Text>
          <Slider min={3} max={10} step={1} value={steps} onChange={setSteps}>
            <SliderTrack>
              <SliderFilledTrack bg="orange.400" />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text mt={1} color="gray.600" fontSize="sm">
            Showing the first {steps} squares
          </Text>
        </Box>

        <HStack spacing={2}>
          <Button
            colorScheme="orange"
            onClick={() => {
              setPlaying((value) => !value);
            }}
          >
            {playing ? "Pause growth" : "Animate growth"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSteps(3);
              setPlaying(false);
            }}
          >
            Reset
          </Button>
        </HStack>

        <Box>
          <HStack justify="space-between" mb={3}>
            <Text fontSize="sm" fontWeight="semibold">
              Spiral overlay
            </Text>
            <Switch isChecked={showSpiral} onChange={() => setShowSpiral((v) => !v)} />
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm" fontWeight="semibold">
              Number labels
            </Text>
            <Switch isChecked={showLabels} onChange={() => setShowLabels((v) => !v)} />
          </HStack>
        </Box>

        <Divider />

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Why this converges
          </Text>
          <Text color="gray.600" fontSize="sm">
            If a ratio stabilizes so that Fₙ₊₁ / Fₙ ≈ x, then the recurrence
            Fₙ₊₁ = Fₙ + Fₙ₋₁ implies x = 1 + 1/x. Solving x² = x + 1 gives the
            positive root φ = (1 + √5) / 2.
          </Text>
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Sequence
          </Text>
          <Text color="gray.700" fontFamily="mono" fontSize="sm">
            {fib.join(", ")}
          </Text>
        </Box>
      </VStack>
    </Stack>
  );
};

export default GoldenRatio;
