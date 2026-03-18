import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line as DreiLine } from "@react-three/drei";
import * as THREE from "three";

type AnimatedSpiralProps = {
  points?: number;
  dt?: number; // spacing along parameter t
  A?: number;
  B?: number;
  w1?: number;
  w2?: number;
  v?: number;
  phase?: number;
  speed?: number;
  lineWidth?: number;
};

export const AnimatedSpiral = ({
  points = 600,
  dt = 0.05,
  A = 1.2,
  B = 1.2,
  w1 = 2,
  w2 = 2,
  v = 0.25,
  phase = Math.PI / 3,
  speed = 1.0,
  lineWidth = 4,
}: AnimatedSpiralProps) => {
  const lineRef = useRef<any>(null);

  // Precompute base t values once (no allocations per frame)
  const tValues = useMemo(() => {
    return Array.from({ length: points }, (_, i) => i * dt);
  }, [points, dt]);

  // Reusable buffer for LineGeometry.setPositions()
  const positions = useMemo(() => {
    return new Float32Array(points * 3);
  }, [points]);

  useFrame((state) => {
    const t0 = state.clock.getElapsedTime() * speed;

    for (let i = 0; i < points; i += 1) {
      const t = tValues[i];

      const x = v * t;
      const y = A * Math.sin(w1 * t + t0);
      const z = B * Math.sin(w2 * t + phase + t0);

      const k = i * 3;
      positions[k + 0] = x;
      positions[k + 1] = y;
      positions[k + 2] = z;
    }

    const geom = lineRef.current?.geometry;
    if (geom && typeof geom.setPositions === "function") {
      geom.setPositions(positions);
      // optional, but helps if you see clipping:
      geom.computeBoundingSphere?.();
    }
  });

  // Initial dummy points (will be overwritten on first frame)
  const initialPoints = useMemo(() => {
    return [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.01, 0, 0)];
  }, []);

  return (
    <DreiLine
      ref={lineRef}
      points={initialPoints}
      lineWidth={lineWidth} // 👈 thick
      // color can be string or THREE.Color
      color="hotpink"
    />
  );
};
