"use client";

import { useEffect, useMemo } from "react";
import { Box, HStack, Tag, Text, VStack } from "@chakra-ui/react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PdbStructure } from "@/utils/parsers/pdb";

const elementPalette: Record<string, string> = {
  H: "#e2e8f0",
  C: "#94a3b8",
  N: "#60a5fa",
  O: "#f87171",
  S: "#fbbf24",
  P: "#f97316",
  FE: "#fb7185",
  MG: "#c084fc",
  CA: "#34d399",
  ZN: "#a78bfa",
  CL: "#86efac",
  BR: "#f59e0b",
};

const colorForElement = (element: string) => {
  return elementPalette[element] ?? "#cbd5e1";
};

const BackboneLines = ({ structure }: { structure: PdbStructure }) => {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    let previous: typeof structure.atoms[number] | null = null;

    for (const atom of structure.atoms) {
      const isBackboneAtom = atom.atomName === "CA" || atom.atomName === "P";

      if (!isBackboneAtom) {
        continue;
      }

      if (
        previous &&
        previous.chainId === atom.chainId &&
        atom.residueSeq - previous.residueSeq <= 1
      ) {
        positions.push(
          previous.x,
          previous.y,
          previous.z,
          atom.x,
          atom.y,
          atom.z,
        );
      }

      previous = atom;
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    return buffer;
  }, [structure]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#38bdf8" transparent opacity={0.55} />
    </lineSegments>
  );
};

const AtomCloud = ({ structure }: { structure: PdbStructure }) => {
  const geometry = useMemo(() => {
    const positions = new Float32Array(structure.atoms.length * 3);
    const colors = new Float32Array(structure.atoms.length * 3);

    structure.atoms.forEach((atom, index) => {
      const color = new THREE.Color(colorForElement(atom.element));
      const offset = index * 3;

      positions[offset] = atom.x;
      positions[offset + 1] = atom.y;
      positions[offset + 2] = atom.z;
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
    });

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    return buffer;
  }, [structure]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.45}
        sizeAttenuation
        transparent
        opacity={0.95}
      />
    </points>
  );
};

const CameraRig = ({ structure }: { structure: PdbStructure }) => {
  const { camera } = useThree();
  const target = useMemo<[number, number, number]>(() => {
    return [structure.center[0], structure.center[1], structure.center[2]];
  }, [structure.center]);

  useEffect(() => {
    const [cx, cy, cz] = structure.center;
    const distance = Math.max(structure.radius * 2.6, 12);

    camera.position.set(cx + distance, cy + distance * 0.4, cz + distance);
    camera.near = 0.1;
    camera.far = distance * 10;
    camera.lookAt(cx, cy, cz);
    camera.updateProjectionMatrix();
  }, [camera, structure]);

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      target={target}
    />
  );
};

export const PdbViewer = ({ structure }: { structure: PdbStructure }) => {
  const elementCounts = useMemo(() => {
    const counts = new Map<string, number>();

    structure.atoms.forEach((atom) => {
      counts.set(atom.element, (counts.get(atom.element) ?? 0) + 1);
    });

    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [structure]);

  return (
    <VStack align="stretch" spacing={4}>
      <HStack spacing={2} flexWrap="wrap">
        <Tag colorScheme="blue">{structure.atoms.length} atoms</Tag>
        <Tag colorScheme="green">{structure.residues} residues</Tag>
        <Tag colorScheme="purple">{structure.chains.length} chains</Tag>
        {structure.chains.map((chainId) => {
          return (
            <Tag key={chainId} variant="subtle">
              Chain {chainId}
            </Tag>
          );
        })}
      </HStack>

      <Box
        h={{ base: "420px", lg: "640px" }}
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="2xl"
        overflow="hidden"
        bg="linear-gradient(180deg, #020617 0%, #0f172a 100%)"
        boxShadow="xl"
      >
        <Canvas camera={{ fov: 45 }}>
          <color attach="background" args={["#020617"]} />
          <fog attach="fog" args={["#020617", structure.radius * 3, structure.radius * 6]} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[12, 14, 10]} intensity={1.2} />
          <directionalLight position={[-10, -6, -4]} intensity={0.35} />
          <BackboneLines structure={structure} />
          <AtomCloud structure={structure} />
          <gridHelper
            args={[Math.max(structure.radius * 3, 20), 20, "#1e293b", "#0f172a"]}
            position={[structure.center[0], structure.center[1] - structure.radius * 1.15, structure.center[2]]}
          />
          <CameraRig structure={structure} />
        </Canvas>
      </Box>

      <HStack align="start" spacing={3} flexWrap="wrap">
        {elementCounts.map(([element, count]) => {
          return (
            <HStack
              key={element}
              spacing={2}
              px={3}
              py={2}
              bg="white"
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="full"
            >
              <Box
                boxSize="10px"
                borderRadius="full"
                bg={colorForElement(element)}
              />
              <Text fontSize="sm">
                {element}: {count}
              </Text>
            </HStack>
          );
        })}
      </HStack>
    </VStack>
  );
};

export default PdbViewer;
