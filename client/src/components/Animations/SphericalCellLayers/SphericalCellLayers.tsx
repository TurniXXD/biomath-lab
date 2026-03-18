"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Switch,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";

type CellNode = {
  id: string;
  position: THREE.Vector3;
  radius: number;
  depth: number;
  label?: string;
};

type CellEdge = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  curved?: boolean;
};

type LayerParams = {
  sphereRadius: number;
  radialLayers: number;
  meridians: number;
  branchDepth: number;
  subBranchFactor: number;
  crownCompression: number;
  jitter: number;
  cellScale: number;
  showLabels: boolean;
  showGuideSphere: boolean;
  showDevelopmentArcs: boolean;
  autoRotate: boolean;
};

type GeneratedLayerModel = {
  nodes: CellNode[];
  edges: CellEdge[];
  stageRings: number[];
};

const defaultParams: LayerParams = {
  sphereRadius: 3.2,
  radialLayers: 4,
  meridians: 6,
  branchDepth: 3,
  subBranchFactor: 2,
  crownCompression: 0.72,
  jitter: 0.08,
  cellScale: 0.42,
  showLabels: true,
  showGuideSphere: true,
  showDevelopmentArcs: true,
  autoRotate: true,
};

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const sphericalToCartesian = (
  radius: number,
  theta: number,
  phi: number,
  compression: number,
) => {
  const sinPhi = Math.sin(phi);
  const x = radius * Math.cos(theta) * sinPhi;
  const y = radius * Math.cos(phi) * compression;
  const z = radius * Math.sin(theta) * sinPhi;

  return new THREE.Vector3(x, y, z);
};

const jitterVector = (amount: number, rand: () => number) => {
  return new THREE.Vector3(
    (rand() - 0.5) * amount,
    (rand() - 0.5) * amount,
    (rand() - 0.5) * amount,
  );
};

