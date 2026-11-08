// EXEMPLO do kit (12 s, vertical 1080x1920). Copie este arquivo para começar um vídeo novo.
// Cena 1 (0-6 s): cidadezinha, cientista acena e a criança se assusta, câmera desliza e aproxima.
// Cena 2 (6-12 s): corte para o espaço, Terra e Lua girando, órbita lenta.
// A legenda vem de words.json (aqui com tempos escritos à mão; num vídeo real, use scripts/palavras.py na narração).
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Cena3D } from "../kit/Cena3D";
import { criarMundo, aplicarNevoa, chao, cidade, casa, arvore, nuvem, planeta } from "../kit/cenarios";
import { Personagem, ELENCO } from "../kit/personagens";
import { camNoTempo, aplicarCam, orbita, Chave } from "../kit/camera";
import { Legenda } from "../kit/Legenda";
import { FPS, Palavra, kick, criarCue, ss } from "../kit/tempo";
import WORDS from "./words.json";

const W = WORDS as Palavra[];
const cue = criarCue(W);
export const EXEMPLO_FRAMES = 12 * FPS;

// --------------------------------------------------------------- cena 1: cidade
const T_SUSTO = cue(/^susto/, 0, 3.2);
const CAM1: Chave[] = [
  { t: 0, c: { pos: [6, 1.6, 15], look: [0, 3.2, -4], fov: 50 } },
  { t: 3, c: { pos: [3.5, 1.5, 9], look: [0, 1.9, -1], fov: 44 } },
  { t: 6, c: { pos: [2.6, 1.4, 6.5], look: [0, 1.5, 0], fov: 40 } },
];
export const Cidade: React.FC = () => (
  <Cena3D
    montar={(scene) => {
      const m = criarMundo("dia");
      aplicarNevoa(scene, m, 40, 220);
      chao(m.root, { tipo: "grama" });
      cidade(m.root, { raio: 55, livre: 10, seed: 3 });
      casa(m.root, -7, -16, { w: 7, h: 6.8, parede: "#f6d58e", telhado: "#c8553d" });
      arvore(m.root, 5, -6, 5.5); arvore(m.root, -4, -5, 4.5);
      nuvem(m.root, -40, 45, -160, 70, 1); nuvem(m.root, 50, 55, -200, 90, 2);
      const cientista = new Personagem(m.root, ELENCO.cientista, { seed: 2 });
      const crianca = new Personagem(m.root, ELENCO.crianca, { altura: 1.25, seed: 5 });
      return { root: m.root, estado: { cientista, crianca } };
    }}
    quadro={(e, t, cam) => {
      aplicarCam(cam, camNoTempo(CAM1, t), kick(T_SUSTO, t, 0.06));
      e.cientista.pose({ x: -0.9, z: 0, expr: t < T_SUSTO ? "smile" : "grin", aceno: Math.max(0, Math.sin(t * 6)) * (t < T_SUSTO ? 1 : 0), t }, cam);
      e.crianca.pose({ x: 0.9, z: 0.4, expr: t < T_SUSTO ? "neutral" : "shock", olhar: -0.6, y: t >= T_SUSTO ? 0.25 * Math.max(0, Math.sin((t - T_SUSTO) * 9)) * (1 - ss(T_SUSTO, T_SUSTO + 0.8, t)) : 0, t }, cam);
    }}
  />
);

// --------------------------------------------------------------- cena 2: espaço
export const Espaco: React.FC = () => (
  <Cena3D
    montar={() => {
      const m = criarMundo("espaco", [-60, 20, 40]);
      const terra = planeta(m.root, "terra", 6, [0, 0, 0], 4);
      const lua = planeta(m.root, "lua", 1.6, [14, 1, 0], 2);
      return { root: m.root, estado: { terra, lua } };
    }}
    quadro={(e, t, cam) => {
      e.terra.rotation.y = t * 0.25;
      const a = t * 0.35; e.lua.position.set(14 * Math.cos(a), 1, -14 * Math.sin(a)); e.lua.rotation.y = -a;
      aplicarCam(cam, orbita([3, 0, 0], -20 + t * 6, 52 - t * 1.2, 8, 40));
    }}
    tinta={{ widthNear: 4, widthFar: 3 }}
  />
);

export const Exemplo: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Sequence durationInFrames={6 * FPS}><Cidade /></Sequence>
    <Sequence from={6 * FPS}><Espaco /></Sequence>
    {/* som: trilha baixa + efeitos no quadro exato (num vídeo real, a voz entra aqui: <Audio src={staticFile("<nome>/voz.mp3")} />) */}
    <Audio src={staticFile("exemplo/trilha_curiosa.wav")} volume={0.35} />
    <Sequence from={Math.round(T_SUSTO * FPS)}><Audio src={staticFile("exemplo/surpresa.wav")} volume={0.6} /></Sequence>
    <Sequence from={6 * FPS - 8}><Audio src={staticFile("exemplo/whoosh.wav")} volume={0.6} /></Sequence>
    {/* a legenda usa o tempo do vídeo inteiro: fica fora das Sequences */}
    <Legenda palavras={W} />
  </AbsoluteFill>
);
