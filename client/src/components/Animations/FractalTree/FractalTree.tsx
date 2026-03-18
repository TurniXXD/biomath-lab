// "use client";

// import React, { useMemo } from "react";
// import { Canvas } from "@react-three/fiber";
// import { OrbitControls } from "@react-three/drei";

// type BranchProps = {
//   depth: number;
//   length: number;
//   thickness: number;
//   tilt: number; // formerly "angle"
//   decay: number;
//   spread: number; // how much around the circle (2π/3 for a third of a circle)
//   yawOffset?: number; // optional, to rotate each level a bit
// };

// const Branch = ({
//   depth,
//   length,
//   thickness,
//   tilt,
//   decay,
//   spread,
//   yawOffset = 0,
// }: BranchProps) => {
//   const nextLength = length * decay;
//   const nextThickness = thickness * decay;

//   const position = useMemo<[number, number, number]>(() => {
//     return [0, length / 2, 0];
//   }, [length]);

//   const childCount = 3;

//   return (
//     <group>
//       <mesh position={position}>
//         <cylinderGeometry args={[thickness, thickness, length, 8]} />
//         <meshStandardMaterial color="saddlebrown" />
//       </mesh>

//       {depth > 0 && (
//         <group position={[0, length, 0]}>
//           {Array.from({ length: childCount }).map((_, i) => {
//             // distribute 3 branches around an arc that is 1/3 of a circle
//             // if you want full 360°, set spread = Math.PI * 2
//             const yaw = yawOffset + (i * spread) / childCount;

//             // give them slightly different tilts so it's not symmetric
//             const tiltZ = i === 0 ? tilt : i === 1 ? -tilt : tilt * 0.6;

//             return (
//               <group key={i} rotation={[0, yaw, tiltZ]}>
//                 <Branch
//                   depth={depth - 1}
//                   length={nextLength}
//                   thickness={nextThickness}
//                   tilt={tilt}
//                   decay={decay}
//                   spread={spread}
//                   // rotate each level a bit to avoid stacked "fans"
//                   yawOffset={yawOffset + spread / 6}
//                 />
//               </group>
//             );
//           })}
//         </group>
//       )}
//     </group>
//   );
// };

// const FractalTree = () => {
//   return (
//     <Canvas
//       camera={{ position: [0, 5, 15], fov: 50 }}
//       style={{ height: "100vh", width: "100%" }}
//     >
//       <ambientLight intensity={0.6} />
//       <directionalLight position={[10, 10, 5]} intensity={1} />
//       <OrbitControls />
//       <axesHelper args={[5]} />

//       <Branch
//         depth={6}
//         length={2.5}
//         thickness={0.15}
//         tilt={Math.PI / 6}
//         decay={0.7}
//         spread={(Math.PI * 2) / 3} // ✅ one third of a circle (120°)
//       />
//     </Canvas>
//   );
// };

// export default FractalTree;

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Box,
  HStack,
  VStack,
  Text,
  Table,
  Tbody,
  Tr,
  Td,
} from "@chakra-ui/react";
import * as THREE from "three";

type TreeParams = {
  depth: number;
  length: number;
  thickness: number;
  tilt: number;
  decay: number;
  spread: number;
};

type Node = {
  id: number;
  parentId: number | null;
  depth: number;

  length: number;
  thickness: number;

  // local transform from parent tip
  yaw: number;
  tiltZ: number;

  // computed world data (for display + positioning)
  start: THREE.Vector3;
  end: THREE.Vector3;

  // for ordering / stats
  order: number;
};

const vecToArr = (v: THREE.Vector3): [number, number, number] => {
  return [v.x, v.y, v.z];
};

const generateTree = (p: TreeParams) => {
  const nodes: Node[] = [];
  let idCounter = 0;

  const childCount = 3;

  const walk = (args: {
    parentId: number | null;
    depth: number;
    length: number;
    thickness: number;
    yawOffset: number;
    start: THREE.Vector3;
    dir: THREE.Vector3; // normalized direction
    order: { v: number };
  }) => {
    const { parentId, depth, length, thickness, yawOffset, start, dir, order } =
      args;

    const end = start.clone().add(dir.clone().multiplyScalar(length));
    const id = idCounter++;

    nodes.push({
      id,
      parentId,
      depth,
      length,
      thickness,
      yaw: yawOffset,
      tiltZ: 0,
      start: start.clone(),
      end: end.clone(),
      order: order.v++,
    });

    if (depth <= 0) {
      return;
    }

    const nextLength = length * p.decay;
    const nextThickness = thickness * p.decay;

    // Build a local basis: up = dir, pick any "right" and "forward" perpendicular
    const up = dir.clone().normalize();
    const arbitrary =
      Math.abs(up.y) < 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0);
    const right = new THREE.Vector3().crossVectors(up, arbitrary).normalize();
    const forward = new THREE.Vector3().crossVectors(right, up).normalize();

    // children: yaw distributed across "spread" (e.g. 120°), and tilt applied away from up
    for (let i = 0; i < childCount; i += 1) {
      const yaw = yawOffset + (i * p.spread) / childCount;
      const tiltZ = i === 0 ? p.tilt : i === 1 ? -p.tilt : p.tilt * 0.6;

      // Rotate a direction around the up axis (yaw), then tilt around the "right" axis
      const yawQuat = new THREE.Quaternion().setFromAxisAngle(up, yaw);
      const tiltedRight = right.clone().applyQuaternion(yawQuat).normalize();

      const tiltQuat = new THREE.Quaternion().setFromAxisAngle(
        tiltedRight,
        tiltZ,
      );
      const childDir = up.clone().applyQuaternion(tiltQuat).normalize();

      walk({
        parentId: id,
        depth: depth - 1,
        length: nextLength,
        thickness: nextThickness,
        yawOffset: yawOffset + p.spread / 6, // subtle twist per level
        start: end,
        dir: childDir,
        order,
      });
    }
  };

  walk({
    parentId: null,
    depth: p.depth,
    length: p.length,
    thickness: p.thickness,
    yawOffset: 0,
    start: new THREE.Vector3(0, 0, 0),
    dir: new THREE.Vector3(0, 1, 0),
    order: { v: 0 },
  });

  return nodes;
};

