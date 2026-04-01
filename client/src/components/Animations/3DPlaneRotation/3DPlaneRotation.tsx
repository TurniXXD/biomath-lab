"use client";

import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  Box,
  Button,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { darkSecondaryButtonProps } from "@/components/Animations/AlgorithmDialogButton";

type Axis = "x" | "y" | "z";

type PlaneParams = {
  width: number;
  height: number;
  gridN: number;
};

type PlaneSceneProps = {
  params: PlaneParams;
  rotation: THREE.Euler;
};

const degToRad = (deg: number) => {
  return (deg * Math.PI) / 180;
};

const activeStepButtonProps = (active: boolean) => {
  return active
    ? { colorScheme: "orange" as const }
    : darkSecondaryButtonProps;
};

const toFixed = (v: number, n = 3) => {
  return Number.isFinite(v) ? v.toFixed(n) : "NaN";
};

const buildPlaneGridLinesLocal = (params: PlaneParams) => {
  // Grid drawn in the plane's LOCAL space (xy-plane at z=0),
  // then the group rotation rotates the whole thing.
  const halfW = params.width / 2;
  const halfH = params.height / 2;
  const n = Math.max(2, Math.floor(params.gridN));

  const lines: Array<Array<[number, number, number]>> = [];

  // Vertical lines (constant x)
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const x = -halfW + t * params.width;

    lines.push([
      [x, -halfH, 0],
      [x, halfH, 0],
    ]);
  }

  // Horizontal lines (constant y)
  for (let j = 0; j < n; j += 1) {
    const t = j / (n - 1);
    const y = -halfH + t * params.height;

    lines.push([
      [-halfW, y, 0],
      [halfW, y, 0],
    ]);
  }

  return lines;
};

const PlaneScene = ({ params, rotation }: PlaneSceneProps) => {
  const groupRef = useRef<THREE.Group | null>(null);

  const gridLines = useMemo(() => {
    return buildPlaneGridLinesLocal(params);
  }, [params]);

  // The plane in LOCAL coords is z=0, with normal (0,0,1).
  // After rotation, the WORLD normal is R * (0,0,1).
  const worldNormal = useMemo(() => {
    const q = new THREE.Quaternion().setFromEuler(rotation);
    return new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
  }, [rotation]);

  // Keep group rotation synced
  useFrame(() => {
    const g = groupRef.current;
    if (!g) {
      return;
    }

    g.rotation.copy(rotation);
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 12, 8]} intensity={1.0} />
      <OrbitControls makeDefault />
      <axesHelper args={[5]} />

      {/* Plane + grid */}
      <group ref={groupRef}>
        {/* Filled plane */}
        <mesh>
          <planeGeometry args={[params.width, params.height, 1, 1]} />
          <meshStandardMaterial
            color="#94a3b8"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Grid lines */}
        {gridLines.map((pts, idx) => {
          return <Line key={idx} points={pts} color="#64748b" lineWidth={1} />;
        })}

        {/* Local normal arrow (z+) */}
        <Line
          points={[
            [0, 0, 0],
            [0, 0, 1.2],
          ]}
          color="#ef4444"
          lineWidth={3}
        />
      </group>

      {/* World normal line from origin (computed) */}
      <Line
        points={[
          [0, 0, 0],
          [worldNormal.x * 1.5, worldNormal.y * 1.5, worldNormal.z * 1.5],
        ]}
        color="#22c55e"
        lineWidth={3}
      />
    </>
  );
};

