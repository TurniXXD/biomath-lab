"use client";

import { useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  SimpleGrid,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Lobe = "frontal" | "parietal" | "temporal" | "occipital" | "cerebellum";
type Hemisphere = "left" | "right";

type BrainNode = {
  id: number;
  position: [number, number, number];
  lobe: Lobe;
  hemisphere: Hemisphere;
  weight: number;
};

type BrainEdge = {
  from: number;
  to: number;
  strength: number;
  crossHemisphere: boolean;
};

const lobeMeta: Record<
  Lobe,
  {
    color: string;
    label: string;
    description: string;
  }
> = {
  frontal: {
    color: "#f97316",
    label: "Frontal",
    description: "Planning, motor control, and executive decisions.",
  },
  parietal: {
    color: "#0ea5e9",
    label: "Parietal",
    description: "Spatial integration and sensory mapping.",
  },
  temporal: {
    color: "#10b981",
    label: "Temporal",
    description: "Auditory processing, memory, and language cues.",
  },
  occipital: {
    color: "#8b5cf6",
    label: "Occipital",
    description: "Visual processing and pattern interpretation.",
  },
  cerebellum: {
    color: "#e11d48",
    label: "Cerebellum",
    description: "Coordination, timing, and movement smoothing.",
  },
};

const lobeOrder: Lobe[] = [
  "frontal",
  "parietal",
  "temporal",
  "occipital",
  "cerebellum",
];

const clamp = (value: number, min: number, max: number) => {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

const inferLobe = (x: number, y: number, z: number): Lobe => {
  if (y < -1.45 && Math.abs(x) < 1.8) {
    return "cerebellum";
  }

  if (z > 1.35) {
    return "occipital";
  }

  if (z < -1.25) {
    return "frontal";
  }

  if (y > 0.9) {
    return "parietal";
  }

  return "temporal";
};

const createBrainData = () => {
  const nodes: BrainNode[] = [];
  const edges: BrainEdge[] = [];
  let id = 0;

  for (const hemisphere of ["left", "right"] as const) {
    const sign = hemisphere === "left" ? -1 : 1;

    for (let i = 0; i < 120; i += 1) {
      const t = (i / 120) * Math.PI * 2;
      const u = ((i * 0.61803398875) % 1) * Math.PI;
      const shell = 0.72 + ((i * 37) % 23) / 100;

      const baseX = Math.sin(u) * Math.cos(t) * 2.45;
      const baseY = Math.cos(u) * 2.15;
      const baseZ = Math.sin(u) * Math.sin(t) * 2.95;

      const fold =
        Math.sin(baseZ * 2.3 + i * 0.17) * 0.14 +
        Math.cos(baseY * 3.1 - i * 0.11) * 0.08;

      const x = sign * (Math.abs(baseX) * shell + 0.8 + fold * 0.25);
      const y = baseY * shell + Math.sin(baseX * 2.2) * 0.1;
      const z = baseZ * shell + fold;

      nodes.push({
        id,
        position: [x, y, z],
        lobe: inferLobe(x, y, z),
        hemisphere,
        weight: 0.45 + ((i * 19) % 17) / 20,
      });
      id += 1;
    }
  }

  const byHemisphere = {
    left: nodes.filter((node) => node.hemisphere === "left"),
    right: nodes.filter((node) => node.hemisphere === "right"),
  };

  for (const hemisphere of ["left", "right"] as const) {
    const bucket = byHemisphere[hemisphere];

    for (let i = 0; i < bucket.length; i += 1) {
      const current = bucket[i];
      const next = bucket[(i + 7) % bucket.length];
      const sibling = bucket[(i + 21) % bucket.length];

      edges.push({
        from: current.id,
        to: next.id,
        strength: 0.35,
        crossHemisphere: false,
      });
      edges.push({
        from: current.id,
        to: sibling.id,
        strength: 0.22,
        crossHemisphere: false,
      });
    }
  }

  const left = byHemisphere.left;
  const right = byHemisphere.right;

  for (let i = 0; i < left.length; i += 8) {
    edges.push({
      from: left[i].id,
      to: right[(i * 3) % right.length].id,
      strength: 0.5,
      crossHemisphere: true,
    });
  }

  return { nodes, edges };
};

type BrainShellProps = {
  activeLobe: Lobe | "all";
};

const BrainShell = ({ activeLobe }: BrainShellProps) => {
  const dimmed = activeLobe !== "all";

  return (
    <>
      <mesh position={[-1.48, 0, 0]} scale={[1.15, 0.98, 1.26]}>
        <sphereGeometry args={[2.25, 48, 48]} />
        <meshStandardMaterial
          color="#f8fafc"
          transparent
          opacity={dimmed ? 0.08 : 0.13}
          roughness={0.35}
          metalness={0.02}
        />
      </mesh>
      <mesh position={[1.48, 0, 0]} scale={[1.15, 0.98, 1.26]}>
        <sphereGeometry args={[2.25, 48, 48]} />
        <meshStandardMaterial
          color="#f8fafc"
          transparent
          opacity={dimmed ? 0.08 : 0.13}
          roughness={0.35}
          metalness={0.02}
        />
      </mesh>
    </>
  );
};

type BrainSceneProps = {
  nodes: BrainNode[];
  edges: BrainEdge[];
  activeLobe: Lobe | "all";
  signalSpeed: number;
  signalStrength: number;
  hoveredNodeId: number | null;
  selectedNodeId: number | null;
  onHoverNode: (id: number | null) => void;
  onSelectNode: (id: number) => void;
};

const BrainScene = ({
  nodes,
  edges,
  activeLobe,
  signalSpeed,
  signalStrength,
  hoveredNodeId,
  selectedNodeId,
  onHoverNode,
  onSelectNode,
}: BrainSceneProps) => {
  const groupRef = useRef<THREE.Group | null>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.18;
    groupRef.current.rotation.z = Math.cos(clock.elapsedTime * 0.12) * 0.04;
  });

  return (
    <>
      <color attach="background" args={["#f4efe7"]} />
      <fog attach="fog" args={["#f4efe7", 9, 20]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[8, 6, 10]} intensity={1.1} />
      <pointLight position={[-6, 3, -4]} intensity={0.65} color="#fb7185" />

      <group ref={groupRef}>
        <BrainShell activeLobe={activeLobe} />

        {edges.map((edge) => {
          const from = nodes[edge.from];
          const to = nodes[edge.to];
          const active =
            activeLobe === "all" ||
            from.lobe === activeLobe ||
            to.lobe === activeLobe;

          if (!active) {
            return null;
          }

          return (
            <Line
              key={`${edge.from}-${edge.to}`}
              points={[from.position, to.position]}
              color={edge.crossHemisphere ? "#f59e0b" : "#475569"}
              transparent
              opacity={edge.crossHemisphere ? 0.2 : 0.12 + edge.strength * 0.2}
              lineWidth={edge.crossHemisphere ? 1.3 : 0.8}
            />
          );
        })}

        {nodes.map((node, index) => {
          const baseColor = lobeMeta[node.lobe].color;
          const muted = activeLobe !== "all" && node.lobe !== activeLobe;
          const isHovered = hoveredNodeId === node.id;
          const isSelected = selectedNodeId === node.id;

          return (
            <Neuron
              key={node.id}
              node={node}
              color={baseColor}
              muted={muted}
              highlighted={isHovered || isSelected}
              signalSpeed={signalSpeed}
              signalStrength={signalStrength}
              phase={index * 0.17}
              onHoverNode={onHoverNode}
              onSelectNode={onSelectNode}
            />
          );
        })}
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={7}
        maxDistance={13}
        autoRotate={activeLobe === "all"}
        autoRotateSpeed={0.45}
      />
    </>
  );
};

