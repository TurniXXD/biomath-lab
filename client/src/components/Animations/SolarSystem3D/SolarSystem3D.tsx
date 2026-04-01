"use client";

import React, { useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
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

type PlanetDef = {
  name: string;
  color: string;
  radiusEarth: number;
  distanceAu: number;
  periodYears: number;
};

type PlanetMeshProps = {
  planet: PlanetDef;
  elapsedDays: number;
  radiusScale: number;
  showLabels: boolean;
};

const AU_UNITS = 8;
const EARTH_RADIUS_TO_AU = 0.0000426;
const SUN_RADIUS_EARTH = 109.1;

const planets: PlanetDef[] = [
  { name: "Mercury", color: "#b8b3aa", radiusEarth: 0.383, distanceAu: 0.387, periodYears: 0.241 },
  { name: "Venus", color: "#d3b06d", radiusEarth: 0.949, distanceAu: 0.723, periodYears: 0.615 },
  { name: "Earth", color: "#3b82f6", radiusEarth: 1, distanceAu: 1, periodYears: 1 },
  { name: "Mars", color: "#ef4444", radiusEarth: 0.532, distanceAu: 1.524, periodYears: 1.881 },
  { name: "Jupiter", color: "#d6b082", radiusEarth: 11.21, distanceAu: 5.203, periodYears: 11.86 },
  { name: "Saturn", color: "#eabf70", radiusEarth: 9.45, distanceAu: 9.537, periodYears: 29.46 },
  { name: "Uranus", color: "#7dd3fc", radiusEarth: 4.01, distanceAu: 19.191, periodYears: 84.01 },
  { name: "Neptune", color: "#2563eb", radiusEarth: 3.88, distanceAu: 30.07, periodYears: 164.8 },
];

const scaledDistance = (distanceAu: number) => {
  return distanceAu * AU_UNITS;
};

const scaledRadius = (radiusEarth: number, radiusScale: number) => {
  const base = radiusEarth * EARTH_RADIUS_TO_AU * AU_UNITS;
  return Math.max(0.08, base * radiusScale);
};

const OrbitRing = ({ radius }: { radius: number }) => {
  const points = useMemo(() => {
    const curve: [number, number, number][] = [];
    const segments = 160;

    for (let index = 0; index <= segments; index += 1) {
      const angle = (index / segments) * Math.PI * 2;
      curve.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }

    return curve;
  }, [radius]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flat())}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#334155" transparent opacity={0.7} />
    </line>
  );
};

