"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import {
  Box,
  Button,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
  VStack,
} from "@chakra-ui/react";

type BodyId = 0 | 1 | 2;

type BodyState = {
  id: BodyId;
  name: string;
  mass: number;
  radius: number;

  pos: THREE.Vector3;
  vel: THREE.Vector3;
};

type SimParams = {
  G: number;
  dt: number;
  softening: number; // epsilon to avoid singularities
  trailLen: number;
};

type ThreeBodySceneProps = {
  paused: boolean;
  params: SimParams;
  bodiesRef: React.MutableRefObject<BodyState[]>;
  trailsRef: React.MutableRefObject<THREE.Vector3[][]>;
  onStats: (stats: SimStats) => void;
};

type SimStats = {
  time: number;
  kinetic: number;
  potential: number;
  total: number;
};

const clamp = (v: number, min: number, max: number) => {
  if (v < min) {
    return min;
  }
  if (v > max) {
    return max;
  }
  return v;
};

const computeAccelerations = (bodies: BodyState[], params: SimParams) => {
  const acc = bodies.map(() => new THREE.Vector3(0, 0, 0));

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = 0; j < bodies.length; j += 1) {
      if (i === j) {
        continue;
      }

      const ri = bodies[i].pos;
      const rj = bodies[j].pos;

      const dx = rj.x - ri.x;
      const dy = rj.y - ri.y;
      const dz = rj.z - ri.z;

      const r2 =
        dx * dx + dy * dy + dz * dz + params.softening * params.softening;
      const invR = 1 / Math.sqrt(r2);
      const invR3 = invR * invR * invR;

      const s = params.G * bodies[j].mass * invR3;

      acc[i].x += dx * s;
      acc[i].y += dy * s;
      acc[i].z += dz * s;
    }
  }

  return acc;
};

const computeEnergy = (bodies: BodyState[], params: SimParams) => {
  let kinetic = 0;
  let potential = 0;

  // Kinetic
  for (const b of bodies) {
    kinetic += 0.5 * b.mass * b.vel.lengthSq();
  }

  // Potential (pairwise, count each pair once)
  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const ri = bodies[i].pos;
      const rj = bodies[j].pos;

      const dx = rj.x - ri.x;
      const dy = rj.y - ri.y;
      const dz = rj.z - ri.z;

      const r = Math.sqrt(
        dx * dx + dy * dy + dz * dz + params.softening * params.softening,
      );
      potential += (-params.G * bodies[i].mass * bodies[j].mass) / r;
    }
  }

  return {
    kinetic,
    potential,
    total: kinetic + potential,
  };
};

const createInitialBodies = () => {
  // A classic "figure-eight-ish" style start (not exact)
  // You can tweak these later for different behaviors.
  const b0: BodyState = {
    id: 0,
    name: "A",
    mass: 1,
    radius: 0.22,
    pos: new THREE.Vector3(-1, 0, 0),
    vel: new THREE.Vector3(0.4, 0.7, 0.0),
  };

  const b1: BodyState = {
    id: 1,
    name: "B",
    mass: 1,
    radius: 0.22,
    pos: new THREE.Vector3(1, 0, 0),
    vel: new THREE.Vector3(-0.4, 0.7, 0.0),
  };

  const b2: BodyState = {
    id: 2,
    name: "C",
    mass: 1,
    radius: 0.22,
    pos: new THREE.Vector3(0, 0.8, 0),
    vel: new THREE.Vector3(0.0, -0.9, 0.0),
  };

  return [b0, b1, b2];
};

const ThreeBodyScene = ({
  paused,
  params,
  bodiesRef,
  trailsRef,
  onStats,
}: ThreeBodySceneProps) => {
  const tRef = useRef(0);

  useFrame((_, dtFrame) => {
    if (paused) {
      return;
    }

    const bodies = bodiesRef.current;

    // Use fixed-ish dt for stability; frame dt only as a cap
    const dt = clamp(params.dt, 0.0005, 0.05);
    const frameCap = clamp(dtFrame, 0, 0.05);

    // Do 1–N substeps to reduce frame dependence
    const steps = Math.max(1, Math.floor(frameCap / dt));
    const h = frameCap / steps;

    for (let s = 0; s < steps; s += 1) {
      // Velocity Verlet / Leapfrog:
      // v(t+1/2) = v(t) + a(t)*h/2
      // x(t+1)   = x(t) + v(t+1/2)*h
      // a(t+1)   = a(x(t+1))
      // v(t+1)   = v(t+1/2) + a(t+1)*h/2

      const a0 = computeAccelerations(bodies, params);

      for (let i = 0; i < bodies.length; i += 1) {
        bodies[i].vel.addScaledVector(a0[i], h * 0.5);
      }

      for (let i = 0; i < bodies.length; i += 1) {
        bodies[i].pos.addScaledVector(bodies[i].vel, h);
      }

      const a1 = computeAccelerations(bodies, params);

      for (let i = 0; i < bodies.length; i += 1) {
        bodies[i].vel.addScaledVector(a1[i], h * 0.5);
      }

      // Update trails
      for (let i = 0; i < bodies.length; i += 1) {
        const trail = trailsRef.current[i];
        trail.push(bodies[i].pos.clone());

        if (trail.length > params.trailLen) {
          trail.shift();
        }
      }

      tRef.current += h;
    }

    const e = computeEnergy(bodies, params);
    onStats({
      time: tRef.current,
      kinetic: e.kinetic,
      potential: e.potential,
      total: e.total,
    });
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 12, 8]} intensity={1.1} />
      <OrbitControls makeDefault />

      <axesHelper args={[5]} />

      {bodiesRef.current.map((b, i) => {
        const trail = trailsRef.current[i];

        return (
          <group key={b.id}>
            <mesh position={b.pos.toArray()}>
              <sphereGeometry args={[b.radius, 24, 24]} />
              <meshStandardMaterial
                color={
                  b.id === 0 ? "#f59e0b" : b.id === 1 ? "#60a5fa" : "#34d399"
                }
                emissive={
                  b.id === 0 ? "#f59e0b" : b.id === 1 ? "#60a5fa" : "#34d399"
                }
                emissiveIntensity={0.2}
              />
            </mesh>

            {trail.length > 1 && (
              <Line
                points={trail.map(
                  (p) => [p.x, p.y, p.z] as [number, number, number],
                )}
                color={
                  b.id === 0 ? "#f59e0b" : b.id === 1 ? "#60a5fa" : "#34d399"
                }
                lineWidth={2}
              />
            )}
          </group>
        );
      })}
    </>
  );
};