const generateSphericalCellLayers = (
  params: LayerParams,
): GeneratedLayerModel => {
  const rand = createSeededRandom(4287);
  const nodes: CellNode[] = [];
  const edges: CellEdge[] = [];
  const stageRings: number[] = [];

  const center = new THREE.Vector3(0, 0, 0);
  nodes.push({
    id: "Z0",
    position: center,
    radius: params.cellScale * 0.9,
    depth: 0,
    label: "Z",
  });

  for (let layerIndex = 1; layerIndex <= params.radialLayers; layerIndex += 1) {
    const layerRadius =
      (params.sphereRadius * layerIndex) / params.radialLayers;
    stageRings.push(layerRadius);

    const phiBase = (Math.PI * layerIndex) / (params.radialLayers + 1);
    const nodeCount = params.meridians + layerIndex * 2;

    for (let i = 0; i < nodeCount; i += 1) {
      const theta =
        (Math.PI * 2 * i) / nodeCount +
        (layerIndex % 2 === 0 ? Math.PI / nodeCount : 0);
      const phi = THREE.MathUtils.clamp(
        phiBase + (rand() - 0.5) * 0.35,
        0.15,
        Math.PI - 0.15,
      );
      const base = sphericalToCartesian(
        layerRadius,
        theta,
        phi,
        params.crownCompression,
      );
      const position = base.add(jitterVector(params.jitter * layerIndex, rand));

      const isHexa = layerIndex >= 3 && i % 3 === 0;
      const isF = layerIndex === 2 && i % 2 === 0;
      const isH = layerIndex === 2 && i % 2 === 1;
      const isC = layerIndex === 1 || layerIndex === params.radialLayers;

      let label: string | undefined;
      if (isC) {
        label = "C";
      } else if (isF) {
        label = "F";
      } else if (isH) {
        label = "H";
      } else if (isHexa) {
        label = "A";
      }

      nodes.push({
        id: `L${layerIndex}-${i}`,
        position,
        radius:
          params.cellScale * (1.05 - layerIndex * 0.12) * (isHexa ? 1.15 : 1),
        depth: layerIndex,
        label,
      });
    }
  }

  const groupedByLayer = new Map<number, CellNode[]>();
  for (const node of nodes) {
    if (!groupedByLayer.has(node.depth)) {
      groupedByLayer.set(node.depth, []);
    }
    groupedByLayer.get(node.depth)?.push(node);
  }

  for (let layerIndex = 1; layerIndex <= params.radialLayers; layerIndex += 1) {
    const layerNodes = groupedByLayer.get(layerIndex) ?? [];

    for (let i = 0; i < layerNodes.length; i += 1) {
      const current = layerNodes[i];
      const next = layerNodes[(i + 1) % layerNodes.length];

      edges.push({
        from: current.position,
        to: next.position,
        color: layerIndex % 2 === 0 ? "#232323" : "#343434",
      });

      const previousLayer = groupedByLayer.get(layerIndex - 1) ?? [];
      if (previousLayer.length > 0) {
        const parent = previousLayer[i % previousLayer.length];
        edges.push({
          from: parent.position,
          to: current.position,
          color: "#555555",
          curved: true,
        });
      }
    }
  }

  if (params.showDevelopmentArcs) {
    const top = new THREE.Vector3(
      0,
      params.sphereRadius * params.crownCompression,
      0,
    );
    const bottom = new THREE.Vector3(
      0,
      -params.sphereRadius * params.crownCompression,
      0,
    );

    const arcCount = Math.max(4, params.meridians);
    for (let i = 0; i < arcCount; i += 1) {
      const theta = (Math.PI * 2 * i) / arcCount;
      const mid = sphericalToCartesian(
        params.sphereRadius * 0.82,
        theta,
        Math.PI / 2,
        params.crownCompression * 0.94,
      );
      edges.push({
        from: top,
        to: mid,
        color: "#6b7280",
        curved: true,
      });
      edges.push({
        from: mid,
        to: bottom,
        color: "#6b7280",
        curved: true,
      });
    }
  }

  const recursiveChildren = (parent: CellNode, depth: number) => {
    if (depth > params.branchDepth) {
      return;
    }

    const dir = parent.position.clone().normalize();
    const tangentA = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    const tangentB = new THREE.Vector3()
      .crossVectors(dir, tangentA)
      .normalize();
    const children = Math.max(1, params.subBranchFactor);

    for (let i = 0; i < children; i += 1) {
      const angle = (Math.PI * 2 * i) / children + rand() * 0.4;
      const radialOffset = tangentA
        .clone()
        .multiplyScalar(Math.cos(angle))
        .add(tangentB.clone().multiplyScalar(Math.sin(angle)));
      const outward = dir
        .clone()
        .multiplyScalar(params.cellScale * (0.9 - depth * 0.12));
      const offset = radialOffset.multiplyScalar(
        params.cellScale * 0.45 * (1.0 - depth * 0.15),
      );
      const position = parent.position
        .clone()
        .add(outward)
        .add(offset)
        .add(jitterVector(params.jitter * 0.5, rand));

      const child: CellNode = {
        id: `${parent.id}-d${depth}-${i}`,
        position,
        radius: Math.max(
          params.cellScale * 0.22,
          params.cellScale * (0.48 - depth * 0.08),
        ),
        depth: params.radialLayers + depth,
      };

      nodes.push(child);
      edges.push({
        from: parent.position,
        to: child.position,
        color: "#3f3f46",
        curved: true,
      });

      recursiveChildren(child, depth + 1);
    }
  };

  const outerNodes = groupedByLayer.get(params.radialLayers) ?? [];
  for (let i = 0; i < outerNodes.length; i += 2) {
    recursiveChildren(outerNodes[i], 1);
  }

  return { nodes, edges, stageRings };
};

const buildCurvedLinePoints = (from: THREE.Vector3, to: THREE.Vector3) => {
  const midpoint = from.clone().add(to).multiplyScalar(0.5);
  const normal = midpoint.clone().normalize().multiplyScalar(0.35);
  const control = midpoint.add(normal);
  const curve = new THREE.QuadraticBezierCurve3(from, control, to);

  return curve.getPoints(24);
};

