// KIT: câmera. Gramática que funciona em short animado:
// - aproximação lenta e contínua dentro do plano (push-in);
// - movimentos grandes = CORTE, nunca um passeio longo;
// - deslizes simétricos (entra e sai suave) de ~0.8 s;
// - impacto = tremido de 7 quadros (kick em tempo.ts).
import * as THREE from "three";
import { sss, lerp } from "./tempo";

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov?: number; roll?: number };
/** chave de câmera: no tempo t (s) a câmera está em `c`. `corte: true` = salta para cá sem deslizar. */
export type Chave = { t: number; c: Cam; corte?: boolean };

const mix = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

/** câmera no tempo t, deslizando entre chaves (ou cortando quando a próxima chave tem corte) */
export const camNoTempo = (chaves: Chave[], t: number): Cam => {
  if (!chaves.length) return { pos: [0, 2, 10], look: [0, 1, 0], fov: 40 };
  let i = 0;
  while (i < chaves.length - 1 && t >= chaves[i + 1].t) i++;
  const a = chaves[i], b = chaves[i + 1];
  if (!b || b.corte) return { fov: 40, roll: 0, ...a.c };
  const u = sss(a.t, b.t, t);
  return {
    pos: mix(a.c.pos, b.c.pos, u), look: mix(a.c.look, b.c.look, u),
    fov: lerp(a.c.fov ?? 40, b.c.fov ?? 40, u), roll: lerp(a.c.roll ?? 0, b.c.roll ?? 0, u),
  };
};

/** órbita em volta de um alvo: ângulo em graus, raio, altura */
export const orbita = (alvo: V3, graus: number, raio: number, altura: number, fov = 40): Cam => {
  const a = (graus * Math.PI) / 180;
  return { pos: [alvo[0] + raio * Math.sin(a), alvo[1] + altura, alvo[2] + raio * Math.cos(a)], look: alvo, fov };
};

/** aproximação lenta: recua de `de` até `ate` (fração do caminho até o alvo) entre t0 e t1 */
export const pushIn = (c: Cam, t0: number, t1: number, t: number, quanto = 0.12): Cam => {
  const u = Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) * quanto;
  return { ...c, pos: mix(c.pos, c.look, u) };
};

const up = new THREE.Vector3(0, 1, 0);
/** aplica a câmera do kit na câmera do three.js; `tremido` em metros (use kick() de tempo.ts) */
export const aplicarCam = (cam: THREE.PerspectiveCamera, c: Cam, tremido = 0) => {
  cam.position.set(c.pos[0], c.pos[1] + tremido * 0.6, c.pos[2]);
  cam.up.copy(up);
  cam.lookAt(c.look[0] + tremido, c.look[1], c.look[2]);
  if (c.roll) cam.rotateZ((c.roll * Math.PI) / 180);
  const fov = c.fov ?? 40;
  if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
};
