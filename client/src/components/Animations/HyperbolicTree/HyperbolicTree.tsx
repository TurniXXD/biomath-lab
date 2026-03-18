"use client";

import { css } from "@emotion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Badge,
  Box,
  Card,
  Checkbox,
  HStack,
  Slider,
  Switch,
  Text,
  VStack,
} from "@chakra-ui/react";
import * as THREE from "three";

type BranchNode = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
  depth: number;
  color: string;
};

type TreeParams = {
  trunkHeight: number;
  trunkRadius: number;
  maxDepth: number;
  branchFactor: number;
  upwardBias: number;
  lengthDecay: number;
  radiusDecay: number;
  spread: number;
  curl: number;
  hyperbolicStrength: number;
  colorJitter: boolean;
};

type DeterministicRng = {
  next: () => number;
  range: (min: number, max: number) => number;
  pickSign: () => 1 | -1;
};

type BranchMeshProps = {
  branch: BranchNode;
};

type TreeSceneProps = {
  params: TreeParams;
  wireframe: boolean;
};

type ControlRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

const createRng = (seed: number): DeterministicRng => {
  let s = seed >>> 0;

  const next = () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const range = (min: number, max: number) => {
    return min + (max - min) * next();
  };

  const pickSign = () => {
    return next() > 0.5 ? 1 : -1;
  };

  return { next, range, pickSign };
};

const lerpColor = (a: THREE.Color, b: THREE.Color, t: number) => {
  return new THREE.Color(a).lerp(b, t);
};

const getBranchColor = (
  depth: number,
  maxDepth: number,
  colorJitter: boolean,
  rng: DeterministicRng,
) => {
  const trunk = new THREE.Color("#6b4f2a");
  const foliage = new THREE.Color("#2f6f3e");
  const blueFoliage = new THREE.Color("#608f95");

  const base = lerpColor(
    trunk,
    foliage,
    Math.min(1, depth / Math.max(1, maxDepth * 0.45)),
  );
  const mixed = lerpColor(
    base,
    blueFoliage,
    Math.min(1, depth / Math.max(1, maxDepth)) * 0.45,
  );

  if (!colorJitter) {
    return `#${mixed.getHexString()}`;
  }

  const hsl = { h: 0, s: 0, l: 0 };
  mixed.getHSL(hsl);
  hsl.h += rng.range(-0.01, 0.01);
  hsl.s = Math.max(0, Math.min(1, hsl.s + rng.range(-0.04, 0.04)));
  hsl.l = Math.max(0, Math.min(1, hsl.l + rng.range(-0.03, 0.03)));

  const out = new THREE.Color();
  out.setHSL(hsl.h, hsl.s, hsl.l);

  return `#${out.getHexString()}`;
};

const orthonormalFromDirection = (dir: THREE.Vector3) => {
  const upCandidate =
    Math.abs(dir.y) < 0.95
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);

  const tangent = new THREE.Vector3()
    .crossVectors(dir, upCandidate)
    .normalize();
  const bitangent = new THREE.Vector3().crossVectors(dir, tangent).normalize();

  return { tangent, bitangent };
};

const generateTree = (params: TreeParams, seed: number) => {
  const rng = createRng(seed);
  const branches: BranchNode[] = [];

  const recurse = (
    start: THREE.Vector3,
    direction: THREE.Vector3,
    length: number,
    radius: number,
    depth: number,
    curvePhase: number,
  ) => {
    if (depth > params.maxDepth || length < 0.03 || radius < 0.002) {
      return;
    }

    const dir = direction.clone().normalize();
    const { tangent, bitangent } = orthonormalFromDirection(dir);

    const hyperbolicLift = params.hyperbolicStrength / (1 + depth * 0.65);
    const verticalPush = new THREE.Vector3(
      0,
      params.upwardBias + hyperbolicLift,
      0,
    );

    const sidewaysA = tangent
      .clone()
      .multiplyScalar(Math.sinh(params.curl * 0.18 + curvePhase) * 0.06);
    const sidewaysB = bitangent
      .clone()
      .multiplyScalar(
        Math.cosh(params.curl * 0.12 + curvePhase) * 0.025 * rng.pickSign(),
      );

    const curvedDirection = dir
      .clone()
      .multiplyScalar(1.0)
      .add(verticalPush)
      .add(sidewaysA)
      .add(sidewaysB)
      .normalize();

    const end = start.clone().add(curvedDirection.multiplyScalar(length));

    branches.push({
      start,
      end,
      radius,
      depth,
      color: getBranchColor(depth, params.maxDepth, params.colorJitter, rng),
    });

    const childCount =
      depth === 0 ? params.branchFactor + 1 : params.branchFactor;

    for (let i = 0; i < childCount; i += 1) {
      const localSpread = params.spread * (0.82 + rng.range(-0.08, 0.08));
      const around = (Math.PI * 2 * i) / childCount + rng.range(-0.32, 0.32);
      const elevate = params.upwardBias + rng.range(0.12, localSpread);

      const radial = tangent
        .clone()
        .multiplyScalar(Math.cos(around))
        .add(bitangent.clone().multiplyScalar(Math.sin(around)));

      const childDirection = dir
        .clone()
        .multiplyScalar(0.55)
        .add(new THREE.Vector3(0, elevate + hyperbolicLift * 0.35, 0))
        .add(radial.multiplyScalar(localSpread))
        .normalize();

      const nextStart = end
        .clone()
        .add(childDirection.clone().multiplyScalar(radius * 1.25));
      const nextLength = length * params.lengthDecay * rng.range(0.88, 1.08);
      const nextRadius = radius * params.radiusDecay * rng.range(0.9, 1.03);
      const nextPhase =
        curvePhase + rng.range(0.12, 0.45) * params.hyperbolicStrength;

      recurse(
        nextStart,
        childDirection,
        nextLength,
        nextRadius,
        depth + 1,
        nextPhase,
      );
    }
  };

  recurse(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 1, 0),
    params.trunkHeight,
    params.trunkRadius,
    0,
    0.25,
  );

  return branches;
};

