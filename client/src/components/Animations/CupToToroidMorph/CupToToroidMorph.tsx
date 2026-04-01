"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";

type Point = [number, number];

const TAU = Math.PI * 2;
const SAMPLE_COUNT = 240;
const CYCLE_SECONDS = 8;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

const wrapAngle = (angle: number) => {
  let value = angle;

  while (value <= -Math.PI) {
    value += TAU;
  }

  while (value > Math.PI) {
    value -= TAU;
  }

  return value;
};

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);

  return t * t * (3 - 2 * t);
};

const buildPath = (points: Point[]) => {
  if (points.length === 0) {
    return "";
  }

  return `${points
    .map(([x, y], index) => {
      return `${index === 0 ? "M" : "L"} ${x.toFixed(4)} ${y.toFixed(4)}`;
    })
    .join(" ")} Z`;
};

const buildMorphContours = (morph: number) => {
  const outerPoints: Point[] = [];
  const innerPoints: Point[] = [];

  const roundedCupFactor = 1 - smoothstep(0.08, 0.85, morph);
  const torusFactor = smoothstep(0.12, 0.95, morph);
  const shapeTilt = 0.06 * Math.sin(morph * TAU);

  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const angle = (index / SAMPLE_COUNT) * TAU - Math.PI / 2;
    const sideAngle = wrapAngle(angle);

    const handleBulge =
      (1 - morph) *
      0.52 *
      Math.exp(-(sideAngle * sideAngle) / (2 * 0.36 * 0.36));

    const upperLip =
      (1 - morph) * 0.16 * Math.max(0, Math.cos(angle - Math.PI / 2));

    const bodyOval =
      (1 - morph) * 0.12 * Math.cos(angle * 2 - Math.PI / 6) +
      torusFactor * 0.03 * Math.cos(angle * 4);

    const outerRadius =
      1.12 + handleBulge + upperLip + bodyOval + roundedCupFactor * 0.04;

    const innerRadius =
      0.56 +
      (1 - morph) * 0.04 * Math.cos(angle * 3 + Math.PI / 4) +
      torusFactor * 0.01 * Math.sin(angle * 2);

    const xOuter = outerRadius * Math.cos(angle);
    const yOuter = outerRadius * Math.sin(angle) * (1 + shapeTilt);
    const xInner = innerRadius * Math.cos(-angle);
    const yInner = innerRadius * Math.sin(-angle) * (1 + shapeTilt);

    outerPoints.push([xOuter, yOuter]);
    innerPoints.push([xInner, yInner]);
  }

  return {
    outerPath: buildPath(outerPoints),
    innerPath: buildPath(innerPoints.reverse()),
    morphLabel:
      morph < 0.5
        ? "Cup"
        : morph < 0.82
          ? "Deforming"
          : "Toroid",
  };
};

