"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
export function WindField3D({
  speed,
  direction,
  count,
  emphasized,
}: {
  speed: number;
  direction: number;
  count: number;
  emphasized: boolean;
}) {
  const ref = useRef<THREE.LineSegments>(null);
  const positions = useMemo(() => {
    const p = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      p[i * 6] = ((i * 7.31) % 35) - 17;
      p[i * 6 + 1] = 1 + ((i * 1.73) % 6);
      p[i * 6 + 2] = -((i * 3.97) % 35);
      p[i * 6 + 3] = p[i * 6];
      p[i * 6 + 4] = p[i * 6 + 1];
      p[i * 6 + 5] = p[i * 6 + 2];
    }
    return p;
  }, [count]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const array = ref.current.geometry.attributes.position.array as Float32Array;
    const angle = (direction * Math.PI) / 180,
      dx = -Math.sin(angle),
      dz = Math.cos(angle),
      dt = Math.min(delta, 0.05) * speed * 0.15;
    for (let i = 0; i < count; i++) {
      const n = i * 6;
      array[n] += dx * dt;
      array[n + 2] += dz * dt;
      if (array[n] > 18) array[n] = -18;
      if (array[n] < -18) array[n] = 18;
      if (array[n + 2] > 3) array[n + 2] = -35;
      if (array[n + 2] < -35) array[n + 2] = 3;
      array[n + 3] = array[n] - dx * (emphasized ? 1.2 : 0.6);
      array[n + 4] = array[n + 1];
      array[n + 5] = array[n + 2] - dz * (emphasized ? 1.2 : 0.6);
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#d5eddc"
        transparent
        opacity={speed < 0.2 ? 0 : emphasized ? 0.55 : 0.16}
      />
    </lineSegments>
  );
}
