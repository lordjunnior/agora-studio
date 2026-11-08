// KIT: cenários. Tudo é procedural (sem arquivo 3D externo): céu, chão, casas, árvores, cidade, mar, nuvens,
// estrelas e planetas. Materiais em dois tons (MeshToonMaterial) + contorno de tinta do ink.ts = visual cartoon 3D.
// Monte o mundo UMA vez (useMemo) e só mova coisas por quadro.
import * as THREE from "three";
import { NOINK } from "./ink";
import { ctex, rep, grass, cobble, water, roof, facade, cloudHD, rng, CLOUD_DAY, CLOUD_GOLD } from "./paint";

export type Luz = "dia" | "por" | "noite" | "espaco";

// ---------------------------------------------------------------- material cartoon
const RAMP = (() => {
  const d = new Uint8Array([150, 150, 150, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 2, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
})();
/** material de dois tons (lado aceso / lado à sombra) */
export const toon = (cor: THREE.ColorRepresentation, map?: THREE.Texture) =>
  new THREE.MeshToonMaterial({ color: cor, map: map ?? null, gradientMap: RAMP });

// ---------------------------------------------------------------- céu e luz
const CEU: Record<Luz, { topo: string; meio: string; horiz: string; sol: string; solI: number; amb: string; ambI: number; nevoa?: string }> = {
  dia: { topo: "#3b8de0", meio: "#7cc0f2", horiz: "#dff1ff", sol: "#fff4e0", solI: 2.2, amb: "#cfe6ff", ambI: 1.4, nevoa: "#cfe6f7" },
  por: { topo: "#4a3a8c", meio: "#e2789a", horiz: "#ffc58a", sol: "#ffb36b", solI: 2.0, amb: "#c7a0d8", ambI: 1.2, nevoa: "#f2b79a" },
  noite: { topo: "#070a24", meio: "#1b2257", horiz: "#3a3f86", sol: "#9fb4ff", solI: 0.9, amb: "#5262b8", ambI: 0.9, nevoa: "#20285e" },
  espaco: { topo: "#05030f", meio: "#0d0826", horiz: "#1a1040", sol: "#ffffff", solI: 2.6, amb: "#6a5ab8", ambI: 0.5 },
};

export type Mundo = { root: THREE.Group; sol: THREE.DirectionalLight; luz: Luz };

/** cria o mundo vazio com céu, sol e luz ambiente. Coloque `mundo.root` na cena. */
export const criarMundo = (luz: Luz = "dia", solDir: [number, number, number] = [30, 45, 20]): Mundo => {
  const c = CEU[luz], root = new THREE.Group();
  const ceu = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { a: { value: new THREE.Color(c.topo) }, b: { value: new THREE.Color(c.meio) }, h: { value: new THREE.Color(c.horiz) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "uniform vec3 a,b,h; varying vec3 vP; void main(){ float y = clamp(vP.y, -0.2, 1.); vec3 col = y < .18 ? mix(h, b, smoothstep(-.05,.18,y)) : mix(b, a, smoothstep(.18,.85,y)); gl_FragColor = vec4(col,1.); }",
  }));
  ceu.layers.set(NOINK); ceu.renderOrder = -10; root.add(ceu);
  const sol = new THREE.DirectionalLight(c.sol, c.solI);
  sol.position.set(...solDir); root.add(sol, sol.target);
  root.add(new THREE.HemisphereLight(c.amb, "#6b5a4a", c.ambI));
  root.userData.nevoa = c.nevoa;
  if (luz === "noite" || luz === "espaco") estrelas(root, luz === "espaco" ? 2500 : 900);
  return { root, sol, luz };
};

/** névoa de distância (aplique na cena): esconde o fim do mundo e dá profundidade */
export const aplicarNevoa = (scene: THREE.Scene, mundo: Mundo, perto = 60, longe = 320) => {
  const n = mundo.root.userData.nevoa as string | undefined;
  scene.fog = n ? new THREE.Fog(n, perto, longe) : null;
};

// ---------------------------------------------------------------- chão, mar
export const chao = (root: THREE.Object3D, o: { tam?: number; tipo?: "grama" | "pedra" | "areia" | "lisa"; cor?: string } = {}) => {
  const tam = o.tam ?? 400, tipo = o.tipo ?? "grama";
  const map = tipo === "grama" ? rep(grass(), tam / 8, tam / 8) : tipo === "pedra" ? rep(cobble(), tam / 4, tam / 4)
    : tipo === "areia" ? rep(ctex("areia", 256, 256, (g, r) => { g.fillStyle = "#f0d9a0"; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 300; i++) { g.fillStyle = r() > .5 ? "#e5c98a" : "#f7e6b8"; g.fillRect(r() * 256, r() * 256, 3, 3); } }), tam / 6, tam / 6) : undefined;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), toon(o.cor ?? "#ffffff", map));
  m.rotation.x = -Math.PI / 2; root.add(m); return m;
};
export const mar = (root: THREE.Object3D, tam = 600, y = -0.3) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(tam, tam), toon("#ffffff", rep(water(), tam / 10, tam / 10)));
  m.rotation.x = -Math.PI / 2; m.position.y = y; root.add(m); return m;
};

