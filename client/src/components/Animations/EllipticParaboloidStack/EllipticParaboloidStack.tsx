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
import { useTexture } from "@react-three/drei";
import { SliderRow } from "@/components/UI/Slider/Slider";

type EllipticParaboloidStackProps = {
  layerCount?: number;
  pointsPerRing?: number;
  ringCount?: number;
  baseRadiusX?: number;
  baseRadiusY?: number;
  radiusDecay?: number;
  layerSpacing?: number;
  curvature?: number;
  showWireframe?: boolean;
  showSurface?: boolean;
  autoRotate?: boolean;
  textureUrl?: string;
  textureRepeatX?: number;
  textureRepeatY?: number;
};

type EllipticParaboloidStackSceneProps = Required<EllipticParaboloidStackProps>;

type ParaboloidGeometryParams = {
  radiusX: number;
  radiusY: number;
  height: number;
  radialSegments: number;
  heightSegments: number;
};

const createEllipticParaboloidGeometry = ({
  radiusX,
  radiusY,
  height,
  radialSegments,
  heightSegments,
}: ParaboloidGeometryParams) => {
  const positions: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  for (let yIndex = 0; yIndex <= heightSegments; yIndex += 1) {
    const v = yIndex / heightSegments;
    const ringScale = v;

    for (let xIndex = 0; xIndex <= radialSegments; xIndex += 1) {
      const u = xIndex / radialSegments;
      const theta = u * Math.PI * 2;

      const x = Math.cos(theta) * radiusX * ringScale;
      const y = Math.sin(theta) * radiusY * ringScale;
      const z = height * ringScale * ringScale;

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

  const normalAttribute = geometry.getAttribute("normal");

  for (let i = 0; i < normalAttribute.count; i += 1) {
    normals.push(
      normalAttribute.getX(i),
      normalAttribute.getY(i),
      normalAttribute.getZ(i),
    );
  }

  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));

  return geometry;
};

type LayerMeshProps = {
  radiusX: number;
  radiusY: number;
  zOffset: number;
  curvature: number;
  radialSegments: number;
  heightSegments: number;
  wireframe: boolean;
  showSurface: boolean;
  textureUrl?: string;
  textureRepeatX?: number;
  textureRepeatY?: number;
};

const LayerMesh = ({
  radiusX,
  radiusY,
  zOffset,
  curvature,
  radialSegments,
  heightSegments,
  wireframe,
  showSurface,
  textureUrl = "/textures/tree-bark.jpg",
  textureRepeatX = 2,
  textureRepeatY = 1,
}: LayerMeshProps) => {
  const geometry = useMemo(() => {
    return createEllipticParaboloidGeometry({
      radiusX,
      radiusY,
      height: curvature,
      radialSegments,
      heightSegments,
    });
  }, [radiusX, radiusY, curvature, radialSegments, heightSegments]);

  const texture = useTexture(textureUrl);

  useMemo(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(textureRepeatX, textureRepeatY);
    texture.needsUpdate = true;
  }, [texture, textureRepeatX, textureRepeatY]);

  return (
    <group position={[0, 0, zOffset]}>
      {showSurface ? (
        <mesh geometry={geometry}>
          <meshStandardMaterial
            map={texture}
            transparent
            opacity={0.95}
            roughness={0.8}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}

      {wireframe ? (
        <mesh geometry={geometry}>
          <meshBasicMaterial wireframe />
        </mesh>
      ) : null}
    </group>
  );
};

const AxesHelper = () => {
  return <primitive object={new THREE.AxesHelper(10)} />;
};

const GridHelper = () => {
  return (
    <primitive
      object={new THREE.GridHelper(20, 20)}
      rotation={[Math.PI / 2, 0, 0]}
    />
  );
};

