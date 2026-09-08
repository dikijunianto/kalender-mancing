"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
export function RainSystem3D({
  intensity,
  maxCount,
  emphasized,
}: {
  intensity: number;
  maxCount: number;
  emphasized: boolean;
}) {
  const ref = useRef<THREE.LineSegments>(null);
  const count = intensity <= 0 ? 0 : Math.max(6, Math.round(maxCount * Math.min(1, intensity / 6)));
  const positions = useMemo(() => {
    const p = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      p[i * 6] = ((i * 2.71) % 30) - 15;
      p[i * 6 + 1] = (i * 1.13) % 18;
      p[i * 6 + 2] = -((i * 3.31) % 25);
      p[i * 6 + 3] = p[i * 6] - 0.04;
      p[i * 6 + 4] = p[i * 6 + 1] - 0.45;
      p[i * 6 + 5] = p[i * 6 + 2];
    }
    return p;
  }, [count]);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const p = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const n = i * 6;
      p[n + 1] -= Math.min(delta, 0.05) * (7 + Math.min(intensity, 10));
      if (p[n + 1] < 0) p[n + 1] = 18;
      p[n + 4] = p[n + 1] - 0.45;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return count ? (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#c2dce2" transparent opacity={emphasized ? 0.55 : 0.28} />
    </lineSegments>
  ) : null;
}