const CupToToroidMorph = () => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let start = 0;

    const loop = (now: number) => {
      if (!start) {
        start = now;
      }

      setElapsed((now - start) / 1000);
      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  const morph = useMemo(() => {
    return 0.5 - 0.5 * Math.cos((elapsed / CYCLE_SECONDS) * TAU);
  }, [elapsed]);

  const contours = useMemo(() => {
    return buildMorphContours(morph);
  }, [morph]);

  const rotation = 12 * Math.sin(elapsed * 0.35);
  const float = Math.sin(elapsed * 1.15) * 10;
  const glow = 0.16 + morph * 0.12;

  return (
    <VStack
      align="stretch"
      spacing={6}
      minH="100vh"
      px={{ base: 4, md: 8 }}
      py={{ base: 6, md: 8 }}
      bg="linear-gradient(180deg, #07111f 0%, #030712 100%)"
      color="white"
    >
      <Box maxW="1100px" mx="auto" w="100%">
        <Badge colorScheme="orange" mb={3}>
          Topology demo
        </Badge>
        <HStack justify="space-between" align="start" gap={4} wrap="wrap">
          <Box>
            <Text fontSize={{ base: "3xl", md: "5xl" }} fontWeight="bold" lineHeight="1.05">
              Cup to Toroid Morph
            </Text>
            <Text color="whiteAlpha.800" maxW="3xl" mt={3}>
              A continuous deformation can change the geometry of a shape
              without changing its topology. The hole count stays at one the
              whole time.
            </Text>
          </Box>

          <HStack spacing={3} wrap="wrap">
            <Badge colorScheme="orange" px={3} py={1} borderRadius="full">
              {contours.morphLabel}
            </Badge>
            <Badge colorScheme="cyan" px={3} py={1} borderRadius="full">
              Hole count 1
            </Badge>
            <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
              Loop {Math.floor(elapsed / CYCLE_SECONDS) + 1}
            </Badge>
          </HStack>
        </HStack>
      </Box>

      <Box
        flex="1"
        maxW="1100px"
        mx="auto"
        w="100%"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        bg="linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(3, 7, 18, 0.96) 100%)"
        boxShadow="0 40px 100px rgba(2, 8, 23, 0.45)"
        overflow="hidden"
        position="relative"
      >
        <Box
          position="absolute"
          inset={0}
          backgroundImage="
            radial-gradient(circle at 50% 30%, rgba(251, 146, 60, 0.18), transparent 30%),
            radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.14), transparent 24%),
            radial-gradient(circle at 15% 70%, rgba(168, 85, 247, 0.12), transparent 28%)
          "
          pointerEvents="none"
        />

        <Box
          position="absolute"
          inset={0}
          backgroundImage="linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)"
          backgroundSize="72px 72px"
          opacity={0.35}
          pointerEvents="none"
        />

        <Box
          position="relative"
          minH={{ base: "560px", md: "760px" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ base: 4, md: 8 }}
        >
          <svg
            viewBox="-2.7 -2.2 5.4 4.4"
            width="100%"
            style={{
              maxWidth: "980px",
              display: "block",
              overflow: "visible",
              transform: `translateY(${float * 0.03}rem) rotate(${rotation}deg)`,
              transformOrigin: "center",
              transition: "transform 40ms linear",
            }}
          >
            <defs>
              <radialGradient id="cup-toroid-fill" cx="30%" cy="25%" r="85%">
                <stop offset="0%" stopColor="#fff7ed" />
                <stop offset="35%" stopColor="#fdba74" />
                <stop offset="100%" stopColor="#7c2d12" />
              </radialGradient>
              <radialGradient id="cup-toroid-glow" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#fb923c" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
              </radialGradient>
              <filter id="cup-toroid-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="0.18" />
              </filter>
            </defs>

            <ellipse
              cx="0"
              cy="1.58"
              rx="1.75"
              ry="0.28"
              fill="#020617"
              opacity={0.55}
              filter="url(#cup-toroid-shadow)"
            />

            <g>
              <path
                d={`${contours.outerPath} ${contours.innerPath}`}
                fill="url(#cup-toroid-fill)"
                fillRule="evenodd"
                stroke="rgba(255, 247, 237, 0.55)"
                strokeWidth="0.04"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              <path
                d={contours.outerPath}
                fill="none"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="0.02"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              <path
                d={contours.innerPath}
                fill="none"
                stroke="rgba(255, 247, 237, 0.7)"
                strokeWidth="0.03"
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.88}
              />
            </g>

            <circle cx="0" cy="0" r="1.82" fill="url(#cup-toroid-glow)" opacity={glow} />
          </svg>
        </Box>
      </Box>

      <Box maxW="1100px" mx="auto" w="100%">
        <Text color="whiteAlpha.700" maxW="3xl">
          The surface keeps one hole as it deforms from a cup-like form to a
          toroid and back again. That is the intuition behind the topology
          joke: shape can change, but holes are preserved under continuous
          deformation.
        </Text>
      </Box>
    </VStack>
  );
};

export default CupToToroidMorph;
