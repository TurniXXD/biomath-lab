"use client";

import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Box,
  Card,
  CardBody,
  Heading,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import * as THREE from "three";

type TreeCrownParams = {
  totalHeight: number;
  baseSectionHeight: number;
  coneSectionHeight: number;
  topSectionHeight: number;
  baseRadiusX: number;
  baseRadiusY: number;
  waistRadiusFactor: number;
  topRadiusFactor: number;
  radialSegments: number;
  heightSegments: number;
};

type TreeLikeEllipticCrownProps = {
  totalHeight?: number;
  baseSectionHeight?: number;
  coneSectionHeight?: number;
  topSectionHeight?: number;
  baseRadiusX?: number;
  baseRadiusY?: number;
  waistRadiusFactor?: number;
  topRadiusFactor?: number;
  radialSegments?: number;
  heightSegments?: number;
  showSurface?: boolean;
  showWireframe?: boolean;
  autoRotate?: boolean;
};

const clamp01 = (value: number) => {
  return Math.max(0, Math.min(1, value));
};

const lerp = (a: number, b: number, t: number) => {
  return a + (b - a) * t;
};

const createTreeLikeCrownGeometry = ({
  totalHeight,
  baseSectionHeight,
  coneSectionHeight,
  topSectionHeight,
  baseRadiusX,
  baseRadiusY,
  waistRadiusFactor,
  topRadiusFactor,
  radialSegments,
  heightSegments,
}: TreeCrownParams) => {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const baseEnd = baseSectionHeight;
  const coneEnd = baseSectionHeight + coneSectionHeight;
  const topEnd = baseSectionHeight + coneSectionHeight + topSectionHeight;

  const safeTotalHeight = Math.max(totalHeight, topEnd, 0.001);

  const getRadiusScale = (z: number) => {
    if (z <= baseEnd) {
      const t = clamp01(z / Math.max(baseSectionHeight, 0.0001));

      // Bottom elliptic paraboloid:
      // starts narrow near trunk, expands upward
      return 0.12 + (1 - 0.12) * (t * t);
    }

    if (z <= coneEnd) {
      const t = clamp01((z - baseEnd) / Math.max(coneSectionHeight, 0.0001));

      // Middle taper:
      // decreases from full radius to narrower waist
      return lerp(1, waistRadiusFactor, t);
    }

    const t = clamp01((z - coneEnd) / Math.max(topSectionHeight, 0.0001));

    // Top flipped elliptic paraboloid:
    // starts at waist and expands again upward, but with smooth dome-like profile
    return (
      waistRadiusFactor +
      (topRadiusFactor - waistRadiusFactor) * (1 - (1 - t) * (1 - t))
    );
  };

  for (let yIndex = 0; yIndex <= heightSegments; yIndex += 1) {
    const v = yIndex / heightSegments;
    const z = v * safeTotalHeight;
    const radiusScale = getRadiusScale(z);

    for (let xIndex = 0; xIndex <= radialSegments; xIndex += 1) {
      const u = xIndex / radialSegments;
      const theta = u * Math.PI * 2;

      const x = Math.cos(theta) * baseRadiusX * radiusScale;
      const y = Math.sin(theta) * baseRadiusY * radiusScale;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let yIndex = 0; yIndex < heightSegments; yIndex += 1) {
    for (let xIndex = 0; xIndex < radialSegments; xIndex += 1) {
      const a = yIndex * (radialSegments + 1) + xIndex;
      const b = a + radialSegments + 1;
      const c = b + 1;
      const d = a + 1;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  return geometry;
};

type CrownMeshProps = {
  totalHeight: number;
  baseSectionHeight: number;
  coneSectionHeight: number;
  topSectionHeight: number;
  baseRadiusX: number;
  baseRadiusY: number;
  waistRadiusFactor: number;
  topRadiusFactor: number;
  radialSegments: number;
  heightSegments: number;
  showSurface: boolean;
  showWireframe: boolean;
};

const CrownMesh = ({
  totalHeight,
  baseSectionHeight,
  coneSectionHeight,
  topSectionHeight,
  baseRadiusX,
  baseRadiusY,
  waistRadiusFactor,
  topRadiusFactor,
  radialSegments,
  heightSegments,
  showSurface,
  showWireframe,
}: CrownMeshProps) => {
  const geometry = useMemo(() => {
    return createTreeLikeCrownGeometry({
      totalHeight,
      baseSectionHeight,
      coneSectionHeight,
      topSectionHeight,
      baseRadiusX,
      baseRadiusY,
      waistRadiusFactor,
      topRadiusFactor,
      radialSegments,
      heightSegments,
    });
  }, [
    totalHeight,
    baseSectionHeight,
    coneSectionHeight,
    topSectionHeight,
    baseRadiusX,
    baseRadiusY,
    waistRadiusFactor,
    topRadiusFactor,
    radialSegments,
    heightSegments,
  ]);

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {showSurface ? (
        <mesh geometry={geometry}>
          <meshStandardMaterial
            transparent
            opacity={0.45}
            roughness={0.5}
            metalness={0.05}
          />
        </mesh>
      ) : null}

      {showWireframe ? (
        <mesh geometry={geometry}>
          <meshBasicMaterial wireframe />
        </mesh>
      ) : null}
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
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm">{label}</Text>
        <Text fontSize="sm" fontWeight="600">
          {value.toFixed(step < 1 ? 2 : 0)}
        </Text>
      </HStack>

      <Slider value={value} min={min} max={max} step={step} onChange={onChange}>
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </Box>
  );
};

const EllipticParaboloidTree = () => {
  const [totalHeight, setTotalHeight] = useState(10);
  const [baseSectionHeight, setBaseSectionHeight] = useState(2.8);
  const [coneSectionHeight, setConeSectionHeight] = useState(4.2);
  const [topSectionHeight, setTopSectionHeight] = useState(3);
  const [baseRadiusX, setBaseRadiusX] = useState(3.2);
  const [baseRadiusY, setBaseRadiusY] = useState(2.2);
  const [waistRadiusFactor, setWaistRadiusFactor] = useState(0.45);
  const [topRadiusFactor, setTopRadiusFactor] = useState(1.15);
  const [radialSegments, setRadialSegments] = useState(96);
  const [heightSegments, setHeightSegments] = useState(80);
  const [showSurface, setShowSurface] = useState(true);
  const [showWireframe, setShowWireframe] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  return (
    <Stack spacing={6} w="full">
      <Card>
        <CardBody>
          <Heading size="md" mb={3}>
            Tree-Like Elliptic Crown Surface
          </Heading>
          <Text fontSize="sm" color="gray.600">
            Bottom elliptic paraboloid → tapered middle cone → top flipped
            elliptic paraboloid.
          </Text>
        </CardBody>
      </Card>

      <Stack
        direction={{ base: "column", xl: "row" }}
        spacing={6}
        align="stretch"
      >
        <Card minW={{ base: "full", xl: "380px" }}>
          <CardBody>
            <Stack spacing={5}>
              <SliderRow
                label="Total height"
                value={totalHeight}
                min={4}
                max={20}
                step={0.1}
                onChange={setTotalHeight}
              />

              <SliderRow
                label="Base paraboloid height"
                value={baseSectionHeight}
                min={0.5}
                max={8}
                step={0.1}
                onChange={setBaseSectionHeight}
              />

              <SliderRow
                label="Middle cone height"
                value={coneSectionHeight}
                min={0.5}
                max={10}
                step={0.1}
                onChange={setConeSectionHeight}
              />

              <SliderRow
                label="Top paraboloid height"
                value={topSectionHeight}
                min={0.5}
                max={8}
                step={0.1}
                onChange={setTopSectionHeight}
              />

              <SliderRow
                label="Base radius X"
                value={baseRadiusX}
                min={0.5}
                max={8}
                step={0.1}
                onChange={setBaseRadiusX}
              />

              <SliderRow
                label="Base radius Y"
                value={baseRadiusY}
                min={0.5}
                max={8}
                step={0.1}
                onChange={setBaseRadiusY}
              />

              <SliderRow
                label="Waist radius factor"
                value={waistRadiusFactor}
                min={0.1}
                max={1}
                step={0.01}
                onChange={setWaistRadiusFactor}
              />

              <SliderRow
                label="Top radius factor"
                value={topRadiusFactor}
                min={0.2}
                max={2}
                step={0.01}
                onChange={setTopRadiusFactor}
              />

              <SliderRow
                label="Radial segments"
                value={radialSegments}
                min={12}
                max={160}
                step={1}
                onChange={setRadialSegments}
              />

              <SliderRow
                label="Height segments"
                value={heightSegments}
                min={8}
                max={160}
                step={1}
                onChange={setHeightSegments}
              />

              <HStack justify="space-between">
                <Text fontSize="sm">Surface</Text>
                <Switch
                  isChecked={showSurface}
                  onChange={(event) => {
                    setShowSurface(event.target.checked);
                  }}
                />
              </HStack>

              <HStack justify="space-between">
                <Text fontSize="sm">Wireframe</Text>
                <Switch
                  isChecked={showWireframe}
                  onChange={(event) => {
                    setShowWireframe(event.target.checked);
                  }}
                />
              </HStack>

              <HStack justify="space-between">
                <Text fontSize="sm">Auto rotate</Text>
                <Switch
                  isChecked={autoRotate}
                  onChange={(event) => {
                    setAutoRotate(event.target.checked);
                  }}
                />
              </HStack>
            </Stack>
          </CardBody>
        </Card>

        <Box
          flex="1"
          minH="720px"
          borderWidth="1px"
          borderRadius="xl"
          overflow="hidden"
        >
          <Canvas camera={{ position: [10, -14, 8], fov: 40 }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[8, 10, 12]} intensity={1.2} />
            <directionalLight position={[-6, -8, 7]} intensity={0.45} />

            <primitive object={new THREE.AxesHelper(5)} />
            <primitive
              object={new THREE.GridHelper(20, 20)}
              rotation={[Math.PI / 2, 0, 0]}
            />

            <CrownMesh
              totalHeight={totalHeight}
              baseSectionHeight={baseSectionHeight}
              coneSectionHeight={coneSectionHeight}
              topSectionHeight={topSectionHeight}
              baseRadiusX={baseRadiusX}
              baseRadiusY={baseRadiusY}
              waistRadiusFactor={waistRadiusFactor}
              topRadiusFactor={topRadiusFactor}
              radialSegments={radialSegments}
              heightSegments={heightSegments}
              showSurface={showSurface}
              showWireframe={showWireframe}
            />

            <OrbitControls autoRotate={autoRotate} />
          </Canvas>
        </Box>
      </Stack>
    </Stack>
  );
};

export default EllipticParaboloidTree;
