"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Badge,
  Box,
  Button,
  HStack,
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

type CubeInstance = {
  position: THREE.Vector3;
  size: number;
  level: number;
};

const MAX_DEPTH = 3;
const BASE_SIZE = 8;

const MENGER_ALGO = {
  title: "Menger sponge recursion",
  summary:
    "The sponge is built by recursively subdividing a cube into 27 smaller cubes, removing the center cube and the six face-centered cubes, and repeating the process on every remaining subcube.",
  steps: [
    "Start with one cube of side length N.",
    "Split it into a 3 × 3 × 3 grid of 27 children.",
    "Discard the center cube and the six cubes touching the centers of each face.",
    "Recurse on every remaining cube until the chosen depth is reached.",
    "Render the survivors as an instanced mesh and color them by level.",
  ],
  code: `const recurse = (center, size, remaining, level) => {
  if (remaining === 0) {
    cubes.push({ position: center.clone(), size, level });
    return;
  }

  const childSize = size / 3;

  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        const zeroCount = Number(x === 0) + Number(y === 0) + Number(z === 0);
        if (zeroCount >= 2) {
          continue;
        }

        recurse(nextCenter, childSize, remaining - 1, level + 1);
      }
    }
  }
};`,
  note:
    "Each subdivision keeps 20 out of 27 cubes, so the fill fraction becomes (20/27)^depth.",
};

const buildMengerCubes = (depth: number) => {
  const cubes: CubeInstance[] = [];

  const recurse = (
    center: THREE.Vector3,
    size: number,
    remaining: number,
    level: number,
  ) => {
    if (remaining === 0) {
      cubes.push({ position: center.clone(), size, level });
      return;
    }

    const childSize = size / 3;
    const offset = childSize;

    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          const zeroCount = Number(x === 0) + Number(y === 0) + Number(z === 0);

          // Remove the center cube and the six face-centered cubes.
          if (zeroCount >= 2) {
            continue;
          }

          const nextCenter = new THREE.Vector3(
            center.x + x * offset,
            center.y + y * offset,
            center.z + z * offset,
          );

          recurse(nextCenter, childSize, remaining - 1, level + 1);
        }
      }
    }
  };

  recurse(new THREE.Vector3(0, 0, 0), BASE_SIZE, depth, 0);
  return cubes;
};

const MengerScene = ({
  cubes,
  autoRotate,
  rotationSpeed,
}: {
  cubes: CubeInstance[];
  autoRotate: boolean;
  rotationSpeed: number;
}) => {
  const rootRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.InstancedMesh | null>(null);
  const geometryRef = useRef<THREE.BoxGeometry | null>(null);

  useEffect(() => {
    const geometry = geometryRef.current;

    if (!geometry) {
      return;
    }

    const position = geometry.attributes.position;
    const colors: number[] = [];
    const topColor = new THREE.Color("#8be9ff");
    const midColor = new THREE.Color("#14b8a6");
    const deepColor = new THREE.Color("#0f766e");
    const scratch = new THREE.Vector3();

    for (let index = 0; index < position.count; index += 1) {
      scratch.fromBufferAttribute(position, index);

      const heightT = THREE.MathUtils.clamp((scratch.y + 0.5) / 1, 0, 1);
      const depthT = THREE.MathUtils.clamp((scratch.z + 0.5) / 1, 0, 1);
      const sideT = THREE.MathUtils.clamp((scratch.x + 0.5) / 1, 0, 1);

      const faceColor = new THREE.Color();
      faceColor
        .copy(deepColor)
        .lerp(midColor, heightT * 0.65 + depthT * 0.15)
        .lerp(topColor, Math.max(0, heightT - 0.45) * 0.9)
        .offsetHSL((sideT - 0.5) * 0.035, 0, 0);

      colors.push(faceColor.r, faceColor.g, faceColor.b);
    }

    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );
  }, []);

  useFrame((state, delta) => {
    if (rootRef.current && autoRotate) {
      rootRef.current.rotation.y += delta * rotationSpeed * 0.28;
      rootRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.25;
    }
  });

  useEffect(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const matrix = new THREE.Matrix4();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    const color = new THREE.Color();
    const maxLevel = Math.max(1, cubes[cubes.length - 1]?.level ?? 1);

    for (let index = 0; index < cubes.length; index += 1) {
      const cube = cubes[index];
      scale.setScalar(cube.size);
      matrix.compose(cube.position, quat, scale);
      mesh.setMatrixAt(index, matrix);

      const levelRatio = cube.level / maxLevel;
      const hue = 0.55 - levelRatio * 0.16 + (cube.position.y / BASE_SIZE) * 0.02;
      color.setHSL(hue, 0.75, 0.54 + levelRatio * 0.12);
      mesh.setColorAt(index, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [cubes]);

  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 18, 36]} />
      <hemisphereLight skyColor="#e0f2fe" groundColor="#0f172a" intensity={1.15} />
      <directionalLight position={[8, 10, 12]} intensity={1.55} />
      <directionalLight position={[-10, -4, -8]} intensity={0.6} color="#f59e0b" />
      <pointLight position={[-8, -6, -10]} intensity={0.8} color="#7dd3fc" />
      <OrbitControls makeDefault enablePan enableZoom target={[0, 0, 0]} />

      <group ref={rootRef}>
        <instancedMesh
          ref={meshRef}
          args={[null as unknown as THREE.BufferGeometry, null as unknown as THREE.Material, cubes.length]}
          castShadow
          receiveShadow
        >
          <boxGeometry ref={geometryRef} args={[1, 1, 1]} />
          <meshStandardMaterial
            vertexColors
            color="#ffffff"
            emissive="#0f766e"
            emissiveIntensity={0.22}
            roughness={0.28}
            metalness={0.18}
          />
        </instancedMesh>
      </group>

      <axesHelper args={[12]} />
    </>
  );
};

