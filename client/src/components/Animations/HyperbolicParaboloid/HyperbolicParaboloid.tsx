"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import {
  Badge,
  Box,
  Button,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  VStack,
} from "@chakra-ui/react";

type SaddleParams = {
  width: number;
  depth: number;
  segments: number;
};

const buildSaddleGeometry = ({ width, depth, segments }: SaddleParams) => {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const half = width / 2;

  for (let yIndex = 0; yIndex <= segments; yIndex += 1) {
    const v = yIndex / segments;
    const y = -half + v * width;

    for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
      const u = xIndex / segments;
      const x = -half + u * width;
      const z = depth * ((x * x) / (half * half) - (y * y) / (half * half));

      positions.push(x, y, z);
      normals.push(0, 0, 1);
      uvs.push(u, v);
    }
  }

  for (let yIndex = 0; yIndex < segments; yIndex += 1) {
    for (let xIndex = 0; xIndex < segments; xIndex += 1) {
      const a = yIndex * (segments + 1) + xIndex;
      const b = a + segments + 1;
      const c = b + 1;
      const d = a + 1;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
};

type SaddleSceneProps = {
  width: number;
  depth: number;
  segments: number;
  autoRotate: boolean;
  wireframe: boolean;
};

const SaddleScene = ({ width, depth, segments, autoRotate, wireframe }: SaddleSceneProps) => {
  const rootRef = useRef<THREE.Group | null>(null);
  const markerARef = useRef<THREE.Mesh | null>(null);
  const markerBRef = useRef<THREE.Mesh | null>(null);

  const geometry = useMemo(() => {
    return buildSaddleGeometry({ width, depth, segments });
  }, [width, depth, segments]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (root && autoRotate) {
      root.rotation.y += delta * 0.32;
      root.rotation.x = -0.55 + Math.sin(state.clock.elapsedTime * 0.45) * 0.06;
    }

    const t = state.clock.elapsedTime;
    const half = width / 2;
    const x = Math.sin(t * 0.9) * half * 0.75;
    const y = Math.cos(t * 0.85) * half * 0.75;
    const zA = depth * ((x * x) / (half * half) - (0.1 * half * 0.1 * half) / (half * half));
    const zB = depth * (((0.1 * half * 0.1 * half) / (half * half)) - (y * y) / (half * half));

    if (markerARef.current) {
      markerARef.current.position.set(x, 0.1 * half, zA + 0.12);
    }

    if (markerBRef.current) {
      markerBRef.current.position.set(-0.1 * half, y, zB + 0.12);
    }
  });

  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 16, 38]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[10, 14, 10]} intensity={1.3} />
      <directionalLight position={[-10, -8, -10]} intensity={0.5} color="#38bdf8" />
      <pointLight position={[0, 10, 6]} intensity={0.8} color="#f59e0b" />
      <OrbitControls makeDefault />

      <group ref={rootRef}>
        <mesh geometry={geometry}>
          <meshStandardMaterial
            color="#f8fafc"
            emissive="#38bdf8"
            emissiveIntensity={0.08}
            roughness={0.34}
            metalness={0.08}
            wireframe={wireframe}
            transparent
            opacity={0.96}
          />
        </mesh>

        <Line points={[[-width / 2, 0, 0], [width / 2, 0, 0]]} color="#22c55e" lineWidth={2} />
        <Line points={[[0, -width / 2, 0], [0, width / 2, 0]]} color="#f97316" lineWidth={2} />

        <mesh ref={markerARef}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
        </mesh>

        <mesh ref={markerBRef}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </>
  );
};

const HyperbolicParaboloid = () => {
  const [depth, setDepth] = useState(1.8);
  const [width, setWidth] = useState(8);
  const [segments, setSegments] = useState(42);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <Badge colorScheme="cyan" mb={3}>
          Geometry
        </Badge>
        <Text fontSize="3xl" fontWeight="bold" lineHeight="1.1" mb={2}>
          Hyperbolic Paraboloid
        </Text>
        <Text color="gray.600" maxW="3xl">
          A saddle surface that curves upward in one direction and downward in
          the perpendicular direction.
        </Text>
      </Box>

      <HStack wrap="wrap" spacing={3}>
        <Badge colorScheme="cyan" px={3} py={1} borderRadius="full">
          Saddle shape
        </Badge>
        <Badge colorScheme="orange" px={3} py={1} borderRadius="full">
          Width {width.toFixed(1)}
        </Badge>
        <Badge colorScheme="green" px={3} py={1} borderRadius="full">
          Depth {depth.toFixed(1)}
        </Badge>
      </HStack>

      <HStack wrap="wrap" spacing={3}>
        <Button colorScheme={autoRotate ? "orange" : "gray"} onClick={() => setAutoRotate((value) => !value)}>
          {autoRotate ? "Pause rotation" : "Resume rotation"}
        </Button>
        <Button variant={wireframe ? "solid" : "outline"} onClick={() => setWireframe((value) => !value)}>
          {wireframe ? "Hide wireframe" : "Show wireframe"}
        </Button>
      </HStack>

      <Box p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm">
        <Text fontSize="sm" mb={2}>
          Surface depth
        </Text>
        <Slider min={0.4} max={4} step={0.1} value={depth} onChange={setDepth}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </Box>

      <Box p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm">
        <Text fontSize="sm" mb={2}>
          Surface width
        </Text>
        <Slider min={4} max={12} step={0.5} value={width} onChange={setWidth}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </Box>

      <Box p={4} bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="2xl" boxShadow="sm">
        <Text fontSize="sm" mb={2}>
          Resolution
        </Text>
        <Slider min={12} max={64} step={1} value={segments} onChange={setSegments}>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb />
        </Slider>
      </Box>

      <Box
        overflow="hidden"
        borderRadius="3xl"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="linear-gradient(180deg, #020617 0%, #0f172a 100%)"
        boxShadow="0 32px 80px rgba(15, 23, 42, 0.22)"
      >
        <Box minH={{ base: "520px", lg: "720px" }}>
          <Canvas camera={{ position: [8, 7, 8], fov: 42 }} style={{ width: "100%", height: "100%" }}>
            <SaddleScene width={width} depth={depth} segments={segments} autoRotate={autoRotate} wireframe={wireframe} />
          </Canvas>
        </Box>
      </Box>

      <Text color="gray.600">
        The two reference curves show the positive and negative curvature directions on the same
        saddle.
      </Text>
    </VStack>
  );
};

export default HyperbolicParaboloid;