const ThreeBody = () => {
  const [paused, setPaused] = useState(false);

  const [G, setG] = useState(1.0);
  const [dt, setDt] = useState(0.01);
  const [softening, setSoftening] = useState(0.05);
  const [trailLen, setTrailLen] = useState(250);

  const [stats, setStats] = useState<SimStats>({
    time: 0,
    kinetic: 0,
    potential: 0,
    total: 0,
  });

  const params = useMemo<SimParams>(() => {
    return { G, dt, softening, trailLen };
  }, [G, dt, softening, trailLen]);

  const bodiesRef = useRef<BodyState[]>(createInitialBodies());
  const trailsRef = useRef<THREE.Vector3[][]>([[], [], []]);

  const reset = () => {
    bodiesRef.current = createInitialBodies();
    trailsRef.current = [[], [], []];
    setStats({
      time: 0,
      kinetic: 0,
      potential: 0,
      total: 0,
    });
  };

  // Initialize trails on mount
  useEffect(() => {
    trailsRef.current = bodiesRef.current.map((b) => {
      return [b.pos.clone()];
    });
  }, []);

  const bodies = bodiesRef.current;

  return (
    <HStack align="stretch" spacing={0} w="100%" h="100vh">
      {/* Left panel */}
      <Box
        w="380px"
        bg="gray.900"
        color="white"
        borderRightWidth="1px"
        borderRightColor="whiteAlpha.200"
        p={4}
      >
        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              3-Body Problem
            </Text>
            <Text fontSize="sm" opacity={0.8}>
              Newtonian gravity + leapfrog integration. Chaos-friendly.
            </Text>
          </Box>

          <HStack>
            <Button
              onClick={() => {
                setPaused((v) => !v);
              }}
            >
              {paused ? "Play" : "Pause"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                reset();
              }}
            >
              Reset
            </Button>
          </HStack>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              G: {G.toFixed(2)}
            </Text>
            <Slider min={0.1} max={5.0} step={0.01} value={G} onChange={setG}>
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              dt: {dt.toFixed(4)}
            </Text>
            <Slider
              min={0.001}
              max={0.03}
              step={0.001}
              value={dt}
              onChange={setDt}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              softening ε: {softening.toFixed(3)}
            </Text>
            <Slider
              min={0.0}
              max={0.3}
              step={0.005}
              value={softening}
              onChange={setSoftening}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              trail length: {trailLen}
            </Text>
            <Slider
              min={20}
              max={1500}
              step={10}
              value={trailLen}
              onChange={setTrailLen}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8} mb={2}>
              Stats
            </Text>

            <Table size="sm" variant="simple">
              <Tbody>
                <Tr>
                  <Td>t</Td>
                  <Td isNumeric>{stats.time.toFixed(2)}</Td>
                </Tr>
                <Tr>
                  <Td>K</Td>
                  <Td isNumeric>{stats.kinetic.toFixed(4)}</Td>
                </Tr>
                <Tr>
                  <Td>U</Td>
                  <Td isNumeric>{stats.potential.toFixed(4)}</Td>
                </Tr>
                <Tr>
                  <Td>E = K + U</Td>
                  <Td isNumeric>{stats.total.toFixed(4)}</Td>
                </Tr>
              </Tbody>
            </Table>

            <Text fontSize="xs" opacity={0.7} mt={2}>
              Energy should stay roughly constant (small drift). If it explodes,
              reduce dt or increase ε.
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8} mb={2}>
              Bodies (pos / vel)
            </Text>

            <Table size="sm" variant="simple">
              <Tbody>
                {bodies.map((b) => {
                  return (
                    <Tr key={b.id}>
                      <Td>{b.name}</Td>
                      <Td fontFamily="mono" fontSize="xs">
                        p=({b.pos.x.toFixed(2)},{b.pos.y.toFixed(2)},
                        {b.pos.z.toFixed(2)})<br />
                        v=({b.vel.x.toFixed(2)},{b.vel.y.toFixed(2)},
                        {b.vel.z.toFixed(2)})
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Box>

      {/* Scene */}
      <Box flex="1">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 50 }}
          style={{ height: "100%", width: "100%" }}
        >
          <ThreeBodyScene
            paused={paused}
            params={params}
            bodiesRef={bodiesRef}
            trailsRef={trailsRef}
            onStats={(s) => {
              setStats(s);
            }}
          />
        </Canvas>
      </Box>
    </HStack>
  );
};

export default ThreeBody;