type BranchMeshProps = {
  node: Node;
  isActive: boolean;
};

const BranchMesh = ({ node, isActive }: BranchMeshProps) => {
  // position cylinder between start and end
  const start = node.start;
  const end = node.end;

  const mid = useMemo(() => {
    return start.clone().add(end).multiplyScalar(0.5);
  }, [start, end]);

  const dir = useMemo(() => {
    return end.clone().sub(start);
  }, [start, end]);

  const length = dir.length();

  const quat = useMemo(() => {
    // align cylinder (Y axis) to direction
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return q;
  }, [dir]);

  return (
    <mesh position={vecToArr(mid)} quaternion={quat}>
      <cylinderGeometry args={[node.thickness, node.thickness, length, 8]} />
      <meshStandardMaterial
        color={isActive ? "#ffd54a" : "saddlebrown"}
        emissive={isActive ? "#ffd54a" : "#000000"}
        emissiveIntensity={isActive ? 0.6 : 0}
      />
    </mesh>
  );
};

const StatsTable = ({
  activeNode,
  visibleCount,
  total,
}: {
  activeNode: Node | null;
  visibleCount: number;
  total: number;
}) => {
  if (!activeNode) {
    return (
      <Box p={4}>
        <Text fontWeight="bold">Tree</Text>
        <Text fontSize="sm" opacity={0.8}>
          No active node
        </Text>
      </Box>
    );
  }

  const dx = activeNode.end.x - activeNode.start.x;
  const dy = activeNode.end.y - activeNode.start.y;
  const dz = activeNode.end.z - activeNode.start.z;

  const segLen = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return (
    <Box p={4}>
      <Text fontWeight="bold" mb={2}>
        Growth step
      </Text>

      <Text fontSize="sm" opacity={0.8} mb={3}>
        Visible: {visibleCount} / {total}
      </Text>

      <Table size="sm" variant="simple">
        <Tbody>
          <Tr>
            <Td>Active id</Td>
            <Td isNumeric>{activeNode.id}</Td>
          </Tr>
          <Tr>
            <Td>Depth</Td>
            <Td isNumeric>{activeNode.depth}</Td>
          </Tr>
          <Tr>
            <Td>Length</Td>
            <Td isNumeric>{activeNode.length.toFixed(3)}</Td>
          </Tr>
          <Tr>
            <Td>Thickness</Td>
            <Td isNumeric>{activeNode.thickness.toFixed(3)}</Td>
          </Tr>
          <Tr>
            <Td>Segment length</Td>
            <Td isNumeric>{segLen.toFixed(3)}</Td>
          </Tr>
          <Tr>
            <Td>Start</Td>
            <Td isNumeric>
              ({activeNode.start.x.toFixed(2)}, {activeNode.start.y.toFixed(2)},{" "}
              {activeNode.start.z.toFixed(2)})
            </Td>
          </Tr>
          <Tr>
            <Td>End</Td>
            <Td isNumeric>
              ({activeNode.end.x.toFixed(2)}, {activeNode.end.y.toFixed(2)},{" "}
              {activeNode.end.z.toFixed(2)})
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </Box>
  );
};

const FractalTree = () => {
  const params = useMemo<TreeParams>(() => {
    return {
      depth: 6,
      length: 2.5,
      thickness: 0.15,
      tilt: Math.PI / 6,
      decay: 0.7,
      spread: (Math.PI * 2) / 3,
    };
  }, []);

  const nodes = useMemo(() => {
    return generateTree(params);
  }, [params]);

  const [activeStep, setActiveStep] = useState(0);

  // simple “one node per tick” growth animation
  useEffect(() => {
    const max = nodes.length;

    const interval = window.setInterval(() => {
      setActiveStep((s) => {
        const next = s + 1;

        if (next >= max) {
          return max - 1;
        }

        return next;
      });
    }, 60); // speed

    return () => {
      window.clearInterval(interval);
    };
  }, [nodes.length]);

  const visibleCount = Math.min(activeStep + 1, nodes.length);
  const activeNode = nodes[activeStep] ?? null;

  return (
    <HStack align="stretch" spacing={0} w="100%" h="100vh">
      {/* Left panel */}
      <Box
        w="360px"
        bg="gray.900"
        color="white"
        borderRightWidth="1px"
        borderRightColor="whiteAlpha.200"
      >
        <StatsTable
          activeNode={activeNode}
          visibleCount={visibleCount}
          total={nodes.length}
        />
      </Box>

      {/* 3D scene */}
      <Box flex="1">
        <Canvas
          camera={{ position: [0, 5, 15], fov: 50 }}
          style={{ height: "100%", width: "100%" }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <OrbitControls />
          <axesHelper args={[5]} />

          {nodes.slice(0, visibleCount).map((n) => {
            const isActive = activeNode?.id === n.id;
            return <BranchMesh key={n.id} node={n} isActive={isActive} />;
          })}
        </Canvas>
      </Box>
    </HStack>
  );
};

export default FractalTree;
