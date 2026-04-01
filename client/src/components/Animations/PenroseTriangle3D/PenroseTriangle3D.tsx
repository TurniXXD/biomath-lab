"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
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
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
} from "@chakra-ui/react";
import { darkSecondaryButtonProps } from "@/components/Animations/AlgorithmDialogButton";

type BeamDefinition = {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
};

type SceneProps = {
  beams: BeamDefinition[];
  autoRotate: boolean;
  rotationSpeed: number;
  showConstruction: boolean;
  snapVersion: number;
};

const beamThickness = 1.25;

const makeBeamMesh = (start: THREE.Vector3, end: THREE.Vector3) => {
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  );

  return { midpoint, quaternion, length };
};

const PenroseScene = ({
  beams,
  autoRotate,
  rotationSpeed,
  showConstruction,
  snapVersion,
}: SceneProps) => {
  const rootRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 18);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [camera, snapVersion]);

  useFrame((_, delta) => {
    if (rootRef.current && autoRotate) {
      rootRef.current.rotation.y += delta * rotationSpeed;
      rootRef.current.rotation.x = Math.sin(performance.now() * 0.00035) * 0.12;
    }
  });

  return (
    <>
      <color attach="background" args={["#020617"]} />
      <fog attach="fog" args={["#020617", 20, 42]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 14, 10]} intensity={1.1} />
      <pointLight position={[-8, 5, 12]} intensity={0.65} color="#67e8f9" />
      <OrbitControls ref={controlsRef} makeDefault />

      <group ref={rootRef}>
        {beams.map((beam) => {
          const { midpoint, quaternion, length } = makeBeamMesh(beam.start, beam.end);

          return (
            <group key={beam.id}>
              <mesh position={midpoint.toArray()} quaternion={quaternion}>
                <boxGeometry args={[beamThickness, length, beamThickness]} />
                <meshStandardMaterial
                  color={beam.color}
                  emissive={beam.color}
                  emissiveIntensity={0.18}
                  metalness={0.15}
                  roughness={0.42}
                />
              </mesh>

              <mesh position={beam.start.toArray()}>
                <boxGeometry args={[beamThickness * 1.05, beamThickness * 1.05, beamThickness * 1.05]} />
                <meshStandardMaterial color={beam.color} emissive={beam.color} emissiveIntensity={0.14} />
              </mesh>

              <mesh position={beam.end.toArray()}>
                <boxGeometry args={[beamThickness * 1.05, beamThickness * 1.05, beamThickness * 1.05]} />
                <meshStandardMaterial color={beam.color} emissive={beam.color} emissiveIntensity={0.14} />
              </mesh>

              {showConstruction ? (
                <Line
                  points={[beam.start.toArray(), beam.end.toArray()]}
                  color="#e2e8f0"
                  dashed
                  dashScale={5}
                  gapSize={0.35}
                  dashSize={0.35}
                  lineWidth={1}
                />
              ) : null}
            </group>
          );
        })}

        {showConstruction ? (
          <Line
            points={[
              [-4.7, 3.7, 0],
              [4.7, 3.7, 0],
              [0, -4.2, 0],
              [-4.7, 3.7, 0],
            ]}
            color="#94a3b8"
            lineWidth={1}
          />
        ) : null}
      </group>

      <axesHelper args={[6]} />
    </>
  );
};

