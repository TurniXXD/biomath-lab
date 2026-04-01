"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  Text,
  VStack,
} from "@chakra-ui/react";

const GRID_WIDTH = 72;
const GRID_HEIGHT = 44;
const CELL_SIZE = 12;

type PatternName = "glider" | "pulsar" | "gosper";

const createEmptyGrid = () => {
  return Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0));
};

const cloneGrid = (grid: number[][]) => {
  return grid.map((row) => [...row]);
};

const countAlive = (grid: number[][]) => {
  let total = 0;

  for (const row of grid) {
    for (const cell of row) {
      total += cell;
    }
  }

  return total;
};

const seedRandom = (density: number) => {
  const next = createEmptyGrid();

  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      next[y][x] = Math.random() < density ? 1 : 0;
    }
  }

  return next;
};

const stampCells = (
  grid: number[][],
  originX: number,
  originY: number,
  cells: Array<[number, number]>,
) => {
  const next = cloneGrid(grid);

  for (const [dx, dy] of cells) {
    const x = originX + dx;
    const y = originY + dy;

    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      continue;
    }

    next[y][x] = 1;
  }

  return next;
};

const insertPattern = (pattern: PatternName) => {
  const grid = createEmptyGrid();

  if (pattern === "glider") {
    return stampCells(grid, 8, 8, [
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ]);
  }

  if (pattern === "pulsar") {
    const arm = [
      [2, 0],
      [3, 0],
      [4, 0],
      [8, 0],
      [9, 0],
      [10, 0],
      [0, 2],
      [5, 2],
      [7, 2],
      [12, 2],
      [0, 3],
      [5, 3],
      [7, 3],
      [12, 3],
      [0, 4],
      [5, 4],
      [7, 4],
      [12, 4],
      [2, 5],
      [3, 5],
      [4, 5],
      [8, 5],
      [9, 5],
      [10, 5],
    ];

    const offsets: Array<[number, number]> = [];

    for (const [x, y] of arm) {
      offsets.push([x, y]);
      offsets.push([x, 12 - y]);
      offsets.push([12 - x, y]);
      offsets.push([12 - x, 12 - y]);
    }

    return stampCells(grid, 30, 15, offsets);
  }

  return stampCells(grid, 4, 14, [
    [0, 4],
    [1, 4],
    [0, 5],
    [1, 5],
    [10, 4],
    [10, 5],
    [10, 6],
    [11, 3],
    [11, 7],
    [12, 2],
    [12, 8],
    [13, 2],
    [13, 8],
    [14, 5],
    [15, 3],
    [15, 7],
    [16, 4],
    [16, 5],
    [16, 6],
    [17, 5],
    [20, 2],
    [20, 3],
    [20, 4],
    [21, 2],
    [21, 3],
    [21, 4],
    [22, 1],
    [22, 5],
    [24, 0],
    [24, 1],
    [24, 5],
    [24, 6],
    [34, 2],
    [34, 3],
    [35, 2],
    [35, 3],
  ]);
};

const nextGeneration = (grid: number[][], wrapEdges: boolean) => {
  const next = createEmptyGrid();

  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      let neighbors = 0;

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) {
            continue;
          }

          let nx = x + dx;
          let ny = y + dy;

          if (wrapEdges) {
            nx = (nx + GRID_WIDTH) % GRID_WIDTH;
            ny = (ny + GRID_HEIGHT) % GRID_HEIGHT;
          }

          if (nx < 0 || nx >= GRID_WIDTH || ny < 0 || ny >= GRID_HEIGHT) {
            continue;
          }

          neighbors += grid[ny][nx];
        }
      }

      if (grid[y][x] === 1) {
        next[y][x] = neighbors === 2 || neighbors === 3 ? 1 : 0;
      } else {
        next[y][x] = neighbors === 3 ? 1 : 0;
      }
    }
  }

  return next;
};