type NeuronProps = {
  node: BrainNode;
  color: string;
  muted: boolean;
  highlighted: boolean;
  signalSpeed: number;
  signalStrength: number;
  phase: number;
  onHoverNode: (id: number | null) => void;
  onSelectNode: (id: number) => void;
};

const Neuron = ({
  node,
  color,
  muted,
  highlighted,
  signalSpeed,
  signalStrength,
  phase,
  onHoverNode,
  onSelectNode,
}: NeuronProps) => {
  const meshRef = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) {
      return;
    }

    const t = clock.elapsedTime * signalSpeed + phase;
    const pulse = (Math.sin(t) + 1) / 2;
    const intensity = muted ? 0.2 : 0.55 + pulse * signalStrength * node.weight;
    const scale = highlighted ? 1.9 : 1 + pulse * 0.45 * node.weight;

    meshRef.current.scale.setScalar(scale);

    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.emissive.set(color);
    material.emissiveIntensity = intensity;
    material.opacity = muted ? 0.2 : 0.75 + pulse * 0.2;
  });

  return (
    <mesh
      ref={meshRef}
      position={node.position}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHoverNode(node.id);
      }}
      onPointerOut={() => {
        onHoverNode(null);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelectNode(node.id);
      }}
    >
      <sphereGeometry args={[0.09, 18, 18]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={muted ? 0.2 : 0.82}
        roughness={0.25}
        metalness={0.08}
      />
    </mesh>
  );
};

