// Cenários prontos da Máquina Preguiça 3D: o lugar inteiro com um nome só. No montar do cena.js:
//
//   const C = K.cenario('construcao');            // ou 'natureza', 'cidade', 'casa', 'cozinha'... (lista em K.CENARIOS)
//   grupo.position.set(...C.centro);              // o objeto do vídeo fica no centro
//   menino.colocar(C.personagem, C.centro);       // o personagem do lado dele
//
// Cada cenário monta chão, céu, luz, o cenário em volta (no tamanho certo perto do personagem) e o que se mexe sozinho
// (guindaste, carros, ondas, peixes), e devolve os lugares com nome. Todo cenário tem os mesmos lugares básicos, então
// trocar o nome do cenário muda o vídeo de lugar sem mexer no resto:
//   C.centro      [0, 0, 0]: onde fica o objeto do vídeo (área livre, sem nada alto em volta)
//   C.personagem  do lado do objeto, um pouco pra frente
//   C.entrada     de onde o personagem chega andando (menino.irPara(C.entrada, C.personagem, ...))
//   C.esquerda    outro lugar livre, à esquerda do objeto (um segundo objeto, um ajudante)
//   C.direita     outro lugar livre, à direita
//   C.fundo       o destaque do cenário, lá atrás (pra câmera 'revelando' ou 'mergulho' no gancho)
//   C.lugares     todos os lugares, com os próprios de cada cenário (C.lugares.guindaste, C.lugares.porta...)
//   C.objetos     as peças do cenário que dá pra filmar ou mexer (C.objetos.betoneira, C.objetos.carros...)
//   C.ceu         o céu que o cenário põe em todo quadro ('dia', ['dia', 'tarde', 0.85]...); a cena troca com K.ceu
//   C.vista       { pos, alvo }: a câmera que mostra o lugar todo (K.mirar(C.vista.pos, C.vista.alvo), no gancho ou no fim)
// A câmera dos ajudantes (K.filmar) não atravessa prédio, parede nem máquina do cenário (K.obstaculos).
//
// op: hora ('dia' | 'tarde' | 'noite'), sem (lista do que tirar, ex. ['operarios', 'guindaste']), cor (estúdio),
// seed. Fotos e o que tem em cada um: referencias/cenarios.md
(function () {
  const K = window.K;
  const CENARIOS = {};
  const APELIDOS = {
    obra: 'construcao', canteiro: 'construcao', predio_em_obra: 'construcao',
    campo: 'natureza', montanha: 'natureza', montanhas: 'natureza', grama: 'natureza', paisagem: 'natureza',
    rua: 'cidade', centro_da_cidade: 'cidade', avenida: 'cidade', transito: 'cidade',
    quintal: 'casa', frente_de_casa: 'casa', jardim: 'casa',
    sala_de_estar: 'sala',
    mar: 'praia', litoral: 'praia',
    oceano: 'fundo_do_mar', submarino: 'fundo_do_mar', debaixo_dagua: 'fundo_do_mar', fundo_mar: 'fundo_do_mar',
    espaco_sideral: 'espaco', universo: 'espaco', planeta: 'espaco',
    sitio: 'fazenda', roca: 'fazenda', interior: 'fazenda',
    mata: 'floresta', bosque: 'floresta', selva: 'floresta',
    egito: 'deserto', piramide: 'deserto', piramides: 'deserto',
    hospital: 'consultorio', clinica: 'consultorio', medico: 'consultorio', laboratorio: 'consultorio',
    garagem: 'oficina', mecanica: 'oficina', mecanico: 'oficina',
    estudio_neutro: 'estudio', fundo_infinito: 'estudio', palco: 'estudio',
    trabalho: 'escritorio', banco: 'escritorio', empresa: 'escritorio'
  };
  const normalizar = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  // ---------- Ferramentas de montar ----------

  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  // Materiais de uma peça do cenário: a mesma cor vira o mesmo material dentro da peça. Peças diferentes não dividem
  // material, então o K.falhar ('esquenta', 'congela') numa peça não pinta as outras
  function paleta() {
    const cache = new Map();
    return (cor, extra) => {
      if (extra) return K.mat(cor, extra);
      if (!cache.has(cor)) cache.set(cor, K.mat(cor));
      return cache.get(cor);
    };
  }
  function por(pai, m, pos, giro) {
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (giro) m.rotation.set(giro[0] || 0, giro[1] || 0, giro[2] || 0);
    pai.add(m);
    return m;
  }
  // Caixa de quina arredondada (no estilo redondo)
  const caixa = (pai, [l, a, p], mat, pos, giro) => por(pai, K.malha(new THREE.BoxGeometry(l, a, p), mat), pos, giro);
  // Caixa de quina reta: parede, piso e laje que encostam umas nas outras
  const bloco = (pai, [l, a, p], mat, pos, giro) => por(pai, K.malha(new THREE.BoxGeometry(l, a, p, 1, 1, 1), mat), pos, giro);
  const cilindro = (pai, [rc, rb, a], mat, pos, giro, lados = 20) => por(pai, K.malha(new THREE.CylinderGeometry(rc, rb, a, lados), mat), pos, giro);
  const esfera = (pai, r, mat, pos, esc) => { const m = por(pai, K.malha(new THREE.SphereGeometry(r, 20, 14), mat), pos); if (esc) m.scale.set(esc[0], esc[1], esc[2]); return m; };
  const grupo = (pai, pos, giroY = 0) => { const g = new THREE.Group(); if (pos) g.position.set(pos[0], pos[1], pos[2]); g.rotation.y = giroY; pai.add(g); return g; };
  // Barra entre dois pontos (cano, viga, cabo, perna de andaime). lados 4: fica leve (o estilo redondo não mexe)
  function barra(pai, a, b, raio, mat, lados = 4) {
    const va = V3(a), d = V3(b).sub(va);
    const m = K.malha(new THREE.CylinderGeometry(raio, raio, d.length(), lados), mat);
    m.position.copy(va).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    pai.add(m);
    return m;
  }
  // Muitas barras iguais numa malha só (andaime, treliça): lista de [a, b]
  function barras(pai, lista, raio, mat, lados = 4) {
    const geo = new THREE.CylinderGeometry(raio, raio, 1, lados);
    const inst = new THREE.InstancedMesh(geo, mat, lista.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), s = new THREE.Vector3();
    lista.forEach(([a, b], i) => {
      const va = V3(a), d = V3(b).sub(va), len = d.length();
      q.setFromUnitVectors(up, d.clone().normalize());
      m4.compose(va.addScaledVector(d, 0.5), q, s.set(1, len, 1));
      inst.setMatrixAt(i, m4);
    });
    inst.castShadow = true;
    inst.receiveShadow = true;
    pai.add(inst);
    return inst;
  }
  // Muitas cópias da mesma peça: lista de { pos, giro: [x, y, z], esc: [x, y, z] | número, cor, ordem: 'YXZ' (gira em y
  // antes de inclinar: folha em roseta) }
  function copias(pai, geo, mat, lista, sombra = true) {
    const inst = new THREE.InstancedMesh(geo, mat, lista.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), c = new THREE.Color();
    lista.forEach((it, i) => {
      const g = it.giro || [0, 0, 0], esc = it.esc == null ? [1, 1, 1] : typeof it.esc === 'number' ? [it.esc, it.esc, it.esc] : it.esc;
      m4.compose(V3(it.pos), q.setFromEuler(e.set(g[0], g[1], g[2], it.ordem || 'XYZ')), s.set(esc[0], esc[1], esc[2]));
      inst.setMatrixAt(i, m4);
      if (it.cor != null) inst.setColorAt(i, c.set(it.cor));
    });
    inst.castShadow = sombra;
    inst.receiveShadow = true;
    pai.add(inst);
    return inst;
  }
  // A caixa da peça vira obstáculo da câmera (K.filmar não põe a lente dentro nem atrás dela)
  function solido(obj, folga = 0.25) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    if (!b.isEmpty()) K.obstaculos.push(b.expandByScalar(folga));
    return obj;
  }
  const solidoCaixa = (min, max) => K.obstaculos.push(new THREE.Box3(V3(min), V3(max)));
  // Personagens do fundo (operário, banhista): não entram na revisão das cenas e o cenário cuida deles em todo quadro
  function figurante(pai, op) {
    const b = K.boneco(op);
    K.bonecos.splice(K.bonecos.indexOf(b), 1);
    K.semNome(b.g);
    pai.add(b.g);
    return b;
  }
  // Textura desenhada em canvas, repetida (tijolo, piso, azulejo, madeira)
  function textura(larg, alt, desenhar, repete = [1, 1]) {
    const cv = document.createElement('canvas');
    cv.width = larg; cv.height = alt;
    desenhar(cv.getContext('2d'), larg, alt);
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repete[0], repete[1]);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  const rgb = (n, k = 1) => `rgb(${Math.min(255, Math.round(((n >> 16) & 255) * k))},${Math.min(255, Math.round(((n >> 8) & 255) * k))},${Math.min(255, Math.round((n & 255) * k))})`;
  // Tijolo à vista: a textura cobre 1,6 x 0,64 (4 tijolos x 4 fiadas). rep: [largura, altura] da parede em metros
  function texTijolo(rep, cor = 0xb9562f) {
    return textura(256, 128, (c, w, h) => {
      c.fillStyle = '#cfc6b6'; c.fillRect(0, 0, w, h);
      const r = K.rand(9);
      for (let f = 0; f < 4; f++) for (let i = -1; i < 5; i++) {
        const x = i * 64 + (f % 2) * 32, y = f * 32;
        c.fillStyle = rgb(cor, 0.86 + r() * 0.24);
        c.fillRect(x + 3, y + 3, 58, 26);
      }
    }, [rep[0] / 1.6, rep[1] / 0.64]);
  }
  // Chão grande com manchas (cores por vértice) e o grão de grama. op: tam, seg, cores [escuro, claro, seco], grao
  // (repetições; 0 tira), zona(x, z) → [cor (número), força 0 a 1] ou null (terra, trilha, areia), relevo(x, z) → altura
  function chao(pai, op = {}) {
    const { tam = 600, seg = 220, cores = [0x76b44c, 0xa3d66c, 0xb5cf6a], grao = 150, zona, relevo, y = 0 } = op;
    const geo = new THREE.PlaneGeometry(tam, tam, seg, seg).rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, cs = [];
    const [escuro, claro, seco] = cores.map((h) => new THREE.Color(h)), c = new THREE.Color(), cz = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const mancha = 0.5 + 0.25 * Math.sin(x * 0.19 + Math.sin(z * 0.13) * 2) + 0.25 * Math.sin(z * 0.23 + Math.cos(x * 0.11) * 2);
      const palha = K.clamp((Math.sin(x * 0.07 + 1) * Math.sin(z * 0.09 + 2) - 0.55) * 3);
      c.copy(escuro).lerp(claro, K.clamp(mancha)).lerp(seco, palha * 0.5);
      const zn = zona && zona(x, z, mancha);
      if (zn) c.lerp(cz.set(zn[0]), zn[1]);
      cs.push(c.r, c.g, c.b);
      if (relevo) pos.setY(i, relevo(x, z));
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
    if (relevo) geo.computeVertexNormals();
    const m = K.malha(geo, K.mat(0xffffff, Object.assign({ vertexColors: true }, grao ? { map: K.texGrao(grao) } : {})), false);
    m.position.y = y;
    m.receiveShadow = true;
    pai.add(m);
    return m;
  }
  // Tufos de grama (instanciados) numa área, fora dos círculos de evitar [[x, z, raio], ...]
  function tufos(pai, n, [x0, x1, z0, z1], evitar = [], seed = 3, alto = 1) {
    const r = K.rand(seed), lista = [];
    const tons = [0x4f9a3a, 0x5aa83f, 0x3f8a35, 0x6cb548, 0x7cc04f];
    let guarda = 0;
    while (lista.length < n && guarda++ < n * 20) {
      const x = x0 + r() * (x1 - x0), z = z0 + r() * (z1 - z0);
      if (evitar.some(([ex, ez, er]) => (x - ex) ** 2 + (z - ez) ** 2 < er * er)) continue;
      const s = (0.6 + r() * 0.9) * alto;
      lista.push({ pos: [x, 0, z], giro: [(r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5], esc: s, cor: tons[Math.floor(r() * tons.length)] });
    }
    return copias(pai, new THREE.ConeGeometry(0.035, 0.32, 3).translate(0, 0.16, 0), K.mat(0xffffff), lista, false);
  }
  // Árvores de longe (baratas: sem balanço), instanciadas: lista de [x, z, escala, pinheiro?]
  function arvoresLonge(pai, lista, seed = 4) {
    const r = K.rand(seed);
    const troncos = [], copas = [], pinhos = [];
    lista.forEach(([x, z, s, pinheiro]) => {
      troncos.push({ pos: [x, 0.6 * s, z], esc: [s, s, s] });
      if (pinheiro) pinhos.push({ pos: [x, 2.3 * s, z], esc: [s, s, s], cor: [0x2f6f35, 0x2a6430, 0x3a7a3a][Math.floor(r() * 3)] });
      else copas.push({ pos: [x, 1.9 * s, z], esc: [s * (0.9 + r() * 0.2), s, s], cor: K.cores.folhas[Math.floor(r() * 4)] });
    });
    copias(pai, new THREE.CylinderGeometry(0.12, 0.18, 1.2, 6), K.mat(K.cores.tronco), troncos);
    if (copas.length) copias(pai, new THREE.IcosahedronGeometry(0.95, 1), K.mat(0xffffff), copas);
    if (pinhos.length) copias(pai, new THREE.ConeGeometry(0.85, 2.8, 8), K.mat(0xffffff), pinhos);
  }
  // Ruído suave (pra montanha, duna, pedra): soma de senos, de -1 a 1
  const ondula = (x, y, z, s = 1) => (Math.sin(x * 1.7 * s + Math.sin(z * 2.3 * s)) + Math.sin(z * 1.9 * s + Math.sin(y * 2.9 * s + x)) + Math.sin(y * 2.1 * s + Math.sin(x * 3.1 * s))) / 3;
  // Montanha: icosaedro amassado e facetado, com a cor pela altura (verde embaixo, rocha no meio, neve no topo)
  function montanha(pai, [x, z], raio, alt, seed = 1, op = {}) {
    const geo = new THREE.IcosahedronGeometry(1, 3);
    const pos = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = ondula(v.x + seed, v.y * 1.3, v.z - seed, 1.6) * 0.22 + ondula(v.x * 3 + seed, v.y * 3, v.z * 3, 1.1) * 0.07;
      v.multiplyScalar(1 + n);
      if (v.y < 0) v.y *= 0.15;
      const afina = 1 - (op.ponta ?? 0.55) * K.clamp(v.y);
      pos.setXYZ(i, v.x * raio * afina, v.y * alt, v.z * raio * afina * (op.fundo ?? 0.8));
    }
    geo.computeVertexNormals();
    // Cor por face (as 3 pontas da face com a mesma cor): neve, rocha ou grama pela altura do meio da face
    const cs = [], c = new THREE.Color(), neve = op.neve ?? 0.7;
    const [corGrama, corRocha, corNeve] = [op.grama ?? 0x5f9a48, op.rocha ?? 0x7f8a96, 0xf3f6fa].map((h) => new THREE.Color(h));
    for (let f = 0; f < pos.count; f += 3) {
      const h = (pos.getY(f) + pos.getY(f + 1) + pos.getY(f + 2)) / 3 / alt + ondula(pos.getX(f) * 0.05, 0, pos.getZ(f) * 0.05) * 0.06;
      if (h > neve) c.copy(corNeve);
      else if (h > 0.32) c.copy(corRocha).offsetHSL(0, 0, (ondula(f, h, 0) * 0.04));
      else c.copy(corGrama).lerp(corRocha, K.clamp((h - 0.18) / 0.14));
      for (let k = 0; k < 3; k++) cs.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
    const m = K.malha(geo, K.mat(0xffffff, { vertexColors: true, flatShading: true, roughness: 0.95 }), false);
    m.receiveShadow = false;
    m.position.set(x, op.y ?? -alt * 0.04, z);
    pai.add(m);
    return m;
  }
  // Faixa no chão por uma lista de pontos [x, z] (trilha, estrada de terra, calçada): largura, cor e grão
  function faixaNoChao(pai, pontos, larg, cor, op = {}) {
    const pos = [], idx = [], uv = [];
    let comp = 0;
    pontos.forEach(([x, z], i) => {
      const [ax, az] = pontos[Math.max(0, i - 1)], [bx, bz] = pontos[Math.min(pontos.length - 1, i + 1)];
      const dx = bx - ax, dz = bz - az, n = Math.hypot(dx, dz) || 1, nx = -dz / n, nz = dx / n;
      const w = (larg / 2) * (op.afina ? 1 - op.afina * (i / (pontos.length - 1)) : 1);
      if (i) comp += Math.hypot(x - pontos[i - 1][0], z - pontos[i - 1][1]);
      pos.push(x + nx * w, op.y ?? 0.02, z + nz * w, x - nx * w, op.y ?? 0.02, z - nz * w);
      uv.push(0, comp / larg, 1, comp / larg);
      if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const tex = K.texGrao(1);
    tex.repeat.set(1, 1);
    const m = K.malha(geo, K.mat(cor, { map: tex, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }), false);
    m.receiveShadow = true;
    pai.add(m);
    return m;
  }
  // Morro verde arredondado (o de sempre, mais macio)
  function morro(pai, [x, z], raio, alt, cor) {
    const m = K.malha(new THREE.IcosahedronGeometry(1, 3), K.mat(cor, { roughness: 0.95 }), false);
    m.scale.set(raio, alt, raio * 0.7);
    m.position.set(x, -alt * 0.35, z);
    pai.add(m);
    return m;
  }
  // Nuvens (as do kit, que andam devagar no estilo redondo): lista de [x, y, z, tamanho]
  function nuvens(pai, lista, seed = 5) {
    const r = K.rand(seed);
    lista.forEach(([x, y, z, s]) => pai.add(K.nuvem(x, y, z, s, r)));
  }
  // Pontinhos boiando no ar (poeira, pólen, bolhas, vagalume): em volta de centro, numa caixa [lx, ly, lz]
  function particulas(pai, n, centro, caixa_, op = {}) {
    const r = K.rand(op.seed || 11), base = [], pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) base.push([(r() - 0.5) * caixa_[0], r(), (r() - 0.5) * caixa_[2], r() * 6]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({
      size: op.tam || 0.06, map: K.degrade([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]),
      color: op.cor ?? 0xfff3c4, transparent: true, opacity: op.opacidade ?? 0.8, depthWrite: false,
      blending: op.normal ? THREE.NormalBlending : THREE.AdditiveBlending
    }));
    pai.add(pts);
    const sobe = op.sobe ?? 0.035;
    K.vivo((t) => {
      base.forEach(([x, y, z, ph], i) => {
        pos[i * 3] = centro[0] + x + Math.sin(t * 0.4 + ph) * (op.vai ?? 0.35);
        pos[i * 3 + 1] = centro[1] + ((y + t * sobe) % 1) * caixa_[1];
        pos[i * 3 + 2] = centro[2] + z + Math.cos(t * 0.33 + ph * 1.3) * (op.vai ?? 0.35);
      });
      geo.attributes.position.needsUpdate = true;
    });
    return pts;
  }

  // ---------- Modelos 3D prontos (motor/modelos/*.js) ----------

  const geoModelos = new Map();
  const deB64 = (s, Tipo) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Tipo(u.buffer); };
  // Os nomes das peças prontas carregadas (pra K.modelo)
  K.MODELOS = Object.keys(window.MODELOS_PRONTOS || {});
  // Peça pronta de um pacote de modelos (motor/modelos/, lista em K.MODELOS): K.modelo('kenney-cidade/building-small-a',
  // { escala: 5, pos: [x, y, z], giro: graus em y, pai }). As peças do kenney-cidade ocupam 1 x 1 no chão: escala 5 deixa
  // a casa do tamanho certo perto do personagem. Devolve a malha, já na cena (ou dentro de op.pai)
  K.modelo = function (nome, op = {}) {
    const d = (window.MODELOS_PRONTOS || {})[nome];
    if (!d) throw new Error(`K.modelo: o modelo "${nome}" não existe. Use um destes: ${K.MODELOS.join(', ')}`);
    if (!geoModelos.has(nome)) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(deB64(d.p, Float32Array), 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(deB64(d.n, Int8Array), 3, true));
      const c8 = deB64(d.c, Uint8Array), cor = new Float32Array(c8.length);
      for (let i = 0; i < c8.length; i++) { const v = c8[i] / 255; cor[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
      geo.setAttribute('color', new THREE.BufferAttribute(cor, 3));
      geoModelos.set(nome, geo);
    }
    const m = K.malha(geoModelos.get(nome), K.mat(0xffffff, { vertexColors: true, roughness: 0.8 }));
    if (op.escala) m.scale.setScalar(op.escala);
    if (op.pos) m.position.set(op.pos[0], op.pos[1], op.pos[2]);
    if (op.giro) m.rotation.y = (op.giro * Math.PI) / 180;
    (op.pai || K.scene).add(m);
    return m;
  };

  // ---------- Construção: canteiro de obras ----------

  // Prédio em obra: 3 andares de estrutura de concreto (pilares, vigas, lajes), o 4º só com pilares e ferragem pra cima,
  // paredes de tijolo subindo, andaime na frente com tela verde e as fôrmas de madeira. Frente pra +z
  function predioEmObra(pai, pos, op = {}) {
    const M = paleta();
    const g = grupo(pai, pos);
    const H = 3.2, L = 11, P = 7, xs = [-5.5, -1.85, 1.85, 5.5], zs = [-3.5, 0, 3.5];
    const concreto = M(0xb9b6ae), concretoNovo = M(0xcfccc4), ferro = M(0x8a4b2a), madeira = M(0xc89a5c);
    bloco(g, [L + 0.8, 0.3, P + 0.8], M(0xa9a59c), [0, 0.15, 0]);
    const y = (i) => 0.3 + i * H;
    for (let i = 0; i < 3; i++) {
      xs.forEach((x) => zs.forEach((z) => bloco(g, [0.36, H - 0.22, 0.36], concreto, [x, y(i) + (H - 0.22) / 2, z])));
      bloco(g, [L + 0.5, 0.22, P + 0.5], i === 2 ? concretoNovo : concreto, [0, y(i + 1) - 0.11, 0]);
      [-P / 2, P / 2].forEach((z) => bloco(g, [L + 0.36, 0.4, 0.3], concreto, [0, y(i + 1) - 0.42, z]));
      [-L / 2, L / 2].forEach((x) => bloco(g, [0.3, 0.4, P + 0.36], concreto, [x, y(i + 1) - 0.42, 0]));
    }
    // 4º andar: pilares pela metade, com a ferragem saindo em cima; alguns ainda na fôrma de madeira
    const ferros = [];
    xs.forEach((x, a) => zs.forEach((z, b) => {
      const alto = (a + b) % 2 ? 1.5 : 0.9;
      if ((a + b) % 3 === 1) bloco(g, [0.5, alto + 0.25, 0.5], madeira, [x, y(3) + (alto + 0.25) / 2, z]);
      else bloco(g, [0.36, alto, 0.36], concretoNovo, [x, y(3) + alto / 2, z]);
      [[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]].forEach(([dx, dz]) => ferros.push([[x + dx, y(3) + alto - 0.05, z + dz], [x + dx * 1.3, y(3) + alto + 0.95, z + dz * 1.3]]));
    }));
    barras(g, ferros, 0.016, ferro);
    // Escoras de madeira segurando a laje nova (andar de cima)
    const escoras = [];
    for (let x = -4.5; x <= 4.5; x += 1.5) for (let z = -2.5; z <= 2.5; z += 2.5) escoras.push([[x, y(2) + 0.02, z], [x, y(3) - 0.24, z]]);
    barras(g, escoras, 0.05, madeira);
    // Paredes de tijolo subindo de baixo pra cima (térreo quase pronto, 1º andar pela metade, 2º começando)
    const parede = (x, z, comp, alt, y0, giro = 0) => {
      const tex = texTijolo([comp, alt]);
      const m = bloco(g, [comp, alt, 0.2], M(0xffffff, { map: tex, roughness: 0.92 }), [x, y0 + alt / 2, z], [0, giro, 0]);
      return m;
    };
    parede(0, -P / 2, L - 0.4, H - 0.25, y(0));
    parede(-L / 2, 0, P - 0.4, H - 0.25, y(0), Math.PI / 2);
    parede(L / 2, 0, P - 0.4, 1.7, y(0), Math.PI / 2);
    parede(-3.7, P / 2, 3.3, H - 0.25, y(0));
    parede(3.0, P / 2, 4.6, 1.1, y(0));
    parede(0, -P / 2, L - 0.4, 2.2, y(1));
    parede(-L / 2, 0, P - 0.4, 1.4, y(1), Math.PI / 2);
    parede(-3.7, P / 2, 3.3, 0.7, y(1));
    parede(-2, -P / 2, 6, 0.75, y(2));
    // Andaime na frente: tubos, tábuas, guarda-corpo, travas em X e a tela verde em cima
    const tubo = M(0x9aa3ab, { metalness: 0.5, roughness: 0.45 }), tabua = M(0xb98a4e);
    const zi = P / 2 + 0.55, ze = P / 2 + 1.65, x0 = -5.2, x1 = 3.4, niveis = [1.6, 3.2, 4.8, 6.4, 8.0];
    const nx = Math.round((x1 - x0) / 1.72), passo = (x1 - x0) / nx, tb = [];
    for (let k = 0; k <= nx; k++) {
      const x = x0 + k * passo;
      [zi, ze].forEach((z) => tb.push([[x, 0.3, z], [x, 9.0, z]]));
      niveis.forEach((ny) => tb.push([[x, ny, zi], [x, ny, ze]]));
    }
    niveis.forEach((ny) => [zi, ze].forEach((z) => { tb.push([[x0, ny, z], [x1, ny, z]]); if (z === ze) tb.push([[x0, ny + 1.0, z], [x1, ny + 1.0, z]]); }));
    for (let k = 0; k < nx; k += 2) for (let n = 0; n < niveis.length - 1; n += 2) {
      const xa = x0 + k * passo, xb = xa + passo;
      tb.push([[xa, niveis[n], ze], [xb, niveis[n + 1], ze]], [[xb, niveis[n], ze], [xa, niveis[n + 1], ze]]);
    }
    barras(g, tb, 0.035, tubo);
    niveis.slice(0, 4).forEach((ny) => { for (let k = 0; k < 3; k++) caixa(g, [x1 - x0, 0.05, 0.32], tabua, [(x0 + x1) / 2, ny + 0.04, zi + 0.2 + k * 0.36]); });
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.4), new THREE.MeshStandardMaterial({ color: 0x2f9e4f, transparent: true, opacity: 0.62, side: THREE.DoubleSide, roughness: 1, depthWrite: false }));
    por(g, tela, [x0 + 2.3, 6.5, ze + 0.06]);
    // Sacos de cimento e um balde em cima da laje, e uma placa "obra" no andaime
    caixa(g, [0.6, 0.35, 0.4], M(0xd8d0bf), [2.5, y(1) + 0.2, 1.5]);
    caixa(g, [0.6, 0.35, 0.4], M(0xd8d0bf), [2.6, y(1) + 0.55, 1.45], [0, 0.3, 0]);
    cilindro(g, [0.2, 0.17, 0.32], M(0x2f6fd0), [-1.5, y(2) + 0.16, 2.2]);
    g.userData = { andaime: { x0, x1, zi, ze, niveis }, alturaLaje: y };
    return g;
  }

  // Guindaste de torre (grua): torre treliçada, cabine, lança girando devagar, carrinho que vai e volta e a carga (um
  // palete de tijolos) pendurada no gancho, balançando. o.giro, o.carrinho, o.gancho, o.carga
  function grua(pai, pos, op = {}) {
    const M = paleta();
    const g = grupo(pai, pos);
    const amarelo = M(0xf2b705, { roughness: 0.5 }), cinza = M(0x5b6470, { metalness: 0.3, roughness: 0.6 }), concreto = M(0xa7a39b);
    const A = op.altura || 21, w = 1.3, sec = 2.1;
    bloco(g, [3.2, 0.7, 3.2], concreto, [0, 0.35, 0]);
    // Torre: 4 montantes e as diagonais de cada face
    const h = w / 2, tr = [];
    [[-h, -h], [h, -h], [h, h], [-h, h]].forEach(([x, z]) => tr.push([[x, 0.7, z], [x, A, z]]));
    for (let y = 0.7; y < A - 0.1; y += sec) {
      const y1 = Math.min(A, y + sec);
      [[[-h, -h], [h, -h]], [[h, -h], [h, h]], [[h, h], [-h, h]], [[-h, h], [-h, -h]]].forEach(([a, b], f) => {
        tr.push([[a[0], y, a[1]], [b[0], y, b[1]]]);
        tr.push(f % 2 ? [[a[0], y, a[1]], [b[0], y1, b[1]]] : [[b[0], y, b[1]], [a[0], y1, a[1]]]);
      });
    }
    barras(g, tr.slice(0, 4), 0.07, amarelo);
    barras(g, tr.slice(4), 0.035, amarelo);
    // Parte que gira: base, cabine, ponta (torre do topo), lança, contra-lança com os contrapesos e os tirantes
    const giro = grupo(g, [0, A, 0]);
    cilindro(giro, [0.95, 0.95, 0.45], cinza, [0, 0.22, 0]);
    const cab = grupo(giro, [0.2, 0.5, w * 0.9]);
    caixa(cab, [1.4, 1.5, 1.3], M(0xf4f4f2), [0, 0.75, 0]);
    caixa(cab, [1.42, 0.7, 1.0], M(0x2d4a63, { roughness: 0.2, metalness: 0.3 }), [0.02, 1.05, 0.02]);
    const L = op.lanca || 19, C = 6.5, lt = [];
    const topo = 1.25, zl = 0.5;
    // Lança (treliça de 3 banzos) pra +x e contra-lança pra -x
    [[-zl, 0], [zl, 0]].forEach(([z]) => { lt.push([[0.6, 0.5, z], [L, 0.5, z]]); lt.push([[-0.6, 0.5, z], [-C, 0.5, z]]); });
    lt.push([[0.6, 0.5 + topo, 0], [L, 0.5 + topo * 0.35, 0]]);
    for (let x = 0.6; x < L - 0.5; x += 1.5) {
      const k = 1 - (0.65 * (x - 0.6)) / L, yt = 0.5 + topo * k;
      lt.push([[x, 0.5, -zl], [x + 0.75, yt, 0]], [[x, 0.5, zl], [x + 0.75, yt, 0]], [[x + 1.5, 0.5, -zl], [x + 0.75, yt, 0]], [[x + 1.5, 0.5, zl], [x + 0.75, yt, 0]], [[x, 0.5, -zl], [x, 0.5, zl]]);
    }
    for (let x = -0.6; x > -C; x -= 1.3) lt.push([[x, 0.5, -zl], [x, 0.5, zl]]);
    barras(giro, lt.slice(0, 5), 0.06, amarelo);
    barras(giro, lt.slice(5), 0.03, amarelo);
    caixa(giro, [C - 0.5, 0.06, 1.1], M(0x8f969e), [-C / 2 - 0.3, 0.5, 0]);
    [-C + 0.6, -C + 1.5].forEach((x) => bloco(giro, [0.8, 1.6, 1.3], concreto, [x, -0.25, 0]));
    // Torre do topo e os tirantes até a ponta da lança e da contra-lança
    barras(giro, [[[-0.5, 0.5, -0.5], [0, 5, 0]], [[-0.5, 0.5, 0.5], [0, 5, 0]], [[0.5, 0.5, -0.5], [0, 5, 0]], [[0.5, 0.5, 0.5], [0, 5, 0]]], 0.06, amarelo);
    barras(giro, [[[0, 5, 0], [L * 0.62, 0.5 + topo * 0.6, 0]], [[0, 5, 0], [-C + 0.3, 0.6, 0]]], 0.022, cinza);
    // Carrinho, cabo, gancho e a carga
    const carrinho = grupo(giro, [10, 0.4, 0]);
    caixa(carrinho, [0.9, 0.35, 1.2], cinza, [0, 0, 0]);
    const cabo = barra(carrinho, [0, 0, 0], [0, -1, 0], 0.02, M(0x1e2226));
    const gancho = grupo(carrinho, [0, -5, 0]);
    caixa(gancho, [0.45, 0.6, 0.3], amarelo, [0, 0, 0]);
    const ganchoPonta = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 6, 12, Math.PI * 1.4), cinza);
    por(gancho, ganchoPonta, [0, -0.45, 0], [0, 0, Math.PI * 0.8]);
    const carga = grupo(gancho, [0, -1.9, 0]);
    caixa(carga, [1.25, 0.14, 1.0], M(0xa57841), [0, -0.52, 0]);
    bloco(carga, [1.1, 0.75, 0.9], M(0xffffff, { map: texTijolo([1.1, 0.75]), roughness: 0.9 }), [0, -0.08, 0]);
    barras(carga, [[[0, 1.25, 0], [-0.55, 0.32, -0.45]], [[0, 1.25, 0], [0.55, 0.32, -0.45]], [[0, 1.25, 0], [-0.55, 0.32, 0.45]], [[0, 1.25, 0], [0.55, 0.32, 0.45]]], 0.014, M(0x2a2e33));
    const giro0 = op.giro || 0, fase = op.fase || 0;
    K.vivo((t) => {
      giro.rotation.y = giro0 + 0.42 * Math.sin(t * 0.11 + fase);
      const d = 10.5 + 4 * Math.sin(t * 0.17 + 1 + fase), desce = 4.2 + 1.6 * Math.sin(t * 0.13 + fase);
      carrinho.position.x = d;
      gancho.position.set(0.18 * Math.sin(t * 1.25), -desce, 0.14 * Math.sin(t * 0.9 + 1));
      cabo.scale.y = desce;
      cabo.position.y = -desce / 2;
      carga.rotation.y = 0.25 * Math.sin(t * 0.35);
    });
    solidoCaixa([pos[0] - 1.7, 0, pos[2] - 1.7], [pos[0] + 1.7, A + 1, pos[2] + 1.7]);
    return { g, giro, carrinho, gancho, carga };
  }

  // Caminhão betoneira (frente pra -x): cabine, 3 eixos e o tambor girando com a faixa em espiral. o.tambor
  function betoneira(pai, pos, giroY = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    const cabine = M(0xf4f4f2), preto = M(0x24272b), aro = M(0xb8bec6, { metalness: 0.5, roughness: 0.35 }), vidro = M(0x2d4a63, { roughness: 0.15, metalness: 0.3 });
    caixa(g, [6.6, 0.35, 1.5], M(0x3b4048), [0.2, 0.95, 0]);
    // Cabine
    caixa(g, [1.9, 1.75, 2.3], cabine, [-2.45, 1.95, 0]);
    caixa(g, [0.08, 0.9, 2.0], vidro, [-3.42, 2.3, 0]);
    [-1, 1].forEach((l) => caixa(g, [1.0, 0.75, 0.06], vidro, [-2.55, 2.3, l * 1.16]));
    caixa(g, [0.25, 0.35, 2.4], M(0x8d939a, { metalness: 0.4 }), [-3.5, 1.05, 0]);
    [-0.82, 0.82].forEach((z) => caixa(g, [0.06, 0.18, 0.4], M(0xfff3c0, { emissive: 0xfff3c0, emissiveIntensity: 0.3 }), [-3.47, 1.35, z]));
    caixa(g, [1.95, 0.3, 2.35], M(0xe8352b), [-2.45, 1.2, 0]);
    // Rodas: dianteira simples e o par de trás com rodado duplo
    [-2.5, 0.9, 2.2].forEach((x) => [-1, 1].forEach((l) => {
      const roda = cilindro(g, [0.52, 0.52, 0.42], preto, [x, 0.52, l * 0.98], [Math.PI / 2, 0, 0], 22);
      cilindro(roda, [0.28, 0.28, 0.44], aro, [0, 0, 0], null, 16);
    }));
    [-2.5, 0.9, 2.2].forEach((x) => caixa(g, [1.2, 0.12, 2.45], preto, [x, 1.12, 0]));
    // Tambor: perfil de ovo inclinado pra trás, com a faixa em espiral (textura) pra ver ele girar
    const tex = textura(256, 64, (c, w, h) => {
      c.fillStyle = '#f39a1e'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffffff';
      for (let i = -2; i < 6; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64 + 26, 0); c.lineTo(i * 64 + 26 + 64, h); c.lineTo(i * 64 + 64, h); c.fill(); }
    });
    const perfil = [[0.05, -2.2], [0.55, -2.05], [1.0, -1.4], [1.18, -0.4], [1.12, 0.6], [0.85, 1.5], [0.48, 2.05], [0.42, 2.25]];
    const geo = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 36);
    const eixo = grupo(g, [0.75, 2.45, 0]);
    eixo.rotation.z = -Math.PI / 2 + 0.2;
    const tambor = K.malha(geo, K.mat(0xffffff, { map: tex, roughness: 0.55 }));
    eixo.add(tambor);
    cilindro(g, [0.07, 0.07, 1.2], M(0x5b6470), [-1.1, 1.75, 0]);
    cilindro(g, [0.07, 0.07, 0.9], M(0x5b6470), [2.4, 1.6, 0]);
    // Bica de despejo e a escadinha de trás
    caixa(g, [1.2, 0.08, 0.45], M(0x5b6470), [3.35, 1.75, 0], [0, 0, -0.45]);
    barras(g, [[[3.0, 1.0, -0.35], [3.0, 3.2, -0.35]], [[3.0, 1.0, 0.35], [3.0, 3.2, 0.35]], ...[1.4, 1.8, 2.2, 2.6, 3.0].map((y) => [[3.0, y, -0.35], [3.0, y, 0.35]])], 0.025, M(0x5b6470));
    K.vivo((t) => { tambor.rotation.y = t * 1.6; });
    solido(g, 0.2);
    return { g, tambor };
  }

  // Escavadeira (frente pra +z): esteiras, a casa que gira, cabine, lança, braço e a concha cavando. o.corpo, o.lanca,
  // o.braco, o.concha
  function escavadeira(pai, pos, giroY = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    const amarelo = M(0xf2b705, { roughness: 0.5 }), preto = M(0x26292d), cinza = M(0x6b737c, { metalness: 0.4 }), vidro = M(0x2d4a63, { roughness: 0.15, metalness: 0.3 });
    [-0.95, 0.95].forEach((x) => {
      const est = K.malha(new THREE.CapsuleGeometry(0.38, 2.3, 6, 16).rotateX(Math.PI / 2), preto);
      est.scale.set(0.75, 1, 1);
      por(g, est, [x, 0.4, 0]);
      for (let z = -1.1; z <= 1.1; z += 0.55) cilindro(g, [0.2, 0.2, 0.62], cinza, [x, 0.4, z], [0, 0, Math.PI / 2], 12);
    });
    caixa(g, [1.6, 0.3, 2.2], cinza, [0, 0.8, 0]);
    const corpo = grupo(g, [0, 0.95, 0]);
    cilindro(corpo, [0.9, 0.9, 0.18], cinza, [0, 0.05, 0]);
    caixa(corpo, [2.3, 0.85, 2.6], amarelo, [0, 0.55, -0.35]);
    caixa(corpo, [2.2, 0.55, 0.7], M(0x3b4048), [0, 0.5, -1.65]);
    const cab = grupo(corpo, [-0.55, 0.95, 0.35]);
    caixa(cab, [0.95, 1.25, 1.05], amarelo, [0, 0.62, 0]);
    caixa(cab, [0.97, 0.75, 0.9], vidro, [0, 0.82, 0.08]);
    cilindro(corpo, [0.08, 0.08, 0.7], M(0x2a2e33), [0.75, 1.25, -0.9]);
    // Lança, braço e concha (cada um gira no seu pino)
    const lanca = grupo(corpo, [0.45, 0.85, 0.85]);
    caixa(lanca, [0.42, 0.42, 2.8], amarelo, [0, 0, 1.3], [0, 0, 0]);
    const braco = grupo(lanca, [0, 0, 2.7]);
    caixa(braco, [0.32, 0.32, 2.0], amarelo, [0, 0, 0.95]);
    barra(lanca, [0, -0.2, 0.2], [0, -0.1, 2.0], 0.07, cinza);
    const concha = grupo(braco, [0, 0, 1.95]);
    caixa(concha, [0.8, 0.55, 0.5], M(0x4a4f56), [0, -0.22, 0.2]);
    for (let i = -2; i <= 2; i++) caixa(concha, [0.08, 0.16, 0.12], cinza, [i * 0.16, -0.52, 0.42]);
    K.vivo((t) => {
      const c = (Math.sin(t * 0.55) + 1) / 2;
      corpo.rotation.y = 0.35 * Math.sin(t * 0.28);
      lanca.rotation.x = -0.55 + 0.4 * c;
      braco.rotation.x = 0.9 - 0.7 * c;
      concha.rotation.x = 0.6 - 0.9 * c;
    });
    solidoCaixa([pos[0] - 1.6, 0, pos[2] - 2.2], [pos[0] + 1.6, 3, pos[2] + 2.2]);
    return { g, corpo, lanca, braco, concha };
  }

  // Carrinho de mão (frente, a roda, pra +z): caçamba verde, roda, pernas e cabos
  function carrinhoDeMao(pai, pos, giroY = 0, cheio = true) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    const perfil = [[0.02, 0], [0.38, 0.02], [0.45, 0.32], [0.47, 0.36]];
    const cacamba = K.malha(new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(r, y)), 20), M(0x2f9e4f, { side: THREE.DoubleSide, metalness: 0.2 }));
    cacamba.scale.set(0.85, 1, 1.25);
    por(g, cacamba, [0, 0.42, 0.05]);
    if (cheio) esfera(g, 0.36, M(0xc9a46b), [0, 0.66, 0.05], [1, 0.32, 1.35]);
    cilindro(g, [0.2, 0.2, 0.1], M(0x26292d), [0, 0.2, 0.68], [0, 0, Math.PI / 2], 18);
    [-0.25, 0.25].forEach((x) => {
      barra(g, [x * 0.6, 0.2, 0.68], [x * 1.2, 0.55, -0.85], 0.025, M(0x8a4b2a));
      barra(g, [x, 0.42, -0.25], [x, 0, -0.3], 0.025, M(0x5b6470));
    });
    return g;
  }

  // Cone de trânsito laranja com faixa branca
  function cone(pai, pos) {
    const M = paleta();
    const g = grupo(pai, pos);
    caixa(g, [0.42, 0.05, 0.42], M(0xe8571b), [0, 0.025, 0]);
    cilindro(g, [0.035, 0.17, 0.6], M(0xf26b1d), [0, 0.33, 0]);
    cilindro(g, [0.09, 0.115, 0.12], M(0xffffff), [0, 0.4, 0]);
    return g;
  }
  // Cavalete listrado (barreira de obra)
  function cavalete(pai, pos, giroY = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    const tex = textura(128, 32, (c, w, h) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#e8352b';
      for (let i = -1; i < 5; i++) { c.beginPath(); c.moveTo(i * 32, h); c.lineTo(i * 32 + 16, h); c.lineTo(i * 32 + 32, 0); c.lineTo(i * 32 + 16, 0); c.fill(); }
    });
    caixa(g, [1.4, 0.22, 0.05], K.mat(0xffffff, { map: tex }), [0, 0.85, 0]);
    caixa(g, [1.4, 0.22, 0.05], K.mat(0xffffff, { map: tex }), [0, 0.5, 0]);
    [-0.6, 0.6].forEach((x) => { barra(g, [x, 0, -0.3], [x, 1.0, 0], 0.03, M(0xf2f2f2)); barra(g, [x, 0, 0.3], [x, 1.0, 0], 0.03, M(0xf2f2f2)); });
    return g;
  }
  // Palete de tijolos
  function paleteTijolos(pai, pos, giroY = 0, alt = 0.75) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    caixa(g, [1.2, 0.14, 1.0], M(0xa57841), [0, 0.07, 0]);
    bloco(g, [1.08, alt, 0.9], M(0xffffff, { map: texTijolo([1.08, alt]), roughness: 0.9 }), [0, 0.14 + alt / 2, 0]);
    return g;
  }
  // Pilha de sacos de cimento
  function sacosCimento(pai, pos, giroY = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    caixa(g, [1.3, 0.14, 1.0], M(0xa57841), [0, 0.07, 0]);
    const saco = M(0xdcd5c5), faixa = M(0x2f6fd0);
    [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 2]].forEach(([i, j], k) => {
      const s = caixa(g, [0.6, 0.18, 0.92], saco, [-0.3 + i * 0.62 - (j === 2 ? 0.02 : 0), 0.24 + j * 0.19, 0], [0, k * 0.05, 0]);
      caixa(s, [0.2, 0.185, 0.93], faixa, [0, 0, 0]);
    });
    return g;
  }
  // Monte (areia, brita, terra): cone de base larga com o topo arredondado
  function monte(pai, pos, raio, alt, cor, seed = 2) {
    const perfil = [];
    for (let i = 0; i <= 10; i++) { const k = i / 10; perfil.push(new THREE.Vector2(raio * (1 - k) ** 1.1 + 0.001, alt * (1 - (1 - k) ** 2.2))); }
    const geo = new THREE.LatheGeometry(perfil, 28);
    const p = geo.attributes.position, r = K.rand(seed);
    const fases = [r() * 6, r() * 6];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const a = Math.atan2(z, x), k = 1 + 0.08 * Math.sin(a * 3 + fases[0]) + 0.05 * Math.sin(a * 5 + fases[1]);
      p.setXYZ(i, x * k, y, z * k);
    }
    geo.computeVertexNormals();
    const m = K.malha(geo, K.mat(cor, { roughness: 1, map: K.texGrao(3) }));
    por(pai, m, pos);
    return m;
  }
  // Contêiner do escritório da obra (frente pra +z), com porta, janela e a caixa d'água em cima
  function conteiner(pai, pos, giroY = 0, noite = false) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    const tex = textura(256, 64, (c, w, h) => {
      c.fillStyle = '#e9edf0'; c.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 16) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x, 0, 5, h); }
    }, [3, 1]);
    bloco(g, [6, 2.6, 2.4], K.mat(0xffffff, { map: tex, roughness: 0.6 }), [0, 1.3 + 0.2, 0]);
    [-2.6, 2.6].forEach((x) => bloco(g, [0.3, 0.2, 2.3], M(0x6b737c), [x, 0.1, 0]));
    caixa(g, [0.9, 2.0, 0.08], M(0x2f6fd0), [-1.6, 1.2, 1.22]);
    caixa(g, [1.6, 0.9, 0.06], M(noite ? 0xffd58a : 0x2d4a63, noite ? { emissive: 0xffc56a, emissiveIntensity: 1.2 } : { roughness: 0.15 }), [1.2, 1.75, 1.22]);
    caixa(g, [1.0, 0.15, 0.7], M(0x8d939a), [-1.6, 0.08, 1.6]);
    cilindro(g, [0.55, 0.45, 0.85], M(0x3a7be0), [1.8, 3.25, -0.3]);
    cilindro(g, [0.6, 0.6, 0.12], M(0x2f63b8), [1.8, 3.72, -0.3]);
    const placa = K.placa('ESCRITÓRIO\nDA OBRA', { larg: 1.6, alt: 0.55, fundo: '#f5c518' });
    por(g, placa, [-0.2, 2.25, 1.23]);
    solido(g, 0.15);
    return g;
  }
  // Banheiro químico azul
  function banheiroQuimico(pai, pos, giroY = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    caixa(g, [1.15, 2.25, 1.15], M(0x2f6fd0), [0, 1.13, 0]);
    caixa(g, [1.25, 0.12, 1.25], M(0xf4f4f2), [0, 2.3, 0]);
    caixa(g, [0.8, 1.8, 0.05], M(0x2559b0), [0, 1.0, 0.59]);
    solido(g, 0.1);
    return g;
  }
  // Tapume de obra: chapas brancas com faixa azul, de a até b (no chão)
  function tapume(pai, a, b, op = {}) {
    const M = paleta();
    const d = V3(b).sub(V3(a)), comp = d.length();
    const tex = textura(256, 128, (c, w, h) => {
      c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, w, h);
      c.fillStyle = op.faixa || '#2f63b8'; c.fillRect(0, h * 0.72, w, h * 0.14);
      c.fillStyle = 'rgba(0,0,0,0.13)'; c.fillRect(0, 0, 3, h);
    }, [comp / 2.2, 1]);
    const g = grupo(pai, [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2], Math.atan2(-d.z, d.x));
    bloco(g, [comp, 2.2, 0.06], K.mat(0xffffff, { map: tex, roughness: 0.7 }), [0, 1.1, 0]);
    for (let x = -comp / 2; x <= comp / 2 + 0.01; x += 2.2) bloco(g, [0.08, 2.3, 0.1], M(0x9aa3ab), [x, 1.15, -0.07]);
    solido(g, 0.3);
    return g;
  }
  // Placa grande da obra em dois postes (texto em linhas)
  function placaObra(pai, pos, giroY, texto) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    [-1.5, 1.5].forEach((x) => cilindro(g, [0.07, 0.07, 3.6], M(0x6b737c), [x, 1.8, -0.05]));
    const placa = K.placa(texto, { larg: 3.6, alt: 2.0, fundo: '#1f5fae', cor: '#ffffff', borda: '#f5c518' });
    por(g, placa, [0, 2.6, 0.02]);
    const costas = K.malha(new THREE.PlaneGeometry(3.6, 2.0), M(0x8d939a, { side: THREE.BackSide }));
    por(g, costas, [0, 2.6, 0.01]);
    solido(g, 0.2);
    return g;
  }

  CENARIOS.construcao = function (C, g, op) {
    const sem = new Set(op.sem || []);
    C.ceu = 'dia';
    C.neblina = [70, 260, 700];
    C.caixaSombra = 22;
    // Chão: terra batida dentro do lote (com marcas de pneu), grama do lado de fora
    const lote = [-16, 16, -28, 14];
    chao(g, {
      zona: (x, z, mancha) => {
        const dentro = Math.min(x - lote[0], lote[1] - x, z - lote[2], lote[3] - z);
        if (dentro < -0.5) return null;
        const pneu = (Math.abs(((x * 0.5 + z * 0.12) % 3 + 3) % 3 - 1.5) < 0.18 && z < 4) ? 0.12 : 0;
        const cor = new THREE.Color(0x9b7a52).lerp(new THREE.Color(0x7d6243), K.clamp(mancha - 0.25 + pneu * 3));
        return [cor.getHex(), K.clamp(dentro + 0.5)];
      }
    });
    // Laje de concreto na frente do prédio e a trilha de brita até o portão
    bloco(g, [13, 0.06, 4], K.mat(0xbdb9b0), [-2, 0.03, -10.6]);
    // Prédio em obra, andaime, guindaste e máquinas
    const predio = predioEmObra(g, [-2, 0, -16.5]);
    solidoCaixa([-8.2, 0, -21], [4.2, 13, -12.6]);
    solidoCaixa([-7.6, 0, -12.6], [1.8, 9.2, -10.7]);
    C.objetos.predio = predio;
    if (!sem.has('guindaste')) {
      const G = grua(g, [3.5, 0, -24], { giro: Math.atan2(-11, -9), altura: 21 });
      C.objetos.guindaste = G.g; C.objetos.carga = G.carga; C.objetos.gancho = G.gancho; C.objetos.lancaGuindaste = G.giro;
      C.lugares.guindaste = [3.5, 12, -24];
    }
    if (!sem.has('betoneira')) {
      const B = betoneira(g, [8.2, 0, -8.2], -0.5);
      C.objetos.betoneira = B.g; C.objetos.tambor = B.tambor;
      C.lugares.betoneira = [8.2, 1.8, -8.2];
    }
    if (!sem.has('escavadeira')) {
      const E = escavadeira(g, [-9.2, 0, -7.4], 0.75);
      C.objetos.escavadeira = E.g; C.objetos.bracoEscavadeira = E.lanca;
      monte(g, [-11.3, 0, -4.2], 1.9, 1.3, 0x8a6a45, 4);
      C.lugares.escavadeira = [-9.2, 1.5, -7.4];
    }
    // Materiais: areia, brita, tijolos, cimento, vergalhões, tábuas
    C.objetos.areia = monte(g, [-5.4, 0, -6.2], 1.7, 1.15, 0xd9b97a, 7);
    monte(g, [-3.0, 0, -7.4], 1.2, 0.8, 0x9b9a96, 9);
    C.objetos.tijolos = paleteTijolos(g, [4.6, 0, -4.2], 0.2);
    paleteTijolos(g, [5.9, 0, -4.5], -0.1, 0.55);
    C.objetos.cimento = sacosCimento(g, [4.2, 0, -2.3], -0.25);
    const M = paleta();
    const verg = grupo(g, [1.2, 0, -6.6], 0.1);
    [-1.4, 1.4].forEach((x) => caixa(verg, [0.25, 0.18, 1.2], M(0x8b5b35), [x, 0.09, 0]));
    barras(verg, Array.from({ length: 14 }, (_, i) => [[-2.6, 0.22 + (i % 3) * 0.04, -0.4 + i * 0.06], [2.6, 0.22 + (i % 3) * 0.04, -0.4 + i * 0.06]]), 0.018, M(0x8a4b2a));
    const tabuas = grupo(g, [-6.6, 0, -2.6], -0.4);
    for (let i = 0; i < 6; i++) caixa(tabuas, [3.2, 0.05, 0.28], M(0xc89a5c), [0, 0.04 + Math.floor(i / 3) * 0.06, -0.3 + (i % 3) * 0.3]);
    // Perto do palco: carrinho de mão, cones, cavalete e a pá enfiada na areia
    C.objetos.carrinho = carrinhoDeMao(g, [-2.9, 0, 2.4], 0.6);
    C.objetos.cones = [[2.6, 0, 3.8], [3.7, 0, 3.4], [4.8, 0, 3.0]].map((p) => cone(g, p));
    cavalete(g, [6.2, 0, 1.6], -0.6);
    const pa = grupo(g, [-4.6, 0.6, -5.5], 0, 0);
    barra(pa, [0, 0, 0], [0.3, 1.3, 0.4], 0.025, M(0x8a5a2a));
    caixa(pa, [0.26, 0.34, 0.04], M(0x6b737c, { metalness: 0.4 }), [-0.02, -0.12, -0.02], [0.3, 0, 0.2]);
    // Lateral esquerda: contêiner do escritório e o banheiro químico; lateral direita: a placa da obra
    C.objetos.conteiner = conteiner(g, [-12.3, 0, -13.5], 0.35, C.noite);
    banheiroQuimico(g, [-13.6, 0, -8.6], 0.6);
    C.objetos.placa = placaObra(g, [11.5, 0, -6.5], -0.75, 'OBRA\nRESIDENCIAL\nPREVISÃO: 2027');
    // Tapume em volta do lote (aberto na frente, onde fica a câmera)
    tapume(g, [lote[0], 0, lote[2]], [lote[1], 0, lote[2]]);
    tapume(g, [lote[0], 0, lote[2]], [lote[0], 0, 6]);
    tapume(g, [lote[1], 0, lote[2]], [lote[1], 0, 6]);
    const aviso = K.placa('USE\nCAPACETE', { larg: 1.1, alt: 1.1, fundo: '#f5c518' });
    por(g, aviso, [lote[1] - 0.06, 1.3, -1.5], [0, -Math.PI / 2, 0]);
    // Lá fora: cidade no horizonte, morros e árvores
    [[-26, -48, 9, 4.5, 0xd9d2c5], [-14, -58, 14, 5, 0xa9c4e0], [16, -52, 11, 4.5, 0xe0c7a8], [30, -62, 16, 5.5, 0xc5cfd8], [0, -70, 18, 6, 0xd4c9b8]].forEach(([x, z, and, l, cor]) => {
      const p = K.predio(and, l, l, cor);
      g.add(p.g);
      p.g.position.set(x, 0, z);
      p.g.scale.setScalar(1.8);
    });
    [[-60, -90, 34, 12, K.cores.morroLonge], [40, -100, 40, 14, K.cores.morro], [-10, -120, 55, 16, K.cores.morroLonge]].forEach(([x, z, r, a, cor]) => morro(g, [x, z], r, a, cor));
    arvoresLonge(g, [[-22, -10, 1.4], [-24, 2, 1.6, true], [22, -14, 1.5], [24, 0, 1.3, true], [-20, -32, 1.6], [18, -34, 1.7, true], [-34, -20, 1.5], [35, -24, 1.6]]);
    nuvens(g, [[-30, 46, -110, 3.2], [22, 52, -130, 4], [55, 44, -100, 3]]);
    tufos(g, 500, [-30, 30, 12, 30], [], 7);
    // Operários: um martelando no andaime, outro levando o carrinho de mão pra lá e pra cá
    if (!sem.has('operarios')) {
      const and = predio.userData.andaime;
      const w1 = figurante(g, { tipo: 'operario' });
      const p1 = [-2 - 1.2, 3.25, -16.5 + and.zi + 0.45];
      const w2 = figurante(g, { tipo: 'operario', cores: { camiseta: 0x2f6fd0, capacete: 0xffffff }, barba: false });
      const carrinho2 = carrinhoDeMao(g, [0, 0, 0], 0, true);
      const ida = [-6.2, 0, -9.6], volta = [1.6, 0, -9.6];
      K.vivo((t) => {
        w1.reset(t);
        w1.g.position.set(...p1);
        w1.g.rotation.y = Math.PI;
        const bate = Math.abs(Math.sin(t * 4.2));
        w1.pose({ z: 0.15 }, { x: -1.6 - 0.9 * bate, z: 0.2, c: -0.4 });
        w2.reset(t);
        const T = 16, u = (t % T) / T, vai = u < 0.5, k = vai ? u * 2 : (u - 0.5) * 2;
        const de = vai ? ida : volta, ate = vai ? volta : ida;
        const p = w2.irPara(de, ate, K.faixa(k, 0.05, 0.95), t, { vel: 0.8, reto: false });
        w2.pose({ x: -0.7, z: 0.1, c: -0.2 }, { x: -0.7, z: 0.1, c: -0.2 });
        const dir = Math.sign(ate[0] - de[0]);
        carrinho2.position.set(p[0] + dir * 0.85, 0, p[2]);
        carrinho2.rotation.set(0, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0);
        carrinho2.rotateX(0.12);
      });
      C.objetos.operarios = [w1, w2];
    }
    // Poeira no ar
    particulas(g, 90, [0, 0, -6], [30, 5, 24], { cor: 0xd8c6a6, tam: 0.07, opacidade: 0.5, normal: true, sobe: 0.02 });
    Object.assign(C.lugares, { predio: [-2, 6, -16.5], andaime: [-2, 4, -12.2], laje: [-2, 9.9, -16.5], areia: [-5.4, 0.6, -6.2], tijolos: [4.6, 0.5, -4.2], cimento: [4.2, 0.4, -2.3], carrinho: [-2.9, 0.5, 2.4], placa: [11.5, 2.6, -6.5], conteiner: [-12.3, 1.5, -13.5] });
    C.fundo = [-2, 6, -16.5];
    C.entrada = [-3.5, 0, 5.5];
    C.vista = { pos: [5, 2.2, 13], alvo: [-1, 6.5, -16] };
  };

  // ---------- Natureza: campo de grama, poucas árvores, montanhas com neve e céu azul ----------

  CENARIOS.natureza = function (C, g, op) {
    C.ceu = 'azul';
    C.neblina = [120, 640, 1000];
    // Trilha de terra que sai da frente e some entre os morros
    const trilha = [];
    for (let i = 0; i <= 24; i++) { const z = 14 - i * 2.1; trilha.push([-4.4 + z * 0.04 + Math.max(0, -z) * 0.27 + Math.sin(i * 0.5) * 0.5, z]); }
    chao(g, {
      tam: 900, seg: 260, cores: [0x6fae46, 0x9fd468, 0xb9d26a], grao: 220,
      relevo: (x, z) => { const r = Math.hypot(x, z * 0.8); return r < 34 ? 0 : (r - 34) * 0.012 * (1 + Math.sin(x * 0.03) * Math.sin(z * 0.025)) * 6; }
    });
    faixaNoChao(g, trilha, 1.5, 0xc29a68, { afina: 0.6 });
    // Morros verdes no meio do caminho e as montanhas de neve lá no fundo
    [[-70, -95, 45, 14, 0x7db55a], [55, -105, 50, 16, 0x8cc164], [0, -125, 60, 15, 0x79b157], [-140, -80, 50, 18, 0x86bb5f], [130, -90, 55, 17, 0x7db55a]].forEach(([x, z, r, a, cor]) => morro(g, [x, z], r, a, cor));
    [[-150, -380, 80, 62, 1], [-55, -430, 95, 84, 2], [55, -400, 85, 70, 3], [160, -370, 80, 58, 4], [-250, -340, 80, 50, 5], [255, -350, 85, 54, 6]].forEach(([x, z, r, a, s]) => montanha(g, [x, z], r, a, s, { neve: 0.68, rocha: 0x8a96a6, grama: 0x6f9a5a }));
    // Poucas árvores: três copas redondas perto e alguns pinheiros mais longe
    const r = K.rand(op.seed || 17);
    [[-7.5, -7, 1.35, false], [9.5, -11, 1.6, false], [-15, -21, 1.75, false], [17, -27, 1.5, true], [-24, -38, 2.0, true], [6, -46, 2.2, true]].forEach(([x, z, s, p]) => {
      const a = K.arvore(x, z, s, p, r);
      g.add(a);
      if (Math.hypot(x, z) < 16) solido(a, 0.1);
    });
    arvoresLonge(g, [[-38, -60, 2.2, true], [-30, -66, 2.4, true], [34, -70, 2.6, true], [42, -64, 2.1, true], [-60, -48, 2.4], [60, -52, 2.6]]);
    // Pedras grandes e pequenas, flores, arbustos, borboletas e pássaros
    const M = paleta();
    [[5.5, -4.5, 0.55], [6.3, -4.0, 0.3], [-10.5, -2.5, 0.7], [12, -16, 0.9]].forEach(([x, z, s], i) => {
      const p = K.malha(new THREE.IcosahedronGeometry(s, 0), M(i % 2 ? 0x9a958c : 0xb3ada2));
      p.position.set(x, s * 0.45, z);
      p.rotation.set(i, i * 2, 0);
      p.scale.y = 0.7;
      g.add(p);
    });
    K.enfeitar(g, 21, { flores: 170, arbustos: 12, pedras: 18, borboletas: 7, passaros: 5 });
    tufos(g, 2200, [-16, 16, -12, 14], [[0, 0, 1.4]], 5);
    tufos(g, 900, [-40, 40, -40, -12], [], 6, 1.2);
    nuvens(g, [[-30, 34, -90, 4], [26, 42, -120, 5], [70, 36, -100, 3.5]]);
    Object.assign(C.lugares, { arvore: [-7.5, 0, -7], trilha: [-4.2, 0, 6], pedra: [5.5, 0.4, -4.5], montanha: [-55, 60, -430] });
    C.fundo = [-55, 50, -430];
    C.vista = { pos: [3, 2.4, 13], alvo: [-1, 3.2, -20] };
    C.entrada = [-3.2, 0, 9];
  };

  // ---------- Cidade: calçadão, rua com carros passando e prédios do outro lado ----------

  // Textura de piso em placas (calçada, cozinha, consultório). tam: lado da placa em metros; rep: [larg, prof] do piso
  function texPiso(rep, tam, cor1, cor2, junta = '#9a948a') {
    return textura(128, 128, (c, w, h) => {
      c.fillStyle = junta; c.fillRect(0, 0, w, h);
      [[0, 0, cor1], [64, 0, cor2], [0, 64, cor2], [64, 64, cor1]].forEach(([x, y, cor]) => { c.fillStyle = cor; c.fillRect(x + 2, y + 2, 60, 60); });
    }, [rep[0] / (tam * 2), rep[1] / (tam * 2)]);
  }
  // Poste de rua (luz acesa de noite)
  function poste(pai, pos, giroY = 0, noite = false) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    cilindro(g, [0.09, 0.13, 6.4], M(0x4a5058, { metalness: 0.4 }), [0, 3.2, 0]);
    barra(g, [0, 6.2, 0], [0, 6.5, 1.4], 0.06, M(0x4a5058));
    caixa(g, [0.5, 0.16, 0.8], M(0x3b4048), [0, 6.45, 1.6]);
    caixa(g, [0.42, 0.04, 0.7], M(noite ? 0xfff2c4 : 0xe9eef2, noite ? { emissive: 0xffe6a0, emissiveIntensity: 2 } : {}), [0, 6.36, 1.6]);
    return g;
  }
  // Semáforo com o ciclo verde, amarelo e vermelho (o.luzes)
  function semaforo(pai, pos, giroY = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    cilindro(g, [0.08, 0.1, 3.4], M(0x3b4048), [0, 1.7, 0]);
    caixa(g, [0.42, 1.2, 0.35], M(0x24272b), [0, 3.5, 0]);
    const cores = [0xe8352b, 0xf5c518, 0x2fb54a];
    const luzes = cores.map((c, i) => {
      const m = K.mat(c, { emissive: c, emissiveIntensity: 0 });
      cilindro(g, [0.13, 0.13, 0.06], m, [0, 3.88 - i * 0.37, 0.18], [Math.PI / 2, 0, 0], 16);
      return m;
    });
    K.vivo((t) => {
      const f = t % 12, aceso = f < 5 ? 2 : f < 7 ? 1 : 0;
      luzes.forEach((m, i) => { m.emissiveIntensity = i === aceso ? 1.6 : 0.03; });
    });
    return { g, luzes };
  }
  // Árvore de calçada no canteiro quadrado
  function arvoreDeCalcada(pai, pos, s = 1, seed = 3) {
    const M = paleta();
    const g = grupo(pai, pos);
    bloco(g, [1.2, 0.2, 1.2], M(0x8d8a84), [0, 0.1, 0]);
    bloco(g, [1.0, 0.04, 1.0], M(0x6b4a2e), [0, 0.2, 0]);
    g.add(K.arvore(0, 0, s, false, K.rand(seed)));
    return g;
  }
  // Ônibus (frente pra +x)
  function onibus(pai, cor = 0x2f7fe0) {
    const M = paleta();
    const g = grupo(pai);
    caixa(g, [9, 2.4, 2.4], M(cor, { roughness: 0.45 }), [0, 1.6, 0]);
    caixa(g, [9.02, 0.9, 2.42], M(0x26394d, { roughness: 0.15, metalness: 0.3 }), [0, 2.05, 0]);
    caixa(g, [9.04, 0.3, 2.44], M(0xf4f4f2), [0, 0.65, 0]);
    [-3, 3].forEach((x) => [-1, 1].forEach((l) => cilindro(g, [0.5, 0.5, 0.3], M(0x24272b), [x, 0.5, l * 1.1], [Math.PI / 2, 0, 0], 18)));
    caixa(g, [0.06, 0.25, 1.6], M(0xfff3c0, { emissive: 0xfff3c0, emissiveIntensity: 0.4 }), [4.52, 0.95, 0]);
    return g;
  }
  // Ponto de ônibus com cobertura e banco
  function pontoDeOnibus(pai, pos, giroY = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    [-1.3, 1.3].forEach((x) => cilindro(g, [0.05, 0.05, 2.5], M(0x5b6470), [x, 1.25, -0.4]));
    caixa(g, [3.0, 0.08, 1.3], M(0x2f6fd0), [0, 2.52, 0]);
    const vidro = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), new THREE.MeshStandardMaterial({ color: 0xbfe0f0, transparent: true, opacity: 0.35, roughness: 0.1, side: THREE.DoubleSide }));
    por(g, vidro, [0, 1.35, -0.42]);
    caixa(g, [2.2, 0.08, 0.4], M(0x8b5b35), [0, 0.5, -0.15]);
    const placa = K.placa('ÔNIBUS', { larg: 0.9, alt: 0.3, fundo: '#2f6fd0', cor: '#ffffff' });
    por(g, placa, [1.3, 2.25, -0.33]);
    return g;
  }

  CENARIOS.cidade = function (C, g, op) {
    const M = paleta();
    C.ceu = 'dia';
    C.neblina = [80, 300, 700];
    C.caixaSombra = 22;
    chao(g, { cores: [0x6f9e4c, 0x8cbc5c, 0x9fb85e], grao: 150 });
    // Calçadão (palco), meio-fio, rua de duas mãos e a calçada do outro lado
    const xR = [-90, 90], comp = xR[1] - xR[0];
    bloco(g, [comp, 0.14, 13], M(0xffffff, { map: texPiso([comp, 13], 0.5, '#dcd6ca', '#d3ccbf', '#c2bbae') }), [0, 0.07, 3.5]);
    bloco(g, [comp, 0.18, 0.3], M(0xb0aaa0), [0, 0.09, -3.1]);
    const asfalto = M(0x3d4147, { roughness: 0.95, map: K.texGrao(60) });
    bloco(g, [comp, 0.04, 8], asfalto, [0, 0.02, -7.2]);
    for (let x = xR[0]; x < xR[1]; x += 6) bloco(g, [3, 0.012, 0.18], M(0xf5c518), [x, 0.045, -7.2]);
    [-3.5, -10.9].forEach((z) => bloco(g, [comp, 0.012, 0.12], M(0xf4f4f0), [0, 0.045, z]));
    for (let k = 0; k < 7; k++) bloco(g, [0.55, 0.012, 6.8], M(0xf4f4f0), [6.2 + k * 0.95, 0.046, -7.2]);
    bloco(g, [comp, 0.18, 0.3], M(0xb0aaa0), [0, 0.09, -11.35]);
    bloco(g, [comp, 0.14, 4.6], M(0xffffff, { map: texPiso([comp, 4.6], 0.5, '#d4cdc0', '#cbc3b5', '#bab2a4') }), [0, 0.07, -13.8]);
    // Prédios prontos do outro lado da rua (Kenney) e os altos atrás
    const tipos = ['building-small-b', 'building-small-a', 'building-small-c', 'building-small-d', 'building-small-b', 'building-garage', 'building-small-c', 'building-small-a'];
    for (let i = 0, x = -36; x <= 36; x += 6, i++) K.modelo('kenney-cidade/' + tipos[i % tipos.length], { escala: 6, pos: [x, 0.14, -19.2], pai: g });
    solidoCaixa([-40, 0, -22.5], [40, 11, -16]);
    [[-30, -38, 22, 6, 0xc5cfd8], [-16, -44, 30, 7, 0xd9d2c5], [-2, -36, 18, 6, 0xa9c4e0], [12, -42, 26, 7, 0xe0c7a8], [26, -36, 20, 6, 0xc9d6c2], [40, -46, 32, 8, 0xd4c9b8], [-44, -48, 28, 7, 0xbac7d4]].forEach(([x, z, and, l, cor]) => {
      const p = K.predio(and, l, l, cor);
      g.add(p.g);
      p.g.position.set(x, 0, z);
      p.g.scale.setScalar(1.6);
      if (C.noite) p.g.children.forEach((c) => { if (c.isInstancedMesh) c.material = K.mat(0xffe6a8, { emissive: 0xffd27a, emissiveIntensity: 0.9 }); });
    });
    // Do lado de cá (atrás da câmera): mais prédios, pra câmera 'tras' ter fundo
    for (let i = 0, x = -30; x <= 30; x += 6, i++) K.modelo('kenney-cidade/' + tipos[(i + 3) % tipos.length], { escala: 6, pos: [x, 0.14, 21], giro: 180, pai: g });
    solidoCaixa([-34, 0, 18], [34, 11, 24]);
    bloco(g, [comp, 0.14, 12], M(0xffffff, { map: texPiso([comp, 12], 0.5, '#dcd6ca', '#d3ccbf', '#c2bbae') }), [0, 0.07, 16]);
    [[-8, 8.5], [8, 8.5], [-15, 6], [15, 6]].forEach(([x, z], i) => {
      const vaso = grupo(g, [x, 0.14, z]);
      bloco(vaso, [1.4, 0.55, 1.4], M(0xb9b3a8), [0, 0.27, 0]);
      for (let k = 0; k < 6; k++) esfera(vaso, 0.24, M([0x3f8a35, 0x4f9a3a][k % 2]), [Math.sin(k) * 0.35, 0.7 + (k % 2) * 0.1, Math.cos(k * 1.3) * 0.35]);
      [0, 1, 2].forEach((f) => esfera(vaso, 0.1, M([0xff5a8a, 0xffd23f, 0xb57cff][(f + i) % 3]), [Math.sin(f * 2) * 0.4, 0.95, Math.cos(f * 2) * 0.4]));
    });
    // Coisas da calçada: postes, árvores, semáforo, ponto de ônibus, banco, lixeira e hidrante
    [-14, 0, 14].forEach((x) => poste(g, [x + 3.5, 0.14, -2.6], Math.PI, C.noite));
    [-9.5, 9.5].forEach((x, i) => arvoreDeCalcada(g, [x, 0.14, -1.6], 1.25, 3 + i));
    const S = semaforo(g, [5.2, 0.14, -2.7], 0);
    C.objetos.semaforo = S.g;
    pontoDeOnibus(g, [-6.2, 0.14, -1.9], 0);
    const banco = grupo(g, [4.8, 0.14, 4.6], Math.PI);
    caixa(banco, [1.8, 0.08, 0.5], M(0x8b5b35), [0, 0.48, 0]);
    caixa(banco, [1.8, 0.4, 0.06], M(0x8b5b35), [0, 0.78, -0.24]);
    [-0.75, 0.75].forEach((x) => caixa(banco, [0.08, 0.48, 0.45], M(0x3b4048), [x, 0.24, 0]));
    cilindro(g, [0.28, 0.24, 0.85], M(0x2f9e4f), [-3.6, 0.57, -2.2]);
    cilindro(g, [0.12, 0.14, 0.6], M(0xe8352b), [11.8, 0.44, -2.5]);
    // Carros e ônibus passando nas duas mãos (o carro do kit, na escala certa perto do personagem)
    const cores = [0xe8352b, 0x2f7fe0, 0xf5f5f5, 0xf5c518, 0x3a3f4a, 0x2fb54a];
    const carros = [];
    cores.forEach((cor, i) => {
      const car = K.carro(cor);
      g.add(car);
      car.scale.setScalar(1.35);
      carros.push({ car, mao: i % 2, fase: i * 37 + (i % 2) * 11, vel: 9 + (i % 3) });
    });
    const bus = onibus(g, 0x2f6fd0);
    carros.push({ car: bus, mao: 1, fase: 70, vel: 7 });
    K.vivo((t) => carros.forEach(({ car, mao, fase, vel }) => {
      const x = (((t * vel + fase) % 180) + 180) % 180 - 90;
      car.position.set(mao ? -x : x, 0.04, mao ? -9.1 : -5.3);
      car.rotation.y = mao ? Math.PI : 0;
    }));
    C.objetos.carros = carros.map((c) => c.car);
    // Pedestres do outro lado
    const andantes = [figurante(g, { tipo: 'menina' }), figurante(g, { cores: { camiseta: 0x8a4fd8 } })];
    K.vivo((t) => andantes.forEach((b, i) => {
      b.reset(t);
      const x = ((t * 1.1 + i * 23) % 60) - 30, dir = i ? -1 : 1;
      b.colocar([dir * x, 0.14, -13.2 - i * 0.9], dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      b.andar(t, 0.9);
    }));
    morro(g, [-80, -140], 60, 18, K.cores.morroLonge);
    morro(g, [70, -150], 70, 20, K.cores.morro);
    nuvens(g, [[-30, 44, -120, 3.5], [30, 50, -140, 4.2], [70, 40, -110, 3]]);
    Object.assign(C.lugares, { rua: [0, 0.04, -7.2], faixa: [9, 0.05, -7.2], semaforo: [5.2, 3.6, -2.7], ponto: [-6.2, 0.14, -1.9], predio: [0, 5, -19.2], calcada_de_la: [0, 0.14, -13.8], banco: [4.8, 0.6, 4.6] });
    C.centro = [0, 0.14, 0.6];
    C.personagem = [1.6, 0.14, 1.5];
    C.entrada = [-4, 0.14, 6];
    C.esquerda = [-2.6, 0.14, 1.0];
    C.direita = [2.9, 0.14, 0.9];
    C.fundo = [0, 5, -19.2];
    C.vista = { pos: [4, 2.6, 13], alvo: [-1, 3.2, -14] };
  };

  // ---------- Casa: frente de casa com quintal, caixa d'água, árvore e cachorro ----------

  // Casa térrea (frente pra +z): paredes, telhado de duas águas, porta, janelas com floreira, a caixa d'água azul em cima
  // e a torneira do jardim. Do tamanho certo perto do personagem (a porta tem 2,1)
  function casaTerrea(pai, pos, giroY = 0, op = {}) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    const L = 8, A = 3.0, P = 6.5, cor = op.cor || 0xf2d9a6;
    bloco(g, [L + 0.6, 0.25, P + 0.6], M(0xbdb5a8), [0, 0.125, 0]);
    bloco(g, [L, A, P], M(cor), [0, 0.25 + A / 2, 0]);
    const ang = Math.atan(1.6 / (P / 2));
    [1, -1].forEach((lado) => bloco(g, [L + 1.0, 0.18, Math.hypot(P / 2 + 0.6, 1.6)], M(op.telhado || 0xc8442f), [0, 0.25 + A + 0.82, lado * (P / 4 + 0.15)], [lado * ang, 0, 0]));
    const tri = new THREE.Shape();
    tri.moveTo(-P / 2, 0); tri.lineTo(P / 2, 0); tri.lineTo(0, 1.6); tri.lineTo(-P / 2, 0);
    [L / 2, -L / 2].forEach((x) => { const o = K.malha(new THREE.ShapeGeometry(tri), M(cor, { side: THREE.DoubleSide })); por(g, o, [x, 0.25 + A, 0], [0, Math.PI / 2, 0]); });
    // Porta, degrau, janelas com floreira, luz da porta
    caixa(g, [1.0, 2.1, 0.1], M(0x7a4a2a), [1.2, 0.25 + 1.05, P / 2 + 0.03]);
    esfera(g, 0.05, M(0xd9b45a, { metalness: 0.6 }), [1.55, 0.25 + 1.0, P / 2 + 0.12]);
    bloco(g, [1.6, 0.18, 0.6], M(0xbdb5a8), [1.2, 0.09, P / 2 + 0.3]);
    [[-2.3, 1.7], [3.2, 1.7]].forEach(([x, y]) => {
      caixa(g, [1.5, 1.2, 0.08], M(0xffffff), [x, 0.25 + y, P / 2 + 0.02]);
      caixa(g, [1.3, 1.0, 0.1], M(op.noite ? 0xffe2a0 : 0x9fd0ee, op.noite ? { emissive: 0xffc96a, emissiveIntensity: 1 } : { roughness: 0.2 }), [x, 0.25 + y, P / 2 + 0.03]);
      caixa(g, [1.5, 0.3, 0.35], M(0x8b5b35), [x, 0.25 + y - 0.75, P / 2 + 0.2]);
      for (let k = -2; k <= 2; k++) esfera(g, 0.11, M([0xff5a8a, 0xffd23f, 0xff7a3a][(k + 2) % 3]), [x + k * 0.28, 0.25 + y - 0.52, P / 2 + 0.22]);
    });
    if (op.noite) caixa(g, [0.25, 0.25, 0.12], M(0xffe9b0, { emissive: 0xffd27a, emissiveIntensity: 2 }), [1.2, 0.25 + 2.55, P / 2 + 0.08]);
    // Caixa d'água azul em cima, numa base, e a antena
    const cx = grupo(g, [-2.2, 0.25 + A + 1.25, -0.4]);
    bloco(cx, [1.6, 0.6, 1.6], M(0xbdb5a8), [0, 0, 0]);
    cilindro(cx, [0.7, 0.58, 1.0], M(0x3a7be0), [0, 0.8, 0]);
    cilindro(cx, [0.76, 0.76, 0.14], M(0x2f63b8), [0, 1.36, 0]);
    barras(g, [[[2.8, 0.25 + A + 0.9, -1], [2.8, 0.25 + A + 2.6, -1]], [[2.3, 0.25 + A + 2.3, -1], [3.3, 0.25 + A + 2.3, -1]], [[2.45, 0.25 + A + 2.0, -1], [3.15, 0.25 + A + 2.0, -1]]], 0.025, M(0x8d939a));
    // Torneira do jardim e a mangueira enrolada
    const t = K.torneira([-3.4, 0.25, P / 2 + 0.05], false);
    t.g.rotation.y = -Math.PI / 2;
    g.add(t.g);
    solido(g, 0.15);
    g.userData = { porta: [pos[0] + 1.2, 0, pos[2] + P / 2 + 0.6], caixaDagua: [pos[0] - 2.2, 0.25 + A + 2.1, pos[2] - 0.4] };
    return g;
  }
  // Cerca de madeira branca de a até b
  function cerca(pai, a, b, cor = 0xf4f1ea) {
    const M = paleta();
    const d = V3(b).sub(V3(a)), comp = d.length();
    const g = grupo(pai, [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2], Math.atan2(-d.z, d.x));
    const ripas = [];
    for (let x = -comp / 2; x <= comp / 2; x += 0.32) ripas.push({ pos: [x, 0.55, 0] });
    copias(g, new THREE.BoxGeometry(0.12, 1.1, 0.04, 1, 1, 1), M(cor), ripas);
    [0.3, 0.85].forEach((y) => bloco(g, [comp, 0.08, 0.05], M(cor), [0, y, -0.04]));
    return g;
  }
  // Casinha de cachorro (porta pra +z)
  function casinhaCachorro(pai, pos, giroY = 0, nome = 'REX') {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    bloco(g, [1.3, 0.95, 1.4], M(0xd86a3a), [0, 0.48, 0]);
    [1, -1].forEach((l) => bloco(g, [0.95, 0.08, 1.55], M(0x8a3a22), [l * 0.36, 1.18, 0], [0, 0, -l * 0.62]));
    caixa(g, [0.6, 0.65, 0.06], M(0x2a1a10), [0, 0.38, 0.69]);
    const placa = K.placa(nome, { larg: 0.5, alt: 0.18, fundo: '#ffffff' });
    por(g, placa, [0, 0.82, 0.71]);
    cilindro(g, [0.2, 0.16, 0.1], M(0xe8352b), [0.9, 0.05, 0.5]);
    return g;
  }
  // Varal com roupa estendida (balança no vento)
  function varal(pai, pos, giroY = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    [-2, 2].forEach((x) => cilindro(g, [0.04, 0.04, 1.9], M(0x8d939a), [x, 0.95, 0]));
    barra(g, [-2, 1.85, 0], [2, 1.85, 0], 0.008, M(0xf4f4f4));
    const roupas = [[-1.3, 0.6, 0.7, 0xe8352b], [-0.4, 0.5, 0.8, 0x3a7be0], [0.5, 0.7, 0.55, 0xf5c518], [1.3, 0.45, 0.6, 0xffffff]].map(([x, l, a, cor]) => {
      const pano = K.malha(new THREE.PlaneGeometry(l, a, 4, 4).translate(0, -a / 2, 0), K.mat(cor, { side: THREE.DoubleSide }));
      por(g, pano, [x, 1.83, 0]);
      return pano;
    });
    K.vivo((t) => roupas.forEach((p, i) => { p.rotation.x = 0.12 * Math.sin(t * 1.7 + i) + 0.08; }));
    return g;
  }
  // Balanço de pneu pendurado num galho
  function balanco(pai, pos) {
    const M = paleta();
    const g = grupo(pai, pos);
    const pneu = K.malha(new THREE.TorusGeometry(0.32, 0.11, 10, 24), M(0x26292d));
    const corda = barra(g, [0, 0, 0], [0, -1.9, 0], 0.015, M(0xd9c7a3));
    por(g, pneu, [0, -2.2, 0], [Math.PI / 2, 0, 0]);
    K.vivo((t) => { g.rotation.x = 0.08 * Math.sin(t * 1.3); corda.visible = true; });
    return g;
  }

  CENARIOS.casa = function (C, g, op) {
    const M = paleta();
    C.ceu = 'dia';
    C.neblina = [70, 260, 600];
    C.caixaSombra = 20;
    chao(g, { cores: [0x6fae46, 0x9fd468, 0xb9d26a], grao: 180 });
    const casa = casaTerrea(g, [-1, 0, -11], 0, { noite: C.noite });
    C.objetos.casa = casa;
    // Caminho de pedras da calçada até a porta
    const pedras = [];
    for (let z = 4; z > -7.2; z -= 0.75) pedras.push({ pos: [0.2 + Math.sin(z * 0.6) * 0.25, 0.02, z], giro: [0, z, 0], esc: [1, 1, 1] });
    copias(g, new THREE.CylinderGeometry(0.34, 0.36, 0.05, 9), M(0xb9b3a8), pedras);
    // Cerca dos lados e muro baixo na frente, com portão
    cerca(g, [-10.5, 0, -15], [-10.5, 0, 9]);
    cerca(g, [10.5, 0, -15], [10.5, 0, 9]);
    cerca(g, [-10.5, 0, 9], [-0.8, 0, 9]);
    cerca(g, [1.4, 0, 9], [10.5, 0, 9]);
    // Árvore grande com balanço, casinha do cachorro, varal, canteiro e caixa de correio
    const arv = K.arvore(7.2, -5.5, 2.1, false, K.rand(8));
    g.add(arv);
    solidoCaixa([6.6, 0, -6.1], [7.8, 3.2, -4.9]);
    balanco(g, [6.2, 3.95, -5.2]);
    C.objetos.arvore = arv;
    C.objetos.casinha = casinhaCachorro(g, [-6.6, 0, -4.2], 0.5);
    varal(g, [-6.4, 0, -9.2], 0.15);
    const canteiro = grupo(g, [-1, 0, -7.2]);
    bloco(canteiro, [7.5, 0.25, 0.7], M(0x8a5a3a), [0, 0.12, 0]);
    for (let x = -3.4; x <= 3.4; x += 0.45) if (Math.abs(x - 2.2) > 0.6) esfera(canteiro, 0.16, M([0xff5a8a, 0xffd23f, 0xb57cff, 0xff7a3a][Math.round(x * 3 + 20) % 4]), [x, 0.4, 0]);
    const correio = grupo(g, [2.4, 0, 8.6]);
    cilindro(correio, [0.05, 0.05, 1.1], M(0x8b5b35), [0, 0.55, 0]);
    caixa(correio, [0.32, 0.28, 0.5], M(0xe8352b), [0, 1.2, 0]);
    K.enfeitar(g, 31, { flores: 90, arbustos: 10, pedras: 12, borboletas: 5, passaros: 4 });
    tufos(g, 1500, [-10, 10, -6, 9], [[0, 0, 1.3], [0.2, -1.5, 0.9]], 4);
    // Vizinhança: casas dos lados, morros e árvores longe
    casaTerrea(g, [-17, 0, -12], 0.2, { cor: 0xbfe0d4, telhado: 0x9a5a3a, noite: C.noite });
    casaTerrea(g, [16, 0, -13], -0.25, { cor: 0xf2c4b8, noite: C.noite });
    [[-60, -90, 40, 12, K.cores.morroLonge], [50, -100, 46, 14, K.cores.morro], [0, -120, 60, 16, K.cores.morroLonge]].forEach(([x, z, r, a, cor]) => morro(g, [x, z], r, a, cor));
    arvoresLonge(g, [[-14, -26, 1.7], [-5, -30, 2, true], [9, -28, 1.8], [20, -26, 2.2, true], [-26, -20, 1.6], [28, -22, 1.8]]);
    nuvens(g, [[-24, 40, -100, 3], [20, 46, -120, 3.8], [55, 38, -90, 2.8]]);
    const u = casa.userData;
    Object.assign(C.lugares, { porta: u.porta, caixa_dagua: u.caixaDagua, arvore: [7.2, 0, -5.5], casinha: [-6.6, 0, -4.2], varal: [-6.4, 0, -9.2], jardim: [-1, 0.3, -7.2], portao: [0.3, 0, 9], torneira: [-4.4, 0.95, -7.7] });
    C.fundo = [-1, 3, -11];
    C.entrada = [0.3, 0, 8];
    C.vista = { pos: [3.2, 2.3, 7.6], alvo: [-1, 2.5, -9] };
  };

  // ---------- Cozinha ----------

  // Sala de dentro de casa sem teto e sem a parede da frente (a câmera fica de fora, como num palco): piso, parede do fundo
  // (z = fundo) e a da esquerda (x = esquerda). op: piso (textura), corParede, corParede2
  function comodo(pai, op) {
    const M = paleta();
    const { P = 14, fundo = -4.2, esquerda = -6.2, direita = 6.2, alt = 6.5 } = op;
    const L = direita - esquerda, cx = (direita + esquerda) / 2;
    bloco(pai, [L + 0.5, 0.1, P], M(0xffffff, { map: op.piso, roughness: 0.6 }), [cx, -0.05, fundo + P / 2]);
    const pFundo = bloco(pai, [L + 0.5, alt, 0.25], M(op.corParede || 0xf2e6cf), [cx, alt / 2, fundo - 0.125]);
    const pEsq = bloco(pai, [0.25, alt, P], M(op.corParede2 || op.corParede || 0xeadcc2), [esquerda - 0.125, alt / 2, fundo + P / 2]);
    const pDir = bloco(pai, [0.25, alt, P], M(op.corParede2 || op.corParede || 0xeadcc2), [direita + 0.125, alt / 2, fundo + P / 2]);
    // rodapé
    bloco(pai, [L, 0.12, 0.04], M(0xffffff), [cx, 0.06, fundo + 0.02]);
    [esquerda + 0.02, direita - 0.02].forEach((x) => bloco(pai, [0.04, 0.12, P], M(0xffffff), [x, 0.06, fundo + P / 2]));
    solidoCaixa([esquerda - 1, 0, fundo - 1], [direita + 1, alt + 3, fundo + 0.05]);
    solidoCaixa([esquerda - 1, 0, fundo - 1], [esquerda + 0.05, alt + 3, fundo + P]);
    solidoCaixa([direita - 0.05, 0, fundo - 1], [direita + 1, alt + 3, fundo + P]);
    return { pFundo, pEsq, pDir };
  }
  // Janela na parede (vidro claro com moldura e cortina opcional): centro, largura, altura, virada pra +z ou +x
  function janela(pai, pos, larg, alt, giroY = 0, op = {}) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    caixa(g, [larg + 0.2, alt + 0.2, 0.08], M(0xffffff), [0, 0, 0]);
    bloco(g, [larg, alt, 0.1], M(0xbfe3ff, { emissive: 0xa8d8ff, emissiveIntensity: 0.55, roughness: 0.1 }), [0, 0, 0.01]);
    bloco(g, [0.06, alt, 0.12], M(0xffffff), [0, 0, 0.02]);
    bloco(g, [larg, 0.06, 0.12], M(0xffffff), [0, 0, 0.02]);
    if (op.cortina) [-1, 1].forEach((l) => {
      const c = K.malha(new THREE.PlaneGeometry(larg * 0.32, alt + 0.4, 6, 1), M(op.cortina, { side: THREE.DoubleSide }));
      const p = c.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, 0.05 * Math.sin(p.getX(i) * 18));
      c.geometry.computeVertexNormals();
      por(g, c, [l * (larg / 2 + 0.05), 0, 0.12]);
    });
    return g;
  }

  CENARIOS.cozinha = function (C, g, op) {
    const M = paleta();
    C.ceu = 'interior';
    C.neblina = [80, 300, 600];
    const fundo = -4.2, esq = -6.2;
    comodo(g, { piso: texPiso([13, 14], 0.45, '#efe9df', '#e6ded1', '#d2c8b8'), corParede: 0xf3ead8, corParede2: 0xe9dcc4, fundo, esquerda: esq, direita: 5.6 });
    // Azulejo atrás da bancada
    bloco(g, [11, 1.0, 0.04], M(0xffffff, { map: texPiso([11, 1.0], 0.2, '#bfe4e0', '#aed9d4', '#ffffff') }), [-1.0, 1.45, fundo + 0.02]);
    // Bancada com gavetas, pedra, pia, fogão e geladeira
    const madeira = M(0x9a6a43), pedra = M(0x3a3f48, { roughness: 0.35 });
    bloco(g, [8.6, 0.88, 0.7], madeira, [-1.6, 0.44, fundo + 0.35]);
    bloco(g, [8.7, 0.06, 0.76], pedra, [-1.6, 0.91, fundo + 0.38]);
    for (let x = -5.4; x <= 2.4; x += 0.95) caixa(g, [0.85, 0.75, 0.04], M(0xb07c50), [x + 0.47, 0.44, fundo + 0.72]);
    for (let x = -5.4; x <= 2.4; x += 0.95) caixa(g, [0.22, 0.04, 0.04], M(0xd8d8d8, { metalness: 0.6 }), [x + 0.47, 0.72, fundo + 0.76]);
    // Pia e torneira
    bloco(g, [1.0, 0.05, 0.5], M(0xc9ccd1, { metalness: 0.6, roughness: 0.3 }), [-0.6, 0.94, fundo + 0.38]);
    const torn = grupo(g, [-0.6, 0.94, fundo + 0.12]);
    cilindro(torn, [0.03, 0.03, 0.35], M(0xd8dbe0, { metalness: 0.8, roughness: 0.2 }), [0, 0.17, 0]);
    barra(torn, [0, 0.34, 0], [0, 0.38, 0.22], 0.025, M(0xd8dbe0, { metalness: 0.8, roughness: 0.2 }));
    // Fogão de 4 bocas com forno
    const fogao = grupo(g, [-3.6, 0, fundo + 0.4]);
    bloco(fogao, [0.9, 0.9, 0.72], M(0xf4f4f2), [0, 0.45, 0]);
    caixa(fogao, [0.7, 0.45, 0.04], M(0x2a2e33, { roughness: 0.2 }), [0, 0.42, 0.37]);
    bloco(fogao, [0.92, 0.04, 0.74], M(0x2a2e33), [0, 0.92, 0]);
    [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.17], [0.2, 0.17]].forEach(([x, z]) => cilindro(fogao, [0.09, 0.09, 0.03], M(0x4a4f56), [x, 0.95, z]));
    for (let k = -2; k <= 1; k++) cilindro(fogao, [0.035, 0.035, 0.04], M(0x2a2e33), [k * 0.17 + 0.08, 0.8, 0.38], [Math.PI / 2, 0, 0]);
    const panela = grupo(fogao, [0.2, 0.97, 0.17]);
    cilindro(panela, [0.17, 0.15, 0.2], M(0xc9ccd1, { metalness: 0.5, roughness: 0.35 }), [0, 0.1, 0]);
    barra(panela, [0.15, 0.17, 0], [0.38, 0.19, 0], 0.02, M(0x2a2e33));
    // Coifa e armários de cima
    caixa(g, [1.0, 0.5, 0.6], M(0xc9ccd1, { metalness: 0.5 }), [-3.6, 2.35, fundo + 0.3]);
    bloco(g, [0.3, 0.9, 0.3], M(0xc9ccd1, { metalness: 0.5 }), [-3.6, 3.0, fundo + 0.15]);
    [[-5.3, 1.5], [-1.95, 2.6], [1.3, 1.8]].forEach(([x, l]) => {
      bloco(g, [l, 0.8, 0.38], madeira, [x, 2.55, fundo + 0.19]);
      caixa(g, [0.04, 0.22, 0.04], M(0xd8d8d8, { metalness: 0.6 }), [x + l / 2 - 0.2, 2.35, fundo + 0.4]);
    });
    // Geladeira de duas portas
    const gel = grupo(g, [3.7, 0, fundo + 0.45]);
    caixa(gel, [1.0, 2.0, 0.85], M(0xe9ecef, { metalness: 0.3, roughness: 0.35 }), [0, 1.0, 0]);
    bloco(gel, [1.0, 0.02, 0.02], M(0x9aa0a6), [0, 1.35, 0.43]);
    [[1.65, 0.45], [0.7, 0.7]].forEach(([y, h]) => caixa(gel, [0.04, h, 0.05], M(0x9aa0a6, { metalness: 0.6 }), [-0.38, y, 0.45]));
    [[0.15, 1.62, 0xe8352b], [0.3, 1.5, 0xf5c518], [0.05, 0.9, 0x2fb54a]].forEach(([x, y, cor]) => esfera(gel, 0.05, M(cor), [x, y, 0.43], [1, 1, 0.4]));
    solido(gel, 0.1);
    C.objetos.geladeira = gel;
    // Micro-ondas, cafeteira, fruteira e tábua na bancada
    const micro = grupo(g, [1.6, 0.94, fundo + 0.4]);
    caixa(micro, [0.75, 0.42, 0.45], M(0x2a2e33), [0, 0.21, 0]);
    caixa(micro, [0.45, 0.3, 0.02], M(0x4a6a80, { roughness: 0.15 }), [-0.1, 0.21, 0.23]);
    C.objetos.microondas = micro;
    const cafe = grupo(g, [-5.2, 0.94, fundo + 0.4]);
    caixa(cafe, [0.3, 0.42, 0.3], M(0xe8352b), [0, 0.21, 0]);
    cilindro(cafe, [0.09, 0.09, 0.18], M(0xbfe3ff, { roughness: 0.1 }), [0, 0.12, 0.08]);
    const frutas = grupo(g, [0.4, 0.94, fundo + 0.4]);
    cilindro(frutas, [0.25, 0.15, 0.12], M(0xf4f1ea), [0, 0.06, 0]);
    [[0, 0.17, 0, 0xe8352b], [0.12, 0.15, 0.06, 0xf7941d], [-0.12, 0.15, 0.05, 0x8cc63f], [0.02, 0.15, -0.12, 0xf5c518]].forEach(([x, y, z, cor]) => esfera(frutas, 0.09, M(cor), [x, y, z]));
    janela(g, [-0.6, 2.2, fundo + 0.03], 1.8, 1.1, 0, { cortina: 0xf2c4b8 });
    // Relógio na parede e a mesa com cadeiras (à esquerda)
    const rel = grupo(g, [2.4, 2.75, fundo + 0.03]);
    cilindro(rel, [0.28, 0.28, 0.05], M(0xffffff), [0, 0, 0], [Math.PI / 2, 0, 0]);
    caixa(rel, [0.03, 0.18, 0.02], M(0x2a2e33), [0, 0.07, 0.04]);
    caixa(rel, [0.13, 0.03, 0.02], M(0x2a2e33), [0.05, 0, 0.04]);
    const mesa = grupo(g, [-4.2, 0, 0.6]);
    cilindro(mesa, [0.75, 0.75, 0.05], M(0xc89a5c), [0, 0.76, 0]);
    cilindro(mesa, [0.07, 0.07, 0.74], M(0x8b5b35), [0, 0.37, 0]);
    cilindro(mesa, [0.35, 0.35, 0.04], M(0x8b5b35), [0, 0.02, 0]);
    [0, 2.1, 4.2].forEach((a) => {
      const cad = grupo(mesa, [Math.sin(a) * 1.05, 0, Math.cos(a) * 1.05], a + Math.PI);
      caixa(cad, [0.45, 0.06, 0.45], M(0xb07c50), [0, 0.47, 0]);
      caixa(cad, [0.45, 0.5, 0.05], M(0xb07c50), [0, 0.75, -0.21]);
      [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([x, z]) => cilindro(cad, [0.025, 0.025, 0.46], M(0x8b5b35), [x, 0.23, z]));
    });
    C.objetos.mesa = mesa;
    solidoCaixa([-5.3, 0, -0.5], [-3.1, 1.0, 1.7]);
    solidoCaixa([-6, 0, fundo], [3, 2.9, fundo + 0.8]);
    Object.assign(C.lugares, { mesa: [-4.2, 0.79, 0.6], fogao: [-3.6, 0.97, fundo + 0.4], pia: [-0.6, 0.95, fundo + 0.38], geladeira: [3.7, 1.0, fundo + 0.45], bancada: [1.0, 0.94, fundo + 0.4], microondas: [1.6, 1.15, fundo + 0.4], janela: [-0.6, 2.2, fundo] });
    C.esquerda = [-2.4, 0, 0.9];
    C.entrada = [5.5, 0, 4];
    C.fundo = [-0.6, 1.8, fundo];
    C.vista = { pos: [3.6, 2.4, 8.5], alvo: [-1, 1.3, -2] };
  };

  // ---------- Sala: sofá, tapete, TV, estante, planta e janela ----------

  CENARIOS.sala = function (C, g, op) {
    const M = paleta();
    C.ceu = 'interior';
    C.neblina = [80, 300, 600];
    const fundo = -4.4, esq = -6.4;
    const taco = textura(128, 128, (c, w, h) => {
      const r = K.rand(5);
      for (let i = 0; i < 8; i++) { c.fillStyle = rgb(0xb07c50, 0.88 + r() * 0.2); c.fillRect(0, i * 16, w, 16); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, i * 16, w, 1); c.fillRect(Math.floor(r() * w), i * 16, 1, 16); }
    }, [8, 7]);
    comodo(g, { piso: taco, corParede: 0xd9e8e2, corParede2: 0xcfe0d8, fundo, esquerda: esq, direita: 6.3 });
    // Tapete redondo no palco
    cilindro(g, [2.3, 2.3, 0.02], M(0xe9b44c, { roughness: 1 }), [0, 0.01, 0], null, 48);
    cilindro(g, [1.7, 1.7, 0.021], M(0xd9534f, { roughness: 1 }), [0, 0.012, 0], null, 48);
    // Sofá de 3 lugares contra a parede do fundo, com almofadas
    const sofa = grupo(g, [-0.5, 0, fundo + 0.55]);
    const tecido = M(0x3f6fb5, { roughness: 0.9 });
    caixa(sofa, [2.8, 0.45, 0.95], tecido, [0, 0.3, 0.05]);
    caixa(sofa, [2.8, 0.75, 0.25], tecido, [0, 0.75, -0.38]);
    [-1.5, 1.5].forEach((x) => caixa(sofa, [0.25, 0.65, 0.95], tecido, [x, 0.45, 0.05]));
    [-0.9, 0, 0.9].forEach((x) => caixa(sofa, [0.85, 0.15, 0.8], M(0x4a7fc7, { roughness: 0.9 }), [x, 0.58, 0.1]));
    [[-1.0, 0xf5c518], [1.0, 0xe8352b]].forEach(([x, cor]) => caixa(sofa, [0.45, 0.4, 0.14], M(cor), [x, 0.85, -0.18], [0.2, 0, 0]));
    C.objetos.sofa = sofa;
    // Quadro em cima do sofá, mesinha de centro, abajur, planta, estante com livros
    const quadro = K.placa('', { larg: 1.6, alt: 1.0, fundo: '#8fd3c8', borda: '#7a4a2a' });
    por(g, quadro, [-0.5, 2.3, fundo + 0.02]);
    esfera(g, 0.25, M(0xf5c518), [-0.9, 2.45, fundo + 0.04], [1, 1, 0.05]);
    caixa(g, [1.2, 0.35, 0.03], M(0x5a9a4a), [-0.4, 2.0, fundo + 0.04]);
    const mesinha = grupo(g, [-0.5, 0, -2.3]);
    caixa(mesinha, [1.2, 0.06, 0.6], M(0x7a4a2a), [0, 0.42, 0]);
    [[-0.5, -0.22], [0.5, -0.22], [-0.5, 0.22], [0.5, 0.22]].forEach(([x, z]) => cilindro(mesinha, [0.03, 0.03, 0.4], M(0x5a3420), [x, 0.2, z]));
    cilindro(mesinha, [0.08, 0.06, 0.12], M(0xffffff), [0.3, 0.51, 0]);
    const abajur = grupo(g, [2.0, 0, fundo + 0.5]);
    cilindro(abajur, [0.2, 0.25, 0.5], M(0xb07c50), [0, 0.25, 0]);
    cilindro(abajur, [0.025, 0.025, 0.7], M(0x3b4048), [0, 0.85, 0]);
    cilindro(abajur, [0.18, 0.3, 0.35], M(0xfff1c4, { emissive: 0xffe6a0, emissiveIntensity: 0.6 }), [0, 1.35, 0]);
    const planta = grupo(g, [-5.5, 0, fundo + 0.7]);
    cilindro(planta, [0.3, 0.22, 0.55], M(0xe8e1d4), [0, 0.28, 0]);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const folha = K.malha(new THREE.SphereGeometry(0.22, 10, 8), M(0x3f8a35)); folha.scale.set(0.4, 1.6, 0.18); por(planta, folha, [Math.sin(a) * 0.22, 0.95 + (i % 3) * 0.12, Math.cos(a) * 0.22], [Math.cos(a) * 0.5, a, -Math.sin(a) * 0.5]); }
    const estante = grupo(g, [esq + 0.3, 0, -1.2], Math.PI / 2);
    bloco(estante, [2.2, 2.3, 0.4], M(0x8b5b35), [0, 1.15, 0]);
    const cores = [0xe8352b, 0x2f7fe0, 0xf5c518, 0x2fb54a, 0x8a4fd8, 0xf7941d, 0xffffff];
    const livros = [];
    [0.55, 1.15, 1.75].forEach((y, f) => { for (let x = -0.95; x < 0.9; x += 0.13 + ((x * 7 + f) % 0.05)) livros.push({ pos: [x, y + 0.2, 0.05], esc: [1, 0.8 + ((x * 13) % 0.3), 1], cor: cores[Math.abs(Math.round(x * 17 + f)) % cores.length] }); });
    copias(estante, new THREE.BoxGeometry(0.1, 0.45, 0.3, 1, 1, 1), M(0xffffff), livros);
    [0.3, 0.9, 1.5, 2.1].forEach((y) => bloco(estante, [2.1, 0.04, 0.38], M(0x6b4a2e), [0, y, 0.02]));
    // TV no rack da direita, virada pro sofá (passa uma imagem colorida)
    const rack = grupo(g, [5.8, 0, -1.6], -Math.PI / 2);
    bloco(rack, [2.4, 0.5, 0.5], M(0x5a3420), [0, 0.25, 0]);
    caixa(rack, [2.0, 1.15, 0.08], M(0x16181b), [0, 1.25, 0]);
    const telaTv = K.malha(new THREE.PlaneGeometry(1.85, 1.0), new THREE.MeshBasicMaterial({ color: 0x59a8e8 }));
    por(rack, telaTv, [0, 1.25, 0.045]);
    K.vivo((t) => telaTv.material.color.setHSL((0.55 + 0.1 * Math.sin(t * 0.7)) % 1, 0.6, 0.55));
    solido(rack, 0.1);
    C.objetos.tv = rack;
    janela(g, [esq + 0.03, 1.9, 2.0], 2.0, 1.5, Math.PI / 2, { cortina: 0xf5e6c8 });
    solidoCaixa([-2.2, 0, fundo], [1.2, 1.2, fundo + 1.2]);
    Object.assign(C.lugares, { sofa: [-0.5, 0.6, fundo + 0.6], tv: [5.75, 1.25, -1.6], tapete: [0, 0.02, 0], mesinha: [-0.5, 0.45, -2.3], estante: [esq + 0.4, 1.2, -1.2], janela: [esq, 1.9, 2.0], abajur: [2.0, 1.35, fundo + 0.5] });
    C.fundo = [-0.5, 1.4, fundo];
    C.entrada = [4.5, 0, 4.5];
    C.vista = { pos: [3.4, 2.3, 8.6], alvo: [-0.6, 1.2, -2] };
  };

  // ---------- Praia: areia, mar com onda chegando, coqueiros, guarda-sol e salva-vidas ----------

  // Mar: plano com ondas (os vértices sobem e descem em todo quadro) e cor mais clara perto da areia. borda: z onde começa
  function mar(pai, borda, op = {}) {
    const larg = op.larg || 700, prof = op.prof || 400;
    const geo = new THREE.PlaneGeometry(larg, prof, 140, 90).rotateX(-Math.PI / 2).translate(0, 0, borda - prof / 2);
    const pos = geo.attributes.position, base = [], cs = [], c = new THREE.Color(), raso = new THREE.Color(op.raso ?? 0x3fd0d4), fundo = new THREE.Color(op.fundo ?? 0x1c6fb8);
    for (let i = 0; i < pos.count; i++) {
      base.push(pos.getX(i), pos.getZ(i));
      c.copy(raso).lerp(fundo, K.clamp((borda - pos.getZ(i)) / 40));
      cs.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
    const agua = K.malha(geo, K.mat(0xffffff, { vertexColors: true, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.94 }), false);
    agua.receiveShadow = true;
    pai.add(agua);
    K.vivo((t) => {
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 2], z = base[i * 2 + 1], longe = K.clamp((borda - z) / 12);
        pos.setY(i, 0.06 + longe * (0.16 * Math.sin(x * 0.18 + t * 1.3 + z * 0.05) + 0.1 * Math.sin(z * 0.35 + t * 1.9)));
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    });
    return agua;
  }
  // Coqueiro do kit dentro do grupo
  const coqueiro = (pai, pos, s, seed) => { const c = K.coqueiro(pos, s, seed); pai.add(c); return c; };
  // Guarda-sol listrado com duas cadeiras e a toalha
  function guardaSol(pai, pos, giroY = 0, cores = [0xe8352b, 0xffffff]) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    cilindro(g, [0.035, 0.035, 2.4], M(0xd8d8d8), [0, 1.2, 0]);
    const n = 10;
    for (let i = 0; i < n; i++) {
      const gomo = K.malha(new THREE.ConeGeometry(1.5, 0.55, 3, 1, true, (i / n) * Math.PI * 2, (Math.PI * 2) / n), M(cores[i % 2], { side: THREE.DoubleSide }));
      por(g, gomo, [0, 2.45, 0]);
    }
    [[-0.7, 0.9, -0.2], [0.7, 0.9, 0.25]].forEach(([x, z, a], i) => {
      const cad = grupo(g, [x, 0, z], a + Math.PI);
      caixa(cad, [0.55, 0.05, 0.6], M([0x2f7fe0, 0xf5c518][i]), [0, 0.32, 0.1], [-0.15, 0, 0]);
      caixa(cad, [0.55, 0.6, 0.05], M([0x2f7fe0, 0xf5c518][i]), [0, 0.6, -0.25], [-0.45, 0, 0]);
      barras(cad, [[[-0.26, 0, 0.35], [-0.26, 0.85, -0.3]], [[0.26, 0, 0.35], [0.26, 0.85, -0.3]], [[-0.26, 0, -0.25], [-0.26, 0.35, 0.3]], [[0.26, 0, -0.25], [0.26, 0.35, 0.3]]], 0.015, M(0xd8d8d8));
    });
    caixa(g, [0.9, 0.01, 1.7], M(0xff7a59), [0.1, 0.012, 1.8], [0, 0.3, 0]);
    caixa(g, [0.5, 0.35, 0.35], M(0xf4f4f2), [-1.3, 0.18, 1.4]);
    caixa(g, [0.52, 0.06, 0.37], M(0x2f7fe0), [-1.3, 0.37, 1.4]);
    return g;
  }
  // Posto de salva-vidas (torre de madeira com bandeira vermelha e amarela)
  function salvaVidas(pai, pos, giroY = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].forEach(([x, z]) => barra(g, [x * 1.1, 0, z * 1.1], [x * 0.8, 2.6, z * 0.8], 0.07, M(0xd9b07a)));
    caixa(g, [2.1, 0.12, 2.1], M(0xd9b07a), [0, 2.65, 0]);
    caixa(g, [1.9, 1.3, 1.9], M(0xf4f4f2), [0, 3.35, -0.1]);
    caixa(g, [1.6, 0.6, 0.06], M(0x2d4a63, { roughness: 0.2 }), [0, 3.55, 0.86]);
    caixa(g, [2.3, 0.12, 2.3], M(0xe8352b), [0, 4.05, -0.1]);
    for (let k = 0; k < 6; k++) caixa(g, [0.9, 0.06, 0.3], M(0xd9b07a), [0, 0.35 + k * 0.42, 1.3 + k * 0.12], [0.6, 0, 0]);
    cilindro(g, [0.03, 0.03, 1.6], M(0xd8d8d8), [0.85, 4.8, -0.9]);
    const bandeira = K.malha(new THREE.PlaneGeometry(0.9, 0.55, 6, 1), K.mat(0xffffff, { side: THREE.DoubleSide, map: textura(64, 32, (c, w, h) => { c.fillStyle = '#e8352b'; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#f5c518'; c.fillRect(0, h / 2, w, h / 2); }) }));
    por(g, bandeira, [1.3, 5.3, -0.9]);
    const bp = bandeira.geometry.attributes.position, bx = [];
    for (let i = 0; i < bp.count; i++) bx.push(bp.getX(i));
    K.vivo((t) => { for (let i = 0; i < bp.count; i++) bp.setZ(i, 0.08 * Math.sin(bx[i] * 6 - t * 7) * (bx[i] + 0.45)); bp.needsUpdate = true; });
    solido(g, 0.1);
    return g;
  }
  // Veleiro (pra boiar longe)
  function veleiro(pai, pos, s = 1) {
    const M = paleta();
    const g = grupo(pai, pos);
    g.scale.setScalar(s);
    caixa(g, [3, 0.6, 1.1], M(0xffffff), [0, 0.2, 0]);
    cilindro(g, [0.05, 0.05, 4], M(0x8d939a), [0.2, 2.4, 0]);
    const vela = new THREE.Shape();
    vela.moveTo(0, 0); vela.lineTo(1.6, 0); vela.lineTo(0, 3.5); vela.lineTo(0, 0);
    por(g, K.malha(new THREE.ShapeGeometry(vela), M(0xf4f1ea, { side: THREE.DoubleSide })), [0.3, 0.7, 0]);
    return g;
  }
  // Pássaros brancos (gaivotas) circulando sobre um ponto
  function gaivotas(pai, centro, n = 3) {
    const M = paleta();
    for (let i = 0; i < n; i++) {
      const p = grupo(pai);
      esfera(p, 0.14, M(0xffffff), [0, 0, 0], [0.8, 0.8, 1.7]);
      const asas = [-1, 1].map((l) => { const piv = grupo(p); esfera(piv, 0.3, M(0xf4f4f4), [l * 0.3, 0, 0], [1, 0.07, 0.38]); return piv; });
      K.vivo((t) => {
        const a = t * 0.35 + i * 2.1, r = 6 + i * 2.5;
        p.position.set(centro[0] + Math.cos(a) * r, centro[1] + i * 1.5 + Math.sin(t + i) * 0.4, centro[2] + Math.sin(a) * r * 0.6);
        p.rotation.y = -a;
        const bate = Math.sin(t * 6 + i) * 0.5;
        asas[0].rotation.z = bate; asas[1].rotation.z = -bate;
      });
    }
  }

  CENARIOS.praia = function (C, g, op) {
    const M = paleta();
    C.ceu = 'azul';
    C.neblina = [90, 420, 800];
    const borda = -9;
    // Areia (mais escura e molhada perto da água) e o mar
    chao(g, { cores: [0xe2c88f, 0xf0dcab, 0xe9d29b], grao: 260, zona: (x, z) => (z < borda + 3 ? [0xc9a86c, K.clamp((borda + 3 - z) / 2.5) * 0.8] : null) });
    mar(g, borda);
    // A onda chegando: espuma branca que vai e volta na beira
    const espuma = K.malha(new THREE.PlaneGeometry(400, 1.2, 80, 1).rotateX(-Math.PI / 2), K.mat(0xffffff, { transparent: true, opacity: 0.85, roughness: 0.4 }), false);
    por(g, espuma, [0, 0.1, borda]);
    K.vivo((t) => { const k = (Math.sin(t * 0.7) + 1) / 2; espuma.position.z = borda + 0.4 + k * 1.6; espuma.material.opacity = 0.35 + 0.55 * (1 - k); });
    coqueiro(g, [-6.8, 0, -3.2], 1.25, 5);
    coqueiro(g, [-9.5, 0, 1.6], 1.05, 7);
    coqueiro(g, [8.6, 0, -5.5], 1.35, 9);
    coqueiro(g, [14, 0, -1.5], 1.1, 11);
    C.objetos.guardaSol = guardaSol(g, [-3.6, 0, -2.6], 0.4);
    C.objetos.salvaVidas = salvaVidas(g, [6.5, 0, -1.8], -0.35);
    // Castelo de areia, bola e conchas perto do palco
    const castelo = grupo(g, [3.2, 0, 2.4]);
    [[0, 0.25, 0, 0.5, 0.5], [-0.4, 0.2, 0.3, 0.25, 0.4], [0.45, 0.2, -0.2, 0.25, 0.4], [0, 0.65, 0, 0.25, 0.3]].forEach(([x, y, z, r, a]) => cilindro(castelo, [r * 0.85, r, a], M(0xd9b97a), [x, y, z], null, 8));
    esfera(g, 0.3, M(0xffffff, { map: textura(64, 32, (c, w, h) => { ['#e8352b', '#ffffff', '#2f7fe0', '#ffffff', '#f5c518', '#ffffff'].forEach((cor, i) => { c.fillStyle = cor; c.fillRect((i * w) / 6, 0, w / 6 + 1, h); }); }) }), [-1.6, 0.3, 3.6]);
    [[1.2, 4.5], [-2.4, 5.6], [4.6, 0.6]].forEach(([x, z], i) => esfera(g, 0.09, M([0xf2c4b8, 0xf4f1ea, 0xffd9a0][i]), [x, 0.03, z], [1, 0.35, 0.8]));
    veleiro(g, [-30, 0.2, -70], 1.6);
    veleiro(g, [45, 0.2, -110], 2);
    gaivotas(g, [2, 9, -18], 3);
    const ilha = morro(g, [-90, -230], 50, 22, 0x6f9a5a);
    ilha.position.y = -4;
    Object.assign(C.lugares, { mar: [0, 0.1, -14], beira: [0, 0, borda + 1], guarda_sol: [-3.6, 2.4, -2.6], salva_vidas: [6.5, 3.4, -1.8], coqueiro: [-6.8, 0, -3.2], castelo: [3.2, 0.3, 2.4], barco: [-30, 1.5, -70] });
    C.fundo = [0, 2, -40];
    C.vista = { pos: [4.5, 2.6, 10], alvo: [-3, 2.6, -10] };
  };

  // ---------- Fundo do mar: areia, corais, algas balançando, peixes, raios de luz e um navio afundado ----------

  CENARIOS.fundo_do_mar = function (C, g, op) {
    const M = paleta();
    C.ceu = 'mar';
    C.neblina = [6, 62, 220];
    chao(g, { tam: 300, seg: 160, cores: [0xc9b48a, 0xddc9a0, 0xb7a47c], grao: 0, relevo: (x, z) => 0.08 * Math.sin(x * 1.3 + Math.sin(z * 0.5) * 2) + (Math.hypot(x, z) > 9 ? 0.04 * (Math.hypot(x, z) - 9) * (1 + Math.sin(x * 0.2 + z * 0.13)) : 0) });
    const r = K.rand(op.seed || 13);
    // Pedras com musgo
    [[-5.5, -4, 1.2], [-6.6, -2.6, 0.7], [6.2, -6, 1.5], [4.9, -4.6, 0.8], [-3, -12, 2.2], [9, -12, 2], [-11, -8, 1.8]].forEach(([x, z, s], i) => {
      const p = K.malha(new THREE.IcosahedronGeometry(s, 1), M(i % 2 ? 0x6d7f6a : 0x7c8a80, { roughness: 1 }));
      p.position.set(x, s * 0.35, z);
      p.scale.set(1.2, 0.75, 1);
      p.rotation.set(r(), r() * 3, 0);
      g.add(p);
    });
    // Corais: galhos, cérebro, leque e esponjas, em cores vivas
    const corais = [[-4.6, -3.2, 0xff6b8a], [-3.4, -4.4, 0xf7941d], [5.2, -3.4, 0xb57cff], [3.8, -5.8, 0xff4d6d], [-7.2, -0.5, 0xf5c518], [7.6, -1.2, 0xff7a3a], [-1.8, -6.8, 0x3fd0d4], [1.8, -7.4, 0xff6b8a]];
    corais.forEach(([x, z, cor], i) => {
      const c = grupo(g, [x, 0, z], r() * 6);
      if (i % 3 === 0) { // galhos
        const gal = [];
        for (let k = 0; k < 7; k++) { const a = r() * 6, h = 0.6 + r() * 0.8; gal.push([[0, 0, 0], [Math.cos(a) * 0.35, h, Math.sin(a) * 0.35]], [[Math.cos(a) * 0.35, h, Math.sin(a) * 0.35], [Math.cos(a) * 0.55, h + 0.35, Math.sin(a) * 0.55]]); }
        barras(c, gal, 0.06, M(cor), 6);
      } else if (i % 3 === 1) { // cérebro
        const b = esfera(c, 0.55, M(cor, { roughness: 0.9 }), [0, 0.3, 0], [1, 0.7, 1]);
        b.material.map = K.texGrao(2);
      } else { // leque e esponjas
        const leque = K.malha(new THREE.CircleGeometry(0.75, 20, 0, Math.PI), M(cor, { side: THREE.DoubleSide, roughness: 0.9 }));
        por(c, leque, [0, 0.05, 0]);
        [[0.5, 0.1], [0.75, -0.25]].forEach(([dx, dz]) => cilindro(c, [0.14, 0.11, 0.6 + r() * 0.4], M(0xffd23f), [dx, 0.35, dz], null, 12));
      }
    });
    // Algas compridas balançando
    const algas = [];
    for (let i = 0; i < 26; i++) {
      const ang = r() * Math.PI * 2, raio = 5 + r() * 9, x = Math.cos(ang) * raio, z = Math.sin(ang) * raio * 0.8 - 3;
      if (z > 2) continue;
      const alt = 1.6 + r() * 2.4;
      const a = K.malha(new THREE.PlaneGeometry(0.28, alt, 1, 8).translate(0, alt / 2, 0), M(r() < 0.5 ? 0x3f8a35 : 0x5aa83f, { side: THREE.DoubleSide, roughness: 0.8 }));
      por(g, a, [x, 0, z], [0, r() * 3, 0]);
      const p = a.geometry.attributes.position, ys = [];
      for (let k = 0; k < p.count; k++) ys.push(p.getY(k));
      algas.push({ p, ys, fase: r() * 6, alt });
    }
    K.vivo((t) => algas.forEach(({ p, ys, fase, alt }) => { for (let k = 0; k < p.count; k++) { const y = ys[k] / alt; p.setX(k, (k % 2 ? 0.14 : -0.14) + Math.sin(t * 1.4 + fase + y * 2) * 0.35 * y * y); } p.needsUpdate = true; }));
    // Navio afundado lá no fundo, meio enterrado e inclinado
    const nav = grupo(g, [-7.5, -0.4, -17], 0.6);
    nav.rotation.z = 0.22;
    caixa(nav, [9, 2.4, 3.2], M(0x6b4a2e, { roughness: 1 }), [0, 1, 0]);
    caixa(nav, [3, 1.6, 2.6], M(0x5a3d26, { roughness: 1 }), [-2, 2.8, 0]);
    cilindro(nav, [0.15, 0.15, 5], M(0x5a3d26), [1.5, 4.2, 0], [0, 0, -0.3]);
    for (let k = 0; k < 4; k++) cilindro(nav, [0.25, 0.25, 0.05], M(0x2a2e33), [-3 + k * 1.6, 1.5, 1.61], [Math.PI / 2, 0, 0], 14);
    solido(nav, 0.2);
    // Baú do tesouro meio aberto
    const bau = grupo(g, [-3.2, 0, -8.2], 0.4);
    caixa(bau, [0.9, 0.5, 0.6], M(0x8b5b35), [0, 0.25, 0]);
    caixa(bau, [0.92, 0.12, 0.62], M(0xd9b45a, { metalness: 0.6, roughness: 0.3 }), [0, 0.5, 0]);
    const tampa = grupo(bau, [0, 0.55, -0.3]);
    caixa(tampa, [0.9, 0.3, 0.6], M(0x8b5b35), [0, 0.12, 0.3], [-0.9, 0, 0]);
    for (let k = 0; k < 6; k++) esfera(bau, 0.07, M(0xf5c518, { metalness: 0.7, roughness: 0.25, emissive: 0x5a4a00 }), [-0.3 + k * 0.12, 0.55, (k % 2) * 0.1 - 0.05]);
    // Estrela-do-mar e conchas na areia
    [[1.6, 2.6, 0xf7941d], [-2.2, 3.4, 0xe8352b], [3.8, -1.6, 0xff6b8a]].forEach(([x, z, cor]) => {
      const e = new THREE.Shape();
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, rr = k % 2 ? 0.09 : 0.24; e[k ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
      por(g, K.malha(new THREE.ExtrudeGeometry(e, { depth: 0.05, bevelEnabled: false }), M(cor)), [x, 0.07, z], [-Math.PI / 2, 0, 0]);
    });
    // Peixes nadando em volta, um cardume e o tubarão passando longe
    const peixes = [[0xf7941d, 1, 4.5, 2.2, 0.9], [0x3a7be0, 0.8, 6.5, 3.1, -0.7], [0xf5c518, 0.9, 5.5, 1.6, 0.6], [0xff6b8a, 0.7, 8, 2.8, -0.5], [0x2fb54a, 0.8, 7, 3.6, 0.8]].map(([cor, tam, raio, y, vel]) => ({ p: K.peixe(cor, tam), raio, y, vel }));
    const cardume = Array.from({ length: 12 }, (_, i) => ({ p: K.peixe(0x9fd0ee, 0.45), i }));
    const tub = K.tubarao();
    K.vivo((t) => {
      peixes.forEach(({ p, raio, y, vel }, i) => { const a = t * vel * 0.4 + i * 1.3; p.em([Math.cos(a) * raio, y + Math.sin(t + i) * 0.3, Math.sin(a) * raio * 0.7 - 4], t, -a + (vel > 0 ? -Math.PI / 2 : Math.PI / 2)); });
      cardume.forEach(({ p, i }) => { const a = t * 0.25 + (i % 4) * 0.12; p.em([Math.cos(a) * 11 + (i % 3) * 0.5, 5 + Math.floor(i / 4) * 0.45, Math.sin(a) * 6 - 10 + (i % 2) * 0.6], t + i, -a - Math.PI / 2); });
      const x = ((t * 2.2) % 90) - 45;
      tub.em([x, 6.5, -24], t, 0, 0.1);
    });
    // Raios de sol vindos de cima e bolhas subindo
    const raios = [];
    for (let i = 0; i < 6; i++) {
      const raio = K.malha(new THREE.ConeGeometry(1.4 + r(), 26, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }), false);
      raio.castShadow = false;
      por(g, raio, [-12 + i * 5 + r() * 2, 12, -8 - r() * 10], [0, 0, 0.18]);
      raios.push(raio);
    }
    K.vivo((t) => raios.forEach((x, i) => { x.material.opacity = 0.05 + 0.03 * Math.sin(t * 0.8 + i * 1.7); }));
    particulas(g, 70, [0, 0, -4], [18, 10, 14], { cor: 0xdff6ff, tam: 0.08, sobe: 0.09, vai: 0.15, opacidade: 0.7 });
    Object.assign(C.lugares, { naufragio: [-7.5, 1.6, -17], bau: [-3.2, 0.5, -8.2], coral: [5.2, 0.5, -3.4], pedra: [6.2, 0.6, -6], superficie: [0, 14, -6] });
    C.fundo = [-7.5, 2, -17];
    C.vista = { pos: [3, 2.6, 10], alvo: [-1.5, 2, -10] };
  };

  // ---------- Espaço: em cima de um planetinha, com a Terra e a Lua no céu, nebulosa e asteroides ----------

  // Fundo de nebulosa: um painel bem longe com manchas coloridas (fica atrás das estrelas)
  function nebulosa(pai) {
    const tex = textura(512, 256, (c, w, h) => {
      c.fillStyle = '#000000'; c.fillRect(0, 0, w, h);
      const r = K.rand(19);
      [[0.3, 0.45, '120,60,200'], [0.62, 0.55, '40,120,220'], [0.45, 0.35, '220,70,150'], [0.8, 0.4, '60,180,200']].forEach(([x, y, cor]) => {
        const gr = c.createRadialGradient(x * w, y * h, 0, x * w, y * h, w * 0.32);
        gr.addColorStop(0, `rgba(${cor},0.55)`); gr.addColorStop(1, `rgba(${cor},0)`);
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
      });
      for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`; c.fillRect(r() * w, r() * h, 1.2, 1.2); }
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(900, 450), new THREE.MeshBasicMaterial({ map: tex, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    m.renderOrder = -9;
    por(pai, m, [0, 90, -280]);
    return m;
  }

  CENARIOS.espaco = function (C, g, op) {
    const M = paleta();
    C.ceu = 'espaco';
    C.neblina = [400, 900, 1200];
    // O chão é um planetinha: uma esfera grande com crateras, o topo em y = 0
    const R = 34;
    const geo = new THREE.IcosahedronGeometry(R, 6), p = geo.attributes.position, v = new THREE.Vector3(), cs = [], c = new THREE.Color();
    const crateras = [[3, -4, 2.2], [-6, -2, 1.6], [7, 3, 1.4], [-3, -10, 3], [9, -9, 2.4], [-10, 5, 2]];
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      let h = 0;
      crateras.forEach(([cx, cz, cr]) => { const d = Math.hypot(v.x - cx, v.z - cz); if (d < cr * 1.3 && v.y > 0) h += d < cr ? -0.35 * (1 - (d / cr) ** 2) : 0.12 * Math.sin(((d - cr) / (cr * 0.3)) * Math.PI); });
      v.setLength(R + h + 0.15 * ondula(v.x * 0.3, v.y * 0.3, v.z * 0.3));
      p.setXYZ(i, v.x, v.y - R, v.z);
      c.setHex(0x8f86a8).offsetHSL(0, 0, h * 0.25 + ondula(v.x * 0.2, 0, v.z * 0.2) * 0.04);
      cs.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3));
    geo.computeVertexNormals();
    const planetinha = K.malha(geo, K.mat(0xffffff, { vertexColors: true, roughness: 1 }), false);
    planetinha.receiveShadow = true;
    g.add(planetinha);
    C.objetos.planetinha = planetinha;
    // Terra grande no céu, a Lua menor, nebulosa e anéis de asteroides passando
    const terra = K.planeta('terra', 22, 4);
    g.add(terra.g);
    terra.g.position.set(-40, 26, -120);
    const lua = K.planeta('lua', 6, 6);
    g.add(lua.g);
    lua.g.position.set(38, 46, -150);
    K.vivo((t) => { terra.g.rotation.y = t * 0.05; lua.g.rotation.y = t * 0.03; });
    nebulosa(g);
    const ast = [];
    const r = K.rand(23);
    for (let i = 0; i < 14; i++) {
      const a = K.malha(new THREE.IcosahedronGeometry(0.4 + r() * 1.1, 0), M(r() < 0.5 ? 0x7c7690 : 0x9a93ad, { roughness: 1 }));
      g.add(a);
      ast.push({ a, raio: 18 + r() * 14, y: 6 + r() * 12, fase: r() * 6, vel: 0.03 + r() * 0.04 });
    }
    K.vivo((t) => ast.forEach(({ a, raio, y, fase, vel }) => { const k = t * vel + fase; a.position.set(Math.cos(k) * raio, y, Math.sin(k) * raio * 0.5 - 16); a.rotation.set(t * 0.3 + fase, t * 0.2, 0); }));
    // Satélite e uma bandeirinha de explorador fincada
    const sat = K.satelite();
    g.add(sat);
    K.vivo((t) => { sat.position.set(14 + Math.sin(t * 0.1) * 3, 13, -22); sat.rotation.set(0.3, t * 0.2, 0.1); });
    const band = grupo(g, [-4.2, 0, -2.6]);
    cilindro(band, [0.03, 0.03, 1.8], M(0xd8d8d8), [0, 0.9, 0]);
    por(band, K.malha(new THREE.PlaneGeometry(0.8, 0.5), M(0xf5c518, { side: THREE.DoubleSide })), [0.42, 1.55, 0]);
    // Pedras e um cristal brilhante
    [[4.6, -3.2, 0.6], [5.4, -2.4, 0.35], [-6, 1.5, 0.5], [2.6, -7, 0.9]].forEach(([x, z, s], i) => { const pe = K.malha(new THREE.IcosahedronGeometry(s, 0), M(0x6f6886)); pe.position.set(x, s * 0.3 - 0.1, z); pe.rotation.set(i, i * 2, 0); g.add(pe); });
    const cristal = grupo(g, [-5.6, 0, -5.2]);
    [[0, 0.7, 0, 0.25, 1.4], [0.3, 0.45, 0.15, 0.15, 0.9], [-0.25, 0.4, -0.1, 0.13, 0.8]].forEach(([x, y, z, rr, a], i) => por(cristal, K.malha(new THREE.ConeGeometry(rr, a, 6), M(0x7fd8ff, { emissive: 0x2fa8e8, emissiveIntensity: 0.8, roughness: 0.2 })), [x, y, z], [0, 0, (i - 1) * 0.3]));
    Object.assign(C.lugares, { terra: [-40, 26, -120], lua: [38, 46, -150], satelite: [14, 13, -22], cristal: [-5.6, 0.7, -5.2], bandeira: [-4.2, 1.2, -2.6] });
    C.fundo = [-40, 26, -120];
    C.vista = { pos: [3.5, 2.4, 11], alvo: [-4, 6, -20] };
  };

  // ---------- Lua: chão cinza com crateras, a Terra no céu e o módulo lunar ----------

  CENARIOS.lua = function (C, g, op) {
    const M = paleta();
    C.ceu = 'lua';
    C.neblina = [300, 900, 1200];
    const crateras = [[6, -8, 3], [-9, -12, 4.5], [14, -20, 6], [-4, -26, 8], [-18, -4, 3], [18, -6, 2.5], [2, -40, 10], [-30, -30, 9], [30, -35, 7]];
    chao(g, {
      tam: 500, seg: 240, cores: [0x9a9aa0, 0xb4b4b8, 0x8c8c92], grao: 300,
      relevo: (x, z) => {
        let h = 0;
        crateras.forEach(([cx, cz, cr]) => { const d = Math.hypot(x - cx, z - cz); if (d < cr * 1.4) h += d < cr ? -0.5 * cr * 0.12 * (1 - (d / cr) ** 2) : 0.18 * cr * 0.12 * Math.sin(((d - cr) / (cr * 0.4)) * Math.PI); });
        return h + (Math.hypot(x, z) > 40 ? Math.sin(x * 0.05) * Math.sin(z * 0.04) * 3 : 0);
      }
    });
    const terra = K.planeta('terra', 9, 4);
    g.add(terra.g);
    terra.g.position.set(-26, 40, -140);
    K.vivo((t) => { terra.g.rotation.y = t * 0.04; });
    const mod = K.moduloLunar();
    g.add(mod.g);
    mod.g.position.set(-7.5, 0, -9);
    mod.g.rotation.y = 0.5;
    solido(mod.g, 0.2);
    C.objetos.modulo = mod.g;
    // Pegadas, pedras e uma antena
    const pegadas = [];
    for (let k = 0; k < 12; k++) pegadas.push({ pos: [-6.4 + k * 0.55 + (k % 2) * 0.1, 0.012, -7.6 + k * 0.62 + (k % 2) * 0.22], giro: [0, -0.7, 0] });
    copias(g, new THREE.BoxGeometry(0.14, 0.01, 0.3, 1, 1, 1), M(0x7a7a80), pegadas, false);
    [[5.2, -3.6, 0.5], [6.4, -4.6, 0.8], [-4, 3, 0.35], [10, -12, 1.4]].forEach(([x, z, s], i) => { const pe = K.malha(new THREE.IcosahedronGeometry(s, 0), M(0x85858c)); pe.position.set(x, s * 0.3, z); pe.rotation.set(i, i, 0); g.add(pe); });
    Object.assign(C.lugares, { terra: [-26, 40, -140], modulo: [-7.5, 2, -9], cratera: [6, 0, -8] });
    C.fundo = [-26, 40, -140];
    C.vista = { pos: [4, 2.2, 11], alvo: [-4, 4, -16] };
  };

  // ---------- Fazenda: celeiro vermelho, silo, plantação, trator, vacas, galinhas e cata-vento ----------

  function celeiro(pai, pos, giroY = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    const L = 8, A = 4.2, P = 7, verm = M(0xb83a2e), branco = M(0xf4f1ea);
    bloco(g, [L, A, P], verm, [0, A / 2, 0]);
    // Telhado de duas águas quebradas (o desenho de celeiro)
    const perfil = new THREE.Shape();
    perfil.moveTo(-P / 2 - 0.3, 0); perfil.lineTo(-P / 2 + 0.6, 1.9); perfil.lineTo(0, 3.0); perfil.lineTo(P / 2 - 0.6, 1.9); perfil.lineTo(P / 2 + 0.3, 0); perfil.lineTo(-P / 2 - 0.3, 0);
    const telhado = K.malha(new THREE.ExtrudeGeometry(perfil, { depth: L + 0.6, bevelEnabled: false }), M(0x5a5f66));
    por(g, telhado, [-(L + 0.6) / 2, A, 0], [0, Math.PI / 2, 0]);
    const oitao = new THREE.Shape();
    oitao.moveTo(-P / 2, 0); oitao.lineTo(-P / 2 + 0.8, 1.75); oitao.lineTo(0, 2.8); oitao.lineTo(P / 2 - 0.8, 1.75); oitao.lineTo(P / 2, 0); oitao.lineTo(-P / 2, 0);
    [L / 2 + 0.01, -L / 2 - 0.01].forEach((x) => por(g, K.malha(new THREE.ShapeGeometry(oitao), M(0xb83a2e, { side: THREE.DoubleSide })), [x, A, 0], [0, Math.PI / 2, 0]));
    // Portão grande com o X branco e a janelinha do feno
    const porta = grupo(g, [0, 0, P / 2 + 0.03]);
    caixa(porta, [3.2, 3.2, 0.08], M(0x9a2e24), [0, 1.6, 0]);
    [[0, 1.6, 0.06, 3.2, 0.14], [0, 0.05, 0.06, 3.3, 0.14], [0, 3.17, 0.06, 3.3, 0.14]].forEach(([x, y, z, l, a]) => caixa(porta, [l, a, 0.05], branco, [x, y, z]));
    [-1, 1].forEach((l) => caixa(porta, [0.14, 3.2, 0.05], branco, [l * 1.6, 1.6, 0.06]));
    [-0.8, 0.8].forEach((x) => [1, -1].forEach((d) => caixa(porta, [1.9, 0.12, 0.05], branco, [x, 1.6, 0.07], [0, 0, d * 0.98])));
    caixa(g, [1.4, 1.1, 0.08], M(0x9a2e24), [0, A + 1.1, P / 2 + 0.02]);
    caixa(g, [1.5, 0.12, 0.06], branco, [0, A + 1.68, P / 2 + 0.05]);
    // Feno saindo pela porta e cantos brancos
    esfera(g, 0.5, M(0xe0c060), [0.4, A + 0.8, P / 2 + 0.2], [1.2, 0.4, 0.5]);
    [-L / 2, L / 2].forEach((x) => [-P / 2, P / 2].forEach((z) => bloco(g, [0.15, A, 0.15], branco, [x, A / 2, z])));
    solido(g, 0.2);
    return g;
  }
  function trator(pai, pos, giroY = 0, cor = 0x2f9e4f) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    const corpo = M(cor, { roughness: 0.45 }), preto = M(0x24272b), aro = M(0xf5c518);
    caixa(g, [2.2, 0.75, 0.95], corpo, [0.4, 1.0, 0]);
    caixa(g, [1.1, 0.7, 1.3], corpo, [-0.9, 1.15, 0]);
    caixa(g, [1.05, 1.0, 1.2], M(0x2d4a63, { roughness: 0.15, metalness: 0.3 }), [-0.9, 2.0, 0]);
    caixa(g, [1.3, 0.1, 1.45], corpo, [-0.9, 2.55, 0]);
    cilindro(g, [0.06, 0.06, 0.9], M(0x3b4048), [1.05, 1.75, 0.25]);
    [-1, 1].forEach((l) => {
      const tras = cilindro(g, [0.82, 0.82, 0.5], preto, [-0.9, 0.82, l * 0.95], [Math.PI / 2, 0, 0], 24);
      cilindro(tras, [0.45, 0.45, 0.52], aro, [0, 0, 0], null, 16);
      const frente = cilindro(g, [0.45, 0.45, 0.32], preto, [1.15, 0.45, l * 0.62], [Math.PI / 2, 0, 0], 20);
      cilindro(frente, [0.24, 0.24, 0.34], aro, [0, 0, 0], null, 12);
    });
    caixa(g, [0.06, 0.18, 0.5], M(0xfff3c0, { emissive: 0xfff3c0, emissiveIntensity: 0.3 }), [1.52, 1.1, 0]);
    solido(g, 0.15);
    return g;
  }
  // Vaca malhada (frente pra +x), pastando: a cabeça desce e sobe e o rabo balança
  function vaca(pai, pos, giroY = 0, fase = 0) {
    const M = paleta();
    const g = grupo(pai, pos, giroY);
    const malhada = textura(128, 64, (c, w, h) => {
      c.fillStyle = '#f7f5ef'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#26221f';
      const r = K.rand(3 + fase);
      for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(r() * w, r() * h, 8 + r() * 14, 6 + r() * 10, r() * 3, 0, Math.PI * 2); c.fill(); }
    });
    const pelo = K.mat(0xffffff, { map: malhada, roughness: 0.85 });
    const corpo = K.malha(new THREE.CapsuleGeometry(0.55, 1.1, 8, 20).rotateZ(Math.PI / 2), pelo);
    por(g, corpo, [0, 1.25, 0]);
    corpo.scale.set(1, 1, 0.85);
    [[0.6, 0.35], [0.6, -0.35], [-0.65, 0.35], [-0.65, -0.35]].forEach(([x, z]) => {
      cilindro(g, [0.11, 0.09, 0.8], pelo, [x, 0.42, z]);
      cilindro(g, [0.1, 0.1, 0.1], M(0x3b2f28), [x, 0.05, z]);
    });
    esfera(g, 0.22, M(0xf2b6b0), [-0.25, 0.68, 0], [1, 0.6, 1]);
    const cab = grupo(g, [1.05, 1.45, 0]);
    caixa(cab, [0.62, 0.48, 0.5], pelo, [0.25, 0, 0]);
    caixa(cab, [0.25, 0.32, 0.46], M(0xf2b6b0), [0.58, -0.08, 0]);
    [-1, 1].forEach((l) => {
      esfera(cab, 0.05, M(0x111111), [0.42, 0.1, l * 0.2]);
      por(cab, K.malha(new THREE.ConeGeometry(0.05, 0.22, 8), M(0xf4f1ea)), [0.15, 0.32, l * 0.2], [0, 0, 0]);
      esfera(cab, 0.12, M(0x26221f), [0.1, 0.12, l * 0.3], [0.5, 0.3, 1]);
    });
    const rabo = grupo(g, [-1.15, 1.45, 0]);
    barra(rabo, [0, 0, 0], [-0.15, -0.8, 0], 0.03, pelo);
    esfera(rabo, 0.08, M(0x26221f), [-0.15, -0.85, 0]);
    K.vivo((t) => {
      const pasta = (Math.sin(t * 0.45 + fase) + 1) / 2;
      cab.rotation.z = -0.9 * pasta;
      cab.position.y = 1.45 - 0.35 * pasta;
      rabo.rotation.x = 0.4 * Math.sin(t * 2.3 + fase);
    });
    return g;
  }
  // Galinha (frente pra +x) que cisca
  function galinha(pai, pos, fase = 0) {
    const M = paleta();
    const g = grupo(pai, pos);
    esfera(g, 0.2, M(0xf4f1ea), [0, 0.32, 0], [1.2, 1, 0.9]);
    const cab = grupo(g, [0.2, 0.5, 0]);
    esfera(cab, 0.1, M(0xf4f1ea), [0, 0, 0]);
    por(cab, K.malha(new THREE.ConeGeometry(0.035, 0.1, 8), M(0xf5a623)), [0.1, -0.01, 0], [0, 0, -Math.PI / 2]);
    caixa(cab, [0.1, 0.07, 0.03], M(0xe8352b), [0, 0.1, 0]);
    [-0.06, 0.06].forEach((z) => barra(g, [0, 0.18, z], [0.02, 0, z], 0.015, M(0xf5a623)));
    esfera(g, 0.1, M(0xe9e4da), [-0.22, 0.42, 0], [0.6, 1, 0.8]);
    K.vivo((t) => {
      const u = (t * 0.8 + fase) % 3;
      g.rotation.y = fase * 2 + Math.floor((t * 0.8 + fase) / 3) * 1.7;
      const bica = u < 0.6 ? Math.sin((u / 0.6) * Math.PI) : 0;
      cab.rotation.z = -1.1 * bica;
      cab.position.set(0.2 + 0.05 * bica, 0.5 - 0.22 * bica, 0);
    });
    return g;
  }
  function cataVento(pai, pos) {
    const M = paleta();
    const g = grupo(pai, pos);
    const pes = [];
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([x, z]) => pes.push([[x * 1.1, 0, z * 1.1], [x * 0.2, 8, z * 0.2]]));
    for (let y = 1.5; y < 8; y += 1.8) { const k = 1.1 - (0.9 * y) / 8; pes.push([[-k, y, -k], [k, y, -k]], [[k, y, -k], [k, y, k]], [[k, y, k], [-k, y, k]], [[-k, y, k], [-k, y, -k]]); }
    barras(g, pes, 0.05, M(0xc9ccd1, { metalness: 0.5 }));
    const roda = grupo(g, [0, 8.3, 0.5]);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; caixa(roda, [0.3, 1.5, 0.03], M(0xf4f4f2), [Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0], [0, 0.3, a - Math.PI / 2]); }
    caixa(g, [0.2, 0.2, 1.6], M(0x8d939a), [0, 8.3, -0.4]);
    caixa(g, [0.05, 0.9, 0.9], M(0xe8352b), [0, 8.3, -1.3]);
    K.vivo((t) => { roda.rotation.z = t * 1.4; });
    return g;
  }
  function cercaRustica(pai, a, b) {
    const M = paleta();
    const d = V3(b).sub(V3(a)), comp = d.length();
    const g = grupo(pai, [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2], Math.atan2(-d.z, d.x));
    const postes = [];
    for (let x = -comp / 2; x <= comp / 2 + 0.01; x += 2.4) postes.push({ pos: [x, 0.65, 0] });
    copias(g, new THREE.CylinderGeometry(0.08, 0.09, 1.3, 6), M(0x7a5a3a), postes);
    [0.5, 1.0].forEach((y) => caixa(g, [comp, 0.1, 0.06], M(0x9a7350), [0, y, 0.06]));
    return g;
  }

  CENARIOS.fazenda = function (C, g, op) {
    const M = paleta();
    C.ceu = 'azul';
    C.neblina = [90, 400, 800];
    C.caixaSombra = 22;
    chao(g, { cores: [0x79b04b, 0xa6d26b, 0xc2cf6a], grao: 180 });
    const estrada = [];
    for (let i = 0; i <= 16; i++) { const z = 12 - i * 2; estrada.push([-3.2 + Math.max(0, -z) * 0.22 + Math.sin(i * 0.4) * 0.3, z]); }
    faixaNoChao(g, estrada, 2.6, 0xb08d5e);
    C.objetos.celeiro = celeiro(g, [-7.5, 0, -15], 0.25);
    const silo = grupo(g, [-1.6, 0, -18]);
    cilindro(silo, [1.6, 1.6, 8], M(0xc9ccd1, { metalness: 0.4, roughness: 0.4 }), [0, 4, 0], null, 28);
    esfera(silo, 1.65, M(0xa9adb3, { metalness: 0.4 }), [0, 8, 0], [1, 0.6, 1]);
    for (let y = 1; y < 8; y += 1.4) cilindro(silo, [1.63, 1.63, 0.06], M(0x9aa0a6), [0, y, 0]);
    solido(silo, 0.2);
    C.objetos.silo = silo;
    // Plantação de milho à direita, em fileiras
    const milho = [], espiga = [];
    for (let fx = 0; fx < 9; fx++) for (let z = -6; z > -26; z -= 0.75) {
      const x = 8 + fx * 1.1, s = 0.85 + ((fx * 7 + z * 3) % 1 + 1) % 1 * 0.3;
      milho.push({ pos: [x, 0.95 * s, z], esc: [1, s, 1], giro: [0, fx + z, 0] });
      if ((fx + Math.round(z)) % 3 === 0) espiga.push({ pos: [x + 0.12, 1.15 * s, z], giro: [0, 0, -0.4] });
    }
    copias(g, new THREE.ConeGeometry(0.28, 1.9, 5), M(0x5aa83f), milho);
    copias(g, new THREE.CapsuleGeometry(0.06, 0.2, 4, 8), M(0xf5c518), espiga);
    C.lugares.plantacao = [12, 1, -14];
    // Pasto cercado à esquerda com as vacas, galinhas soltas perto do celeiro
    cercaRustica(g, [-17, 0, -4], [-7, 0, -4]);
    cercaRustica(g, [-17, 0, -4], [-17, 0, 8]);
    cercaRustica(g, [-17, 0, 8], [-7, 0, 8]);
    C.objetos.vacas = [vaca(g, [-12, 0, 1.5], 0.3, 0), vaca(g, [-13.5, 0, 5.5], -2.4, 2)];
    C.objetos.galinhas = [[-4.6, -6.6], [-3.8, -7.4], [-5.4, -7.8], [-4.2, -8.6]].map(([x, z], i) => galinha(g, [x, 0, z], i * 1.3));
    C.objetos.trator = trator(g, [5.4, 0, -5.8], -0.6);
    // Fardos de feno, bebedouro e o cata-vento
    [[3.2, -1.8, 0.3], [4.5, -2.3, -0.2], [3.9, -1.9, 0.1, 1.1]].forEach(([x, z, a, y]) => cilindro(g, [0.6, 0.6, 1.1], M(0xe0c060, { map: K.texGrao(2) }), [x, y || 0.6, z], [Math.PI / 2, a, 0], 20));
    caixa(g, [2, 0.5, 0.6], M(0x8b5b35), [-8.6, 0.25, -1.4]);
    caixa(g, [1.9, 0.05, 0.5], M(0x4aa3e8, { roughness: 0.1 }), [-8.6, 0.48, -1.4]);
    C.objetos.cataVento = cataVento(g, [6, 0, -22]);
    // Casa da fazenda lá atrás, árvores e morros
    casaTerrea(g, [18, 0, -28], -0.5, { cor: 0xf4f1ea, telhado: 0xc8442f, noite: C.noite });
    [[-60, -90, 40, 12, 0x86c158], [50, -100, 46, 14, 0x9fcf72], [0, -130, 60, 16, 0x86c158]].forEach(([x, z, r, a, cor]) => morro(g, [x, z], r, a, cor));
    arvoresLonge(g, [[-20, -24, 1.8], [-24, -14, 1.6], [24, -12, 1.8], [-14, -32, 2.1, true], [30, -34, 2.2], [12, -36, 1.9]]);
    const r = K.rand(41);
    [[-9, 7.5], [11.5, 5]].forEach(([x, z]) => { const a = K.arvore(x, z, 1.5, false, r); g.add(a); solidoCaixa([x - 1.3, 0, z - 1.3], [x + 1.3, 3.6, z + 1.3]); });
    K.enfeitar(g, 51, { flores: 60, arbustos: 8, pedras: 10, borboletas: 4, passaros: 4 });
    tufos(g, 1200, [-7, 8, -6, 12], [[0, 0, 1.4]], 9);
    nuvens(g, [[-26, 42, -100, 3.2], [24, 48, -120, 4], [60, 40, -90, 3]]);
    Object.assign(C.lugares, { celeiro: [-7.5, 2.5, -15], silo: [-1.6, 5, -18], trator: [5.4, 1.2, -5.8], pasto: [-12, 0, 2], vaca: [-12, 1.3, 1.5], galinhas: [-4.5, 0.3, -7.6], cata_vento: [6, 8, -22], feno: [3.9, 0.6, -2], estrada: [-3.2, 0, 6] });
    C.fundo = [-7.5, 3, -15];
    C.entrada = [-3.2, 0, 9];
    C.vista = { pos: [3.5, 2.4, 12], alvo: [-2, 3, -15] };
  };

  // ---------- Floresta: clareira cercada de árvores, tronco caído, cogumelos, riacho e raios de sol ----------

  CENARIOS.floresta = function (C, g, op) {
    const M = paleta();
    C.ceu = 'dia';
    C.neblina = [30, 140, 500];
    chao(g, { cores: [0x4f8a36, 0x6fa84a, 0x8a7a4a], grao: 220, zona: (x, z, mancha) => (Math.hypot(x, z) > 7 ? [0x5e4a2e, K.clamp((Math.hypot(x, z) - 7) / 6) * 0.35 * mancha] : null) });
    const r = K.rand(op.seed || 61);
    // Anel de árvores em volta da clareira (as de perto balançam) e a mata fechada depois
    let n = 0;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r() * 0.2, raio = 9 + r() * 6, x = Math.cos(a) * raio, z = Math.sin(a) * raio * 0.9 - 2;
      if (z > 6 && Math.abs(x) < 7) continue;
      const arv = K.arvore(x, z, 1.5 + r() * 0.9, r() < 0.45, r);
      g.add(arv);
      if (n++ % 2 === 0) solidoCaixa([x - 1, 0, z - 1], [x + 1, 4, z + 1]);
    }
    const longe = [];
    for (let i = 0; i < 90; i++) { const a = r() * Math.PI * 2, raio = 17 + r() * 30; longe.push([Math.cos(a) * raio, Math.sin(a) * raio - 4, 1.8 + r() * 1.4, r() < 0.5]); }
    arvoresLonge(g, longe.filter(([x, z]) => !(z > 8 && Math.abs(x) < 10)), 7);
    // Tronco caído com musgo, cogumelos e samambaias
    const tronco = grupo(g, [-4.8, 0, -3.4], 0.5);
    cilindro(tronco, [0.55, 0.6, 4.2], M(0x6b4a2e, { map: K.texGrao(2), roughness: 1 }), [0, 0.5, 0], [0, 0, Math.PI / 2], 16);
    cilindro(tronco, [0.5, 0.5, 0.02], M(0xc8a070), [2.11, 0.5, 0], [0, 0, Math.PI / 2], 16);
    esfera(tronco, 0.4, M(0x5aa83f), [0.4, 0.95, 0.1], [2, 0.35, 1]);
    solido(tronco, 0.1);
    C.objetos.tronco = tronco;
    [[-3.2, -1.8, 0.28], [-2.8, -2.1, 0.18], [-6.6, -2.2, 0.22], [3.6, -4.2, 0.3], [3.9, -3.8, 0.2]].forEach(([x, z, s]) => {
      cilindro(g, [s * 0.25, s * 0.3, s * 1.1], M(0xf4f1ea), [x, s * 0.55, z]);
      const chapeu = esfera(g, s, M(0xe8352b), [x, s * 1.1, z], [1, 0.55, 1]);
      [0, 2, 4].forEach((k) => esfera(chapeu, 0.18, M(0xffffff), [Math.cos(k) * 0.55, 0.62, Math.sin(k) * 0.55], [1, 0.4, 1]));
    });
    const folhas = [];
    for (let i = 0; i < 46; i++) { const a = r() * Math.PI * 2, raio = 4.5 + r() * 4; const x = Math.cos(a) * raio, z = Math.sin(a) * raio * 0.8 - 1; if (z > 3) continue; for (let k = 0; k < 7; k++) folhas.push({ pos: [x, 0.02, z], giro: [0.95, (k / 7) * Math.PI * 2 + i, 0], ordem: 'YXZ', esc: [0.8 + r() * 0.4, 0.8 + r() * 0.3, 1] }); }
    copias(g, new THREE.PlaneGeometry(0.24, 0.85, 1, 3).translate(0, 0.42, 0), M(0x3f8a35, { side: THREE.DoubleSide }), folhas, false);
    // Riacho atrás, com a pontezinha de madeira
    const rio = [];
    for (let i = 0; i <= 30; i++) { const x = -30 + i * 2; rio.push([x, -8.5 + Math.sin(x * 0.18) * 1.6]); }
    const agua = faixaNoChao(g, rio, 2.2, 0x4aa3e8, { y: 0.03 });
    agua.material.roughness = 0.1;
    agua.material.map = null;
    K.vivo((t) => { agua.material.emissive.setHex(0x0a2a40); agua.material.emissiveIntensity = 0.4 + 0.15 * Math.sin(t * 2); });
    const ponte = grupo(g, [2.4, 0, -8.5 + Math.sin(2.4 * 0.18) * 1.6], 0.15);
    for (let k = -3; k <= 3; k++) caixa(ponte, [0.32, 0.08, 1.4], M(0x9a7350), [k * 0.36, 0.32 + Math.cos(k * 0.35) * 0.12, 0]);
    [-0.7, 0.7].forEach((z) => barra(ponte, [-1.2, 0.3, z], [1.2, 0.3, z], 0.05, M(0x7a5a3a)));
    [[-5.6, -9.5, 0.9], [6.8, -7.4, 0.7], [7.6, -2.6, 1.1]].forEach(([x, z, s], i) => { const p = K.malha(new THREE.IcosahedronGeometry(s, 1), M(i % 2 ? 0x8a8f86 : 0x7c8a78)); p.position.set(x, s * 0.4, z); p.scale.y = 0.65; g.add(p); esfera(g, s * 0.6, M(0x5aa83f), [x, s * 0.75, z], [1.2, 0.3, 1]); });
    // Raios de sol entrando entre as copas e o pólen (de noite, vagalumes)
    for (let i = 0; i < 5; i++) {
      const raio = K.malha(new THREE.CylinderGeometry(0.6, 1.6, 22, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), false);
      raio.castShadow = false;
      por(g, raio, [-6 + i * 3.4, 9, -5 - (i % 2) * 3], [0.35, 0, -0.4]);
    }
    K.enfeitar(g, 71, { flores: 50, arbustos: 22, pedras: 16, borboletas: 6, passaros: 3 });
    tufos(g, 1400, [-9, 9, -7, 9], [[0, 0, 1.4], [-4.8, -3.4, 2.4]], 12);
    if (C.noite) particulas(g, 60, [0, 0, -2], [16, 3, 14], { cor: 0xd8ff6a, tam: 0.1, sobe: 0.01, vai: 0.6, opacidade: 0.95 });
    Object.assign(C.lugares, { tronco: [-4.8, 0.9, -3.4], cogumelos: [-3, 0.3, -2], riacho: [0, 0.05, -8.6], ponte: [2.4, 0.4, -8.1], clareira: [0, 0, 0] });
    C.fundo = [2.4, 1, -9];
    C.vista = { pos: [3, 2.4, 10], alvo: [-1, 2.4, -9] };
  };

  // ---------- Deserto: dunas, pirâmides, oásis com coqueiros e os blocos de pedra num trenó ----------

  // Pirâmide de degraus de pedra (textura de blocos): base quadrada de lado L e altura A
  function piramide(pai, pos, L, A, giroY = 0.25) {
    const tex = textura(256, 256, (c, w, h) => {
      c.fillStyle = '#d8b878'; c.fillRect(0, 0, w, h);
      const r = K.rand(17);
      for (let y = 0; y < h; y += 16) for (let x = -(y % 32); x < w; x += 32) { c.fillStyle = rgb(0xd8b878, 0.88 + r() * 0.2); c.fillRect(x + 1, y + 1, 30, 14); }
      c.fillStyle = 'rgba(90,60,30,0.35)';
      for (let y = 0; y < h; y += 16) c.fillRect(0, y, w, 2);
    }, [L / 6, A / 6]);
    const m = K.malha(new THREE.ConeGeometry(L / Math.SQRT2, A, 4, 1), K.mat(0xffffff, { map: tex, roughness: 0.95, flatShading: true }));
    m.position.set(pos[0], A / 2, pos[2]);
    m.rotation.y = Math.PI / 4 + giroY;
    pai.add(m);
    return m;
  }

  CENARIOS.deserto = function (C, g, op) {
    const M = paleta();
    C.ceu = ['dia', 'tarde', 0.18];
    C.neblina = [90, 520, 900];
    chao(g, { tam: 900, seg: 240, cores: [0xd9b77c, 0xedd4a0, 0xe4c690], grao: 280, relevo: (x, z) => { const d = Math.hypot(x, z); return d < 16 ? 0 : K.clamp((d - 16) / 20) * (1.6 * Math.sin(x * 0.07 + z * 0.03) + 1.1 * Math.sin(z * 0.11 - x * 0.05) + 1.6); } });
    C.objetos.piramide = piramide(g, [-14, 0, -95], 70, 46);
    piramide(g, [42, 0, -150], 60, 40, 0.1);
    piramide(g, [-70, 0, -175], 46, 30, 0.4);
    // Oásis à direita: lagoinha e coqueiros
    const lagoa = cilindro(g, [4.2, 4.2, 0.05], M(0x3fb4d4, { roughness: 0.1, emissive: 0x0a3040, emissiveIntensity: 0.3 }), [11, 0.03, -9], null, 40);
    lagoa.scale.z = 0.6;
    [[8.4, -10.8, 1.2, 5], [13.6, -11, 1.0, 7], [10.4, -6.2, 0.9, 9], [14.2, -7.4, 1.3, 11]].forEach(([x, z, s, seed]) => coqueiro(g, [x, 0, z], s, seed));
    // Blocos de pedra e o trenó de madeira (do jeito que puxavam os blocos)
    const treno = grupo(g, [-4.6, 0, -3.6], 0.35);
    [-0.55, 0.55].forEach((z) => caixa(treno, [2.6, 0.18, 0.2], M(0x8b5b35), [0, 0.12, z]));
    bloco(treno, [1.6, 1.0, 1.1], M(0xd9c08e, { map: K.texGrao(2) }), [0, 0.72, 0]);
    barra(treno, [1.3, 0.2, 0], [3.4, 0.6, 0], 0.025, M(0xc9a46b));
    C.objetos.treno = treno;
    [[-7.6, -6.4, 0.3], [-8.4, -5.2, 0.9], [-7.9, -5.8, 0.5, 1.0], [5.2, -3.8, 0.2]].forEach(([x, z, a, y]) => bloco(g, [1.4, 0.9, 1.0], M(0xd9c08e, { map: K.texGrao(2) }), [x, (y || 0) + 0.45, z], [0, a, 0]));
    const toras = [];
    for (let k = 0; k < 4; k++) toras.push([[-3 + k * 0.7, 0.12, -6.6], [-3 + k * 0.7, 0.12, -4.8]]);
    barras(g, toras, 0.11, M(0x9a7350), 8);
    [[6.5, 2.5, 0.6], [-9, 1, 0.8], [3, -12, 1.2]].forEach(([x, z, s], i) => { const p = K.malha(new THREE.IcosahedronGeometry(s, 0), M(0xb89a6a)); p.position.set(x, s * 0.35, z); p.rotation.set(i, i * 2, 0); g.add(p); });
    nuvens(g, [[-40, 50, -160, 3], [50, 56, -180, 3.6]]);
    Object.assign(C.lugares, { piramide: [-14, 20, -95], oasis: [11, 0, -9], treno: [-4.6, 0.8, -3.6], blocos: [-8, 0.5, -5.8] });
    C.fundo = [-14, 20, -95];
    C.vista = { pos: [4, 2, 11], alvo: [-4, 5, -30] };
  };

  // ---------- Consultório: maca, mesa do médico, armário de remédio, cartaz do corpo humano e balança ----------

  CENARIOS.consultorio = function (C, g, op) {
    const M = paleta();
    C.ceu = 'interior';
    C.neblina = [80, 300, 600];
    const fundo = -4.2, esq = -6, dir = 6;
    comodo(g, { piso: texPiso([12, 14], 0.45, '#eef3f5', '#e3eaee', '#cdd6dc'), corParede: 0xdcecf2, corParede2: 0xd2e6ee, fundo, esquerda: esq, direita: dir });
    bloco(g, [12, 1.1, 0.03], M(0xffffff), [0, 0.55, fundo + 0.02]);
    // Maca com lençol de papel e o banquinho
    const maca = grupo(g, [-3.6, 0, fundo + 0.9]);
    caixa(maca, [2.1, 0.12, 0.8], M(0xc9ccd1, { metalness: 0.4 }), [0, 0.72, 0]);
    caixa(maca, [2.0, 0.14, 0.72], M(0x8fd3c8), [0, 0.84, 0]);
    caixa(maca, [0.6, 0.14, 0.72], M(0x8fd3c8), [-0.82, 0.98, 0], [0, 0, 0.35]);
    caixa(maca, [1.6, 0.01, 0.5], M(0xffffff), [0.15, 0.92, 0]);
    [[-0.9, -0.3], [0.9, -0.3], [-0.9, 0.3], [0.9, 0.3]].forEach(([x, z]) => cilindro(maca, [0.03, 0.03, 0.7], M(0xc9ccd1, { metalness: 0.5 }), [x, 0.35, z]));
    caixa(maca, [0.5, 0.2, 0.35], M(0xc9ccd1), [0.6, 0.18, 0.6]);
    solido(maca, 0.1);
    C.objetos.maca = maca;
    // Cartaz do corpo humano na parede
    const cartaz = textura(256, 384, (c, w, h) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#2f7fe0'; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
      c.fillStyle = '#f2c9a8';
      c.beginPath(); c.arc(w / 2, 70, 34, 0, Math.PI * 2); c.fill();
      c.fillRect(w / 2 - 45, 108, 90, 140); c.fillRect(w / 2 - 80, 112, 30, 120); c.fillRect(w / 2 + 50, 112, 30, 120);
      c.fillRect(w / 2 - 42, 248, 34, 110); c.fillRect(w / 2 + 8, 248, 34, 110);
      [['#e8352b', w / 2 - 10, 150, 16], ['#f7941d', w / 2 + 14, 185, 18], ['#ff9fb5', w / 2 - 22, 135, 14], ['#ff9fb5', w / 2 + 22, 135, 14], ['#c06a3a', w / 2, 215, 20]].forEach(([cor, x, y, r]) => { c.fillStyle = cor; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
      c.fillStyle = '#1b1b1b'; c.font = '900 26px Montserrat, sans-serif'; c.textAlign = 'center'; c.fillText('CORPO HUMANO', w / 2, h - 14);
    });
    por(g, K.malha(new THREE.PlaneGeometry(1.3, 1.95), M(0xffffff, { map: cartaz })), [-0.6, 2.2, fundo + 0.03]);
    // Armário de remédios com vidro e frascos coloridos
    const arm = grupo(g, [1.9, 0, fundo + 0.3]);
    bloco(arm, [1.6, 2.2, 0.55], M(0xf4f4f2), [0, 1.1, 0]);
    const frascos = [];
    [0.75, 1.35, 1.9].forEach((y, f) => { for (let k = 0; k < 6; k++) frascos.push({ pos: [-0.6 + k * 0.24, y, 0.08], esc: [1, 0.8 + ((k + f) % 3) * 0.2, 1], cor: [0xe8352b, 0x2f7fe0, 0xf5c518, 0x2fb54a, 0xffffff, 0xf7941d][(k + f) % 6] }); });
    copias(arm, new THREE.CylinderGeometry(0.07, 0.07, 0.25, 12), M(0xffffff), frascos);
    bloco(arm, [1.5, 2.0, 0.04], M(0xd8f0f8, { transparent: true, opacity: 0.3, roughness: 0.05 }), [0, 1.15, 0.29]);
    caixa(arm, [0.4, 0.4, 0.04], M(0xe8352b), [0, 2.45, 0.28]);
    caixa(arm, [0.12, 0.3, 0.05], M(0xffffff), [0, 2.45, 0.31]);
    caixa(arm, [0.3, 0.1, 0.05], M(0xffffff), [0, 2.45, 0.31]);
    C.objetos.armario = arm;
    // Mesa do médico com computador e as duas cadeiras (à direita)
    const mesa = grupo(g, [4.3, 0, -0.6], -Math.PI / 2);
    caixa(mesa, [2.0, 0.08, 0.95], M(0xe9ecef), [0, 0.76, 0]);
    [[-0.9, -0.4], [0.9, -0.4], [-0.9, 0.4], [0.9, 0.4]].forEach(([x, z]) => cilindro(mesa, [0.03, 0.03, 0.74], M(0x9aa0a6), [x, 0.37, z]));
    const comp = grupo(mesa, [0.3, 0.8, -0.2]);
    caixa(comp, [0.75, 0.48, 0.05], M(0x1b1d22), [0, 0.38, 0]);
    caixa(comp, [0.68, 0.4, 0.02], M(0x8fd3ff, { emissive: 0x5fb8f0, emissiveIntensity: 0.6 }), [0, 0.38, 0.03]);
    cilindro(comp, [0.03, 0.03, 0.15], M(0x3b4048), [0, 0.08, 0]);
    caixa(mesa, [0.5, 0.02, 0.18], M(0x3b4048), [0.3, 0.81, 0.2]);
    caixa(mesa, [0.22, 0.3, 0.02], M(0xffffff), [-0.55, 0.92, 0.1], [-0.3, 0.4, 0]);
    solido(mesa, 0.1);
    C.objetos.mesa = mesa;
    // Balança, suporte de soro, pia com espelho e a janela
    const bal = grupo(g, [-5.2, 0, 0.4]);
    caixa(bal, [0.5, 0.08, 0.5], M(0xe9ecef), [0, 0.04, 0]);
    cilindro(bal, [0.04, 0.04, 1.4], M(0xc9ccd1, { metalness: 0.5 }), [0, 0.74, -0.2]);
    caixa(bal, [0.35, 0.25, 0.08], M(0xf4f4f2), [0, 1.45, -0.2]);
    const soro = grupo(g, [-1.6, 0, fundo + 0.8]);
    cilindro(soro, [0.025, 0.025, 1.9], M(0xc9ccd1, { metalness: 0.5 }), [0, 0.95, 0]);
    barra(soro, [-0.25, 1.9, 0], [0.25, 1.9, 0], 0.015, M(0xc9ccd1));
    caixa(soro, [0.18, 0.3, 0.06], M(0xdff4ff, { transparent: true, opacity: 0.7 }), [0.2, 1.7, 0]);
    [0, 2.1, 4.2].forEach((a) => barra(soro, [0, 0.05, 0], [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3], 0.02, M(0x9aa0a6)));
    const pia = grupo(g, [esq + 0.35, 0, -1.6], Math.PI / 2);
    caixa(pia, [0.8, 0.15, 0.5], M(0xffffff), [0, 0.85, 0]);
    cilindro(pia, [0.04, 0.05, 0.75], M(0xffffff), [0, 0.4, -0.05]);
    caixa(pia, [0.7, 0.9, 0.03], M(0xcfe8f0, { metalness: 0.6, roughness: 0.05 }), [0, 1.65, -0.23]);
    janela(g, [4.2, 2.3, fundo + 0.03], 1.6, 1.3, 0, { cortina: 0xd2e6ee });
    const placa = K.placa('CONSULTÓRIO', { larg: 1.6, alt: 0.35, fundo: '#2f7fe0', cor: '#ffffff', borda: '#ffffff' });
    por(g, placa, [-3.6, 3.35, fundo + 0.03]);
    Object.assign(C.lugares, { maca: [-3.6, 0.95, fundo + 0.9], cartaz: [-0.6, 2.2, fundo + 0.05], armario: [1.9, 1.3, fundo + 0.4], mesa: [4.3, 0.8, -0.6], computador: [4.1, 1.2, -0.3], balanca: [-5.2, 0.1, 0.4], soro: [-1.6, 1.7, fundo + 0.8], pia: [esq + 0.4, 0.9, -1.6] });
    C.fundo = [-0.6, 2, fundo];
    C.entrada = [4.5, 0, 5];
    C.vista = { pos: [3.2, 2.3, 8.2], alvo: [-0.8, 1.4, -2] };
  };

  // ---------- Oficina: carro no elevador, parede de ferramentas, pneus, bancada e o portão ----------

  CENARIOS.oficina = function (C, g, op) {
    const M = paleta();
    C.ceu = 'interior';
    C.neblina = [80, 300, 600];
    const fundo = -4.6, esq = -6.6, dir = 6.6;
    const pisoTex = textura(256, 256, (c, w, h) => {
      c.fillStyle = '#9da3a8'; c.fillRect(0, 0, w, h);
      const r = K.rand(3);
      for (let i = 0; i < 1600; i++) { const v = Math.round(140 + r() * 40); c.fillStyle = `rgba(${v},${v},${v},0.5)`; c.fillRect(r() * w, r() * h, 2, 2); }
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, 0, w, 2); c.fillRect(0, 0, 2, h);
    }, [6, 7]);
    const sala = comodo(g, { piso: pisoTex, corParede: 0xc9d3dc, corParede2: 0xbcc8d2, fundo, esquerda: esq, direita: dir });
    bloco(g, [13.2, 1.2, 0.03], M(0x2f6fd0), [0, 0.6, fundo + 0.02]);
    // Portão de enrolar meio aberto no fundo (luz entrando por baixo)
    const portao = grupo(g, [3.2, 0, fundo + 0.04]);
    bloco(portao, [4.2, 3.6, 0.04], M(0x1b1d22), [0, 1.8, 0]);
    for (let y = 1.6; y < 3.6; y += 0.18) bloco(portao, [4.2, 0.16, 0.06], M(0xb7bec6, { metalness: 0.5 }), [0, y, 0.02]);
    bloco(portao, [4.2, 1.5, 0.05], M(0xfff4d6, { emissive: 0xfff0c8, emissiveIntensity: 0.7 }), [0, 0.75, -0.01]);
    // Elevador de 2 colunas com o carro lá em cima
    const elev = grupo(g, [-3.1, 0, -2.3], Math.PI / 2);
    [-1.6, 1.6].forEach((z) => { bloco(elev, [0.35, 3.0, 0.35], M(0xe8352b), [0, 1.5, z]); barra(elev, [0, 1.55, z], [0.9, 1.5, z * 0.4], 0.05, M(0x3b4048)); barra(elev, [0, 1.55, z], [-0.9, 1.5, z * 0.4], 0.05, M(0x3b4048)); });
    bloco(elev, [0.4, 0.2, 3.6], M(0xe8352b), [0, 3.0, 0]);
    const carro = K.carro(0x2f7fe0);
    elev.add(carro);
    carro.scale.setScalar(1.35);
    carro.position.set(0, 1.55, 0);
    carro.rotation.y = Math.PI / 2;
    solido(elev, 0.1);
    C.objetos.carro = carro;
    C.objetos.elevador = elev;
    // Parede de ferramentas (painel com as silhuetas), bancada com morsa e o carrinho de ferramentas vermelho
    const painel = grupo(g, [esq + 0.05, 0, 1.4], Math.PI / 2);
    bloco(painel, [3.2, 1.6, 0.04], M(0xe9dcc4), [0, 2.0, 0]);
    const ferr = [[-1.2, 2.3, 0.08, 0.6, 0x5b6470], [-0.9, 2.3, 0.06, 0.5, 0x5b6470], [-0.6, 2.3, 0.07, 0.55, 0x5b6470], [-0.1, 2.2, 0.08, 0.7, 0xe8352b], [0.4, 2.25, 0.07, 0.6, 0xf5c518], [0.9, 2.3, 0.09, 0.5, 0x2f7fe0], [1.25, 2.2, 0.06, 0.6, 0x5b6470]];
    ferr.forEach(([x, y, l, a, cor]) => caixa(painel, [l, a, 0.05], M(cor, { metalness: 0.4 }), [x, y, 0.05]));
    [[-0.8, 1.6], [0.6, 1.6]].forEach(([x, y]) => caixa(painel, [0.5, 0.1, 0.05], M(0x8b5b35), [x, y, 0.05]));
    const bancada = grupo(g, [esq + 0.5, 0, 1.4], Math.PI / 2);
    caixa(bancada, [3.0, 0.1, 0.8], M(0x8b5b35), [0, 0.92, 0.1]);
    [[-1.4, -0.25], [1.4, -0.25], [-1.4, 0.45], [1.4, 0.45]].forEach(([x, z]) => caixa(bancada, [0.08, 0.9, 0.08], M(0x3b4048), [x, 0.45, z]));
    caixa(bancada, [0.3, 0.22, 0.2], M(0x2f6fd0), [-0.9, 1.08, 0.2]);
    solido(bancada, 0.1);
    const carrinho = grupo(g, [4.9, 0, -2.6], -0.4);
    bloco(carrinho, [1.0, 1.1, 0.55], M(0xe8352b), [0, 0.65, 0]);
    for (let k = 0; k < 5; k++) caixa(carrinho, [0.9, 0.16, 0.04], M(0xc8241c), [0, 0.3 + k * 0.2, 0.29]);
    [[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]].forEach(([x, z]) => cilindro(carrinho, [0.05, 0.05, 0.06], M(0x24272b), [x, 0.05, z], [Math.PI / 2, 0, 0]));
    // Pneus empilhados, tambores de óleo e o compressor
    const pneus = grupo(g, [5.1, 0, 1.0]);
    for (let k = 0; k < 4; k++) por(pneus, K.malha(new THREE.TorusGeometry(0.36, 0.16, 12, 24), M(0x24272b)), [0, 0.16 + k * 0.32, 0], [Math.PI / 2, 0, k * 0.4]);
    [[5.5, -0.6, 0xe8352b], [5.0, -1.3, 0x2f7fe0]].forEach(([x, z, cor]) => { const t = K.tambor(cor); g.add(t.g || t); (t.g || t).position.set(x, 0, z); });
    const comp = grupo(g, [-5.6, 0, 4.2]);
    cilindro(comp, [0.35, 0.35, 1.1], M(0xe8352b), [0, 0.45, 0], [0, 0, Math.PI / 2]);
    caixa(comp, [0.6, 0.35, 0.4], M(0x3b4048), [0, 0.9, 0]);
    const placa = K.placa('OFICINA', { larg: 2.2, alt: 0.55, fundo: '#f5c518' });
    por(g, placa, [-2.2, 3.8, fundo + 0.03]);
    [[2.2, -1.8, 0.7], [-1.0, 2.2, 0.45], [4.0, 2.8, 0.55]].forEach(([x, z, rr]) => { const m = K.malha(new THREE.CircleGeometry(rr, 20).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x3a3a40, transparent: true, opacity: 0.22, depthWrite: false }), false); m.scale.set(1, 1, 0.6); por(g, m, [x, 0.012, z]); });
    Object.assign(C.lugares, { carro: [-3.1, 2.4, -2.3], elevador: [-3.1, 1.5, -2.3], baixo_do_carro: [-3.1, 0, -2.3], ferramentas: [esq + 0.1, 2.1, 1.4], bancada: [esq + 0.6, 1.0, 1.4], pneus: [5.1, 0.6, 1.0], portao: [3.2, 1.5, fundo] });
    C.fundo = [-3.1, 2.2, -2.3];
    C.entrada = [3.2, 0, 5];
    C.esquerda = [-3.6, 0, 1.2];
    C.vista = { pos: [3.4, 2.4, 9], alvo: [-1, 1.6, -2.2] };
  };

  // ---------- Escritório: mesas com computador, janela com a cidade, quadro com gráfico e plantas ----------

  CENARIOS.escritorio = function (C, g, op) {
    const M = paleta();
    C.ceu = 'interior';
    C.neblina = [80, 300, 600];
    const fundo = -4.4, esq = -6.4, dir = 6.4;
    const carpete = textura(128, 128, (c, w, h) => { c.fillStyle = '#7d8ea3'; c.fillRect(0, 0, w, h); const r = K.rand(7); for (let i = 0; i < 900; i++) { const v = r() < 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'; c.fillStyle = v; c.fillRect(r() * w, r() * h, 2, 2); } }, [10, 10]);
    comodo(g, { piso: carpete, corParede: 0xeef0f2, corParede2: 0xe2e6ea, fundo, esquerda: esq, direita: dir });
    // Janelão com a cidade lá fora (desenhada)
    const cidadeTex = textura(512, 256, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5aa6e8'); gr.addColorStop(1, '#cfe9fb'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      const r = K.rand(13);
      for (let i = 0; i < 18; i++) { const x = i * 30 - 10, l = 26 + r() * 14, a = 60 + r() * 140; c.fillStyle = ['#9fb4c8', '#b7c6d4', '#8ea4ba', '#c5d1dc'][i % 4]; c.fillRect(x, h - a, l, a); c.fillStyle = 'rgba(255,255,255,0.5)'; for (let y = h - a + 8; y < h - 6; y += 12) for (let xx = x + 4; xx < x + l - 4; xx += 8) c.fillRect(xx, y, 4, 6); }
    });
    bloco(g, [7, 2.4, 0.06], M(0xffffff, { map: cidadeTex, emissive: 0xffffff, emissiveMap: cidadeTex, emissiveIntensity: 0.5 }), [-0.5, 2.3, fundo + 0.02]);
    for (let x = -4; x <= 3; x += 1.75) bloco(g, [0.08, 2.4, 0.1], M(0x3b4048), [x, 2.3, fundo + 0.05]);
    [1.1, 3.5].forEach((y) => bloco(g, [7.1, 0.08, 0.1], M(0x3b4048), [-0.5, y, fundo + 0.05]));
    // Duas mesas com computador e cadeira
    const mesaDe = (pos, giro) => {
      const m = grupo(g, pos, giro);
      caixa(m, [1.8, 0.07, 0.85], M(0xe9e4da), [0, 0.75, 0]);
      [[-0.85, 0], [0.85, 0]].forEach(([x]) => caixa(m, [0.06, 0.74, 0.8], M(0x9aa0a6), [x, 0.37, 0]));
      const tela = grupo(m, [0, 0.79, -0.22]);
      caixa(tela, [0.8, 0.5, 0.05], M(0x1b1d22), [0, 0.38, 0]);
      caixa(tela, [0.72, 0.42, 0.02], M(0x8fd3ff, { emissive: 0x5fb8f0, emissiveIntensity: 0.6 }), [0, 0.38, 0.03]);
      cilindro(tela, [0.03, 0.03, 0.15], M(0x3b4048), [0, 0.08, 0]);
      caixa(m, [0.5, 0.02, 0.18], M(0x3b4048), [0, 0.8, 0.15]);
      cilindro(m, [0.05, 0.04, 0.1], M(0xe8352b), [0.6, 0.83, 0.1]);
      const cad = grupo(m, [0, 0, 0.75], Math.PI);
      caixa(cad, [0.55, 0.1, 0.5], M(0x2a2e33), [0, 0.5, 0]);
      caixa(cad, [0.55, 0.65, 0.08], M(0x2a2e33), [0, 0.9, 0.25]);
      cilindro(cad, [0.04, 0.04, 0.45], M(0x9aa0a6), [0, 0.25, 0]);
      [0, 1.25, 2.5, 3.75, 5].forEach((a) => barra(cad, [0, 0.05, 0], [Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3], 0.02, M(0x3b4048)));
      solido(m, 0.1);
      return m;
    };
    C.objetos.mesas = [mesaDe([-3.6, 0, -2.4], 0.25), mesaDe([3.4, 0, -2.6], -0.25)];
    // Quadro branco com o gráfico subindo (parede da direita)
    const graf = textura(256, 160, (c, w, h) => {
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#1b1b1b'; c.lineWidth = 3; c.beginPath(); c.moveTo(20, 10); c.lineTo(20, h - 20); c.lineTo(w - 10, h - 20); c.stroke();
      [[40, 30, '#2f7fe0'], [80, 55, '#2f7fe0'], [120, 45, '#2f7fe0'], [160, 85, '#2fb54a'], [200, 110, '#2fb54a']].forEach(([x, a, cor]) => { c.fillStyle = cor; c.fillRect(x, h - 20 - a, 26, a); });
      c.strokeStyle = '#e8352b'; c.lineWidth = 4; c.beginPath(); c.moveTo(40, h - 45); c.lineTo(95, h - 70); c.lineTo(135, h - 60); c.lineTo(175, h - 100); c.lineTo(225, h - 130); c.stroke();
    });
    const quadro = grupo(g, [dir - 0.05, 0, 0.2], -Math.PI / 2);
    bloco(quadro, [2.4, 1.5, 0.05], M(0xffffff, { map: graf }), [0, 1.9, 0]);
    bloco(quadro, [2.5, 1.6, 0.03], M(0x9aa0a6), [0, 1.9, -0.03]);
    C.objetos.quadro = quadro;
    // Plantas, bebedouro, arquivo e relógio
    [[esq + 0.7, fundo + 0.7], [dir - 0.7, fundo + 0.7]].forEach(([x, z]) => {
      const pl = grupo(g, [x, 0, z]);
      cilindro(pl, [0.32, 0.25, 0.6], M(0xf4f1ea), [0, 0.3, 0]);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; const f = K.malha(new THREE.SphereGeometry(0.22, 10, 8), M(0x3f8a35)); f.scale.set(0.35, 1.7, 0.16); por(pl, f, [Math.sin(a) * 0.2, 1.0 + (k % 3) * 0.12, Math.cos(a) * 0.2], [Math.cos(a) * 0.5, a, -Math.sin(a) * 0.5]); }
    });
    const beb = grupo(g, [esq + 0.6, 0, 1.6]);
    caixa(beb, [0.5, 1.05, 0.5], M(0xf4f4f2), [0, 0.52, 0]);
    cilindro(beb, [0.2, 0.2, 0.5], M(0x8fd3ff, { transparent: true, opacity: 0.6, roughness: 0.05 }), [0, 1.3, 0]);
    const arq = grupo(g, [esq + 0.45, 0, -1.6]);
    bloco(arq, [0.6, 1.3, 0.7], M(0x9aa0a6, { metalness: 0.3 }), [0, 0.65, 0]);
    for (let k = 0; k < 3; k++) caixa(arq, [0.04, 0.35, 0.6], M(0x7d848c), [0.31, 0.3 + k * 0.42, 0]);
    Object.assign(C.lugares, { mesa: [-3.6, 0.8, -2.4], computador: [-3.6, 1.2, -2.6], mesa2: [3.4, 0.8, -2.6], quadro: [dir - 0.1, 1.9, 0.2], janela: [-0.5, 2.3, fundo], bebedouro: [esq + 0.6, 1.0, 1.6] });
    C.fundo = [-0.5, 2.2, fundo];
    C.entrada = [3.5, 0, 5];
    C.vista = { pos: [3.2, 2.4, 8.4], alvo: [-0.8, 1.5, -2] };
  };

  // ---------- Estúdio: fundo infinito (o chão vira parede numa curva), luz macia e um pedestal ----------

  CENARIOS.estudio = function (C, g, op) {
    C.ceu = 'interior';
    C.neblina = [200, 600, 900];
    const cor = op.cor != null ? new THREE.Color(op.cor) : new THREE.Color(0xe7ebf0);
    // O perfil do fundo infinito: chão reto, curva e parede subindo lá atrás
    const perfil = [];
    for (let i = 0; i <= 16; i++) { const a = (i / 16) * (Math.PI / 2); perfil.push([-9 - Math.sin(a) * 6, 6 - Math.cos(a) * 6]); }
    const pts = [[14, 0], ...perfil.map(([z, y]) => [z, y]), [-15, 20]];
    const shape = [];
    pts.forEach(([z, y]) => shape.push(new THREE.Vector2(z, y)));
    const geo = new THREE.BufferGeometry(), pos = [], idx = [], L = 60;
    shape.forEach((p) => pos.push(-L / 2, p.y, p.x, L / 2, p.y, p.x));
    for (let i = 0; i < shape.length - 1; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const fundoInf = K.malha(geo, K.mat(cor.getHex(), { roughness: 0.95, side: THREE.DoubleSide }), false);
    fundoInf.receiveShadow = true;
    g.add(fundoInf);
    if (op.pedestal !== false) {
      const M = paleta();
      const ped = cilindro(g, [2.1, 2.2, 0.18], M(cor.clone().offsetHSL(0, 0, -0.08).getHex(), { roughness: 0.6 }), [0, 0.09, 0], null, 48);
      C.objetos.pedestal = ped;
    }
    C.centro = [0, op.pedestal !== false ? 0.18 : 0, 0];
    Object.assign(C.lugares, { pedestal: [0, 0.18, 0] });
    C.personagem = [2.7, 0, 1.2];
    C.fundo = [0, 3, -12];
    C.vista = { pos: [2.6, 2.2, 10], alvo: [0, 1.2, -2] };
  };

  // ---------- Montagem do cenário ----------

  // Os nomes dos cenários prontos (pra K.cenario)
  K.CENARIOS = Object.keys(CENARIOS);
  // Cenário pronto: o lugar inteiro com um nome só (explicação no topo deste arquivo). Chamar uma vez, no montar
  K.cenario = function (nome, op = {}) {
    const chave = APELIDOS[normalizar(nome)] || normalizar(nome);
    const fazer = CENARIOS[chave];
    if (!fazer) throw new Error(`K.cenario: o cenário "${nome}" não existe. Use um destes: ${K.CENARIOS.join(', ')}`);
    const g = new THREE.Group();
    g.name = 'cenario-' + chave;
    K.scene.add(g);
    const C = {
      nome: chave, grupo: g, noite: op.hora === 'noite', hora: op.hora || 'dia',
      centro: [0, 0, 0], personagem: [1.6, 0, 0.9], entrada: [-3, 0, 4.5], esquerda: [-2.6, 0, 0.4], direita: [2.9, 0, 0.3], fundo: [0, 3, -12],
      lugares: {}, objetos: {}, ceu: 'dia', neblina: [60, 220, 600], caixaSombra: 16,
      vista: { pos: [2.5, 2.2, 11], alvo: [0, 1.8, -8] }
    };
    fazer(C, g, op);
    // Os objetos do cenário ganham nome pro "mostra" do roteiro.json (C.objetos.betoneira → "betoneira")
    Object.entries(C.objetos).forEach(([n, o]) => (Array.isArray(o) ? o : [o]).forEach((x) => {
      if (x && (x.isObject3D || (x.g && x.g.isObject3D))) K.nomear(n, x);
    }));
    // A hora do dia muda o céu dos cenários de fora (dentro de casa a luz é a mesma)
    if (typeof C.ceu === 'string' && !['interior', 'espaco', 'lua', 'mar', 'abismo', 'escuro'].includes(C.ceu)) {
      if (op.hora === 'tarde') C.ceu = [C.ceu, 'tarde', 0.85];
      else if (op.hora === 'noite') C.ceu = ['noite', 'tarde', 0.28];
    }
    if (op.ceu) C.ceu = op.ceu;
    K.vivo(() => {
      if (Array.isArray(C.ceu)) K.ceu(...C.ceu); else K.ceu(C.ceu);
      K.neblina(...C.neblina);
      K.caixaSombra(C.caixaSombra);
    });
    C.lugares = Object.assign({ centro: C.centro, personagem: C.personagem, entrada: C.entrada, esquerda: C.esquerda, direita: C.direita, fundo: C.fundo }, C.lugares);
    K.cenarioAtual = C;
    return C;
  };
})();