const GameOfLife = () => {
  const [grid, setGrid] = useState<number[][]>(() => seedRandom(0.24));
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(8);
  const [density, setDensity] = useState(24);
  const [generation, setGeneration] = useState(0);
  const [wrapEdges, setWrapEdges] = useState(true);
  const [paintValue, setPaintValue] = useState<0 | 1>(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerDownRef = useRef(false);

  const aliveCount = useMemo(() => {
    return countAlive(grid);
  }, [grid]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const delay = Math.max(35, 280 - speed * 22);
    const timer = window.setInterval(() => {
      setGrid((current) => {
        return nextGeneration(current, wrapEdges);
      });
      setGeneration((value) => value + 1);
    }, delay);

    return () => {
      window.clearInterval(timer);
    };
  }, [running, speed, wrapEdges]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff9f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        const alive = grid[y][x] === 1;
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        ctx.fillStyle = alive ? "#111827" : "#f3e8d4";
        ctx.fillRect(px, py, CELL_SIZE - 1, CELL_SIZE - 1);

        if (alive) {
          ctx.fillStyle = "#fb923c";
          ctx.fillRect(px + 2, py + 2, CELL_SIZE - 5, CELL_SIZE - 5);
        }
      }
    }
  }, [grid]);

  const applyBrush = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);

    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
      return;
    }

    setGrid((current) => {
      const next = cloneGrid(current);
      next[y][x] = paintValue;
      return next;
    });
  };

  const stepForward = () => {
    setGrid((current) => {
      return nextGeneration(current, wrapEdges);
    });
    setGeneration((value) => value + 1);
  };

  return (
    <Stack
      direction={{ base: "column", xl: "row" }}
      spacing={6}
      align="stretch"
      w="100%"
    >
      <VStack
        align="stretch"
        spacing={5}
        w={{ base: "100%", xl: "360px" }}
        p={5}
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="white"
        boxShadow="lg"
      >
        <Box>
          <Badge colorScheme="orange" mb={3}>
            Cellular Automaton
          </Badge>
          <Text fontSize="2xl" fontWeight="bold" lineHeight="1.1">
            Conway&apos;s Game of Life
          </Text>
          <Text color="gray.600" mt={2}>
            Paint cells, load classic patterns, and watch local rules create
            global structure.
          </Text>
        </Box>

        <Divider />

        <HStack justify="space-between">
          <Box>
            <Text fontSize="sm" color="gray.600">
              Generation
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {generation}
            </Text>
          </Box>
          <Box textAlign="right">
            <Text fontSize="sm" color="gray.600">
              Living cells
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              {aliveCount}
            </Text>
          </Box>
        </HStack>

        <HStack spacing={2} flexWrap="wrap">
          <Button
            colorScheme="orange"
            onClick={() => {
              setRunning((value) => !value);
            }}
          >
            {running ? "Pause" : "Run"}
          </Button>
          <Button onClick={stepForward}>Step</Button>
          <Button
            variant="outline"
            onClick={() => {
              setRunning(false);
              setGrid(createEmptyGrid());
              setGeneration(0);
            }}
          >
            Clear
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setGrid(seedRandom(density / 100));
              setGeneration(0);
            }}
          >
            Reseed
          </Button>
        </HStack>

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Simulation speed
          </Text>
          <Slider min={1} max={10} step={1} value={speed} onChange={setSpeed}>
            <SliderTrack>
              <SliderFilledTrack bg="orange.400" />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text fontSize="sm" color="gray.600" mt={1}>
            {speed} / 10
          </Text>
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Random density
          </Text>
          <Slider
            min={5}
            max={50}
            step={1}
            value={density}
            onChange={setDensity}
          >
            <SliderTrack>
              <SliderFilledTrack bg="pink.400" />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text fontSize="sm" color="gray.600" mt={1}>
            {density}% alive on reseed
          </Text>
        </Box>

        <Divider />

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Patterns
          </Text>
          <HStack spacing={2} flexWrap="wrap">
            <Button
              size="sm"
              onClick={() => {
                setRunning(false);
                setGrid(insertPattern("glider"));
                setGeneration(0);
              }}
            >
              Glider
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setRunning(false);
                setGrid(insertPattern("pulsar"));
                setGeneration(0);
              }}
            >
              Pulsar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setRunning(false);
                setGrid(insertPattern("gosper"));
                setGeneration(0);
              }}
            >
              Gosper gun
            </Button>
          </HStack>
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Editing mode
          </Text>
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme={paintValue === 1 ? "orange" : "gray"}
              onClick={() => {
                setPaintValue(1);
              }}
            >
              Paint life
            </Button>
            <Button
              size="sm"
              colorScheme={paintValue === 0 ? "orange" : "gray"}
              onClick={() => {
                setPaintValue(0);
              }}
            >
              Erase
            </Button>
          </HStack>
          <Button
            mt={3}
            size="sm"
            variant={wrapEdges ? "solid" : "outline"}
            onClick={() => {
              setWrapEdges((value) => !value);
            }}
          >
            {wrapEdges ? "Toroidal edges on" : "Toroidal edges off"}
          </Button>
        </Box>
      </VStack>

      <Box
        flex="1"
        p={{ base: 3, md: 5 }}
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="linear-gradient(180deg, #fff8eb 0%, #f3e8d4 100%)"
        boxShadow="0 30px 80px rgba(108, 74, 37, 0.15)"
      >
        <Box
          overflow="auto"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor="blackAlpha.100"
          bg="#fffdf7"
          p={3}
        >
          <canvas
            ref={canvasRef}
            width={GRID_WIDTH * CELL_SIZE}
            height={GRID_HEIGHT * CELL_SIZE}
            style={{
              display: "block",
              width: "100%",
              maxWidth: `${GRID_WIDTH * CELL_SIZE}px`,
              cursor: paintValue === 1 ? "crosshair" : "cell",
              borderRadius: "20px",
            }}
            onPointerDown={(event) => {
              pointerDownRef.current = true;
              applyBrush(event);
            }}
            onPointerMove={(event) => {
              if (!pointerDownRef.current) {
                return;
              }

              applyBrush(event);
            }}
            onPointerUp={() => {
              pointerDownRef.current = false;
            }}
            onPointerLeave={() => {
              pointerDownRef.current = false;
            }}
          />
        </Box>

        <Text mt={4} color="gray.600">
          Rules: a live cell survives with 2 or 3 neighbors, a dead cell is
          born with exactly 3. Click or drag on the grid to edit the colony.
        </Text>
      </Box>
    </Stack>
  );
};

export default GameOfLife;