const PenroseTriangle3D = () => {
  const [autoRotate, setAutoRotate] = useState(true);
  const [showConstruction, setShowConstruction] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(0.42);
  const [snapVersion, setSnapVersion] = useState(0);

  const beams = useMemo<BeamDefinition[]>(() => {
    return [
      {
        id: "top",
        start: new THREE.Vector3(-4.7, 3.7, 0),
        end: new THREE.Vector3(4.7, 3.7, 0),
        color: "#22c55e",
      },
      {
        id: "right",
        start: new THREE.Vector3(4.7, 3.7, 0),
        end: new THREE.Vector3(0, -4.2, 3.6),
        color: "#38bdf8",
      },
      {
        id: "left",
        start: new THREE.Vector3(0, -4.2, -3.6),
        end: new THREE.Vector3(-4.7, 3.7, 0),
        color: "#f59e0b",
      },
    ];
  }, []);

  const beamCount = beams.length;
  const depthOffset = 3.6;

  return (
    <HStack align="stretch" spacing={0} w="100%" h="100vh" bg="#020617">
      <Box
        w={{ base: "360px", xl: "420px" }}
        bg="gray.950"
        color="white"
        borderRightWidth="1px"
        borderRightColor="whiteAlpha.200"
        p={4}
      >
        <VStack align="stretch" spacing={5}>
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              Penrose Triangle (3D)
            </Text>
            <Text fontSize="sm" color="whiteAlpha.800">
              This scene is a spatial cheat: from the front it projects to an impossible
              triangle, but the illusion breaks the moment you orbit around it.
            </Text>
          </Box>

          <Box
            p={4}
            borderRadius="xl"
            bgGradient="linear(to-br, teal.400, cyan.700)"
            color="white"
          >
            <Text fontSize="sm" fontWeight="600" mb={1}>
              Illusion mode
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              Forced perspective
            </Text>
            <Text fontSize="sm" color="whiteAlpha.900">
              Snap back to the front view to recover the Penrose projection.
            </Text>
          </Box>

          <VStack align="stretch" spacing={3}>
            <Box>
              <Text fontSize="sm" mb={2}>
                Rotation speed
              </Text>
              <Slider
                min={0.1}
                max={1.2}
                step={0.05}
                value={rotationSpeed}
                onChange={setRotationSpeed}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Text fontSize="sm" color="whiteAlpha.700" mt={1}>
                {rotationSpeed.toFixed(2)} rad/s
              </Text>
            </Box>
          </VStack>

          <HStack flexWrap="wrap" spacing={3}>
            <Button
              colorScheme={autoRotate ? "orange" : "green"}
              onClick={() => {
                setAutoRotate((value) => !value);
              }}
            >
              {autoRotate ? "Pause Rotation" : "Rotate"}
            </Button>
            <Button
              onClick={() => {
                setSnapVersion((value) => value + 1);
              }}
              {...darkSecondaryButtonProps}
            >
              Snap Illusion View
            </Button>
          </HStack>

          <Button
            variant={showConstruction ? "solid" : "outline"}
            onClick={() => {
              setShowConstruction((value) => !value);
            }}
            {...(showConstruction
              ? {}
              : darkSecondaryButtonProps)}
          >
            {showConstruction ? "Hide Construction" : "Show Construction"}
          </Button>

          <HStack spacing={4} align="stretch">
            <Stat
              p={3}
              bg="whiteAlpha.100"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
            >
              <StatLabel color="whiteAlpha.700">Beams</StatLabel>
              <StatNumber>{beamCount}</StatNumber>
            </Stat>
            <Stat
              p={3}
              bg="whiteAlpha.100"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
            >
              <StatLabel color="whiteAlpha.700">Depth offset</StatLabel>
              <StatNumber>{depthOffset.toFixed(1)}</StatNumber>
            </Stat>
          </HStack>

          <Box
            p={4}
            borderRadius="xl"
            bg="whiteAlpha.100"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
          >
            <Text fontWeight="600" mb={2}>
              Reading the model
            </Text>
            <Text fontSize="sm" color="whiteAlpha.800">
              Green, blue, and amber beams are intentionally misaligned in depth. The
              construction overlay reveals the true 3D connections that the front camera
              hides.
            </Text>
          </Box>

          <Badge colorScheme="purple" alignSelf="start">
            Orbit to break the illusion
          </Badge>
        </VStack>
      </Box>

      <Box flex="1" position="relative">
        <Canvas camera={{ position: [0, 0, 18], fov: 28 }}>
          <PenroseScene
            beams={beams}
            autoRotate={autoRotate}
            rotationSpeed={rotationSpeed}
            showConstruction={showConstruction}
            snapVersion={snapVersion}
          />
        </Canvas>
      </Box>
    </HStack>
  );
};

export default PenroseTriangle3D;
