import React, { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { AgoraTrackItem } from "./types";

type ModelProps = { item: AgoraTrackItem; src: string };
const LoadedModel: React.FC<ModelProps> = ({ item, src }) => {
  const gltf = useLoader(GLTFLoader, staticFile(src));
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const model = item.model ?? {};
  const object = useMemo(() => gltf.scene.clone(true), [gltf]);
  const rotation = model.rotation ?? [0, 0, 0];
  const position = model.position ?? [0, 0, 0];
  return <primitive object={object} position={new THREE.Vector3(...position)}
    rotation={new THREE.Euler(rotation[0], rotation[1] + (frame / fps) * (model.spinPerSecond ?? 0), rotation[2])}
    scale={model.scale ?? 1} />;
};
const Camera: React.FC<{ position: [number, number, number]; fov: number }> = ({ position, fov }) => {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(...position);
    (camera as THREE.PerspectiveCamera).fov = fov;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, position, fov]);
  return null;
};
const ModelScene: React.FC<ModelProps> = (props) => {
  const model = props.item.model ?? {};
  return <>
    <ambientLight intensity={model.ambientIntensity ?? 1.2} />
    <directionalLight position={[4, 8, 6]} intensity={2} />
    <Camera position={model.cameraPosition ?? [0, 1.5, 5]} fov={model.cameraFov ?? 40} />
    <LoadedModel {...props} />
  </>;
};
export const TimelineModel: React.FC<ModelProps> = ({ item, src }) => {
  const { width, height } = useVideoConfig();
  return <AbsoluteFill style={{ background: "transparent" }}>
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 1.5, 5], fov: 40, near: 0.01, far: 1000 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
      <Suspense fallback={null}><ModelScene item={item} src={src} /></Suspense>
    </ThreeCanvas>
  </AbsoluteFill>;
};