const BrainModel = () => {
  const { nodes, edges } = useMemo(() => {
    return createBrainData();
  }, []);

  const [activeLobe, setActiveLobe] = useState<Lobe | "all">("all");
  const [signalSpeed, setSignalSpeed] = useState(1.4);
  const [signalStrength, setSignalStrength] = useState(1.1);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

  const selectedNode = useMemo(() => {
    const id = hoveredNodeId ?? selectedNodeId;

    if (id === null) {
      return null;
    }

    return nodes.find((node) => node.id === id) ?? null;
  }, [hoveredNodeId, nodes, selectedNodeId]);

  const lobeStats = useMemo(() => {
    return lobeOrder.map((lobe) => {
      const count = nodes.filter((node) => node.lobe === lobe).length;

      return {
        lobe,
        count,
      };
    });
  }, [nodes]);

  return (
    <Stack
      direction={{ base: "column", xl: "row" }}
      align="stretch"
      spacing={6}
      w="100%"
    >
      <Box
        flex="1"
        minH={{ base: "480px", xl: "calc(100vh - 96px)" }}
        borderRadius="3xl"
        overflow="hidden"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        bg="linear-gradient(160deg, #fffdf8 0%, #f3ebe0 100%)"
        boxShadow="0 30px 80px rgba(148, 113, 79, 0.18)"
      >
        <Canvas camera={{ position: [0, 1.4, 10], fov: 42 }}>
          <BrainScene
            nodes={nodes}
            edges={edges}
            activeLobe={activeLobe}
            signalSpeed={signalSpeed}
            signalStrength={signalStrength}
            hoveredNodeId={hoveredNodeId}
            selectedNodeId={selectedNodeId}
            onHoverNode={setHoveredNodeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              setActiveLobe(nodes[id]?.lobe ?? "all");
            }}
          />
        </Canvas>
      </Box>

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
            Interactive Brain Model
          </Badge>
          <Text fontSize="2xl" fontWeight="bold" lineHeight="1.1">
            Explore hemispheres, lobes, and signal flow.
          </Text>
          <Text color="gray.600" mt={2}>
            Rotate the model, hover neurons, and isolate functional regions.
          </Text>
        </Box>

        <Divider />

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Region focus
          </Text>
          <SimpleGrid columns={2} spacing={2}>
            <Button
              size="sm"
              variant={activeLobe === "all" ? "solid" : "outline"}
              colorScheme="gray"
              onClick={() => {
                setActiveLobe("all");
              }}
            >
              Whole brain
            </Button>
            {lobeOrder.map((lobe) => {
              return (
                <Button
                  key={lobe}
                  size="sm"
                  variant={activeLobe === lobe ? "solid" : "outline"}
                  onClick={() => {
                    setActiveLobe(lobe);
                  }}
                >
                  {lobeMeta[lobe].label}
                </Button>
              );
            })}
          </SimpleGrid>
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Signal speed
          </Text>
          <Slider
            min={0.4}
            max={3}
            step={0.1}
            value={signalSpeed}
            onChange={setSignalSpeed}
          >
            <SliderTrack>
              <SliderFilledTrack bg="orange.400" />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text mt={1} color="gray.600" fontSize="sm">
            {signalSpeed.toFixed(1)}x pulse rate
          </Text>
        </Box>

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Signal intensity
          </Text>
          <Slider
            min={0.2}
            max={1.8}
            step={0.05}
            value={signalStrength}
            onChange={setSignalStrength}
          >
            <SliderTrack>
              <SliderFilledTrack bg="pink.400" />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text mt={1} color="gray.600" fontSize="sm">
            {signalStrength.toFixed(2)} emissive gain
          </Text>
        </Box>

        <Divider />

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={3}>
            Functional map
          </Text>
          <VStack align="stretch" spacing={2}>
            {lobeStats.map(({ lobe, count }) => {
              return (
                <HStack
                  key={lobe}
                  justify="space-between"
                  px={3}
                  py={2}
                  borderRadius="xl"
                  bg={activeLobe === lobe ? "orange.50" : "gray.50"}
                >
                  <HStack>
                    <Box
                      w="10px"
                      h="10px"
                      borderRadius="full"
                      bg={lobeMeta[lobe].color}
                    />
                    <Text fontWeight="medium">{lobeMeta[lobe].label}</Text>
                  </HStack>
                  <Text color="gray.600" fontSize="sm">
                    {count} nodes
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Selected structure
          </Text>
          {selectedNode ? (
            <VStack
              align="stretch"
              spacing={2}
              p={4}
              borderRadius="2xl"
              bg="gray.50"
            >
              <HStack justify="space-between">
                <Text fontWeight="bold">{lobeMeta[selectedNode.lobe].label}</Text>
                <Badge>{selectedNode.hemisphere}</Badge>
              </HStack>
              <Text color="gray.600" fontSize="sm">
                {lobeMeta[selectedNode.lobe].description}
              </Text>
              <Text fontSize="sm" color="gray.600">
                Node strength {selectedNode.weight.toFixed(2)}
              </Text>
            </VStack>
          ) : (
            <Text color="gray.600" fontSize="sm">
              Hover or click a neuron to inspect a region.
            </Text>
          )}
        </Box>
      </VStack>
    </Stack>
  );
};

export default BrainModel;
