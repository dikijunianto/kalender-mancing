"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
const vertex = `varying vec3 vNormal;varying vec3 vPosition;void main(){vNormal=normal;vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment = `uniform vec3 uLight;varying vec3 vNormal;varying vec3 vPosition;float noise(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}void main(){vec3 n=normalize(vNormal);float light=max(0.,dot(n,normalize(uLight)));float maria=sin(vPosition.x*7.+sin(vPosition.y*9.))*sin(vPosition.z*8.+vPosition.y*4.);float detail=noise(floor(vPosition*110.))*.08;vec3 rock=vec3(.78,.8,.72)*( .76+maria*.13+detail);gl_FragColor=vec4(rock*(.018+light*.982),1.);}`;
export function Moon3D({
  phase,
  focused,
  onFocus,
}: {
  phase: number;
  focused: boolean;
  onFocus: () => void;
}) {
  const mesh = useRef<THREE.Mesh>(null),
    material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uLight: {
        value: new THREE.Vector3(Math.sin(phase * Math.PI * 2), 0, -Math.cos(phase * Math.PI * 2)),
      },
    }),
    [],
  );
  useFrame((_, delta) => {
    if (!mesh.current || !material.current) return;
    mesh.current.position.lerp(
      new THREE.Vector3(focused ? 0 : 9, focused ? 5 : 11, focused ? -5 : -24),
      Math.min(delta * 3, 1),
    );
    const angle = phase * Math.PI * 2;
    material.current.uniforms.uLight.value.set(Math.sin(angle), 0, -Math.cos(angle));
    const scale = focused ? 2.5 : 1.8;
    mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), Math.min(delta * 3, 1));
  });
  return (
    <mesh
      ref={mesh}
      position={[9, 11, -24]}
      onClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
    >
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
      />
    </mesh>
  );
}
