"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MeshStandardMaterial } from "three";

type Atom = {
  position: [number, number, number];
  radius: number;
  color: string;
};

const atoms: Atom[] = [
  { position: [0, 0, 0], radius: 1.7, color: "#222222" }, // Carbon
  { position: [0.63, 0.63, 0.63], radius: 1.2, color: "#ffffff" },
  { position: [-0.63, -0.63, 0.63], radius: 1.2, color: "#ffffff" },
  { position: [-0.63, 0.63, -0.63], radius: 1.2, color: "#ffffff" },
  { position: [0.63, -0.63, -0.63], radius: 1.2, color: "#ffffff" },
];

const AtomSphere = ({ atom }: { atom: Atom }) => {
  return (
    <mesh position={atom.position}>
      <sphereGeometry args={[atom.radius, 64, 64]} />
      <meshStandardMaterial color={atom.color} />
    </mesh>
  );
};

const MethaneVDW = () => {
  return (
    <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      {atoms.map((atom, i) => (
        <AtomSphere key={i} atom={atom} />
      ))}

      <OrbitControls />
    </Canvas>
  );
};

export default MethaneVDW;