// ---------------------------------------------------------------- casa, árvore, cidade
const PAREDES = ["#f4e3c1", "#f2c6b4", "#cfe3d2", "#f6d58e", "#d8d1ef", "#ffffff"];
const TELHADOS = ["#c8553d", "#3d6fb0", "#6b4f8c", "#d98b2b", "#4f8a5b"];
/** casa de 2 águas com fachada pintada. Base em y = 0, frente virada para +z (gire com yaw em graus). */
export const casa = (root: THREE.Object3D, x: number, z: number, o: { w?: number; d?: number; h?: number; yaw?: number; seed?: number; parede?: string; telhado?: string } = {}) => {
  const r = rng(o.seed ?? Math.round(x * 13 + z * 7)), w = o.w ?? 6, d = o.d ?? 5, h = o.h ?? 4 + Math.floor(r() * 3) * 2.8;
  const parede = o.parede ?? PAREDES[Math.floor(r() * PAREDES.length)], tel = o.telhado ?? TELHADOS[Math.floor(r() * TELHADOS.length)];
  const g = new THREE.Group();
  const fr = toon("#ffffff", facade(`f_${parede}_${w}_${h}`, w, h, { wall: parede, shutter: tel, door: true }));
  const lado = toon("#ffffff", facade(`l_${parede}_${d}_${h}`, d, h, { wall: parede, shutter: tel }));
  const corpo = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [lado, lado, toon(parede), toon(parede), fr, fr]);
  corpo.position.y = h / 2; g.add(corpo);
  const rh = Math.min(w, d) * 0.45, sh = new THREE.Shape([new THREE.Vector2(-w / 2 - 0.3, 0), new THREE.Vector2(w / 2 + 0.3, 0), new THREE.Vector2(0, rh)]);
  const tg = new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false }); tg.translate(0, 0, -(d + 0.6) / 2);
  const tet = new THREE.Mesh(tg, toon("#ffffff", rep(roof(tel), 2, 2))); tet.position.y = h; g.add(tet);
  g.position.set(x, 0, z); g.rotation.y = ((o.yaw ?? 0) * Math.PI) / 180; root.add(g); return g;
};
/** árvore de livro infantil: tronco + copa de esferas */
export const arvore = (root: THREE.Object3D, x: number, z: number, h = 5, cor = "#4fa34a", seed = 1) => {
  const r = rng(seed + Math.round(x * 3 + z)), g = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * h / 5, 0.2 * h / 5, h * 0.45, 8), toon("#7a5232")); tr.position.y = h * 0.22; g.add(tr);
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(h * (0.2 + r() * 0.1), 16, 12), toon(new THREE.Color(cor).offsetHSL(0, 0, (r() - 0.5) * 0.08)));
    s.position.set((r() - 0.5) * h * 0.35, h * (0.55 + r() * 0.25), (r() - 0.5) * h * 0.35); g.add(s);
  }
  g.position.set(x, 0, z); root.add(g); return g;
};
/** cidadezinha: ruas em grade com casas e árvores. Deixa livre um círculo `livre` no centro para a ação. */
export const cidade = (root: THREE.Object3D, o: { raio?: number; livre?: number; seed?: number } = {}) => {
  const r = rng(o.seed ?? 7), R = o.raio ?? 60, livre = o.livre ?? 12;
  for (let x = -R; x <= R; x += 11) for (let z = -R; z <= R; z += 11) {
    if (Math.hypot(x, z) < livre) continue;
    if (r() < 0.75) casa(root, x + (r() - 0.5) * 2, z + (r() - 0.5) * 2, { yaw: Math.round(r() * 4) * 90, seed: Math.round(r() * 1e4) });
    else arvore(root, x, z, 4 + r() * 3, "#4fa34a", Math.round(r() * 100));
  }
};