const EllipticParaboloidStackScene = ({
  layerCount,
  pointsPerRing,
  ringCount,
  baseRadiusX,
  baseRadiusY,
  radiusDecay,
  layerSpacing,
  curvature,
  showWireframe,
  showSurface,
  autoRotate,
  textureUrl,
  textureRepeatX,
  textureRepeatY,
}: EllipticParaboloidStackSceneProps) => {
  const layers = useMemo(() => {
    return Array.from({ length: layerCount }, (_, index) => {
      const scale = Math.pow(radiusDecay, index);

      return {
        radiusX: baseRadiusX * scale,
        radiusY: baseRadiusY * scale,
        zOffset: index * layerSpacing,
      };
    });
  }, [layerCount, baseRadiusX, baseRadiusY, radiusDecay, layerSpacing]);

  return (
    <Canvas camera={{ position: [8, -12, 10], fov: 45 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[8, 8, 10]} intensity={1.2} />
      <directionalLight position={[-6, -6, 8]} intensity={0.5} />

      <AxesHelper />
      <GridHelper />

      {layers.map((layer, index) => {
        return (
          <LayerMesh
            key={index}
            radiusX={layer.radiusX}
            radiusY={layer.radiusY}
            zOffset={layer.zOffset}
            curvature={curvature}
            radialSegments={pointsPerRing}
            heightSegments={ringCount}
            wireframe={showWireframe}
            showSurface={showSurface}
            textureUrl={textureUrl}
            textureRepeatX={textureRepeatX}
            textureRepeatY={textureRepeatY}
          />
        );
      })}

      <OrbitControls autoRotate={autoRotate} />
    </Canvas>
  );
};

const EllipticParaboloidStack = () => {
  const [layerCount, setLayerCount] = useState(6);
  const [baseRadiusX, setBaseRadiusX] = useState(4);
  const [baseRadiusY, setBaseRadiusY] = useState(2.5);
  const [radiusDecay, setRadiusDecay] = useState(0.82);
  const [layerSpacing, setLayerSpacing] = useState(2);
  const [curvature, setCurvature] = useState(2.8);
  const [pointsPerRing, setPointsPerRing] = useState(64);
  const [ringCount, setRingCount] = useState(28);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showSurface, setShowSurface] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const textureRepeatX = 2;
  const textureRepeatY = 1;

  return (
    <Stack spacing={6} w="full">
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>
            Elliptic Paraboloid Stack
          </Heading>

          <Text fontSize="sm" color="gray.600">
            Multiple elliptic paraboloids stacked along Z, shrinking with each
            higher layer.
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
                label="Layer count"
                value={layerCount}
                min={1}
                max={20}
                step={1}
                onChange={setLayerCount}
              />

              <SliderRow
                label="Base radius X"
                value={baseRadiusX}
                min={0.5}
                max={10}
                step={0.1}
                onChange={setBaseRadiusX}
              />

              <SliderRow
                label="Base radius Y"
                value={baseRadiusY}
                min={0.5}
                max={10}
                step={0.1}
                onChange={setBaseRadiusY}
              />

              <SliderRow
                label="Radius decay"
                value={radiusDecay}
                min={0.4}
                max={0.98}
                step={0.01}
                onChange={setRadiusDecay}
              />

              <SliderRow
                label="Layer spacing"
                value={layerSpacing}
                min={0.5}
                max={6}
                step={0.1}
                onChange={setLayerSpacing}
              />

              <SliderRow
                label="Curvature / height"
                value={curvature}
                min={0.5}
                max={8}
                step={0.1}
                onChange={setCurvature}
              />

              <SliderRow
                label="Radial segments"
                value={pointsPerRing}
                min={8}
                max={128}
                step={1}
                onChange={setPointsPerRing}
              />

              <SliderRow
                label="Height segments"
                value={ringCount}
                min={4}
                max={64}
                step={1}
                onChange={setRingCount}
              />

              <HStack justify="space-between">
                <Text fontSize="sm">Wireframe</Text>
                <Switch
                  isChecked={showWireframe}
                  onChange={(event) => setShowWireframe(event.target.checked)}
                />
              </HStack>

              <HStack justify="space-between">
                <Text fontSize="sm">Surface</Text>
                <Switch
                  isChecked={showSurface}
                  onChange={(event) => setShowSurface(event.target.checked)}
                />
              </HStack>

              <HStack justify="space-between">
                <Text fontSize="sm">Auto rotate</Text>
                <Switch
                  isChecked={autoRotate}
                  onChange={(event) => setAutoRotate(event.target.checked)}
                />
              </HStack>
            </Stack>
          </CardBody>
        </Card>

        <Box
          flex="1"
          minH="700px"
          borderRadius="xl"
          overflow="hidden"
          borderWidth="1px"
        >
          <EllipticParaboloidStackScene
            layerCount={layerCount}
            pointsPerRing={pointsPerRing}
            ringCount={ringCount}
            baseRadiusX={baseRadiusX}
            baseRadiusY={baseRadiusY}
            radiusDecay={radiusDecay}
            layerSpacing={layerSpacing}
            curvature={curvature}
            showWireframe={showWireframe}
            showSurface={showSurface}
            autoRotate={autoRotate}
            textureUrl="/textures/adam.jpeg"
            textureRepeatX={textureRepeatX}
            textureRepeatY={textureRepeatY}
          />
        </Box>
      </Stack>
    </Stack>
  );
};

export default EllipticParaboloidStack;
