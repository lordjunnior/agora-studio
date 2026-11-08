// KIT: a tela 3D. Você passa duas funções:
//   montar(scene)          -> monta o mundo UMA vez e devolve o que você quiser guardar (personagens, objetos)
//   quadro(estado, t, cam)  -> chamado a cada quadro com o tempo t em segundos: mova câmera, personagens e objetos
// Pós-processamento: contorno de tinta (InkPass) + tone mapping neutro. Tudo é função do quadro (render determinístico).
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback, InkOptions } from "./ink";
import { FPS } from "./tempo";

type Props<T> = {
  montar: (scene: THREE.Scene) => { root: THREE.Object3D; estado: T };
  quadro: (estado: T, t: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) => void;
  tinta?: boolean | InkOptions;
  /** cor de fundo atrás do canvas */
  fundo?: string;
};

function Dentro<T>({ montar, quadro, tinta = true }: Props<T>) {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const m = useMemo(() => montar(scene), []); // eslint-disable-line react-hooks/exhaustive-deps
  const fx = useMemo(() => ({
    ink: tinta ? new InkPass(scene, cam, typeof tinta === "object" ? tinta : {}) : null,
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
  }), [scene, cam, tinta]);
  useEffect(() => () => { if (fx.ink && typeof fx.ink.dispose === "function") fx.ink.dispose(); }, [fx]);
  quadro(m.estado, f / FPS, cam, scene);
  noInkFallback(m.root);
  const passes = [fx.ink, fx.tone].filter(Boolean) as object[];
  return (
    <>
      <primitive object={m.root} dispose={null} />
      <EffectComposer multisampling={4}>
        {passes.map((p, i) => <primitive key={i} object={p} dispose={null} />)}
      </EffectComposer>
    </>
  );
}

export function Cena3D<T>(props: Props<T>) {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: props.fundo ?? "#000" }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }}
        camera={{ fov: 40, near: 0.1, far: 2000 }}>
        <Dentro {...props} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
}