const MengerSponge = () => {
  const [depth, setDepth] = useState(2);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(1.6);

  const cubes = useMemo(() => {
    return buildMengerCubes(depth);
  }, [depth]);

  const cubeCount = cubes.length;
  const fillFraction = useMemo(() => {
    return Math.pow(20 / 27, depth);
  }, [depth]);

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
        bg="linear-gradient(160deg, #0f172a 0%, #111827 52%, #1e293b 100%)"
        color="white"
        boxShadow="0 30px 90px rgba(15, 23, 42, 0.35)"
      >
        <VStack align="stretch" spacing={4}>
          <Box>
            <HStack spacing={3} mb={3} wrap="wrap">
              <Badge colorScheme="cyan" px={3} py={1} borderRadius="full">
                Fractal geometry
              </Badge>
              <Badge colorScheme="orange" px={3} py={1} borderRadius="full">
                3D
              </Badge>
            </HStack>
            <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
              Menger Sponge
            </Text>
            <Text opacity={0.8} maxW="3xl">
              Repeatedly subdivide a cube into 27 smaller cubes and remove the
              center plus the six face-centered cubes. What remains is a
              self-similar 3D fractal.
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
                  Depth
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {depth}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" opacity={0.7}>
                  Cubes
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {cubeCount.toLocaleString()}
                </Text>
              </Box>
              <Box>
                <Text fontSize="sm" opacity={0.7}>
                  Fill fraction
                </Text>
                <Text fontSize="2xl" fontWeight="bold">
                  {(fillFraction * 100).toFixed(2)}%
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
          >
            <Text fontSize="sm" opacity={0.8} mb={2}>
              Fractal depth
            </Text>
            <Slider min={0} max={MAX_DEPTH} step={1} value={depth} onChange={setDepth}>
              <SliderTrack bg="whiteAlpha.200">
                <SliderFilledTrack bg="cyan.300" />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
            <Text fontSize="xs" opacity={0.65} mt={2}>
              Depth {depth} keeps the cube count manageable while still showing
              the recursive structure.
            </Text>
          </Box>

          <Box
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
            bg="rgba(255,255,255,0.03)"
            p={3}
          >
            <Text fontSize="sm" opacity={0.8} mb={2}>
              Rotation speed
            </Text>
            <Slider
              min={0}
              max={4}
              step={0.1}
              value={rotationSpeed}
              onChange={setRotationSpeed}
            >
              <SliderTrack bg="whiteAlpha.200">
                <SliderFilledTrack bg="orange.300" />
              </SliderTrack>
              <SliderThumb boxSize={4} />
            </Slider>
          </Box>

          <HStack spacing={3} wrap="wrap">
            <Button
              colorScheme={autoRotate ? "orange" : "gray"}
              onClick={() => setAutoRotate((value) => !value)}
            >
              {autoRotate ? "Pause rotation" : "Resume rotation"}
            </Button>
            <Button onClick={() => setDepth(2)} {...darkSecondaryButtonProps}>
              Reset depth
            </Button>
            <AlgorithmDialogButton
              title={MENGER_ALGO.title}
              summary={MENGER_ALGO.summary}
              steps={MENGER_ALGO.steps}
              code={MENGER_ALGO.code}
              note={MENGER_ALGO.note}
            />
          </HStack>
        </VStack>
      </Box>

      <Box
        flex="1.2"
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
              Viewport
            </Text>
            <Text fontSize="sm" color="gray.600">
              Orbit the sponge, zoom into the gaps, and step the recursion depth
              up or down.
            </Text>
          </Box>

          <Box
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="blackAlpha.100"
            overflow="hidden"
            bg="#020617"
            h={{ base: "420px", xl: "760px" }}
          >
            <Canvas
              camera={{ position: [16, 14, 16], fov: 36 }}
              style={{ width: "100%", height: "100%", display: "block" }}
              shadows
            >
              <MengerScene
                cubes={cubes}
                autoRotate={autoRotate}
                rotationSpeed={rotationSpeed}
              />
            </Canvas>
          </Box>

          <Text fontSize="sm" color="gray.600">
            The classic Menger sponge keeps 20 out of every 27 subcubes on each
            subdivision step.
          </Text>
        </VStack>
      </Box>
    </Stack>
  );
};

export default MengerSponge;
