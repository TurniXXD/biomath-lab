"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from "@chakra-ui/react";

const WIDTH = 960;
const HEIGHT = 640;

const palette = (iteration: number, maxIterations: number) => {
  if (iteration >= maxIterations) {
    return [4, 8, 18];
  }

  const t = iteration / maxIterations;
  const r = Math.floor(9 * (1 - t) * t * t * t * 255);
  const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
  const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);

  return [r, g, b];
};

const MandelbrotSet = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [centerX, setCenterX] = useState(-0.5);
  const [centerY, setCenterY] = useState(0);
  const [scale, setScale] = useState(3);
  const [maxIterations, setMaxIterations] = useState(120);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const image = context.createImageData(WIDTH, HEIGHT);
    const aspect = HEIGHT / WIDTH;
    const heightScale = scale * aspect;

    for (let px = 0; px < WIDTH; px += 1) {
      for (let py = 0; py < HEIGHT; py += 1) {
        const x0 = centerX + (px / WIDTH - 0.5) * scale;
        const y0 = centerY + (py / HEIGHT - 0.5) * heightScale;

        let x = 0;
        let y = 0;
        let iteration = 0;

        while (x * x + y * y <= 4 && iteration < maxIterations) {
          const xTemp = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xTemp;
          iteration += 1;
        }

        const [r, g, b] = palette(iteration, maxIterations);
        const offset = (py * WIDTH + px) * 4;

        image.data[offset] = r;
        image.data[offset + 1] = g;
        image.data[offset + 2] = b;
        image.data[offset + 3] = 255;
      }
    }

    context.putImageData(image, 0, 0);
  }, [centerX, centerY, scale, maxIterations]);

  const viewport = useMemo(() => {
    const heightScale = scale * (HEIGHT / WIDTH);

    return {
      xMin: centerX - scale / 2,
      xMax: centerX + scale / 2,
      yMin: centerY - heightScale / 2,
      yMax: centerY + heightScale / 2,
    };
  }, [centerX, centerY, scale]);

  const zoomAtPoint = (
    clientX: number,
    clientY: number,
    zoomFactor: number,
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    const nextScale = scale * zoomFactor;
    const nextHeightScale = nextScale * (HEIGHT / WIDTH);

    const worldX = viewport.xMin + px * (viewport.xMax - viewport.xMin);
    const worldY = viewport.yMin + py * (viewport.yMax - viewport.yMin);

    setCenterX(worldX - (px - 0.5) * nextScale);
    setCenterY(worldY - (py - 0.5) * nextHeightScale);
    setScale(nextScale);
    setLastPoint({ x: worldX, y: worldY });
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Heading mb={2}>Mandelbrot Set</Heading>
        <Text color="gray.600">
          Explore the classic complex dynamical system by iterating{" "}
          <code>z_(n+1) = z_n^2 + c</code> and coloring each point by its
          escape time.
        </Text>
      </Box>

      <Grid templateColumns={{ base: "1fr", xl: "340px 1fr" }} gap={6}>
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
              <FormLabel>Center X</FormLabel>
              <Input
                type="number"
                value={centerX}
                onChange={(event) => setCenterX(Number(event.target.value))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Center Y</FormLabel>
              <Input
                type="number"
                value={centerY}
                onChange={(event) => setCenterY(Number(event.target.value))}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Zoom scale</FormLabel>
              <Slider
                min={0.1}
                max={4}
                step={0.05}
                value={scale}
                onChange={setScale}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Text mt={2} fontSize="sm" color="gray.600">
                {scale.toFixed(2)}
              </Text>
            </FormControl>

            <FormControl>
              <FormLabel>Max iterations</FormLabel>
              <Slider
                min={40}
                max={400}
                step={10}
                value={maxIterations}
                onChange={setMaxIterations}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Text mt={2} fontSize="sm" color="gray.600">
                {maxIterations}
              </Text>
            </FormControl>

            <HStack>
              <Button
                onClick={() => {
                  setCenterX(-0.5);
                  setCenterY(0);
                  setScale(3);
                  setMaxIterations(120);
                  setLastPoint(null);
                }}
              >
                Reset
              </Button>
              <Button colorScheme="green" onClick={() => setScale((value) => value * 0.5)}>
                Zoom in
              </Button>
              <Button colorScheme="orange" onClick={() => setScale((value) => value * 2)}>
                Zoom out
              </Button>
            </HStack>
          </VStack>
        </GridItem>

        <GridItem>
          <VStack align="stretch" spacing={4}>
            <Grid templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }} gap={4}>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>x range</StatLabel>
                <StatNumber fontSize="md">
                  {viewport.xMin.toFixed(3)} to {viewport.xMax.toFixed(3)}
                </StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>y range</StatLabel>
                <StatNumber fontSize="md">
                  {viewport.yMin.toFixed(3)} to {viewport.yMax.toFixed(3)}
                </StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>Resolution</StatLabel>
                <StatNumber fontSize="md">
                  {WIDTH} × {HEIGHT}
                </StatNumber>
              </Stat>
              <Stat p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="xl">
                <StatLabel>Last clicked point</StatLabel>
                <StatNumber fontSize="md">
                  {lastPoint ? `${lastPoint.x.toFixed(4)}, ${lastPoint.y.toFixed(4)}` : "none"}
                </StatNumber>
              </Stat>
            </Grid>

            <Box
              p={3}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="2xl"
              bg="white"
              overflow="hidden"
            >
              <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "1rem" }}
                onClick={(event) => zoomAtPoint(event.clientX, event.clientY, 0.5)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  zoomAtPoint(event.clientX, event.clientY, 2);
                }}
              />
            </Box>

            <Text fontSize="sm" color="gray.600">
              Left click to zoom in, right click to zoom out.
            </Text>
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
};

export default MandelbrotSet;