// ---------------------------------------------------------------- céu: nuvens e estrelas
export const nuvem = (root: THREE.Object3D, x: number, y: number, z: number, w = 30, seed = 1, luz: Luz = "dia") => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudHD(seed, luz === "por" ? CLOUD_GOLD : CLOUD_DAY), depthWrite: false, fog: false }));
  sp.scale.set(w, w / 2, 1); sp.position.set(x, y, z); sp.layers.set(NOINK); root.add(sp); return sp;
};
export const estrelas = (root: THREE.Object3D, n = 1500, raio = 800) => {
  const r = rng(99), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    p.set([raio * s * Math.cos(a), raio * Math.abs(u) * 0.9 + 20, raio * s * Math.sin(a)], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: "#ffffff", size: 2.2, sizeAttenuation: false, fog: false, depthWrite: false }));
  pts.layers.set(NOINK); root.add(pts); return pts;
};

// ---------------------------------------------------------------- planetas
export type TipoPlaneta = "terra" | "lua" | "marte" | "gasoso" | "sol";
const texPlaneta = (tipo: TipoPlaneta, seed: number) => ctex(`pl_${tipo}_${seed}`, 1024, 512, (g, r) => {
  const W = 1024, H = 512;
  const blob = (cx: number, cy: number, rx: number, ry: number, col: string) => {
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2, k = 0.75 + r() * 0.35; g.lineTo(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k); }
    g.fill();
  };
  if (tipo === "terra") {
    g.fillStyle = "#2f7fd8"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) blob(r() * W, 90 + r() * 330, 60 + r() * 110, 40 + r() * 70, i % 3 ? "#5fbf5a" : "#d9c27a");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, W, 30); g.fillRect(0, H - 30, W, 30);
    g.globalAlpha = 0.55; for (let i = 0; i < 14; i++) blob(r() * W, r() * H, 70 + r() * 90, 10 + r() * 14, "#ffffff"); g.globalAlpha = 1;
  } else if (tipo === "lua") {
    g.fillStyle = "#d9d6cf"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) blob(r() * W, 100 + r() * 300, 60 + r() * 90, 40 + r() * 60, "#b8b4ad");
    for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, s = 4 + r() * 22; g.fillStyle = "#a9a49c"; g.beginPath(); g.ellipse(x, y, s, s * 0.8, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(40,30,40,.35)"; g.lineWidth = 2; g.stroke(); }
  } else if (tipo === "marte") {
    g.fillStyle = "#d4683a"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 10; i++) blob(r() * W, r() * H, 50 + r() * 90, 30 + r() * 50, "#a9472a");
  } else if (tipo === "gasoso") {
    const cs = ["#e7c08a", "#d49a62", "#f2dcb0", "#c47f4e"];
    for (let y = 0; y < H; y += 24) { g.fillStyle = cs[Math.floor(r() * cs.length)]; g.fillRect(0, y, W, 26); }
  } else {
    g.fillStyle = "#ffcf3f"; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) blob(r() * W, r() * H, 20 + r() * 40, 15 + r() * 25, "#ffb21f");
  }
});
/** planeta pintado à mão. Gire com `.rotation.y` por quadro. O sol brilha (sem sombra). */
export const planeta = (root: THREE.Object3D, tipo: TipoPlaneta, raio: number, pos: [number, number, number], seed = 1) => {
  const map = texPlaneta(tipo, seed);
  const mat = tipo === "sol" ? new THREE.MeshBasicMaterial({ map, toneMapped: false }) : toon("#ffffff", map);
  const m = new THREE.Mesh(new THREE.SphereGeometry(raio, 64, 32), mat);
  m.position.set(...pos); root.add(m);
  if (tipo === "terra") { // atmosfera: halo fino
    const h = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.025, 48, 24), new THREE.MeshBasicMaterial({ color: "#9fe0ff", transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false }));
    h.layers.set(NOINK); m.add(h);
  }
  return m;
};
