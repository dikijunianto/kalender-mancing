"use client";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
export function CloudSystem3D({ cover, rain }: { cover: number; rain: boolean }) {
  const count = Math.round(cover / 4),
    ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      object.position.set(((i * 8.21) % 75) - 37, 12 + ((i * 1.37) % 5), -28 - ((i * 5.7) % 24));
      object.scale.set(4 + (i % 3), 0.55 + (i % 2) * 0.25, 2);
      object.updateMatrix();
      ref.current.setMatrixAt(i, object.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);
  return count ? (
    <instancedMesh key={count} ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 12, 6]} />
      <meshStandardMaterial
        color={rain ? "#58656e" : "#cadada"}
        transparent
        opacity={rain ? 0.8 : 0.6}
        roughness={1}
      />
    </instancedMesh>
  ) : null;
}