const CellSphere = ({
  node,
  params,
}: {
  node: CellNode;
  params: LayerParams;
}) => {
  const color = useMemo(() => {
    if (node.label === "Z") {
      return "#d4af37";
    }

    if (node.label === "C") {
      return "#475569";
    }

    if (node.label === "F") {
      return "#d97706";
    }

    if (node.label === "H") {
      return "#2563eb";
    }

    if (node.label === "A") {
      return "#0f766e";
    }

    return "#fafaf9";
  }, [node.label]);

  return (
    <group position={node.position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[node.radius, 24, 24]} />
        <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
      </mesh>
      {params.showLabels && node.label ? (
        <Html center distanceFactor={10}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#111827",
              background: "rgba(255,255,255,0.82)",
              borderRadius: 999,
              padding: "2px 6px",
              border: "1px solid rgba(17,24,39,0.12)",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {node.label}
          </div>
        </Html>
      ) : null}
    </group>
  );
};

const DevelopmentScene = ({ params }: { params: LayerParams }) => {
  const model = useMemo(() => generateSphericalCellLayers(params), [params]);

  return (
    <group>
      <ambientLight intensity={0.8} />
      <directionalLight position={[8, 10, 5]} intensity={1.3} castShadow />
      <directionalLight position={[-6, 4, -6]} intensity={0.35} />
      <color attach="background" args={["#eef2f7"]} />
      <fog attach="fog" args={["#eef2f7", 10, 24]} />

      {params.showGuideSphere ? (
        <mesh>
          <sphereGeometry args={[params.sphereRadius, 48, 48]} />
          <meshStandardMaterial
            color="#dbe6f4"
            transparent
            opacity={0.16}
            roughness={1}
          />
        </mesh>
      ) : null}

      {model.stageRings.map((radius, index) => (
        <mesh key={`ring-${index}`} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.012, 12, 120]} />
          <meshStandardMaterial color="#94a3b8" transparent opacity={0.35} />
        </mesh>
      ))}

      {model.edges.map((edge, index) => {
        const points = edge.curved
          ? buildCurvedLinePoints(edge.from, edge.to)
          : [edge.from, edge.to];

        return (
          <Line
            key={`edge-${index}`}
            points={points}
            color={edge.color}
            lineWidth={1.25}
          />
        );
      })}

      {model.nodes.map((node) => (
        <CellSphere key={node.id} node={node} params={params} />
      ))}
    </group>
  );
};

const SliderRow = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => {
  return (
    <VStack align="stretch" spacing={2} width="100%">
      <HStack justify="space-between">
        <Text fontSize="sm" fontWeight="semibold">
          {label}
        </Text>
        <Badge colorScheme="purple" variant="subtle">
          {value.toFixed(2)}
        </Badge>
      </HStack>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange}>
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </VStack>
  );
};

