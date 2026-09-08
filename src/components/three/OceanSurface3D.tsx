"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MarineSceneState } from "@/types/fishing";
const vertex = `uniform float uTime;uniform float uHeight;uniform float uPeriod;varying vec3 vPosition;varying float vCrest;
void main(){vec3 p=position;float t=uTime*6.283/max(2.,uPeriod);float w=sin(p.x*.65+t)*.45+sin(p.y*.8+t*.85+p.x*.27)*.28+sin(p.x*1.8-p.y*.9+t*1.3)*.12; p.z=w*uHeight;vCrest=w;vPosition=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`;
const fragment = `uniform vec3 uDeep;uniform vec3 uLight;uniform float uDay;varying vec3 vPosition;varying float vCrest;
void main(){float ridge=smoothstep(.25,.65,vCrest);vec3 color=mix(uDeep,uLight,(vCrest+.9)*.45);float shimmer=pow(max(0.,sin(vPosition.x*12.+vPosition.y*7.)),35.)*ridge;float reflection=exp(-pow(vPosition.x*.18,2.))*max(0.,vCrest+.1);color+=vec3(.75,.8,.65)*reflection*.25*uDay;color+=vec3(.5,.75,.75)*shimmer*.3;gl_FragColor=vec4(color,1.);}`;
export function OceanSurface3D({ state, segments }: { state: MarineSceneState; segments: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHeight: { value: state.waveHeight },
      uPeriod: { value: state.wavePeriod },
      uDeep: { value: new THREE.Color("#082d40") },
      uLight: { value: new THREE.Color("#428b9b") },
      uDay: { value: 1 },
    }),
    [],
  );
  useFrame((_, delta) => {
    if (!material.current) return;
    const u = material.current.uniforms;
    u.uTime.value += Math.min(delta, 0.05);
    u.uHeight.value = THREE.MathUtils.damp(u.uHeight.value, state.waveHeight * 1.1 + 0.1, 3, delta);
    u.uPeriod.value = state.wavePeriod;
    u.uDay.value = THREE.MathUtils.damp(u.uDay.value, state.isDaytime ? 1 : 0.2, 3, delta);
    u.uDeep.value.lerp(
      new THREE.Color(state.isDaytime ? "#0b3a4b" : "#04131f"),
      Math.min(delta * 2, 1),
    );
    u.uLight.value.lerp(
      new THREE.Color(state.isDaytime ? "#4b929d" : "#234458"),
      Math.min(delta * 2, 1),
    );
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, -12]}>
      <planeGeometry args={[120, 120, segments, segments]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
      />
    </mesh>
  );
}
