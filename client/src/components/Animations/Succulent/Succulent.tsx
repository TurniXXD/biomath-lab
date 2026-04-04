"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";

type Leaf = {
  angle: number;
  radius: number;
  length: number;
  width: number;
  hue: number;
};

const TAU = Math.PI * 2;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const generateLeaves = (count: number) => {
  const leaves: Leaf[] = [];

  for (let index = 0; index < count; index += 1) {
    const progress = index / Math.max(1, count - 1);
    leaves.push({
      angle: index * GOLDEN_ANGLE,
      radius: 0.12 + progress * 2.8,
      length: 0.9 + progress * 0.9,
      width: 0.16 + progress * 0.11,
      hue: 125 + progress * 30,
    });
  }

  return leaves;
};

const Succulent = () => {
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

  const leaves = useMemo(() => generateLeaves(72), []);
  const pulse = 1 + Math.sin(elapsed * 1.15) * 0.025;
  const turn = elapsed * 7;
  const glow = 0.12 + Math.sin(elapsed * 1.8) * 0.04;

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Badge colorScheme="green" mb={3}>
          Biology
        </Badge>
        <Text fontSize="3xl" fontWeight="bold" lineHeight="1.1" mb={2}>
          Succulent
        </Text>
        <Text color="gray.600" maxW="3xl">
          A spiraling rosette with phyllotaxis-inspired leaf placement, subtle
          pulsing, and a slow rotational drift.
        </Text>
      </Box>

      <HStack wrap="wrap" spacing={3}>
        <Badge colorScheme="green" px={3} py={1} borderRadius="full">
          Leaves {leaves.length}
        </Badge>
        <Badge colorScheme="teal" px={3} py={1} borderRadius="full">
          Golden angle
        </Badge>
        <Badge colorScheme="orange" px={3} py={1} borderRadius="full">
          Pulse {pulse.toFixed(2)}x
        </Badge>
      </HStack>

      <Box
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="linear-gradient(180deg, #f0fdf4 0%, #f8fafc 100%)"
        boxShadow="0 28px 80px rgba(15, 23, 42, 0.12)"
        overflow="hidden"
        position="relative"
      >
        <Box
          position="absolute"
          inset={0}
          backgroundImage="
            radial-gradient(circle at 50% 28%, rgba(34, 197, 94, 0.12), transparent 26%),
            radial-gradient(circle at 80% 35%, rgba(20, 184, 166, 0.10), transparent 22%),
            radial-gradient(circle at 20% 72%, rgba(132, 204, 22, 0.10), transparent 24%)
          "
          pointerEvents="none"
        />

        <Box
          minH={{ base: "520px", md: "680px" }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ base: 4, md: 8 }}
        >
          <svg
            viewBox="-5 -5 10 10"
            width="100%"
            style={{
              maxWidth: "920px",
              display: "block",
              overflow: "visible",
            }}
          >
            <defs>
              <linearGradient id="succulent-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dcfce7" />
                <stop offset="45%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
              <radialGradient id="succulent-center" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="60%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </radialGradient>
              <radialGradient id="succulent-glow" cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#86efac" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse cx="0" cy="3.3" rx="3.3" ry="0.6" fill="#1f2937" opacity={0.13} />

            <g transform={`rotate(${turn}) scale(${pulse})`}>
              {leaves.map((leaf, index) => {
                const rad = leaf.radius + Math.sin(elapsed * 1.5 + index * 0.18) * 0.06;
                const angle = leaf.angle + Math.sin(elapsed * 1.2 + index * 0.12) * 0.08;
                const x = Math.cos(angle) * rad;
                const y = Math.sin(angle) * rad * 0.72;
                const leafRotation = (angle * 180) / Math.PI + 90;
                const bend = 0.15 + Math.sin(elapsed * 2 + index * 0.2) * 0.02;
                const leafLength = leaf.length + Math.sin(elapsed * 1.1 + index * 0.14) * 0.04;
                const leafWidth = leaf.width;
                const color = `hsl(${leaf.hue}, 58%, ${52 - Math.min(index / 3, 10)}%)`;

                return (
                  <g
                    key={`${index}-${leaf.angle}`}
                    transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${leafRotation})`}
                  >
                    <path
                      d={`M 0 0 C -${(leafWidth * 0.55).toFixed(3)} -${(leafLength * 0.35).toFixed(3)}, -${leafWidth.toFixed(3)} -${(leafLength * 0.75).toFixed(3)}, 0 -${leafLength.toFixed(3)} C ${leafWidth.toFixed(3)} -${(leafLength * 0.75).toFixed(3)}, ${(leafWidth * 0.55).toFixed(3)} -${(leafLength * 0.35).toFixed(3)}, 0 0 Z`}
                      fill={index % 3 === 0 ? "url(#succulent-leaf)" : color}
                      opacity={0.9}
                      transform={`scale(1 ${(1 + bend).toFixed(3)})`}
                    />
                    <path
                      d={`M 0 -0.12 C ${(-leafWidth * 0.12).toFixed(3)} -${(leafLength * 0.45).toFixed(3)}, ${(leafWidth * 0.12).toFixed(3)} -${(leafLength * 0.7).toFixed(3)}, 0 -${leafLength.toFixed(3)}`}
                      fill="none"
                      stroke="#f8fafc"
                      strokeOpacity={0.18}
                      strokeWidth="0.04"
                    />
                  </g>
                );
              })}

              <circle cx="0" cy="0" r="1.2" fill="url(#succulent-center)" />
              <circle cx="0" cy="0" r="2.8" fill="url(#succulent-glow)" opacity={glow} />
            </g>
          </svg>
        </Box>
      </Box>
    </VStack>
  );
};

export default Succulent;