const BranchMesh = ({ branch }: BranchMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(branch.end, branch.start);
    const length = dir.length();

    return new THREE.CylinderGeometry(
      Math.max(branch.radius * 0.72, 0.003),
      Math.max(branch.radius, 0.004),
      length,
      Math.max(6, 10 - branch.depth),
    );
  }, [branch]);

  const midpoint = useMemo(() => {
    return new THREE.Vector3()
      .addVectors(branch.start, branch.end)
      .multiplyScalar(0.5);
  }, [branch]);

  const quaternion = useMemo(() => {
    const dir = new THREE.Vector3()
      .subVectors(branch.end, branch.start)
      .normalize();
    const up = new THREE.Vector3(0, 1, 0);

    return new THREE.Quaternion().setFromUnitVectors(up, dir);
  }, [branch]);

  useFrame((_, delta) => {
    if (!meshRef.current) {
      return;
    }

    meshRef.current.rotation.y += delta * 0.02;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={midpoint}
      quaternion={quaternion}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={branch.color}
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  );
};

const Ground = () => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
      receiveShadow
    >
      <circleGeometry args={[7, 64]} />
      <meshStandardMaterial color="#6d7d48" roughness={1} />
    </mesh>
  );
};

const TreeScene = ({ params, wireframe }: TreeSceneProps) => {
  const branches = useMemo(() => {
    return generateTree(params, 1337);
  }, [params]);

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[8, 14, 6]} intensity={1.4} castShadow />
      <directionalLight position={[-6, 8, -6]} intensity={0.45} />
      <fog attach="fog" args={["#c7d7eb", 12, 34]} />
      <color attach="background" args={["#b9d4f0"]} />

      <Ground />

      <group position={[0, 0, 0]}>
        {branches.map((branch, index) => (
          <group key={`${branch.depth}-${index}`}>
            <BranchMesh branch={branch} />
            {wireframe ? (
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[
                      new Float32Array([
                        branch.start.x,
                        branch.start.y,
                        branch.start.z,
                        branch.end.x,
                        branch.end.y,
                        branch.end.z,
                      ]),
                      3,
                    ]}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#0b2239" />
              </line>
            ) : null}
          </group>
        ))}
      </group>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 2.02}
      />
    </>
  );
};

const ControlRow = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: ControlRowProps) => {
  return (
    <VStack align="stretch" gap={2} width="100%">
      <HStack justify="space-between" width="100%">
        <Text fontSize="sm" fontWeight="semibold">
          {label}
        </Text>
        <Badge variant="outline">{value.toFixed(2)}</Badge>
      </HStack>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(next) => {
          onChange(next ?? value);
        }}
      />
    </VStack>
  );
};

const SceneAutoRotate = () => {
  const rootRef = useRef<THREE.Group | null>(null);

  useFrame((state, delta) => {
    if (!rootRef.current) {
      rootRef.current = state.scene.children.find((child) => {
        return child.type === "Group";
      }) as THREE.Group | null;
    }

    if (!rootRef.current) {
      return;
    }

    rootRef.current.rotation.y += delta * 0.18;
  });

  return null;
};

