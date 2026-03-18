"use client";

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";
import {
  Box,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  VStack,
} from "@chakra-ui/react";

type CurvatureParams = {
  mass: number; // strength of well
  radius: number; // softening radius
  depth: number; // max z displacement scale
  gridSize: number; // half-size of plane
  segments: number; // plane resolution
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

// A smooth "gravity well" function for the surface z = -depth * mass / sqrt(r^2 + radius^2)
const wellZ = (x: number, y: number, p: CurvatureParams) => {
  const r2 = x * x + y * y;
  const denom = Math.sqrt(r2 + p.radius * p.radius);
  const z = (-p.depth * p.mass) / denom;
  return z;
};

// Gradient of the well (for acceleration direction on the surface)
const wellGrad = (x: number, y: number, p: CurvatureParams) => {
  const r2 = x * x + y * y;
  const denom = Math.sqrt(r2 + p.radius * p.radius);
  const denom3 = denom * denom * denom;

  // z = -C / denom, C = depth*mass
  // dz/dx = -C * d(1/denom)/dx = -C * (-x)/denom^3 = C*x/denom^3
  const C = p.depth * p.mass;
  const dzdx = (C * x) / denom3;
  const dzdy = (C * y) / denom3;

  return { dzdx, dzdy };
};

type WarpedGridProps = {
  params: CurvatureParams;
};

const WarpedGrid = ({ params }: WarpedGridProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const basePositions = useMemo(() => {
    // create base plane positions so we can reapply z displacement each frame without drift
    const geom = new THREE.PlaneGeometry(
      params.gridSize * 2,
      params.gridSize * 2,
      params.segments,
      params.segments,
    );

    const pos = geom.attributes.position.array as Float32Array;
    const base = new Float32Array(pos.length);
    base.set(pos);

    return { geom, base };
  }, [params.gridSize, params.segments]);

  useFrame(() => {
    const mesh = meshRef.current;

    if (!mesh) {
      return;
    }

    const geom = mesh.geometry as THREE.BufferGeometry;
    const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;

    const base = basePositions.base;

    for (let i = 0; i < posAttr.count; i += 1) {
      const ix = i * 3;

      const x = base[ix + 0];
      const y = base[ix + 1];

      // plane geometry is XY by default; we'll use Z as vertical displacement
      const z = wellZ(x, y, params);

      posAttr.setXYZ(i, x, y, z);
    }

    posAttr.needsUpdate = true;
    geom.computeVertexNormals();
  });

  return (
    <mesh
      ref={meshRef}
      geometry={basePositions.geom}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <meshStandardMaterial
        color="#111827"
        wireframe
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

type ParticleProps = {
  params: CurvatureParams;
  paused: boolean;
};

const Particle = ({ params, paused }: ParticleProps) => {
  const ref = useRef<THREE.Mesh>(null);

  // state in refs so we can update smoothly without rerenders
  const state = useRef({
    // start slightly off center
    x: 6,
    y: 0,
    vx: 0,
    vy: 2.2,
  });

  useFrame((_, dt) => {
    if (paused) {
      return;
    }

    const mesh = ref.current;

    if (!mesh) {
      return;
    }

    // cap dt to avoid huge jumps if tab was inactive
    const h = clamp(dt, 0, 0.033);

    const s = state.current;

    // "gravity" pulls toward center in the XY plane using gradient magnitude
    // This isn't true GR; it's a nice intuitive coupling: acceleration ~ -grad(z)
    const g = wellGrad(s.x, s.y, params);

    // Tune: how strongly the slope affects acceleration
    const accelScale = 6.0;

    const ax = -accelScale * g.dzdx;
    const ay = -accelScale * g.dzdy;

    s.vx += ax * h;
    s.vy += ay * h;

    s.x += s.vx * h;
    s.y += s.vy * h;

    // keep it bounded
    const limit = params.gridSize * 0.95;

    if (Math.abs(s.x) > limit) {
      s.x = clamp(s.x, -limit, limit);
      s.vx *= -0.8;
    }

    if (Math.abs(s.y) > limit) {
      s.y = clamp(s.y, -limit, limit);
      s.vy *= -0.8;
    }

    // place the particle slightly above the surface
    const z = wellZ(s.x, s.y, params) + 0.25;

    mesh.position.set(s.x, z, s.y);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.25, 24, 24]} />
      <meshStandardMaterial
        color="#f59e0b"
        emissive="#f59e0b"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
};

type AxisLinesProps = {
  size: number;
};

const AxisLines = ({ size }: AxisLinesProps) => {
  // X red, Y green, Z blue vibe, but we’ll just draw visible lines (colors are fixed)
  // If you want strict "no specific colors", tell me and I’ll switch to neutral materials.
  return (
    <>
      <Line
        points={[
          [-size, 0, 0],
          [size, 0, 0],
        ]}
        color="#ef4444"
        lineWidth={2}
      />
      <Line
        points={[
          [0, -size, 0],
          [0, size, 0],
        ]}
        color="#22c55e"
        lineWidth={2}
      />
      <Line
        points={[
          [0, 0, -size],
          [0, 0, size],
        ]}
        color="#3b82f6"
        lineWidth={2}
      />
    </>
  );
};

const SpaceCurvature = () => {
  const [mass, setMass] = useState(1.0);
  const [radius, setRadius] = useState(2.0);
  const [depth, setDepth] = useState(6.0);
  const [paused, setPaused] = useState(false);

  const params = useMemo<CurvatureParams>(() => {
    return {
      mass,
      radius,
      depth,
      gridSize: 12,
      segments: 120,
    };
  }, [mass, radius, depth]);

  return (
    <HStack align="stretch" spacing={0} w="100%" h="100vh">
      <Box
        w="360px"
        bg="gray.900"
        color="white"
        borderRightWidth="1px"
        borderRightColor="whiteAlpha.200"
        p={4}
      >
        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              Space Curvature (visual intuition)
            </Text>
            <Text fontSize="sm" opacity={0.8}>
              A warped grid + a test particle sliding “downhill” toward the
              mass.
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              Mass: {mass.toFixed(2)}
            </Text>
            <Slider
              min={0.1}
              max={3.0}
              step={0.01}
              value={mass}
              onChange={setMass}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              Softening radius: {radius.toFixed(2)}
            </Text>
            <Slider
              min={0.5}
              max={6.0}
              step={0.01}
              value={radius}
              onChange={setRadius}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              Depth scale: {depth.toFixed(2)}
            </Text>
            <Slider
              min={1.0}
              max={12.0}
              step={0.01}
              value={depth}
              onChange={setDepth}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>

          <Box>
            <Text
              as="button"
              onClick={() => {
                setPaused((v) => !v);
              }}
              fontWeight="bold"
              bg="whiteAlpha.200"
              borderRadius="md"
              px={3}
              py={2}
              _hover={{ bg: "whiteAlpha.300" }}
              textAlign="left"
            >
              {paused ? "Resume particle" : "Pause particle"}
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8}>
              Notes
            </Text>
            <Text fontSize="sm" opacity={0.75}>
              This is a teaching visualization: curvature is encoded as a
              surface z = f(x,y). The particle accelerates along the slope
              (−∇z). It looks like “gravity”.
            </Text>
          </Box>
        </VStack>
      </Box>

      <Box flex="1">
        <Canvas
          camera={{ position: [10, 9, 14], fov: 45 }}
          style={{ height: "100%", width: "100%" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 12, 6]} intensity={1.1} />

          <OrbitControls makeDefault />

          <axesHelper args={[6]} />
          <AxisLines size={8} />

          {/* "Mass" marker at origin */}
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.35, 24, 24]} />
            <meshStandardMaterial
              color="#e11d48"
              emissive="#e11d48"
              emissiveIntensity={0.25}
            />
          </mesh>

          <WarpedGrid params={params} />
          <Particle params={params} paused={paused} />
        </Canvas>
      </Box>
    </HStack>
  );
};

export default SpaceCurvature;
