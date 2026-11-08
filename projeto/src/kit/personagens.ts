// KIT: personagens 2D (cartões planos) dentro do mundo 3D. Cada quadro o personagem pede um desenho (pose +
// expressão); desenhos iguais reaproveitam o mesmo canvas. O cartão gira só no eixo vertical para olhar a câmera.
// Fica na camada NOINK (o contorno de tinta do mundo não passa nele: o desenho já tem contorno próprio).
import * as THREE from "three";
import { Pen, bodyFront, bodySide, Outfit, Expr, FrontOpts, SideOpts, KID, PARENT } from "./toon";
import { NOINK } from "./ink";
import { FPS } from "./tempo";

/** elenco pronto. Troque cores à vontade: { ...ELENCO.cientista, jacket: "#..." } */
export const ELENCO: Record<string, Outfit> = {
  crianca: KID,
  mae: { ...PARENT, jacket: "#d9467a", pants: "#3b3f52", hair: "#6b3a22" },
  pai: { jacket: "#3a6fd1", pants: "#33384a", boots: "#3a2a20", hat: "hair", hair: "#3a2a20", moustache: "#3a2a20" },
  cientista: { jacket: "#f3f1ea", pants: "#2f3446", boots: "#2a2230", hat: "hair", hair: "#9aa0a8", buttons: "#c9ced6" },
  vovo: { jacket: "#4f8a5b", pants: "#4a4038", boots: "#3a2a20", hat: "hair", hair: "#eeeeee", build: "stout" },
  astronauta: { jacket: "#f4f4f4", pants: "#e6e6e6", boots: "#8a8f99", hat: "cap", cap: "#f08a2c", belt: "#3a6fd1" },
  chef: { jacket: "#ffffff", pants: "#2b2b2b", boots: "#2b2b2b", hat: "tophat", belt: "#d33c3c" },
  turista: { jacket: "#f2c230", pants: "#4a6b3a", boots: "#6b4a2a", hat: "cap", cap: "#2e9bd6" },
};

const SU = 0.00216; // metros por unidade de desenho: 1000 unidades = 2.16 m
const cache = new Map<string, THREE.CanvasTexture>();
const desenho = (key: string, w: number, h: number, k: number, draw: (p: Pen) => void) => {
  let t = cache.get(key);
  if (t) return t;
  if (cache.size > 400) { for (const v of cache.values()) v.dispose(); cache.clear(); }
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d")!; g.setTransform(k, 0, 0, k, 0, 0);
  draw(new Pen(g));
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  cache.set(key, t);
  return t;
};
const q = (v: number) => Math.round(v * 60) / 60;
const chave = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

/** piscada automática: 0 aberto .. 1 fechado, intervalos de 0.5 a 2.3 s, diferente para cada seed */
export const piscar = (t: number, seed: number) => {
  const f = Math.round(t * FPS), LID = [0.5, 1, 1, 0.5];
  const h = (i: number) => { const v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return v - Math.floor(v); };
  let s = Math.round(-60 * h(9));
  for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * h(n + 13)); }
  return 0;
};

export type Pose = {
  x: number; y?: number; z: number;
  expr?: Expr;
  /** frente: stand | stroll | march | sit | fall ; lado: stand | march */
  modo?: "stand" | "stroll" | "march" | "sit" | "fall";
  /** fase do passo 0..1 (para andar: fase = t * 1.0 dá 2 passos por segundo) */
  fase?: number;
  /** de lado (perfil) em vez de frente */
  lado?: boolean;
  /** espelhar (de lado: olhando para a esquerda) */
  espelho?: boolean;
  /** -1..1 para onde os olhos olham */
  olhar?: number;
  /** 0..1 braço acenando / apontando */
  aceno?: number;
  /** inclinação do corpo em graus */
  inclina?: number;
  /** tempo em s para a piscada automática */
  t?: number;
};

const GEO = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })(); // sola no y = 0

export class Personagem {
  mesh: THREE.Mesh; sombra: THREE.Mesh; mat: THREE.MeshBasicMaterial;
  constructor(parent: THREE.Object3D, public roupa: Outfit, public opts: { altura?: number; seed?: number } = {}) {
    this.mat = new THREE.MeshBasicMaterial({ transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, toneMapped: false });
    this.mesh = new THREE.Mesh(GEO, this.mat);
    this.mesh.layers.set(NOINK);
    const s = (opts.altura ?? 1.75) / 1.75;
    this.mesh.scale.setScalar(s);
    const sm = new THREE.MeshBasicMaterial({ color: "#1d1630", transparent: true, opacity: 0.28, depthWrite: false });
    this.sombra = new THREE.Mesh(new THREE.CircleGeometry(0.32, 32), sm);
    this.sombra.rotation.x = -Math.PI / 2; this.sombra.scale.set(s, s * 0.55, 1); this.sombra.layers.set(NOINK);
    parent.add(this.mesh, this.sombra);
  }
  /** posiciona e desenha o personagem para este quadro. `cam` = câmera do three.js */
  pose(p: Pose, cam: THREE.Camera, visivel = true) {
    this.mesh.visible = this.sombra.visible = visivel;
    if (!visivel) return;
    const seed = this.opts.seed ?? 1, blink = p.t !== undefined ? piscar(p.t, seed) : 0;
    const dist = cam.position.distanceTo(new THREE.Vector3(p.x, (p.y ?? 0) + 1, p.z));
    const [w, h, k] = dist < 4 ? [1200, 2000, 2] : dist < 12 ? [720, 1200, 1.2] : [300, 500, 0.5];
    let key: string, draw: (pen: Pen) => void;
    if (p.lado) {
      const so: SideOpts = { phase: p.fase ?? 0, expr: p.expr ?? "neutral", mode: p.modo === "march" || p.modo === "stroll" ? "march" : "stand", blink, seed, stride: p.modo === "stroll" ? 0.6 : 1 };
      key = `S|${w}|${chave(this.roupa)}|${chave(so)}`; draw = (pen) => bodySide(pen, this.roupa, so);
    } else {
      const fo: FrontOpts = { phase: p.fase ?? 0, expr: p.expr ?? "neutral", mode: p.modo ?? "stand", look: p.olhar ?? 0, blink, seed, wave: p.aceno, tilt: p.inclina ?? 0 };
      key = `F|${w}|${chave(this.roupa)}|${chave(fo)}`; draw = (pen) => bodyFront(pen, this.roupa, fo);
    }
    this.mat.map = desenho(key, w, h, k, draw); this.mat.needsUpdate = true;
    const y = p.y ?? 0;
    this.mesh.position.set(p.x, y, p.z);
    this.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
    this.mesh.scale.x = Math.abs(this.mesh.scale.x) * (p.lado && p.espelho ? -1 : 1);
    this.sombra.position.set(p.x, y + 0.015, p.z);
  }
}
