"use client";
import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import * as THREE from "three";
import type { MarineSceneState } from "@/types/fishing";
import { sceneQuality, type Quality } from "@/config/three";
import { OceanSurface3D } from "./OceanSurface3D";
import { Moon3D } from "./Moon3D";
import { WindField3D } from "./WindField3D";
import { RainSystem3D } from "./RainSystem3D";
import { CloudSystem3D } from "./CloudSystem3D";
export type WeatherMode = "overview" | "wind" | "rain" | "moon" | "waves";
function MarineLighting({ state, mode }: { state: MarineSceneState; mode: WeatherMode }) {
  const { scene, camera } = useThree(),
    lastMode = useRef(mode),
    target = useRef(new THREE.Vector3(0, 4, 11));
  const transition = useRef(false);
  useFrame((_, delta) => {
    const color = new THREE.Color(
      state.isDaytime ? (state.sunAltitude < 0.16 ? "#b49378" : "#709da9") : "#06131e",
    );
    if (!(scene.background instanceof THREE.Color)) scene.background = color;
    else scene.background.lerp(color, Math.min(delta * 2, 1));
    if (lastMode.current !== mode) {
      lastMode.current = mode;
      transition.current = true;
      target.current.set(
        0,
        mode === "moon" ? 5 : mode === "waves" ? 1.8 : 4,
        mode === "moon" ? 7 : mode === "waves" ? 7 : 11,
      );
    }
    if (transition.current) {
      camera.position.lerp(target.current, Math.min(delta * 3, 1));
      if (camera.position.distanceTo(target.current) < 0.02) transition.current = false;
    }
  });
  return (
    <>
      <ambientLight intensity={state.isDaytime ? 0.65 : 0.12} />
      <directionalLight
        position={[10, Math.max(1, Math.sin(state.sunAltitude) * 30), -30]}
        intensity={state.isDaytime ? 2 : 0.1}
        color={state.sunAltitude < 0.16 ? "#f4c893" : "#e3f4fa"}
      />
      {state.isDaytime && (
        <Sky
          distance={450000}
          sunPosition={[20, Math.sin(state.sunAltitude) * 100, -100]}
          turbidity={5 + state.cloudCover / 10}
          rayleigh={state.sunAltitude < 0.16 ? 2.5 : 0.7}
        />
      )}
      <fog attach="fog" args={[state.isDaytime ? "#7799a1" : "#0b1d2b", 35, 105]} />
    </>
  );
}
export default function MarineWeatherScene({
  state,
  quality,
  mode,
  active,
  onMode,
}: {
  state: MarineSceneState;
  quality: Quality;
  mode: WeatherMode;
  active: boolean;
  onMode: (mode: WeatherMode) => void;
}) {
  const q = sceneQuality[quality];
  return (
    <Canvas
      camera={{ position: [0, 4, 11], fov: 52, near: 0.1, far: 180 }}
      dpr={[1, q.dpr]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: quality === "HIGH", powerPreference: "low-power", alpha: false }}
      fallback={<div>Visualisasi WebGL tidak tersedia.</div>}
    >
      <MarineLighting state={state} mode={mode} />
      <OceanSurface3D state={state} segments={q.segments} />
      <CloudSystem3D cover={state.cloudCover} rain={state.precipitationIntensity > 0} />
      {(!state.isDaytime || mode === "moon") && (
        <Moon3D phase={state.moonPhase} focused={mode === "moon"} onFocus={() => onMode("moon")} />
      )}
      <WindField3D
        speed={state.windSpeed}
        direction={state.windDirection}
        count={q.wind}
        emphasized={mode === "wind"}
      />
      <RainSystem3D
        intensity={state.precipitationIntensity}
        maxCount={q.rain}
        emphasized={mode === "rain"}
      />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minAzimuthAngle={-0.3}
        maxAzimuthAngle={0.3}
        minPolarAngle={mode === "moon" ? Math.PI / 2 : 1.2}
        maxPolarAngle={mode === "moon" ? Math.PI / 2 : 1.55}
        target={[0, mode === "moon" ? 5 : 1, -5]}
        enableDamping
        dampingFactor={0.07}
      />
    </Canvas>
  );
}
