"use client";

import { useMemo, useRef, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import { AnimatedSpiral } from "@/components/Animations/SinSinSpiral/SinSinSpiral";

type RotationState = {
  quat: THREE.Quaternion;
};

type DragState = {
  dragging: boolean;
  lastX: number;
  lastY: number;
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

const makeDeltaQuat = (dx: number, dy: number) => {
  // Simple “trackball-ish” mapping:
  // - horizontal drag -> yaw (Y axis)
  // - vertical drag -> pitch (X axis)
  const yaw = dx * 0.01;
  const pitch = dy * 0.01;

  const qYaw = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    yaw,
  );
  const qPitch = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(1, 0, 0),
    pitch,
  );

  // Apply pitch then yaw (feel free to swap to taste)
  return qYaw.multiply(qPitch);
};

type MainSceneProps = {
  rotation: RotationState;
};

const MainScene = ({ rotation }: MainSceneProps) => {
  const groupRef = useRef<THREE.Group | null>(null);

  useFrame(() => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.quaternion.copy(rotation.quat);
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} />

      <gridHelper args={[10, 10]} />
      <axesHelper args={[3]} />

      {/* Everything that should rotate goes inside this group */}
      <group ref={groupRef}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial />
        </mesh>

        {/* <mesh ref={cubeRef} position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
      </mesh> */}

        <AnimatedSpiral />
      </group>

      <OrbitControls makeDefault />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport />
      </GizmoHelper>
    </>
  );
};
type MiniCubeProps = {
  rotation: RotationState;
  onRotate: (next: THREE.Quaternion) => void;
};

const MiniCube = ({ rotation, onRotate }: MiniCubeProps) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const dragRef = useRef<DragState>({ dragging: false, lastX: 0, lastY: 0 });

  // Keep mini cube visually in sync with the shared rotation
  useFrame(() => {
    if (!meshRef.current) {
      return;
    }

    meshRef.current.quaternion.copy(rotation.quat);
  });

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    dragRef.current.dragging = true;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    // capture pointer so dragging continues even if you leave the mesh
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    dragRef.current.dragging = false;

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!dragRef.current.dragging) {
      return;
    }

    e.stopPropagation();

    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;

    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    const deltaQ = makeDeltaQuat(dx, dy);

    // next = delta * current
    const next = deltaQ.multiply(rotation.quat.clone()).normalize();
    onRotate(next);
  };

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 3]} intensity={0.7} />

      {/* Keep camera stable in this mini view */}
      <axesHelper args={[1.5]} />

      <mesh
        ref={meshRef}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial />
      </mesh>
    </>
  );
};

const quatToEulerDeg = (q: THREE.Quaternion) => {
  const e = new THREE.Euler().setFromQuaternion(q, "YXZ");
  const radToDeg = 180 / Math.PI;

  return {
    x: clamp(e.x * radToDeg, -180, 180),
    y: clamp(e.y * radToDeg, -180, 180),
    z: clamp(e.z * radToDeg, -180, 180),
  };
};

export const CoordinateSystem3D = () => {
  const [rotation, setRotation] = useState<RotationState>(() => ({
    quat: new THREE.Quaternion(),
  }));

  const euler = useMemo(() => {
    return quatToEulerDeg(rotation.quat);
  }, [rotation.quat]);

  const handleRotate = (next: THREE.Quaternion) => {
    setRotation({ quat: next });
  };

  return (
    <Box
      position="relative"
      w="100%"
      h="calc(100vh - 80px)"
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
    >
      {/* Main canvas */}
      <Canvas camera={{ position: [4, 3, 6], fov: 50 }}>
        <MainScene rotation={rotation} />
      </Canvas>

      {/* Mini cube overlay */}
      <Box
        position="absolute"
        top={3}
        right={3}
        w="220px"
        h="220px"
        borderWidth="1px"
        borderRadius="xl"
        overflow="hidden"
        bg="white"
        boxShadow="md"
      >
        <Canvas camera={{ position: [2.2, 2.2, 2.2], fov: 50 }}>
          <MiniCube rotation={rotation} onRotate={handleRotate} />
        </Canvas>

        <Box
          position="absolute"
          left={2}
          bottom={2}
          bg="whiteAlpha.800"
          px={2}
          py={1}
          borderRadius="md"
        >
          <Text fontSize="xs">
            rot: x {euler.x.toFixed(0)}° · y {euler.y.toFixed(0)}° · z{" "}
            {euler.z.toFixed(0)}°
          </Text>
          <Text fontSize="xs" opacity={0.7}>
            Drag cube to rotate
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default CoordinateSystem3D;