const HyperbolicTreeModel = () => {
  const [params, setParams] = useState<TreeParams>({
    trunkHeight: 3.6,
    trunkRadius: 0.22,
    maxDepth: 5,
    branchFactor: 4,
    upwardBias: 0.62,
    lengthDecay: 0.72,
    radiusDecay: 0.67,
    spread: 0.65,
    curl: 1.45,
    hyperbolicStrength: 1.55,
    colorJitter: true,
  });

  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const sceneGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!sceneGroupRef.current) {
      return;
    }

    sceneGroupRef.current.rotation.y = 0;
  }, [params]);

  return (
    <Box p={4} width="100%">
      <Card css={cardStyles}>
        <HStack css={headerRowStyles}>
          <Box>
            <Text fontSize="xl" fontWeight="bold">
              Hyperbolic Fractal Spruce Generator
            </Text>
            <Text fontSize="sm" color="gray.500" mt={2}>
              Three.js model for a spruce-like tree with upward hyperbolic
              branching, recursive sub-branches, and colorized foliage.
            </Text>
          </Box>

          <HStack gap={2} flexWrap="wrap">
            <Badge>Next.js</Badge>
            <Badge>Three.js</Badge>
            <Badge>Chakra UI</Badge>
          </HStack>
        </HStack>

        <Box css={layoutGridStyles}>
          <VStack align="stretch" gap={5} css={controlsPanelStyles}>
            <ControlRow
              label="Trunk height"
              value={params.trunkHeight}
              min={2.5}
              max={5.5}
              step={0.05}
              onChange={(value) => {
                setParams((prev) => ({ ...prev, trunkHeight: value }));
              }}
            />

            <ControlRow
              label="Trunk radius"
              value={params.trunkRadius}
              min={0.08}
              max={0.35}
              step={0.01}
              onChange={(value) => {
                setParams((prev) => ({ ...prev, trunkRadius: value }));
              }}
            />

            <ControlRow
              label="Branch depth"
              value={params.maxDepth}
              min={3}
              max={7}
              step={1}
              onChange={(value) => {
                setParams((prev) => ({
                  ...prev,
                  maxDepth: Math.round(value),
                }));
              }}
            />

            <ControlRow
              label="Branch factor"
              value={params.branchFactor}
              min={2}
              max={6}
              step={1}
              onChange={(value) => {
                setParams((prev) => ({
                  ...prev,
                  branchFactor: Math.round(value),
                }));
              }}
            />

            <ControlRow
              label="Upward bias"
              value={params.upwardBias}
              min={0.15}
              max={1.2}
              step={0.01}
              onChange={(value) => {
                setParams((prev) => ({ ...prev, upwardBias: value }));
              }}
            />

            <ControlRow
              label="Spread"
              value={params.spread}
              min={0.15}
              max={1.2}
              step={0.01}
              onChange={(value) => {
                setParams((prev) => ({ ...prev, spread: value }));
              }}
            />

            <ControlRow
              label="Hyperbolic strength"
              value={params.hyperbolicStrength}
              min={0.1}
              max={3}
              step={0.05}
              onChange={(value) => {
                setParams((prev) => ({ ...prev, hyperbolicStrength: value }));
              }}
            />

            <ControlRow
              label="Length decay"
              value={params.lengthDecay}
              min={0.45}
              max={0.9}
              step={0.01}
              onChange={(value) => {
                setParams((prev) => ({ ...prev, lengthDecay: value }));
              }}
            />

            <ControlRow
              label="Radius decay"
              value={params.radiusDecay}
              min={0.45}
              max={0.9}
              step={0.01}
              onChange={(value) => {
                setParams((prev) => ({ ...prev, radiusDecay: value }));
              }}
            />

            <ControlRow
              label="Curl"
              value={params.curl}
              min={0}
              max={3}
              step={0.05}
              onChange={(value) => {
                setParams((prev) => ({ ...prev, curl: value }));
              }}
            />

            <HStack justify="space-between">
              <Text as="label" htmlFor="wireframe-switch">
                Wireframe guides
              </Text>
              <Switch
                id="wireframe-switch"
                checked={wireframe}
                onChange={(event) => {
                  setWireframe(event.target.checked);
                }}
              />
            </HStack>

            <HStack justify="space-between">
              <Text as="label" htmlFor="jitter-switch">
                Color jitter
              </Text>
              <Checkbox
                id="jitter-switch"
                checked={params.colorJitter}
                onChange={(event) => {
                  setParams((prev) => ({
                    ...prev,
                    colorJitter: event.target.checked,
                  }));
                }}
              />
            </HStack>

            <HStack justify="space-between">
              <Text as="label" htmlFor="rotate-switch">
                Auto-rotate scene
              </Text>
              <Switch
                id="rotate-switch"
                checked={autoRotate}
                onChange={(event) => {
                  setAutoRotate(event.target.checked);
                }}
              />
            </HStack>
          </VStack>

          <Box css={canvasWrapperStyles}>
            <Canvas shadows camera={{ position: [6.2, 4.8, 7.5], fov: 42 }}>
              <group ref={sceneGroupRef}>
                <TreeScene params={params} wireframe={wireframe} />
              </group>
              {autoRotate ? <SceneAutoRotate /> : null}
            </Canvas>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

const cardStyles = css`
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 1.5rem;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
  padding: 1.5rem;
`;

const headerRowStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

const layoutGridStyles = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;

  @media (min-width: 1280px) {
    grid-template-columns: 360px minmax(0, 1fr);
  }
`;

const controlsPanelStyles = css`
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  background: #ffffff;
`;

const canvasWrapperStyles = css`
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: #f8fafc;
  min-height: 720px;
  height: 720px;
`;

export default HyperbolicTreeModel;