const SphericalCellLayersModel = () => {
  const [params, setParams] = useState<LayerParams>(defaultParams);

  return (
    <Box p={4} width="100%">
      <Card
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="xl"
        borderWidth="1px"
      >
        <CardHeader>
          <HStack
            justify="space-between"
            align="flex-start"
            flexWrap="wrap"
            gap={3}
          >
            <Box>
              <Text fontSize="2xl" fontWeight="bold">
                Spherical Cell Layer Development Simulator
              </Text>
              <Text fontSize="sm" color="gray.600" mt={2} maxW="3xl">
                Interactive Next.js + Three.js + Chakra UI component inspired by
                staged spherical cell-layer growth. It visualizes concentric
                developmental layers, meridian-like arcs, and recursive
                sub-branching across the shell.
              </Text>
            </Box>
            <HStack>
              <Badge colorScheme="purple">Next.js</Badge>
              <Badge colorScheme="blue">Three.js</Badge>
              <Badge colorScheme="green">Chakra UI</Badge>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          <Box
            display="grid"
            gridTemplateColumns={{ base: "1fr", xl: "360px minmax(0,1fr)" }}
            gap={6}
          >
            <VStack
              align="stretch"
              spacing={5}
              p={4}
              borderWidth="1px"
              borderRadius="xl"
              bg="white"
            >
              <SliderRow
                label="Sphere radius"
                value={params.sphereRadius}
                min={2}
                max={5}
                step={0.05}
                onChange={(value) => {
                  setParams((prev) => ({ ...prev, sphereRadius: value }));
                }}
              />
              <SliderRow
                label="Radial layers"
                value={params.radialLayers}
                min={2}
                max={6}
                step={1}
                onChange={(value) => {
                  setParams((prev) => ({
                    ...prev,
                    radialLayers: Math.round(value),
                  }));
                }}
              />
              <SliderRow
                label="Meridians"
                value={params.meridians}
                min={4}
                max={12}
                step={1}
                onChange={(value) => {
                  setParams((prev) => ({
                    ...prev,
                    meridians: Math.round(value),
                  }));
                }}
              />
              <SliderRow
                label="Branch depth"
                value={params.branchDepth}
                min={1}
                max={5}
                step={1}
                onChange={(value) => {
                  setParams((prev) => ({
                    ...prev,
                    branchDepth: Math.round(value),
                  }));
                }}
              />
              <SliderRow
                label="Sub-branch factor"
                value={params.subBranchFactor}
                min={1}
                max={4}
                step={1}
                onChange={(value) => {
                  setParams((prev) => ({
                    ...prev,
                    subBranchFactor: Math.round(value),
                  }));
                }}
              />
              <SliderRow
                label="Crown compression"
                value={params.crownCompression}
                min={0.45}
                max={1}
                step={0.01}
                onChange={(value) => {
                  setParams((prev) => ({ ...prev, crownCompression: value }));
                }}
              />
              <SliderRow
                label="Cell scale"
                value={params.cellScale}
                min={0.18}
                max={0.7}
                step={0.01}
                onChange={(value) => {
                  setParams((prev) => ({ ...prev, cellScale: value }));
                }}
              />
              <SliderRow
                label="Jitter"
                value={params.jitter}
                min={0}
                max={0.25}
                step={0.01}
                onChange={(value) => {
                  setParams((prev) => ({ ...prev, jitter: value }));
                }}
              />

              <Stack spacing={3} pt={1}>
                <Checkbox
                  isChecked={params.showLabels}
                  onChange={(event) => {
                    setParams((prev) => ({
                      ...prev,
                      showLabels: event.target.checked,
                    }));
                  }}
                >
                  Show cell labels
                </Checkbox>
                <Checkbox
                  isChecked={params.showGuideSphere}
                  onChange={(event) => {
                    setParams((prev) => ({
                      ...prev,
                      showGuideSphere: event.target.checked,
                    }));
                  }}
                >
                  Show guide sphere
                </Checkbox>
                <Checkbox
                  isChecked={params.showDevelopmentArcs}
                  onChange={(event) => {
                    setParams((prev) => ({
                      ...prev,
                      showDevelopmentArcs: event.target.checked,
                    }));
                  }}
                >
                  Show development arcs
                </Checkbox>
                <HStack justify="space-between">
                  <Text fontSize="sm">Auto rotate</Text>
                  <Switch
                    isChecked={params.autoRotate}
                    onChange={(event) => {
                      setParams((prev) => ({
                        ...prev,
                        autoRotate: event.target.checked,
                      }));
                    }}
                  />
                </HStack>
              </Stack>
            </VStack>

            <Box
              borderWidth="1px"
              borderRadius="xl"
              overflow="hidden"
              minH="860px"
              bg="gray.50"
            >
              <Canvas shadows camera={{ position: [7.5, 5.5, 7.5], fov: 36 }}>
                <DevelopmentScene params={params} />
                <OrbitControls
                  autoRotate={params.autoRotate}
                  autoRotateSpeed={1.2}
                  enablePan
                  enableZoom
                  enableRotate
                />
              </Canvas>
            </Box>
          </Box>
        </CardBody>
      </Card>
    </Box>
  );
};

export default SphericalCellLayersModel;