const PlanetMesh = ({ planet, elapsedDays, radiusScale, showLabels }: PlanetMeshProps) => {
  const angle = (elapsedDays / (planet.periodYears * 365.25)) * Math.PI * 2;
  const distance = scaledDistance(planet.distanceAu);
  const position = useMemo(() => {
    return new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
  }, [angle, distance]);

  return (
    <group position={position.toArray()}>
      <mesh>
        <sphereGeometry args={[scaledRadius(planet.radiusEarth, radiusScale), 20, 20]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={planet.color}
          emissiveIntensity={0.16}
          roughness={0.8}
        />
      </mesh>

      {showLabels ? (
        <Html distanceFactor={12}>
          <Box
            px={2}
            py={1}
            bg="blackAlpha.700"
            color="white"
            borderRadius="md"
            fontSize="11px"
            whiteSpace="nowrap"
          >
            {planet.name}
          </Box>
        </Html>
      ) : null}
    </group>
  );
};

const SolarScene = ({
  elapsedDays,
  radiusScale,
  showLabels,
  showOrbits,
}: {
  elapsedDays: number;
  radiusScale: number;
  showLabels: boolean;
  showOrbits: boolean;
}) => {
  const starFieldRef = React.useRef<THREE.Points | null>(null);

  const stars = useMemo(() => {
    const positions: number[] = [];

    for (let index = 0; index < 1200; index += 1) {
      positions.push(
        (Math.random() - 0.5) * 900,
        (Math.random() - 0.5) * 900,
        (Math.random() - 0.5) * 900,
      );
    }

    return new Float32Array(positions);
  }, []);

  useFrame((_, delta) => {
    if (starFieldRef.current) {
      starFieldRef.current.rotation.y += delta * 0.002;
    }
  });

  return (
    <>
      <color attach="background" args={["#020617"]} />
      <ambientLight intensity={0.18} />
      <pointLight position={[0, 0, 0]} intensity={3.8} color="#fde68a" />
      <OrbitControls makeDefault />

      <points ref={starFieldRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={stars.length / 3}
            array={stars}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color="#e2e8f0" size={0.75} sizeAttenuation />
      </points>

      <mesh>
        <sphereGeometry args={[scaledRadius(SUN_RADIUS_EARTH, radiusScale), 40, 40]} />
        <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={1.2} />
      </mesh>

      {showOrbits
        ? planets.map((planet) => {
            return <OrbitRing key={planet.name} radius={scaledDistance(planet.distanceAu)} />;
          })
        : null}

      {planets.map((planet) => {
        return (
          <PlanetMesh
            key={planet.name}
            planet={planet}
            elapsedDays={elapsedDays}
            radiusScale={radiusScale}
            showLabels={showLabels}
          />
        );
      })}
    </>
  );
};

const SolarSystem3D = () => {
  const [playing, setPlaying] = useState(true);
  const [daysPerSecond, setDaysPerSecond] = useState(60);
  const [elapsedDays, setElapsedDays] = useState(0);
  const [radiusScale, setRadiusScale] = useState(220);
  const [showLabels, setShowLabels] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);

  React.useEffect(() => {
    if (!playing) {
      return;
    }

    let frameId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const deltaSeconds = (now - last) / 1000;
      last = now;
      setElapsedDays((value) => value + deltaSeconds * daysPerSecond);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [daysPerSecond, playing]);

  const furthestOrbit = scaledDistance(planets[planets.length - 1].distanceAu);

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
              Solar System (3D)
            </Text>
            <Text fontSize="sm" color="whiteAlpha.800">
              Orbital distances and periods are modeled proportionally. Planet and Sun radii are
              exaggerated so the bodies remain visible at solar-system scale.
            </Text>
          </Box>

          <Box
            p={4}
            borderRadius="xl"
            bgGradient="linear(to-br, orange.400, yellow.600)"
            color="black"
          >
            <Text fontSize="sm" fontWeight="600" mb={1}>
              Scale mode
            </Text>
            <Text fontSize="2xl" fontWeight="bold">
              Distance-accurate
            </Text>
            <Text fontSize="sm">
              Radii use a visibility multiplier of {radiusScale.toFixed(0)}x.
            </Text>
          </Box>

          <HStack flexWrap="wrap" spacing={3}>
            <Button
              colorScheme={playing ? "orange" : "green"}
              onClick={() => {
                setPlaying((value) => !value);
              }}
            >
              {playing ? "Pause" : "Play"}
            </Button>
            <Button
              onClick={() => {
                setElapsedDays(0);
              }}
              {...darkSecondaryButtonProps}
            >
              Reset Epoch
            </Button>
          </HStack>

          <Box>
            <Text fontSize="sm" mb={2}>
              Simulation speed
            </Text>
            <Slider
              min={5}
              max={365}
              step={5}
              value={daysPerSecond}
              onChange={setDaysPerSecond}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Text fontSize="sm" color="whiteAlpha.700" mt={1}>
              {daysPerSecond} simulated days / second
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" mb={2}>
              Radius exaggeration
            </Text>
            <Slider
              min={40}
              max={400}
              step={10}
              value={radiusScale}
              onChange={setRadiusScale}
            >
              <SliderTrack>
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <Text fontSize="sm" color="whiteAlpha.700" mt={1}>
              {radiusScale}x
            </Text>
          </Box>

          <HStack flexWrap="wrap" spacing={3}>
            <Button
              variant={showLabels ? "solid" : "outline"}
              onClick={() => {
                setShowLabels((value) => !value);
              }}
            >
              {showLabels ? "Hide Labels" : "Show Labels"}
            </Button>
            <Button
              variant={showOrbits ? "solid" : "outline"}
              onClick={() => {
                setShowOrbits((value) => !value);
              }}
            >
              {showOrbits ? "Hide Orbits" : "Show Orbits"}
            </Button>
          </HStack>

          <HStack spacing={4} align="stretch">
            <Stat
              p={3}
              bg="whiteAlpha.100"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
            >
              <StatLabel color="whiteAlpha.700">Elapsed</StatLabel>
              <StatNumber>{(elapsedDays / 365.25).toFixed(2)}y</StatNumber>
            </Stat>
            <Stat
              p={3}
              bg="whiteAlpha.100"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
            >
              <StatLabel color="whiteAlpha.700">Outer orbit</StatLabel>
              <StatNumber>{furthestOrbit.toFixed(1)}</StatNumber>
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
              Accuracy note
            </Text>
            <Text fontSize="sm" color="whiteAlpha.800">
              Distances and orbital periods are proportional to the real solar system. True body
              radii at that scale would be too small to see, so the radii are intentionally
              magnified with the control above.
            </Text>
          </Box>

          <Badge colorScheme="blue" alignSelf="start">
            8 planets + Sun
          </Badge>
        </VStack>
      </Box>

      <Box flex="1" position="relative">
        <Canvas camera={{ position: [0, 55, 120], fov: 42 }}>
          <SolarScene
            elapsedDays={elapsedDays}
            radiusScale={radiusScale}
            showLabels={showLabels}
            showOrbits={showOrbits}
          />
        </Canvas>
      </Box>
    </HStack>
  );
};

export default SolarSystem3D;