const PlaneRotationSim = () => {
  const [rotDeg, setRotDeg] = useState({ x: 0, y: 0, z: 0 });
  const [stepDeg, setStepDeg] = useState(15);

  const params = useMemo<PlaneParams>(() => {
    return { width: 6, height: 6, gridN: 11 };
  }, []);

  const rotation = useMemo(() => {
    // Order matters. Default Euler order is XYZ in three.js unless changed.
    return new THREE.Euler(
      degToRad(rotDeg.x),
      degToRad(rotDeg.y),
      degToRad(rotDeg.z),
      "XYZ",
    );
  }, [rotDeg]);

  const worldNormal = useMemo(() => {
    const q = new THREE.Quaternion().setFromEuler(rotation);
    return new THREE.Vector3(0, 0, 1).applyQuaternion(q).normalize();
  }, [rotation]);

  // Plane equation for a plane through origin: n·p = 0
  // If n = (a,b,c), equation is ax + by + cz = 0
  const planeEq = useMemo(() => {
    const a = worldNormal.x;
    const b = worldNormal.y;
    const c = worldNormal.z;

    return { a, b, c };
  }, [worldNormal]);

  const rotate = (axis: Axis, dir: 1 | -1) => {
    setRotDeg((prev) => {
      const next = { ...prev };

      next[axis] = prev[axis] + dir * stepDeg;

      // keep it readable
      if (next[axis] > 180) {
        next[axis] -= 360;
      }
      if (next[axis] < -180) {
        next[axis] += 360;
      }

      return next;
    });
  };

  const reset = () => {
    setRotDeg({ x: 0, y: 0, z: 0 });
  };

  return (
    <HStack align="stretch" spacing={0} w="100%" h="100vh">
      {/* Left panel */}
      <Box
        w="420px"
        bg="gray.900"
        color="white"
        borderRightWidth="1px"
        borderRightColor="whiteAlpha.200"
        p={4}
      >
        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              Plane Rotation (3D)
            </Text>
            <Text fontSize="sm" opacity={0.85}>
              Rotate the plane around X / Y / Z. Green line = world normal, red
              line = local normal.
            </Text>
          </Box>

          <HStack>
            <Button
              onClick={() => {
                reset();
              }}
              {...darkSecondaryButtonProps}
            >
              Reset
            </Button>

            <Button
              onClick={() => {
                setStepDeg(5);
              }}
              {...activeStepButtonProps(stepDeg === 5)}
            >
              5°
            </Button>
            <Button
              onClick={() => {
                setStepDeg(15);
              }}
              {...activeStepButtonProps(stepDeg === 15)}
            >
              15°
            </Button>
            <Button
              onClick={() => {
                setStepDeg(45);
              }}
              {...activeStepButtonProps(stepDeg === 45)}
            >
              45°
            </Button>
          </HStack>

          <Box>
            <Text fontSize="sm" opacity={0.8} mb={2}>
              Rotate plane
            </Text>

            <VStack align="stretch" spacing={2}>
              <HStack>
                <Button
                  onClick={() => {
                    rotate("x", -1);
                  }}
                  w="50%"
                >
                  X −
                </Button>
                <Button
                  onClick={() => {
                    rotate("x", 1);
                  }}
                  w="50%"
                >
                  X +
                </Button>
              </HStack>

              <HStack>
                <Button
                  onClick={() => {
                    rotate("y", -1);
                  }}
                  w="50%"
                >
                  Y −
                </Button>
                <Button
                  onClick={() => {
                    rotate("y", 1);
                  }}
                  w="50%"
                >
                  Y +
                </Button>
              </HStack>

              <HStack>
                <Button
                  onClick={() => {
                    rotate("z", -1);
                  }}
                  w="50%"
                >
                  Z −
                </Button>
                <Button
                  onClick={() => {
                    rotate("z", 1);
                  }}
                  w="50%"
                >
                  Z +
                </Button>
              </HStack>
            </VStack>
          </Box>

          <Box>
            <Text fontSize="sm" opacity={0.8} mb={2}>
              Current state
            </Text>

            <Table size="sm" variant="simple">
              <Tbody>
                <Tr>
                  <Td>Rotation (deg)</Td>
                  <Td isNumeric fontFamily="mono" fontSize="xs">
                    x={toFixed(rotDeg.x, 1)}&nbsp; y={toFixed(rotDeg.y, 1)}
                    &nbsp; z={toFixed(rotDeg.z, 1)}
                  </Td>
                </Tr>

                <Tr>
                  <Td>Normal n</Td>
                  <Td isNumeric fontFamily="mono" fontSize="xs">
                    ({toFixed(worldNormal.x)}, {toFixed(worldNormal.y)},{" "}
                    {toFixed(worldNormal.z)})
                  </Td>
                </Tr>

                <Tr>
                  <Td>Plane</Td>
                  <Td isNumeric fontFamily="mono" fontSize="xs">
                    {toFixed(planeEq.a)}·x + {toFixed(planeEq.b)}·y +{" "}
                    {toFixed(planeEq.c)}·z = 0
                  </Td>
                </Tr>
              </Tbody>
            </Table>

            <Text fontSize="xs" opacity={0.7} mt={2}>
              Plane shown is the local plane z=0 rotated in world. Since it
              passes through origin, equation is n·p=0.
            </Text>
          </Box>
        </VStack>
      </Box>

      {/* Scene */}
      <Box flex="1">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 50 }}
          style={{ height: "100%", width: "100%" }}
        >
          <PlaneScene params={params} rotation={rotation} />
        </Canvas>
      </Box>
    </HStack>
  );
};

export default PlaneRotationSim;
