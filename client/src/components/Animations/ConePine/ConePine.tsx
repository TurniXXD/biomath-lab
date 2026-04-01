"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Box, HStack, Text, VStack } from "@chakra-ui/react";

type Layer = {
  radius: number;
  y: number;
  wobble: number;
  count: number;
};

const TAU = Math.PI * 2;

const buildLayers = (): Layer[] => {
  return [
    { radius: 1.6, y: -1.6, wobble: 0.08, count: 16 },
    { radius: 2.15, y: -0.65, wobble: 0.12, count: 20 },
    { radius: 2.7, y: 0.15, wobble: 0.15, count: 24 },
    { radius: 2.05, y: 1.05, wobble: 0.1, count: 18 },
    { radius: 1.2, y: 1.9, wobble: 0.06, count: 10 },
  ];
};

const ConePine = () => {
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

  const layers = useMemo(() => buildLayers(), []);
  const sway = Math.sin(elapsed * 1.1) * 4.5;
  const glow = 0.45 + 0.1 * Math.sin(elapsed * 1.7);
  const coneSpin = elapsed * 10;

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Badge colorScheme="green" mb={3}>
          Biology
        </Badge>
        <Text fontSize="3xl" fontWeight="bold" lineHeight="1.1" mb={2}>
          Cone Pine
        </Text>
        <Text color="gray.600" maxW="3xl">
          A conifer-inspired animated form built from layered cone rings and
          gently swaying needle clusters.
        </Text>
      </Box>

      <HStack wrap="wrap" spacing={3}>
        <Badge colorScheme="green" px={3} py={1} borderRadius="full">
          Sway {sway.toFixed(1)}°
        </Badge>
        <Badge colorScheme="orange" px={3} py={1} borderRadius="full">
          Layers {layers.length}
        </Badge>
        <Badge colorScheme="teal" px={3} py={1} borderRadius="full">
          Spin {Math.round(coneSpin)}°
        </Badge>
      </HStack>

      <Box
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="linear-gradient(180deg, #f8fafc 0%, #ecfdf5 100%)"
        boxShadow="0 28px 80px rgba(15, 23, 42, 0.12)"
        overflow="hidden"
        position="relative"
      >
        <Box
          position="absolute"
          inset={0}
          backgroundImage="
            radial-gradient(circle at 50% 20%, rgba(34, 197, 94, 0.14), transparent 28%),
            radial-gradient(circle at 20% 70%, rgba(16, 185, 129, 0.10), transparent 22%),
            radial-gradient(circle at 85% 30%, rgba(251, 191, 36, 0.10), transparent 20%)
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
            viewBox="-5.2 -5.6 10.4 11.2"
            width="100%"
            style={{
              maxWidth: "920px",
              display: "block",
              overflow: "visible",
            }}
          >
            <defs>
              <linearGradient id="cone-pine-bark" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5a2b" />
                <stop offset="100%" stopColor="#5c3a1a" />
              </linearGradient>
              <linearGradient id="cone-pine-needles" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bbf7d0" />
                <stop offset="55%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
              <radialGradient id="cone-pine-glow" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#86efac" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
              </radialGradient>
            </defs>

            <ellipse
              cx="0"
              cy="4.15"
              rx="3.4"
              ry="0.6"
              fill="#1f2937"
              opacity={0.15}
            />

            <g transform={`translate(0 ${Math.sin(elapsed * 0.6) * 0.08}) rotate(${sway * 0.12})`}>
              <rect x="-0.18" y="0.35" width="0.36" height="3.85" rx="0.16" fill="url(#cone-pine-bark)" />

              {layers.map((layer, layerIndex) => {
                const y = layer.y + Math.sin(elapsed * 1.3 + layerIndex) * 0.06;
                const leafScale = 1 + Math.sin(elapsed * 2 + layerIndex) * 0.03;

                return (
                  <g key={`${layer.radius}-${layer.y}`} transform={`translate(0 ${y})`}>
                    {Array.from({ length: layer.count }).map((_, index) => {
                      const angle = (index / layer.count) * TAU + layerIndex * 0.35;
                      const wind = Math.sin(elapsed * 2.2 + index * 0.6 + layerIndex) * layer.wobble;
                      const x = Math.cos(angle + wind) * layer.radius;
                      const z = Math.sin(angle + wind) * layer.radius * 0.18;
                      const leafRotation = (angle * 180) / Math.PI + 90 + sway * 0.8;
                      const needleLength = 0.9 + ((index + layerIndex) % 3) * 0.18;

                      return (
                        <g
                          key={`${layerIndex}-${index}`}
                          transform={`translate(${x.toFixed(3)} ${z.toFixed(3)}) rotate(${leafRotation}) scale(${leafScale})`}
                        >
                          <path
                            d={`M 0 0 C -0.18 -0.16, -0.26 -0.62, 0 -${needleLength.toFixed(3)} C 0.26 -0.62, 0.18 -0.16, 0 0 Z`}
                            fill="url(#cone-pine-needles)"
                            opacity={0.92}
                          />
                          <path
                            d={`M 0 0 C -0.08 -0.12, -0.12 -0.44, 0 -${(needleLength * 0.72).toFixed(3)} C 0.12 -0.44, 0.08 -0.12, 0 0 Z`}
                            fill="#166534"
                            opacity={0.45}
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              <g transform="translate(0 -3.45)">
                <ellipse cx="0" cy="0" rx="0.42" ry="0.18" fill="#f59e0b" opacity={0.85} />
                <path
                  d="M 0 -0.65 C 0.7 -0.6, 1.05 -0.1, 0.85 0.22 C 0.62 0.54, 0.16 0.5, 0 0.14 C -0.16 0.5, -0.62 0.54, -0.85 0.22 C -1.05 -0.1, -0.7 -0.6, 0 -0.65 Z"
                  fill="#86efac"
                  opacity={0.8}
                  transform={`rotate(${coneSpin})`}
                />
              </g>

              <circle cx="0" cy="0" r="3.85" fill="url(#cone-pine-glow)" opacity={glow} />
            </g>
          </svg>
        </Box>
      </Box>
    </VStack>
  );
};

export default ConePine;
