// Bichos prontos da Máquina Preguiça 3D, feitos e testados em vídeos de verdade: a mosquita (a fêmea do
// mosquito, com as agulhas), o gato (as duas metades que giram separadas, pra mostrar como ele cai em pé), o
// ornitorrinco (com o filhote e o macho de esporão), o cachorro (vira-lata caramelo, com raio-X dos órgãos), o camaleão
// (olhos que giram cada um pro seu lado, língua elástica e a cor que muda) e a mosca, mais os efeitos estrelinhas da
// tontura, coraçõezinhos e fedor. Carregado depois do kit.js (o render cuida disso).
//
// Como usar: crie o bicho no montar (const gato = K.gato()) e, a cada quadro, ponha ele no lugar com em(pos, t, op), como o
// K.peixe: gato.em([x, y, z], tc, { rumo, cara: 'susto' }). As opções de cada um estão no comentário em cima dele; as
// caras prontas ficam em K.GATO_CARAS, K.CACHORRO_CARAS, K.ORNITORRINCO_CARAS e K.CAMALEAO_CARAS. O tamanho: o gato e o
// cachorro já vêm na escala certa perto do personagem (o.escala aumenta ou diminui)
(function () {
  const K = window.K;


  // ---------- Mosquita ----------

  const CORES_AGULHAS = [0xf39a1e, 0xf39a1e, 0xf5c518, 0xf5c518, 0xe8352b, 0x3a8fe0]; // serras, que seguram, sangue, saliva
  K.CORES_AGULHAS = CORES_AGULHAS;
  // Mosquita: a fêmea fofa de olhão e cílios, de frente pra +x. Asas batendo, seis pernas com
  // joelho, antenas, a probóscide com o estojo que dobra e as 6 agulhas que saem (e abrem em leque, coloridas, pra
  // explicar), e a barriga que enche de vermelho. op.macho: antena peluda, sem cílio. Tamanho ~1,6 do bico ao rabo.
  // fareja (0 a 1): antenas mexendo, cheirando
  // em(pos, t, op): op = { rumo, incl (nariz pra baixo +), giro (de lado), escala, voo (0 pousada, 1 voando), asas (0
  // dobradas, 1 batendo), barriga (0 a 1), dobra (estojo dobrando, 0 a 1), agulhas (quanto as agulhas passam da
  // ponta, 0 a 1), leque (agulhas abertas e coloridas, 0 a 1), olhar ([x, y] da pupila), feliz (0 a 1: bochecha corada),
  // pernas e bico (comprimento, 1 = normal; maior = pernilongo exagerado, como na capa do mosquito) }
  K.mosquita = function (op = {}) {
    const macho = !!op.macho;
    const g = new THREE.Group();
    g.rotation.order = 'YZX';
    const corpo = new THREE.Group();
    g.add(corpo);
    const escuro = K.mat(macho ? 0x54443a : 0x4a3830, { roughness: 0.42 });
    const listra = K.mat(0xf1ece2, { roughness: 0.6 });

    // Tórax corcunda e listrinha clara nas costas
    const torax = K.malha(new THREE.SphereGeometry(0.17), escuro);
    torax.scale.set(1.12, 1.0, 0.86);
    const lira = K.malha(new THREE.SphereGeometry(0.17).scale(0.6, 0.2, 0.2), listra);
    lira.position.set(0.02, 0.15, 0);
    lira.rotation.z = 0.25;
    corpo.add(torax, lira);

    // Barriga: listrada (textura), enche e fica vermelha
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 64;
    const c2 = cv.getContext('2d');
    c2.fillStyle = '#fff'; c2.fillRect(0, 0, 256, 64);
    c2.fillStyle = 'rgba(70,50,40,0.75)';
    for (let i = 0; i < 7; i++) c2.fillRect(20 + i * 33, 0, 13, 64);
    const texB = new THREE.CanvasTexture(cv);
    texB.colorSpace = THREE.SRGBColorSpace;
    const matBarriga = K.mat(0xc9b08a, { map: texB, roughness: 0.45, emissive: 0xc8102e, emissiveIntensity: 0 });
    const barriga = new THREE.Group();
    barriga.position.set(-0.17, -0.01, 0);
    barriga.rotation.z = 0.16;
    const saco = K.malha(new THREE.SphereGeometry(0.15).rotateZ(Math.PI / 2), matBarriga);
    saco.position.x = -0.33;
    saco.scale.set(2.4, 0.78, 0.8);
    const brilhoB = new THREE.Mesh(new THREE.SphereGeometry(0.035), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
    brilhoB.position.set(-0.3, 0.09, 0.09);
    barriga.add(saco, brilhoB);
    corpo.add(barriga);

    // Cabeça com olhão, cílios, antenas e o bico
    const cab = new THREE.Group();
    cab.position.set(0.24, 0.05, 0);
    const cranio = K.malha(new THREE.SphereGeometry(0.13), escuro);
    cab.add(cranio);
    const olhos = [], pupilas = [], cilios = [], bochechas = [], antenas = [];
    [-1, 1].forEach((s) => {
      const olho = new THREE.Group();
      olho.position.set(0.05, 0.04, s * 0.08);
      olho.rotation.y = -s * 0.9;
      const branco = new THREE.Mesh(new THREE.SphereGeometry(0.09), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.25 }));
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.057).scale(1, 1, 0.5), new THREE.MeshBasicMaterial({ color: 0x24160f }));
      iris.position.z = 0.068;
      const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.017), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      brilho.position.set(0.02, 0.022, 0.092);
      const pup = new THREE.Group();
      pup.add(iris, brilho);
      olho.add(branco, pup);
      pupilas.push(pup);
      olhos.push(branco);
      if (!macho) for (let k = 0; k < 3; k++) {
        const c = K.malha(new THREE.CylinderGeometry(0.006, 0.003, 0.065, 4).translate(0, 0.032, 0), K.mat(0x1a1210), false);
        c.position.set(-0.014 + k * 0.026, 0.078, 0.036);
        c.rotation.set(0.5, 0, -0.4 + k * 0.4);
        olho.add(c);
        cilios.push(c);
      }
      const boch = new THREE.Mesh(new THREE.CircleGeometry(0.025, 12), new THREE.MeshBasicMaterial({ color: 0xff7f9a, transparent: true, opacity: 0 }));
      boch.position.set(-0.02, -0.07, 0.075);
      olho.add(boch);
      bochechas.push(boch);
      cab.add(olho);
      // Antena: 3 gomos curvando pra frente e pra cima; a do macho é peluda
      const ant = new THREE.Group();
      ant.position.set(0.1, 0.09, s * 0.035);
      ant.rotation.set(s * 0.3, 0, -1.05);
      let pai = ant;
      for (let k = 0; k < 3; k++) {
        const gomo = new THREE.Group();
        if (k) gomo.position.y = 0.11;
        gomo.rotation.z = k ? 0.16 : 0;
        const haste = K.malha(new THREE.CylinderGeometry(0.008, 0.01, 0.11, 6).translate(0, 0.055, 0), escuro, false);
        gomo.add(haste);
        const pelos = macho ? 7 : 2;
        for (let p = 0; p < pelos; p++) {
          const pelo = K.malha(new THREE.CylinderGeometry(0.002, 0.003, macho ? 0.07 : 0.03, 3).translate(0, macho ? 0.035 : 0.015, 0), escuro, false);
          pelo.position.y = 0.02 + (p / pelos) * 0.08;
          pelo.rotation.set((p % 2 ? 1 : -1) * 1.1, 0, (p % 3) * 0.3 - 0.3);
          gomo.add(pelo);
        }
        pai.add(gomo);
        pai = gomo;
      }
      cab.add(ant);
      antenas.push(ant);
    });

    // Bico: estojo em 2 metades (dobra no meio quando as agulhas entram) e as 6 agulhas por dentro
    const bico = new THREE.Group();
    bico.position.set(0.12, -0.055, 0);
    bico.rotation.z = -0.62;
    const L = 0.46;
    const matEstojo = K.mat(macho ? 0x4a3b30 : 0x34261f, { roughness: 0.5 });
    const meia = () => K.malha(new THREE.CylinderGeometry(0.017, 0.019, L / 2, 10).rotateZ(-Math.PI / 2).translate(L / 4, 0, 0), matEstojo, false);
    const est1 = meia(), dobra2 = new THREE.Group(), est2 = meia();
    dobra2.add(est2);
    const ponta = K.malha(new THREE.SphereGeometry(0.02).scale(1.3, 1, 1), matEstojo, false);
    ponta.position.x = L / 2;
    dobra2.add(ponta);
    bico.add(est1, dobra2);
    const agulhas = CORES_AGULHAS.map((cor, i) => {
      const a = new THREE.Group();
      const mat = K.mat(0x3b2d27, { roughness: 0.4, emissive: cor, emissiveIntensity: 0 });
      mat.userData.cor = new THREE.Color(cor);
      const m = K.malha(new THREE.CylinderGeometry(i >= 4 ? 0.006 : 0.0045, 0.004, 1, 6).rotateZ(-Math.PI / 2).translate(0.5, 0, 0), mat, false);
      a.add(m);
      a.userData = { m, mat };
      bico.add(a);
      return a;
    });
    // Palpos curtos ao lado do bico
    [-1, 1].forEach((s) => {
      const p = K.malha(new THREE.CylinderGeometry(0.01, 0.008, macho ? 0.4 : 0.09, 6).rotateZ(-Math.PI / 2).translate(macho ? 0.2 : 0.045, 0, 0), escuro, false);
      p.position.set(0.08, -0.03, s * 0.03);
      p.rotation.z = -0.55;
      cab.add(p);
    });
    cab.add(bico);
    corpo.add(cab);

    // Asas: elipse transparente com nervuras
    const cva = document.createElement('canvas');
    cva.width = 256; cva.height = 64;
    const ca = cva.getContext('2d');
    ca.fillStyle = 'rgba(232,244,255,0.62)';
    ca.strokeStyle = 'rgba(55,75,105,0.9)';
    ca.lineWidth = 3;
    ca.beginPath(); ca.ellipse(128, 32, 124, 28, 0, 0, Math.PI * 2); ca.fill(); ca.stroke();
    ca.lineWidth = 1.6;
    [[8, 30, 250, 26], [8, 33, 240, 40], [40, 32, 230, 14], [60, 36, 200, 52]].forEach(([x0, y0, x1, y1]) => { ca.beginPath(); ca.moveTo(x0, y0); ca.lineTo(x1, y1); ca.stroke(); });
    const texAsa = new THREE.CanvasTexture(cva);
    const matAsa = new THREE.MeshBasicMaterial({ map: texAsa, transparent: true, side: THREE.DoubleSide, depthWrite: false });
    const asas = [-1, 1].map((s) => {
      const piv = new THREE.Group();
      piv.position.set(0.04, 0.15, s * 0.05);
      const a = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2).rotateX(-Math.PI / 2).translate(-0.35, 0, 0), matAsa);
      a.renderOrder = 4;
      piv.add(a);
      corpo.add(piv);
      return { piv, s };
    });

    // Pernas: coxa, canela e pé comprido, com anelzinho claro nos joelhos
    const pernas = [];
    [[0.09, 0.9], [0.0, 0.05], [-0.08, -0.75]].forEach(([x, rumo], par) => [-1, 1].forEach((s) => {
      const quadril = new THREE.Group();
      quadril.position.set(x, -0.12, s * 0.05);
      const coxa = K.malha(new THREE.CylinderGeometry(0.01, 0.012, 0.2, 5).translate(0, -0.1, 0), escuro, false);
      const joelho = new THREE.Group();
      joelho.position.y = -0.2;
      const anel = K.malha(new THREE.SphereGeometry(0.015), listra, false);
      const canela = K.malha(new THREE.CylinderGeometry(0.008, 0.01, 0.22, 5).translate(0, -0.11, 0), escuro, false);
      const tarso = new THREE.Group();
      tarso.position.y = -0.22;
      const pe = K.malha(new THREE.CylinderGeometry(0.005, 0.008, 0.22, 5).translate(0, -0.11, 0), listra, false);
      tarso.add(pe);
      joelho.add(anel, canela, tarso);
      quadril.add(coxa, joelho);
      corpo.add(quadril);
      pernas.push({ quadril, joelho, tarso, coxa, canela, pe, s, par, rumo });
    }));

    g.traverse((o) => { if (o.isMesh && o.material !== matAsa) o.castShadow = true; });
    g.visible = false;
    K.scene.add(g);
    const VERMELHO_SANGUE = new THREE.Color(0xd31a2a);
    let ultComp = L;
    const m = K.componente({
      g, corpo, bico, barriga, cab, agulhas, ponta, antenas, asas: asas.map((a) => a.piv),
      esconder() { g.visible = false; },
      em(pos, t, op = {}) {
        const { rumo = 0, incl = 0, giro = 0, escala = 1, voo = 1, asas: ab = voo, barriga: bar = 0, dobra = 0, agulhas: ag = 0, leque = 0, olhar = [0, 0], feliz = 0, fareja = 0, pernas: lp = 1, bico: lb = 1 } = op;
        antenas.forEach((a, i) => { a.rotation.z = -1.05 + Math.sin(t * 19 + i * 2) * 0.22 * fareja; });
        g.visible = true;
        g.position.set(...pos);
        g.rotation.set(giro, rumo, -incl);
        g.scale.setScalar(escala);
        corpo.position.y = voo * Math.sin(t * 9) * 0.02;
        // Asas: dobradas sobre a barriga ou batendo rápido (abertas pros lados)
        asas.forEach(({ piv, s }) => {
          const bate = Math.sin(t * 95 + (s > 0 ? 0 : 0.2));
          piv.rotation.set(s * K.lerp(0.12, 0.78 + 0.42 * bate, ab), s * K.lerp(0.06, 0.45, ab), K.lerp(0.06, 0.12, ab));
        });
        // Pernas: pousada (abertas, apoiadas, as de trás levantadas) ou penduradas no voo
        pernas.forEach(({ quadril, joelho, tarso, coxa, canela, pe, s, par, rumo: rp }) => {
          coxa.scale.y = canela.scale.y = pe.scale.y = lp;
          joelho.position.y = -0.2 * lp;
          tarso.position.y = -0.22 * lp;
          const balanco = Math.sin(t * 3 + par + s) * 0.08 * voo;
          const pousa = par === 2 ? [0.6, -1.1, 0.4] : [0.95, -1.3, 0.5]; // abre pro lado, joelho, pé
          quadril.rotation.set(s * K.lerp(pousa[0], 0.25, voo), 0, K.lerp(rp, -0.5 - par * 0.25, voo) + balanco);
          joelho.rotation.set(s * K.lerp(pousa[1], -0.2, voo), 0, K.lerp(par === 2 ? -0.9 : 0, 0.35, voo));
          tarso.rotation.set(s * K.lerp(pousa[2], 0.1, voo), 0, K.lerp(par === 0 ? 0.6 : par === 2 ? -0.8 : 0, 0.2, voo));
        });
        // Barriga enche (até ~3 vezes o peso) e fica vermelha
        const b2 = K.clamp(bar);
        saco.scale.set(2.4 * (1 + 0.22 * b2), 0.78 * (1 + 0.85 * b2), 0.8 * (1 + 0.85 * b2));
        matBarriga.color.setHex(0xc9b08a).lerp(VERMELHO_SANGUE, b2 * 0.9);
        matBarriga.emissiveIntensity = 0.28 * b2;
        brilhoB.material.opacity = 0.7 * b2;
        brilhoB.position.set(-0.3, 0.09 + 0.06 * b2, 0.09 + 0.05 * b2);
        // Bico: o estojo dobra pra trás feito cotovelo; as agulhas passam da ponta e, no leque, abrem coloridas
        bico.scale.x = lb;
        const d = L * (1 - 0.55 * K.clamp(dobra)), h = Math.sqrt(Math.max(0, (L / 2) ** 2 - (d / 2) ** 2));
        const a1 = Math.atan2(h, d / 2);
        est1.rotation.z = -a1;
        dobra2.position.set((L / 2) * Math.cos(a1), -(L / 2) * Math.sin(a1), 0);
        dobra2.rotation.z = a1;
        const comp = d + L * 0.9 * K.clamp(ag);
        ultComp = comp;
        agulhas.forEach((a, i) => {
          const { m: mesh, mat } = a.userData;
          mesh.scale.x = Math.max(0.01, comp + (i >= 4 ? 0.01 : 0));
          a.rotation.set(0, 0, (i - 2.5) * 0.13 * leque);
          mesh.scale.y = mesh.scale.z = 1 + 1.6 * leque;
          mat.emissiveIntensity = 0.8 * leque;
          mat.color.setHex(0x3b2d27).lerp(mat.userData.cor, leque);
        });
        // Olhos: pisca de vez em quando, pupila olhando pra onde pedir
        const pisca = (t + 0.7) % 3.1 < 0.12 ? 0.15 : 1;
        olhos.forEach((o) => { o.scale.y = pisca; });
        pupilas.forEach((p) => { p.position.set(olhar[0] * 0.02, olhar[1] * 0.02, 0); p.scale.y = pisca; });
        cilios.forEach((c) => { c.visible = pisca > 0.5; });
        bochechas.forEach((b) => { b.material.opacity = 0.75 * feliz; });
      },
      // Pontos no mundo: ponta das agulhas (ou do estojo) e ponta da barriga (de onde sai a gotinha)
      ponta() { g.updateMatrixWorld(true); return K.noMundo(bico, [ultComp + 0.02, 0, 0]); },
      pontaBarriga() { g.updateMatrixWorld(true); return K.noMundo(barriga, [-0.33 - 0.15 * saco.scale.x, 0, 0]); }
    });
    return m;
  };

  // ---------- Gato ----------

  // Gato: laranja rajado de barriga e meias brancas, olhão, coleira com guizo e
  // feijõezinhos rosa embaixo das patas. O corpo é em duas metades com o pivô na cintura, e cada uma gira no seu eixo
  // (o reflexo de endireitamento). De frente pra +x, costas pra +y. em(pos da cintura, t, op); em pé, a cintura fica
  // a `altura` do chão (vezes a escala). op.cores troca as cores; op.rabo = false faz o gato sem rabo
  K.GATO_CARAS = {
    normal: { lid: 0.2, pup: 0.5 },
    dormindo: { lid: 1, pup: 0.5, blep: 1, orelha: 'relax' },
    susto: { lid: 0, pup: 1.35, boca: 0.95, olho: 1.5, erica: 1, orelha: 'cima' },
    ninja: { lid: 0.55, tilt: 0.38, pup: 0.18, orelha: 'frente' },
    heroi: { lid: 0.42, tilt: -0.12, pup: 0.45, orelha: 'cima' },
    desdem: { lid: 0.64, tilt: -0.08, pup: 0.22, orelha: 'lado' },
    emburrado: { lid: 0.45, tilt: 0.42, pup: 0.35, orelha: 'aviao' },
    ofendido: { lid: 0, tilt: 0.3, pup: 0.75, olho: 1.2, orelha: 'tras' },
    feliz: { lid: 0.72, tilt: -0.2, pup: 0.6, boca: 0.3, rosado: 1, orelha: 'cima' },
    miando: { lid: 0.35, pup: 0.6, boca: 1, orelha: 'cima' },
    curioso: { lid: 0, pup: 1.15, olho: 1.18, orelha: 'frente' },
    lambendo: { lid: 0.8, pup: 0.4, lingua: 1, orelha: 'lado' }
  };
  K.gato = function (op = {}) {
    const c = Object.assign({ pelo: 0xf0923a, listra: 0xc9621a, branco: 0xfbf3e6, rosa: 0xf4a0b2, iris: 0x9ccf3a }, op.cores || {});
    const comRabo = op.rabo !== false;
    const ALT = 0.36;
    const g = new THREE.Group();
    g.rotation.order = 'YZX';
    const corpoG = new THREE.Group();   // squash/stretch do corpo inteiro
    g.add(corpoG);
    const cintura = new THREE.Group();
    corpoG.add(cintura);
    const hex = (n) => '#' + new THREE.Color(n).getHexString();

    // Rajado: faixas escuras nas costas (u = 0 e 1 é o lombo depois de deitar a esfera no eixo x)
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const cx = cv.getContext('2d');
    cx.fillStyle = hex(c.pelo); cx.fillRect(0, 0, 256, 256);
    cx.strokeStyle = hex(c.listra); cx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const y = 30 + i * 40 + (i % 2) * 6;
      cx.lineWidth = 10 - Math.abs(i - 2.5) * 1.1;
      const w = 52 + (i % 3) * 12;
      [0, 256].forEach((x0) => { cx.beginPath(); cx.moveTo(x0 - w, y + 9); cx.quadraticCurveTo(x0, y - 10, x0 + w, y + 9); cx.stroke(); });
    }
    const texRaj = new THREE.CanvasTexture(cv);
    texRaj.colorSpace = THREE.SRGBColorSpace;
    const matPelo = K.mat(0xffffff, { map: texRaj, roughness: 0.75 });
    const matLiso = K.mat(c.pelo, { roughness: 0.75 });
    const matBranco = K.mat(c.branco, { roughness: 0.8 });
    const matRosa = K.mat(c.rosa, { roughness: 0.55 });
    const deitada = (r) => new THREE.SphereGeometry(r, 28, 18).rotateZ(-Math.PI / 2);

    // Metades: a da frente (peito, cabeça, patas da frente) e a de trás (quadril, patas de trás, rabo)
    const frente = new THREE.Group(), tras = new THREE.Group();
    cintura.add(frente, tras);
    const junta = K.malha(new THREE.SphereGeometry(0.148, 24, 16), matLiso);
    cintura.add(junta);
    const peito = K.malha(deitada(0.17), matPelo);
    peito.position.x = 0.12;
    peito.scale.set(1.14, 0.95, 0.92);
    const peitoB = K.malha(new THREE.SphereGeometry(0.13, 20, 14), matBranco);
    peitoB.position.set(0.17, -0.06, 0);
    peitoB.scale.set(1.05, 0.8, 0.85);
    frente.add(peito, peitoB);
    const anca = K.malha(deitada(0.17), matPelo);
    anca.position.x = -0.12;
    anca.scale.set(1.14, 0.96, 0.98);
    const ancaB = K.malha(new THREE.SphereGeometry(0.12, 20, 14), matBranco);
    ancaB.position.set(-0.08, -0.08, 0);
    ancaB.scale.set(1.3, 0.7, 0.85);
    tras.add(anca, ancaB);

    // Pelo eriçado: espinhos no lombo das duas metades (escondidos com eriça 0)
    const matEsp = K.mat(c.listra, { roughness: 0.8 });
    const espinhos = [];
    [[frente, 0.02, 0.26], [tras, -0.28, -0.02]].forEach(([pai, x0, x1]) => {
      for (let i = 0; i < 7; i++) {
        const x = K.lerp(x0, x1, i / 6);
        [-1, 0, 1].forEach((s) => {
          const e = K.malha(new THREE.ConeGeometry(0.018, 0.09, 6).translate(0, 0.045, 0), matEsp, false);
          e.position.set(x, 0.14 - Math.abs(s) * 0.02, s * 0.06);
          e.rotation.set(-s * 0.55, 0, (i - 3) * 0.08);
          e.visible = false;
          pai.add(e);
          espinhos.push(e);
        });
      }
    });

    // Patas: ombro/quadril → cotovelo/joelho → pata (meia branca e feijõezinhos embaixo)
    const patas = [];
    const fazPata = (pai, x, y, z, s, frenteQ) => {
      const ombro = new THREE.Group();
      ombro.position.set(x, y, z);
      const sup = K.malha(new THREE.CapsuleGeometry(frenteQ ? 0.04 : 0.052, frenteQ ? 0.1 : 0.07, 6, 14), matLiso);
      sup.position.y = frenteQ ? -0.075 : -0.06;
      const cot = new THREE.Group();
      cot.position.y = frenteQ ? -0.15 : -0.14;
      const inf = K.malha(new THREE.CapsuleGeometry(0.033, 0.09, 6, 14), matBranco);
      inf.position.y = -0.055;
      const pata = new THREE.Group();
      pata.position.y = -0.125;
      const pe = K.malha(new THREE.SphereGeometry(0.045, 18, 12), matBranco);
      pe.scale.set(1.3, 0.6, 1.05);
      pe.position.x = 0.012;
      const almofada = K.malha(new THREE.SphereGeometry(0.019, 12, 8), matRosa, false);
      almofada.scale.set(1.15, 0.45, 1.3);
      almofada.position.set(0.0, -0.025, 0);
      pata.add(pe, almofada);
      const dedos = [-0.024, -0.008, 0.008, 0.024].map((dz, k) => {
        const d = K.malha(new THREE.SphereGeometry(0.0095, 10, 8), matRosa, false);
        d.scale.set(1, 0.5, 1);
        d.position.set(0.032 - Math.abs(dz) * 0.35, -0.022, dz);
        pata.add(d);
        return d;
      });
      cot.add(inf, pata);
      ombro.add(sup, cot);
      pai.add(ombro);
      const p = { ombro, cot, pata, almofada, dedos, s, frente: frenteQ };
      patas.push(p);
      return p;
    };
    [-1, 1].forEach((s) => fazPata(frente, 0.17, -0.07, s * 0.075, s, true));
    [-1, 1].forEach((s) => fazPata(tras, -0.19, -0.055, s * 0.085, s, false));

    // Rabo: gomos que afinam, com a ponta escura; eriçado vira escovão
    const rabo = [];
    if (comRabo) {
      let pai = new THREE.Group();
      pai.position.set(-0.31, 0.05, 0);
      tras.add(pai);
      for (let i = 0; i < 9; i++) {
        const gomo = new THREE.Group();
        if (i) gomo.position.x = -0.058;
        const r = 0.032 - i * 0.0011;
        const m = K.malha(new THREE.CapsuleGeometry(r, 0.05, 6, 12).rotateZ(Math.PI / 2), i >= 7 ? matEsp : matLiso);
        m.position.x = -0.03;
        gomo.add(m);
        gomo.userData.m = m;
        pai.add(gomo);
        rabo.push(gomo);
        pai = gomo;
      }
    }

    // Cabeça: crânio rajado, focinho, nariz rosa, boca em "ω", bigodes, orelhas, olhão com pálpebra
    const cab = new THREE.Group();
    cab.position.set(0.31, 0.13, 0);
    frente.add(cab);
    const pescoco = K.malha(new THREE.SphereGeometry(0.11, 18, 12), matLiso);
    pescoco.position.set(0.25, 0.06, 0);
    frente.add(pescoco);
    const cvc = document.createElement('canvas');
    cvc.width = cvc.height = 256;
    const cc = cvc.getContext('2d');
    cc.fillStyle = hex(c.pelo); cc.fillRect(0, 0, 256, 256);
    cc.strokeStyle = hex(c.listra); cc.lineCap = 'round'; cc.lineWidth = 9;
    [[-22, 14], [0, 22], [22, 14]].forEach(([dx, l]) => { cc.beginPath(); cc.moveTo(128 + dx, 30); cc.lineTo(128 + dx * 1.15, 30 + l * 2.3); cc.stroke(); });
    [80, 176].forEach((x) => { cc.beginPath(); cc.moveTo(x - 30, 120); cc.lineTo(x + 30, 112); cc.stroke(); });
    const texCab = new THREE.CanvasTexture(cvc);
    texCab.colorSpace = THREE.SRGBColorSpace;
    const cranio = K.malha(new THREE.SphereGeometry(0.17, 30, 20), K.mat(0xffffff, { map: texCab, roughness: 0.75 }));
    cranio.scale.set(0.95, 0.9, 1.05);
    cab.add(cranio);
    const bochechas = [-1, 1].map((s) => {
      const b = K.malha(new THREE.SphereGeometry(0.06, 16, 12), matBranco);
      b.position.set(0.12, -0.06, s * 0.042);
      b.scale.set(0.9, 0.78, 1);
      cab.add(b);
      return b;
    });
    const queixo = K.malha(new THREE.SphereGeometry(0.035, 12, 8), matBranco);
    queixo.position.set(0.13, -0.105, 0);
    cab.add(queixo);
    const nariz = K.malha(new THREE.ConeGeometry(0.02, 0.024, 3).rotateZ(Math.PI).rotateY(Math.PI / 2), matRosa, false);
    nariz.position.set(0.178, -0.022, 0);
    cab.add(nariz);
    const matBoca = new THREE.MeshBasicMaterial({ color: 0x4a2418 });
    const omega = new THREE.Group();
    [-1, 1].forEach((s) => {
      const a = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.0045, 6, 14, Math.PI), matBoca);
      a.rotation.set(0, Math.PI / 2, Math.PI);
      a.position.set(0, 0, s * 0.016);
      omega.add(a);
    });
    omega.position.set(0.168, -0.052, 0);
    cab.add(omega);
    // Boca aberta: escuro, dois caninos e a língua
    const bocaA = new THREE.Group();
    const fundo = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 10), matBoca);
    fundo.scale.set(0.4, 1, 1.1);
    const lingBoca = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), new THREE.MeshBasicMaterial({ color: 0xe86a7a }));
    lingBoca.scale.set(0.4, 0.5, 1);
    lingBoca.position.set(0.006, -0.022, 0);
    bocaA.add(fundo, lingBoca);
    [-1, 1].forEach((s) => {
      const d = new THREE.Mesh(new THREE.ConeGeometry(0.0075, 0.022, 6).rotateZ(Math.PI), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      d.position.set(0.012, 0.026, s * 0.022);
      bocaA.add(d);
    });
    bocaA.position.set(0.16, -0.07, 0);
    cab.add(bocaA);
    // Língua de fora (blep e lambida)
    const lingua = new THREE.Group();
    const lm = K.malha(new THREE.CapsuleGeometry(0.018, 0.04, 6, 12).rotateZ(Math.PI / 2).translate(0.03, 0, 0), K.mat(0xe86a7a, { roughness: 0.4 }), false);
    lm.scale.set(1, 0.45, 1.2);
    lingua.add(lm);
    lingua.position.set(0.165, -0.07, 0);
    cab.add(lingua);
    // Bigodes
    const bigodes = [];
    const matBig = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-1, 1].forEach((s) => [-0.18, 0, 0.18].forEach((a) => {
      const piv = new THREE.Group();
      piv.position.set(0.15, -0.045, s * 0.06);
      const fio = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0012, 0.17, 4).translate(0, 0.085, 0), matBig);
      fio.rotation.set(s * 1.5, 0, -0.35 + a);
      piv.add(fio);
      cab.add(piv);
      bigodes.push({ piv, s, a });
    }));
    // Orelhas: pivô na base; avião = deitadas pros lados
    const orelhas = [-1, 1].map((s) => {
      const piv = new THREE.Group();
      piv.position.set(0.0, 0.12, s * 0.085);
      const fora = K.malha(new THREE.ConeGeometry(0.07, 0.13, 20).translate(0, 0.06, 0).scale(0.5, 1, 1), matLiso);
      const dentro = K.malha(new THREE.ConeGeometry(0.046, 0.095, 16).translate(0, 0.045, 0).scale(0.4, 1, 1), matRosa, false);
      dentro.position.set(0.016, 0.004, 0);
      piv.add(fora, dentro);
      cab.add(piv);
      return { piv, s };
    });
    // Olhos: branco, íris verde, pupila (fenda a redonda), brilho e pálpebra que fecha e inclina
    const olhos = [-1, 1].map((s) => {
      const og = new THREE.Group();
      og.position.set(0.132, 0.025, s * 0.067);
      og.rotation.y = Math.PI / 2 - s * 0.28;
      const branco = new THREE.Mesh(new THREE.SphereGeometry(0.052, 22, 16), new THREE.MeshStandardMaterial({ color: 0xfdfdf8, roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.15 }));
      branco.scale.set(1, 1.08, 0.62);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.038, 18, 12), new THREE.MeshBasicMaterial({ color: c.iris }));
      iris.scale.set(1, 1.06, 0.35);
      iris.position.z = 0.02;
      const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.027, 16, 10), new THREE.MeshBasicMaterial({ color: 0x0b0a08 }));
      pupila.scale.set(0.5, 1, 0.35);
      pupila.position.z = 0.026;
      const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      brilho.position.set(0.013, 0.017, 0.034);
      const olhar = new THREE.Group();
      olhar.add(iris, pupila, brilho);
      const palp = K.malha(new THREE.SphereGeometry(0.056, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), matLiso, false);
      palp.scale.set(1.02, 1.1, 0.7);
      og.add(branco, olhar, palp);
      cab.add(og);
      return { og, olhar, pupila, palp, s };
    });
    const rosados = [-1, 1].map((s) => {
      const r = new THREE.Mesh(new THREE.CircleGeometry(0.024, 14), new THREE.MeshBasicMaterial({ color: 0xff7f9a, transparent: true, opacity: 0 }));
      r.position.set(0.148, -0.03, s * 0.098);
      r.rotation.y = Math.PI / 2 - s * 0.7;
      cab.add(r);
      return r;
    });
    // Coleira vermelha com guizo
    const coleira = K.malha(new THREE.TorusGeometry(0.105, 0.019, 10, 28).rotateY(Math.PI / 2), K.mat(0xd8302a, { roughness: 0.5 }), false);
    coleira.position.set(0.25, 0.05, 0);
    coleira.rotation.z = -0.5;
    const guizo = K.malha(new THREE.SphereGeometry(0.024, 14, 10), K.mat(0xf5c518, { roughness: 0.25, metalness: 0.6, emissive: 0x5a4000, emissiveIntensity: 0.3 }), false);
    guizo.position.set(0.31, -0.045, 0);
    frente.add(coleira, guizo);

    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.visible = false;
    K.scene.add(g);
    const mancha = K.redondo ? K.manchaSombra(0.34, 0.5) : null;
    if (mancha) { mancha.visible = false; K.scene.add(mancha); }

    const ORELHAS = { cima: [0.18, 0], relax: [0.45, 0.25], frente: [0.12, -0.2], lado: [0.75, 0.1], aviao: [1.35, 0.2], tras: [0.6, 0.85] };
    let caraAtual = 'normal';
    const pontos = { cabeca: [cab, [0, 0, 0]], ouvido: [cab, [0, 0.03, 0.15]], queixo: [cab, [0.12, -0.12, 0]], peito: [frente, [0.15, -0.12, 0]], focinho: [cab, [0.17, -0.03, 0]], cintura: [cintura, [0, 0, 0]], rabo: [tras, [-0.5, 0.1, 0]] };
    const m = K.componente({
      g, cintura, frente, tras, cab, patas, rabo, orelhas, olhos, altura: ALT,
      esconder() { g.visible = false; if (mancha) mancha.visible = false; },
      // op: rumo, incl, giro (o corpo todo), escala, rolF/rolT (giro de cada metade no eixo do corpo), dobra (V na
      // cintura), arco (costas arqueadas), encF/encT (encolhe as patas), estF/estT (estica as patas pra longe), abre
      // (patas abertas pros lados: paraquedas), agacha (patas de mola no pouso), sentado, andar, estica (corpo
      // comprido; negativo achata), cara (K.GATO_CARAS), erica, rabo (balanço), olhar [x, y], pupila, boca, lingua,
      // lambe (lambendo a pata da frente), cabeca [x, y, z] (giro extra), chao (altura do chão pra sombra)
      em(pos, t, op = {}) {
        const { rumo = 0, incl = 0, giro = 0, escala = 1, rolF = 0, rolT = 0, dobra = 0, arco = 0, encF = 0, encT = 0, estF = 0, estT = 0,
          abre = 0, agacha = 0, sentado = 0, andar = 0, estica = 0, cara = 'normal', rabo: rb = 1, olhar = [0, 0], cabeca = [0, 0, 0], lambe = 0, chao = null } = op;
        const C = K.GATO_CARAS[cara] || K.GATO_CARAS.normal;
        caraAtual = cara;
        const erica = op.erica != null ? op.erica : C.erica || 0;
        g.visible = true;
        g.position.set(...pos);
        g.rotation.set(giro, rumo, -incl);
        g.scale.setScalar(escala);
        corpoG.scale.set(1 + estica, 1 - estica * 0.55, 1 - estica * 0.55);
        const resp = Math.sin(t * 2.6) * 0.012;
        cintura.position.set(0, -0.07 * agacha - 0.11 * sentado + resp * 0.3, 0);
        // Metades: giro próprio (x), dobra em V e arco (z); sentado levanta a frente e baixa o quadril
        frente.rotation.set(rolF, 0, -dobra * 0.5 + arco * 0.25 + 0.75 * sentado);
        tras.rotation.set(rolT, 0, dobra * 0.5 - arco * 0.25 + 0.55 * sentado);
        junta.scale.set(1, 1 + arco * 0.12, 1);
        // Patas
        const f = t * 11;
        patas.forEach((p, i) => {
          const fase = (p.frente ? 0 : Math.PI) + (p.s > 0 ? Math.PI * 0.5 : 0);
          const passo = Math.sin(f + fase) * andar;
          let oz = 0.42 * passo, cz = -0.55 * Math.max(0, Math.sin(f + fase + 1.2)) * andar, ox = 0;
          if (p.frente) {
            oz += -0.7 * encF + 0.95 * estF + 0.35 * agacha + 0.5 * abre - 0.75 * sentado;
            cz += 2.5 * encF - 0.75 * agacha;
            // Lambendo: a pata direita sobe até a boca
            if (lambe && p.s > 0) { oz += 1.35 * lambe; cz += 1.8 * lambe; ox -= 0.35 * lambe; }
          } else {
            oz += 1.1 * encT - 0.95 * estT + 0.65 * agacha - 0.5 * abre + 1.25 * sentado;
            cz += -2.1 * encT - 1.2 * agacha - 2.35 * sentado;
          }
          ox += -p.s * 1.2 * abre;
          p.ombro.rotation.set(ox, 0, oz);
          p.cot.rotation.set(0, 0, cz);
          // A pata fica de sola pro chão no pé; no ar, abre os dedinhos
          p.pata.rotation.set(0, 0, -(oz + cz) * (1 - encF * (p.frente ? 1 : 0)) * 0.6);
          p.dedos.forEach((d, k) => { d.position.z = [-0.024, -0.008, 0.008, 0.024][k] * (1 + 0.25 * abre); });
          void i;
        });
        // Rabo: balança devagar (ou chicoteia), sobe na ponta; eriçado fica grosso
        rabo.forEach((gm, i) => {
          const k = i / Math.max(1, rabo.length - 1);
          gm.rotation.set(0, Math.sin(t * 2.2 - i * 0.5) * 0.16 * rb, (i ? 0.13 + 0.05 * Math.sin(t * 1.7 - i * 0.6) * rb : 0.1) * (1 - 0.4 * sentado) + (i === 0 ? -0.6 * sentado : 0));
          gm.userData.m.scale.set(1, 1 + 0.75 * erica * (0.5 + k), 1 + 0.75 * erica * (0.5 + k));
          if (i === 0) gm.rotation.z += 1.1 * erica;
        });
        espinhos.forEach((e) => { e.visible = erica > 0.02; e.scale.set(1, Math.max(0.01, erica), 1); });
        // Cabeça: olha um pouco pra cima no sentado; lambe virando pra pata
        cab.rotation.set(cabeca[0] + 0.5 * lambe + Math.sin(t * 22) * 0.06 * lambe, cabeca[1] - 0.25 * lambe, cabeca[2] - 0.6 * sentado - 0.5 * lambe);
        // Olhos: pálpebra (pisca de vez em quando), pupila e tamanho
        const pisca = cara !== 'dormindo' && (t + 0.4) % 3.7 < 0.11 ? 1 : 0;
        const lid = Math.max(C.lid ?? 0.2, pisca);
        const pup = op.pupila != null ? op.pupila : C.pup ?? 0.5;
        const oEsc = C.olho || 1;
        olhos.forEach(({ og, olhar: ol, pupila, palp, s }) => {
          og.scale.set(oEsc, oEsc, oEsc);
          palp.rotation.set((lid - 0.5) * Math.PI, 0, s * (C.tilt || 0));
          pupila.scale.set(K.clamp(0.18 + 0.82 * Math.min(1, pup), 0.18, 1) * (pup > 1 ? pup : 1), pup > 1 ? pup : 1, 0.35);
          ol.position.set(olhar[0] * 0.012, olhar[1] * 0.012, 0);
        });
        rosados.forEach((r) => { r.material.opacity = 0.75 * (C.rosado || op.rosado || 0); });
        // Boca: "ω" fechada ou aberta (miado, susto); língua de fora
        const bocaK = op.boca != null ? op.boca : C.boca || 0;
        omega.visible = bocaK < 0.15;
        bocaA.visible = bocaK >= 0.15;
        bocaA.scale.set(1, 0.4 + 0.9 * bocaK + 0.08 * Math.sin(t * 30) * (cara === 'susto' ? 1 : 0), 0.7 + 0.5 * bocaK);
        const lg = op.lingua != null ? op.lingua : (C.lingua || 0) + (C.blep ? 0.35 : 0);
        lingua.visible = lg > 0.02;
        lingua.scale.set(0.3 + lg * (1 + (lambe ? 0.5 * Math.max(0, Math.sin(t * 22)) : 0)), 1, 1);
        lingua.rotation.z = -0.5 - 0.3 * lambe;
        // Orelhas e bigodes
        const [ab, tr] = ORELHAS[op.orelha || C.orelha || 'cima'];
        orelhas.forEach(({ piv, s }) => { piv.rotation.set(s * ab, 0, tr + Math.sin(t * 5 + s) * 0.03); piv.scale.set(1, cara === 'susto' ? 1.25 : 1, 1); });
        bigodes.forEach(({ piv, s }) => { piv.rotation.set(0, 0, Math.sin(t * 7 + s) * 0.08 + (cara === 'susto' ? 0.35 : 0)); });
        if (mancha) {
          mancha.visible = chao != null;
          if (chao != null) {
            const alt = Math.max(0, pos[1] - chao - ALT * escala);
            mancha.position.set(pos[0], chao + 0.012, pos[2]);
            mancha.scale.setScalar(escala * 1.4 * (1 - Math.min(0.6, alt * 0.5)));
            mancha.material.opacity = mancha.userData.forca * (1 - Math.min(0.8, alt * 0.6));
          }
        }
      },
      // Ponto do gato no mundo: 'cabeca', 'ouvido', 'queixo', 'peito', 'focinho', 'cintura', 'rabo', ou a pata i (0 e 1
      // da frente, 2 e 3 de trás)
      ponto(nome) {
        g.updateMatrixWorld(true);
        if (typeof nome === 'number') return K.noMundo(patas[nome].pata, [0, -0.03, 0]);
        const [obj, local] = pontos[nome];
        return K.noMundo(obj, local);
      },
      cara: () => caraAtual
    });
    return m;
  };

  // ---------- Ornitorrinco ----------

  // Caras do ornitorrinco. lid: pálpebra (0 aberta, 1 fechada); pup: pupila; olho: tamanho do olho; sobr: [inclinação,
  // altura] das sobrancelhas (inclinação positiva = bravo); boca: abre o bico de baixo; rosado: bochecha corada; fecha:
  // fecha olho, ouvido e narina (o mergulho); torta: uma sobrancelha lá em cima ("que foi?"); nariz: empina o bico
  K.ORNITORRINCO_CARAS = {
    normal: { lid: 0.12, pup: 0.6 },
    mergulho: { lid: 1, fecha: 1, sobr: [0.1, 0] },
    radar: { lid: 1, fecha: 1, sobr: [0.55, -0.008] },
    dormindo: { lid: 1, sobr: [-0.2, -0.004], boca: 0.06 },
    satisfeito: { lid: 0.7, pup: 0.55, sobr: [-0.35, 0.006], rosado: 1 },
    feliz: { lid: 0.45, pup: 0.65, sobr: [-0.4, 0.01], boca: 0.3, rosado: 1 },
    orgulhosa: { lid: 0.62, pup: 0.55, sobr: [-0.45, 0.012], rosado: 0.9, nariz: 0.22 },
    bravo: { lid: 0.36, pup: 0.4, sobr: [0.8, -0.012], boca: 0.22 },
    desdem: { lid: 0.62, pup: 0.35, sobr: [0.25, -0.006], nariz: 0.12 },
    susto: { lid: 0, pup: 1.2, olho: 1.55, sobr: [-0.6, 0.032], boca: 0.8 },
    quefoi: { lid: 0, pup: 0.9, olho: 1.3, sobr: [-0.3, 0.022], torta: 1 },
    curioso: { lid: 0, pup: 1.05, olho: 1.22, sobr: [-0.35, 0.018] },
    engasgado: { lid: 0, pup: 0.45, olho: 1.45, sobr: [-0.45, 0.024], boca: 0.45 },
    fome: { lid: 1, sobr: [-0.55, 0.012], boca: 0.9 }
  };
  // Ornitorrinco de desenho (frente pra +x): marrom-chocolate de barriga clara, bico cinza mole com os sensores, olhinho com
  // pálpebra e sobrancelha, bochecha que estufa, rabo chato de castor, patas da frente com a pele que dobra pra trás e
  // mostra as unhas, patas de trás de leme e, no macho (op.macho), o esporão no calcanhar. op.filhote: rosinha, pelado e de
  // olho fechado. Sem chapéu e sem azul-esverdeado: não pode lembrar o ornitorrinco de desenho mais famoso
  K.ornitorrinco = function (op = {}) {
    const filhote = !!op.filhote, macho = !!op.macho;
    const c = Object.assign(filhote
      ? { pelo: 0xf2a49c, barriga: 0xf8c2ba, bico: 0xe58f8c, pele: 0xe8948c, unha: 0xfbe6df, membrana: 0xf0a8a0 }
      : { pelo: 0x8f5a36, barriga: 0xdcb88c, bico: 0x6b7079, pele: 0x4d3f37, unha: 0xeee2c8, membrana: 0x6e5a4e }, op.cores || {});
    const ALT = 0.13;
    const rgb = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const g = new THREE.Group();
    g.rotation.order = 'YZX';
    const corpoG = new THREE.Group();   // squash e o "em pé" (gira em volta do pé de trás)
    g.add(corpoG);
    const cintura = new THREE.Group();
    corpoG.add(cintura);
    const mats = [];
    const guarda = (m) => { mats.push(m); return m; };

    // Pelo: risquinhos mais claros e mais escuros (o filhote é pelado: pele lisa)
    let matPelo;
    if (filhote) matPelo = guarda(K.mat(c.pelo, { roughness: 0.5 }));
    else {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 256;
      const cx = cv.getContext('2d');
      const [r0, g0, b0] = rgb(c.pelo);
      cx.fillStyle = `rgb(${r0},${g0},${b0})`;
      cx.fillRect(0, 0, 256, 256);
      const r = K.rand(51);
      for (let i = 0; i < 520; i++) {
        const k = r() < 0.55 ? 0.8 : 1.16;
        cx.strokeStyle = `rgba(${Math.min(255, Math.round(r0 * k))},${Math.min(255, Math.round(g0 * k))},${Math.min(255, Math.round(b0 * k))},0.6)`;
        cx.lineWidth = 1.4 + r() * 1.6;
        const px = r() * 256, py = r() * 256, l = 5 + r() * 9;
        cx.beginPath(); cx.moveTo(px, py); cx.lineTo(px + (r() - 0.5) * 3, py + l); cx.stroke();
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      matPelo = guarda(K.mat(0xffffff, { map: tex, roughness: 0.88 }));
    }
    const matLiso = guarda(K.mat(c.pelo, { roughness: filhote ? 0.5 : 0.88 }));
    const matBarriga = guarda(K.mat(c.barriga, { roughness: filhote ? 0.5 : 0.9 }));
    const matBico = guarda(K.mat(c.bico, { roughness: 0.8 }));
    const matPele = guarda(K.mat(c.pele, { roughness: 0.7 }));
    const matMembrana = guarda(K.mat(c.membrana, { roughness: 0.7, side: THREE.DoubleSide }));
    const matUnha = guarda(K.mat(c.unha, { roughness: 0.35 }));
    const matEscuro = guarda(new THREE.MeshBasicMaterial({ color: 0x1f140c }));

    // Corpo em duas metades com pivô na cintura (pra enrolar nos ovos e dobrar)
    const frente = new THREE.Group(), tras = new THREE.Group();
    cintura.add(frente, tras);
    const capsula = (r, comp) => new THREE.CapsuleGeometry(r, comp, 10, 28).rotateZ(Math.PI / 2);
    const junta = K.malha(new THREE.SphereGeometry(0.155, 28, 18), matPelo);
    junta.scale.set(1, 0.78, 1.08);
    cintura.add(junta);
    const peito = K.malha(capsula(0.155, 0.1), matPelo);
    peito.position.x = 0.05;
    peito.scale.set(1, 0.78, 1.08);
    const anca = K.malha(capsula(0.155, 0.1), matPelo);
    anca.position.x = -0.05;
    anca.scale.set(1, 0.78, 1.08);
    const barrigaF = K.malha(capsula(0.135, 0.09), matBarriga);
    barrigaF.position.set(0.05, -0.05, 0);
    barrigaF.scale.set(1, 0.58, 0.95);
    const barrigaT = K.malha(capsula(0.135, 0.09), matBarriga);
    barrigaT.position.set(-0.05, -0.05, 0);
    barrigaT.scale.set(1, 0.58, 0.95);
    frente.add(peito, barrigaF);
    tras.add(anca, barrigaT);
    // As duas manchas da barriga por onde o leite sai (só a fêmea adulta mostra; a cena põe as gotinhas)
    const manchas = [-1, 1].map((s) => {
      const mm = K.malha(new THREE.SphereGeometry(0.035, 14, 10), guarda(K.mat(0xf0d6b0, { roughness: 0.6 })), false);
      mm.scale.set(1.3, 0.25, 1);
      mm.position.set(0.04, -0.112, s * 0.045);
      frente.add(mm);
      return mm;
    });

    // Rabo chato de castor (pivô na anca)
    const raboP = new THREE.Group();
    raboP.position.set(-0.22, 0.005, 0);
    tras.add(raboP);
    const raboM = K.malha(new THREE.SphereGeometry(0.11, 26, 16), matPelo);
    raboM.scale.set(1.2, 0.26, 0.95);
    raboM.position.x = -0.115;
    raboP.add(raboM);

    // Patas: ombro → braço curtinho → pé com a pele (membrana) e as unhas. As da frente abrem a pele em leque pra
    // nadar e dobram ela pra trás em terra (garra); as de trás vão viradas pra trás, de leme, com o esporão no macho
    const patas = [];
    const fazPata = (pai, x, y, z, s, daFrente) => {
      const ombro = new THREE.Group();
      ombro.position.set(x, y, z);
      const braco = K.malha(new THREE.CapsuleGeometry(0.026, 0.045, 6, 12), matLiso);
      braco.position.set(0.0, -0.03, s * 0.025);
      braco.rotation.x = s * 0.7;
      const pe = new THREE.Group();
      pe.position.set(0.0, -0.068, s * 0.05);
      if (!daFrente) pe.rotation.y = Math.PI;
      const sola = K.malha(new THREE.SphereGeometry(0.036, 16, 10), matPele);
      sola.scale.set(1.25, 0.38, 1.1);
      const rM = daFrente ? 0.098 : 0.066;
      const membrana = new THREE.Group();
      const leque = K.malha(new THREE.CircleGeometry(rM, 22, -0.95, 1.9).rotateX(-Math.PI / 2), matMembrana, false);
      leque.position.y = -0.004;
      membrana.add(leque);
      const unhas = [];
      for (let k = 0; k < 5; k++) {
        const a = -0.62 + (k / 4) * 1.24;
        const u = new THREE.Group();
        u.position.set(Math.cos(a) * 0.04, -0.002, -Math.sin(a) * 0.04);
        u.rotation.y = a;
        const dedo = K.malha(new THREE.CapsuleGeometry(0.008, 0.02, 4, 8).rotateZ(Math.PI / 2), matPele, false);
        dedo.position.x = 0.006;
        const unha = K.malha(new THREE.ConeGeometry(0.0075, 0.026, 8).rotateZ(-Math.PI / 2), matUnha, false);
        unha.position.x = 0.026;
        u.add(dedo, unha);
        pe.add(u);
        unhas.push(unha);
      }
      pe.add(sola, membrana);
      let esporao = null;
      if (!daFrente && macho) {
        esporao = new THREE.Group();
        // No calcanhar, apontando pra trás e um pouco pra fora (de desenho: assim aparece de lado)
        esporao.position.set(-0.025, 0.014, -s * 0.03);
        const pon = K.malha(new THREE.ConeGeometry(0.011, 0.052, 10).rotateZ(-Math.PI / 2).translate(0.026, 0, 0), guarda(K.mat(0xf6ecd8, { roughness: 0.3, emissive: 0x9a2be2, emissiveIntensity: 0 })), false);
        esporao.rotation.y = s * 0.6;
        esporao.add(pon);
        esporao.userData.mat = pon.material;
        pe.add(esporao);
      }
      ombro.add(braco, pe);
      pai.add(ombro);
      const p = { ombro, pe, membrana, unhas, esporao, s, frente: daFrente };
      patas.push(p);
      return p;
    };
    [-1, 1].forEach((s) => fazPata(frente, 0.12, -0.05, s * 0.115, s, true));
    [-1, 1].forEach((s) => fazPata(tras, -0.13, -0.055, s * 0.12, s, false));

    // Cabeça: crânio, bochechas que estufam, olhinho com pálpebra, sobrancelha, a fenda do ouvido e o bico
    const cab = new THREE.Group();
    cab.position.set(0.27, 0.035, 0);
    frente.add(cab);
    const cranio = K.malha(new THREE.SphereGeometry(0.108, 30, 20), matPelo);
    cranio.scale.set(1.05, 0.85, 1.02);
    cab.add(cranio);
    const bochechas = [-1, 1].map((s) => {
      const b = K.malha(new THREE.SphereGeometry(0.04, 18, 12), matLiso);
      b.position.set(0.005, -0.04, s * 0.06);
      cab.add(b);
      return { b, s };
    });
    const rosados = [-1, 1].map((s) => {
      const r = new THREE.Mesh(new THREE.CircleGeometry(0.019, 16), guarda(new THREE.MeshBasicMaterial({ color: 0xff8a9a, transparent: true, opacity: 0, depthWrite: false })));
      r.position.set(0.05, -0.018, s * 0.09);
      r.rotation.y = s > 0 ? 0.55 : Math.PI - 0.55;
      cab.add(r);
      return r;
    });
    const olhos = [-1, 1].map((s) => {
      const og = new THREE.Group();
      og.position.set(0.052, 0.038, s * 0.07);
      og.rotation.y = s > 0 ? 0.75 : Math.PI - 0.75;
      const branco = new THREE.Mesh(new THREE.SphereGeometry(0.034, 20, 14), guarda(new THREE.MeshStandardMaterial({ color: 0xfdfdf8, roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.15 })));
      branco.scale.set(1, 1.08, 0.62);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 10), guarda(new THREE.MeshBasicMaterial({ color: 0x5a3216 })));
      iris.scale.set(1, 1.05, 0.35);
      iris.position.z = 0.0135;
      const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.0165, 14, 10), guarda(new THREE.MeshBasicMaterial({ color: 0x0b0806 })));
      pupila.scale.set(1, 1, 0.35);
      pupila.position.z = 0.0177;
      const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.0064, 8, 6), guarda(new THREE.MeshBasicMaterial({ color: 0xffffff })));
      brilho.position.set(0.008, 0.011, 0.0225);
      const olhar = new THREE.Group();
      olhar.add(iris, pupila, brilho);
      const palp = K.malha(new THREE.SphereGeometry(0.037, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), matLiso, false);
      palp.scale.set(1.03, 1.1, 0.72);
      og.add(branco, olhar, palp);
      // Sobrancelha (gira no plano do olho) e a fenda do ouvido logo atrás
      const sob = K.malha(new THREE.CapsuleGeometry(0.007, 0.03, 4, 8).rotateZ(Math.PI / 2), guarda(K.mat(0x3a2414)), false);
      const sobP = new THREE.Group();
      sobP.rotation.order = 'YXZ';
      sobP.add(sob);
      cab.add(og, sobP);
      const ouvido = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.012, 4, 8), matEscuro);
      ouvido.position.set(-0.012, 0.03, s * 0.088);
      cab.add(ouvido);
      return { og, olhar, pupila, palp, sobP, ouvido, s };
    });
    // Bico: chato, mole e mais largo na ponta. Duas elipses em cima (a da base e a da ponta, mais larga) com as narinas e os
    // sensores; embaixo, a parte que abre, um tom mais escura
    const bico = new THREE.Group();
    bico.position.set(0.082, -0.016, 0);
    cab.add(bico);
    const COMP = 0.2;
    const matBico2 = guarda(K.mat(new THREE.Color(c.bico).multiplyScalar(0.8).getHex(), { roughness: 0.8 }));
    const ELIPS = [[0.075, 0.008, 0.085, 0.026, 0.055], [0.125, 0.005, 0.078, 0.021, 0.082]]; // [x, y, meio comprimento, meia espessura, meia largura]
    const elipse = (x, y, hx, hy, hz, mat) => { const e = K.malha(new THREE.SphereGeometry(1, 40, 22), mat); e.scale.set(hx, hy, hz); e.position.set(x, y, 0); return e; };
    ELIPS.forEach(([x, y, hx, hy, hz]) => bico.add(elipse(x, y, hx, hy, hz, matBico)));
    const narinas = [-1, 1].map((s) => {
      const n = new THREE.Mesh(new THREE.CapsuleGeometry(0.0042, 0.008, 4, 8).rotateZ(Math.PI / 2), matEscuro);
      n.position.set(0.168, 0.0215, s * 0.015);
      bico.add(n);
      return n;
    });
    const mandibula = new THREE.Group();
    mandibula.position.set(0.0, -0.006, 0);
    bico.add(mandibula);
    mandibula.add(elipse(0.07, -0.008, 0.08, 0.017, 0.048, matBico2), elipse(0.115, -0.008, 0.07, 0.014, 0.07, matBico2));
    const dentro = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 10), guarda(new THREE.MeshBasicMaterial({ color: 0x6a2a2a })));
    dentro.scale.set(1.5, 0.16, 0.9);
    dentro.position.set(0.08, -0.008, 0);
    bico.add(dentro);
    // Sensores do bico: pontinhos que acendem (os 40 mil, de brincadeira), espalhados em cima das elipses de cima
    const topo = (x, z) => {
      let y = null;
      ELIPS.forEach(([cx, cy, hx, hy, hz]) => { const k = 1 - ((x - cx) / hx) ** 2 - (z / hz) ** 2; if (k > 0) y = Math.max(y ?? -1, cy + hy * Math.sqrt(k)); });
      return y;
    };
    const rs = K.rand(83), pts = [];
    while (pts.length < 150) {
      const x = 0.03 + rs() * 0.17, z = (rs() - 0.5) * 0.15, y = topo(x, z);
      if (y != null && Math.abs(z) < 0.07) pts.push([x, y + 0.0015, z, rs() * 6.28]);
    }
    const matSensor = guarda(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    const sensores = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0034, 6, 4), matSensor, pts.length);
    const m4 = new THREE.Matrix4(), cs = new THREE.Color();
    pts.forEach(([x, y, z], i) => { m4.makeTranslation(x, y, z); sensores.setMatrixAt(i, m4); sensores.setColorAt(i, cs.setHex(0x8fe0ff)); });
    sensores.visible = false;
    bico.add(sensores);

    if (filhote) {
      cab.scale.setScalar(1.35);
      bico.scale.set(0.62, 0.9, 0.8);
      raboP.scale.setScalar(0.55);
      patas.forEach((p) => p.ombro.scale.setScalar(0.85));
      manchas.forEach((mm) => { mm.visible = false; });
    }
    if (macho) manchas.forEach((mm) => { mm.visible = false; });

    g.traverse((o) => { if (o.isMesh && o !== sensores) o.castShadow = true; });
    g.visible = false;
    K.scene.add(g);
    const mancha = K.redondo ? K.manchaSombra(0.36, 0.5) : null;
    if (mancha) { mancha.visible = false; K.scene.add(mancha); }

    let caraAtual = 'normal', fant = 1;
    const pontos = {
      cabeca: [cab, [0, 0, 0]], bico: [bico, [COMP + 0.005, 0.005, 0]], bicoMeio: [bico, [COMP * 0.55, 0.024, 0]], boca: [bico, [COMP * 0.3, -0.008, 0]],
      olho: [cab, [0.05, 0.04, 0.08]], ouvido: [cab, [-0.012, 0.03, 0.09]], nariz: [bico, [0.168, 0.02, 0]], bochecha: [cab, [0, -0.036, 0.11]],
      barriga: [frente, [0.02, -0.12, 0]], leite: [frente, [0.04, -0.118, 0.045]], leite2: [frente, [0.04, -0.118, -0.045]],
      cintura: [cintura, [0, 0, 0]], rabo: [raboP, [-0.14, 0.03, 0]], costas: [cintura, [0, 0.12, 0]]
    };
    const m = K.componente({
      g, corpoG, cintura, frente, tras, cab, bico, mandibula, rabo: raboP, patas, olhos, altura: ALT, filhote, macho,
      esconder() { g.visible = false; if (mancha) mancha.visible = false; },
      // op: rumo, incl (bico pra cima +), giro (rola no eixo do corpo), escala, cara (K.ORNITORRINCO_CARAS), nado (patas
      // remando), andar (gingado de lagarto), cava (as da frente cavando), varre (cabeça varrendo o fundo de um lado pro
      // outro), garra (pele dobrada e unhas pra fora), bochecha (estufa), boca, mastiga, sensores (pontinhos do bico
      // acesos), enrola (enrolada nos ovos, de U aberto pra +z), empe (em pé no rabo), abraca (patas da frente abraçando),
      // empurra (patas da frente empurrando), chute (pata de trás do lado +z chutando), esporao (acende o esporão),
      // posefinal (deitado de lado, patinha pra cima), olhar [x, y], cabeca [x, y, z] (giro extra), rabo (balanço),
      // fecha (olho, ouvido e narina), chao (altura do chão pra sombra)
      em(pos, t, op = {}) {
        const { rumo = 0, incl = 0, giro = 0, escala = 1, nado = 0, andar = 0, cava = 0, varre = 0, garra = 0, bochecha = 0, mastiga = 0, sensores: sen = 0,
          enrola = 0, empe = 0, abraca = 0, empurra = 0, chute = 0, esporao: esp = 0, posefinal = 0, olhar = [0, 0], cabeca = [0, 0, 0], cara = 'normal', rabo: rb = 1, chao = null } = op;
        const C = K.ORNITORRINCO_CARAS[cara] || K.ORNITORRINCO_CARAS.normal;
        caraAtual = cara;
        g.visible = true;
        g.position.set(...pos);
        g.rotation.set(giro - (Math.PI / 2) * posefinal, rumo, incl);
        g.scale.setScalar(escala);
        // Em pé: o corpo gira em volta do pé de trás (P), e o rabo e as patas de trás ficam no chão
        const th = 1.2 * empe, P = [-0.2, -0.1];
        const cth = Math.cos(th), sth = Math.sin(th);
        corpoG.rotation.set(0, 0, th);
        corpoG.position.set(P[0] - (P[0] * cth - P[1] * sth), P[1] - (P[0] * sth + P[1] * cth), 0);
        const resp = Math.sin(t * 2.4) * 0.012;
        cintura.scale.set(1, 1 + resp, 1 + resp * 0.6);
        // Nado: rola de leve e ondula; enrolada: as duas pontas vêm pra frente (U aberto pra +z)
        const fN = t * 2 * Math.PI * 1.8;
        cintura.rotation.set(Math.sin(fN) * 0.05 * nado + Math.sin(t * 9 * Math.PI) * 0.04 * andar, Math.sin(t * 4.5 * Math.PI) * 0.07 * andar, 0);
        frente.rotation.set(0, -0.95 * enrola, 0.08 * Math.sin(fN + 1) * nado - 0.05 * cava);
        tras.rotation.set(0, 0.85 * enrola, -0.08 * Math.sin(fN) * nado);
        // Rabo: leme no nado, balança devagar, cobre os ovos quando enrolada e deita no chão em pé
        raboP.rotation.set(0, 0.6 * enrola + Math.sin(t * 2.2) * 0.12 * rb, 0.06 + Math.sin(fN * 0.5) * 0.28 * nado - th * 0.92 - 0.25 * enrola);
        // Patas
        patas.forEach((p) => {
          const { ombro, pe, membrana, unhas, s } = p;
          let ox = 0, oy = 0, oz = 0, px = 0, pz = 0;
          if (p.frente) {
            const rema = Math.sin(fN + (s > 0 ? 0 : Math.PI));
            oz += 0.9 * rema * nado - 0.2 * nado;
            px += 0.6 * Math.cos(fN + (s > 0 ? 0 : Math.PI)) * nado;
            const passo = Math.sin(t * 9 * Math.PI / 2 + (s > 0 ? 0 : Math.PI));
            oy += -s * 0.5 * passo * andar;
            ox += s * 0.25 * Math.max(0, Math.cos(t * 9 * Math.PI / 2 + (s > 0 ? 0 : Math.PI))) * andar;
            const cv = Math.sin(t * 26 + (s > 0 ? 0 : Math.PI));
            oz += (0.5 + 0.7 * cv) * cava;
            ox += s * 0.25 * cava;
            oz += 1.0 * abraca;
            ox += -s * 0.55 * abraca;
            oz += 1.2 * empurra;
            pz += -0.6 * empurra;
            oz += -th * 0.15;
            px += s * 1.2 * abraca;
            // Pose final, deitado do lado -z: a de cima (+z) acena pro alto e a de baixo apoia a cabeça
            if (posefinal && s > 0) { oz += 1.9 * posefinal; ox += -0.9 * posefinal + 0.3 * Math.sin(t * 8) * posefinal; }
            if (posefinal && s < 0) { oz += 1.5 * posefinal; ox += 0.5 * posefinal; }
          } else {
            const passo = Math.sin(t * 9 * Math.PI / 2 + (s > 0 ? Math.PI : 0));
            oy += -s * 0.45 * passo * andar;
            ox += s * 0.22 * Math.max(0, Math.cos(t * 9 * Math.PI / 2 + (s > 0 ? Math.PI : 0))) * andar;
            oz += -0.35 * nado + 0.15 * Math.sin(fN * 0.5 + s) * nado;
            oz += -th * 0.85;
            if (s > 0) { ox += 0.9 * chute; oz += -0.7 * chute; }
          }
          ombro.rotation.set(ox, oy, oz);
          pe.rotation.x = px;
          pe.rotation.z = pz;
          // Pele: aberta em leque (nadar) ou dobrada pra trás com as unhas pra fora (cavar e andar)
          const gr = p.frente ? garra : Math.min(garra, 0.3);
          membrana.scale.setScalar(1 - 0.55 * gr);
          membrana.position.set(-0.03 * gr, -0.006 * gr, 0);
          membrana.rotation.z = -1.0 * gr;
          unhas.forEach((u) => u.scale.set(1 + 0.9 * gr, 1 + 0.2 * gr, 1 + 0.2 * gr));
          if (p.esporao) {
            p.esporao.scale.setScalar(1 + 1.1 * esp);
            p.esporao.userData.mat.emissiveIntensity = 0.9 * esp * (0.75 + 0.25 * Math.sin(t * 9));
          }
        });
        // Cabeça: varrendo o fundo, empinada (orgulho, desdém) ou virando
        const nz = C.nariz || 0;
        cab.rotation.set(cabeca[0] + Math.sin(t * 2 * Math.PI * 1.5) * 0.12 * varre, cabeca[1] + Math.sin(t * 2 * Math.PI * 1.5) * 0.55 * varre - 0.5 * enrola, cabeca[2] + nz - th * 0.92 - 0.1 * cava - 0.75 * posefinal);
        // Bochecha (bolsinho cheio de comida) e boca (mastigando)
        const boch = bochecha * (1 + 0.06 * Math.sin(t * 16) * (mastiga > 0 ? 1 : 0));
        bochechas.forEach(({ b, s }) => {
          b.scale.set(1 + 0.6 * boch, 1 + 0.65 * boch, 1 + 1.25 * boch);
          b.position.set(0.005 - 0.008 * boch, -0.04 - 0.008 * boch, s * (0.06 + 0.04 * boch));
        });
        const bocaK = (op.boca != null ? op.boca : C.boca || 0) + 0.35 * mastiga * Math.max(0, Math.sin(t * 15));
        mandibula.rotation.z = -0.55 * bocaK;
        dentro.visible = bocaK > 0.08;
        // Olhos: pálpebra (pisca), pupila, tamanho, sobrancelha; fecha: olho, ouvido e narina fechados (o mergulho)
        const fecha = op.fecha != null ? op.fecha : C.fecha || 0;
        const pisca = cara !== 'dormindo' && (t + (filhote ? 1.1 : 0.3)) % 3.3 < 0.11 ? 1 : 0;
        const lid = Math.max(C.lid ?? 0.12, pisca, fecha, filhote && op.cara == null ? 1 : 0);
        const pup = op.pupila != null ? op.pupila : C.pup ?? 0.6;
        const oEsc = C.olho || 1;
        const [sA, sY] = C.sobr || [0, 0];
        olhos.forEach(({ og, olhar: ol, pupila, palp, sobP, ouvido, s }) => {
          og.scale.setScalar(oEsc);
          palp.rotation.set((lid - 0.5) * Math.PI, 0, 0);
          pupila.scale.set(K.clamp(pup, 0.3, 1.6), K.clamp(pup, 0.3, 1.6), 0.35);
          ol.position.set(olhar[0] * 0.008 * s, olhar[1] * 0.008, 0);
          const sobe = sY + (C.torta && s > 0 ? 0.016 : 0) + 0.004 * Math.sin(t * 3) * (cara === 'susto' ? 1 : 0);
          sobP.position.set(0.05, 0.078 + sobe + 0.022 * (oEsc - 1), s * 0.066);
          sobP.rotation.set(0, og.rotation.y, -s * (sA + (C.torta && s > 0 ? -0.5 : 0)));
          ouvido.scale.set(1, Math.max(0.08, 1 - fecha), 1);
        });
        narinas.forEach((n) => n.scale.set(1, 1, Math.max(0.1, 1 - 0.9 * fecha)));
        rosados.forEach((r) => { r.material.opacity = 0.7 * (op.rosado != null ? op.rosado : C.rosado || 0) * fant; });
        // Sensores acesos piscando
        sensores.visible = sen > 0.01;
        if (sensores.visible) {
          matSensor.opacity = Math.min(1, sen) * fant;
          pts.forEach(([, , , fase], i) => { const k = 0.35 + 0.65 * Math.pow(Math.max(0, Math.sin(t * 7 + fase * 3)), 2); sensores.setColorAt(i, cs.setRGB(0.12 * k, 0.55 * k + 0.05, 1.0 * k + 0.1)); });
          sensores.instanceColor.needsUpdate = true;
        }
        if (mancha) {
          mancha.visible = chao != null && fant > 0.5;
          if (chao != null) {
            const alt = Math.max(0, pos[1] - chao - ALT * escala);
            mancha.position.set(pos[0], chao + 0.012, pos[2]);
            mancha.scale.setScalar(escala * 1.6 * (1 - Math.min(0.6, alt * 0.5)));
            mancha.material.opacity = mancha.userData.forca * (1 - Math.min(0.8, alt * 0.6));
          }
        }
      },
      // Ponto no mundo: cabeca, bico (a ponta), bicoMeio, boca, olho, ouvido, nariz, bochecha, barriga, leite, leite2,
      // cintura, rabo, costas, esporao (só no macho), ou a pata i (0 e 1 da frente, 2 e 3 de trás)
      ponto(nome) {
        g.updateMatrixWorld(true);
        if (typeof nome === 'number') return K.noMundo(patas[nome].pe, [0.02, -0.01, 0]);
        if (nome === 'esporao') { const p = patas[3]; return K.noMundo(p.esporao || p.pe, p.esporao ? [0.055, 0, 0] : [0, 0, 0]); }
        const [obj, local] = pontos[nome];
        return K.noMundo(obj, local);
      },
      // Fantasma (raio-X): 1 normal, menos que 1 deixa o bicho transparente pra mostrar o que tem dentro
      fantasma(k = 1) {
        fant = k;
        mats.forEach((mt) => {
          if (mt === matSensor) return;
          const transp = k < 0.999;
          if (mt.transparent !== transp && !mt.userData.semprePuro) { mt.transparent = transp; mt.needsUpdate = true; }
          if (mt.userData.op0 == null) mt.userData.op0 = mt.opacity;
          if (!mt.userData.semprePuro) { mt.opacity = transp ? k : mt.userData.op0; mt.depthWrite = !transp; }
        });
      },
      cara: () => caraAtual
    });
    rosados.forEach((r) => { r.material.userData.semprePuro = true; });
    return m;
  };

  // ---------- Cachorro ----------

  // Caras do cachorro. lid: pálpebra (0 aberta, 1 fechada); pup: pupila; olho: tamanho do olho; sobr: [inclinação, altura]
  // das sobrancelhas (inclinação positiva = de dó, o pidão); boca: abre a boca; lingua: língua de fora; orelha: [abre, pra
  // trás]; verde: a cabeça esverdeia (enjoo)
  K.CACHORRO_CARAS = {
    normal: { lid: 0.12, pup: 0.62 },
    feliz: { lid: 0.4, pup: 0.6, boca: 0.55, lingua: 0.8, sobr: [-0.1, 0.004], orelha: [0.25, -0.1] },
    pidao: { lid: 0, pup: 1.05, olho: 1.22, sobr: [0.55, 0.012], orelha: [-0.1, 0.25] },
    curioso: { lid: 0, pup: 0.8, olho: 1.08, sobr: [0.1, 0.012], orelha: [0.35, -0.2] },
    enjoado: { lid: 0.5, pup: 0.5, sobr: [0.45, -0.004], boca: 0.12, orelha: [-0.15, 0.45], verde: 1 },
    agitado: { lid: 0, pup: 0.32, olho: 1.2, sobr: [-0.25, 0.014], boca: 0.7, lingua: 0.55, orelha: [0.5, -0.25] },
    dor: { lid: 0.62, pup: 0.5, sobr: [0.6, -0.006], boca: 0.05, orelha: [-0.2, 0.6] },
    fraco: { lid: 0.72, pup: 0.45, sobr: [0.35, -0.006], orelha: [-0.25, 0.55] },
    dormindo: { lid: 1, sobr: [0.1, -0.004], orelha: [-0.2, 0.35] },
    susto: { lid: 0, pup: 1.2, olho: 1.32, sobr: [0.2, 0.018], boca: 0.6, orelha: [0.6, -0.3] },
    satisfeito: { lid: 0.55, pup: 0.55, sobr: [-0.05, 0.004], boca: 0.3, lingua: 0.35, orelha: [0.1, 0] },
    comendo: { lid: 0.35, pup: 0.6, orelha: [0.15, 0] }
  };
  // Vira-lata caramelo: focinho e peito creme, orelha caída, rabo enrolado pra cima, coleira azul com medalha.
  // O pos do em() é o chão embaixo do meio do corpo (ele mesmo sobe as patas), virado pra +x com rumo 0
  K.cachorro = function (op = {}) {
    const c = Object.assign({ pelo: 0xd4893f, escuro: 0xb06a2c, creme: 0xf3d6a8, nariz: 0x2a1d18, coleira: 0x2f6fd8, iris: 0x6a3a1a }, op.cores || {});
    const ALT = 0.4;                     // do chão ao meio do corpo, em pé
    const rgb = (n) => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    const g = new THREE.Group();
    g.rotation.order = 'YZX';
    const corpoG = new THREE.Group();    // altura do corpo, deitar de lado e tremer
    g.add(corpoG);
    const cintura = new THREE.Group();
    corpoG.add(cintura);
    const mats = [];
    const guarda = (m) => { mats.push(m); return m; };

    // Pelo: risquinhos mais claros e mais escuros, pra não ficar liso de plástico
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const cx = cv.getContext('2d');
    const [r0, g0, b0] = rgb(c.pelo);
    cx.fillStyle = `rgb(${r0},${g0},${b0})`;
    cx.fillRect(0, 0, 256, 256);
    const r = K.rand(61);
    for (let i = 0; i < 480; i++) {
      const k = r() < 0.5 ? 0.84 : 1.12;
      cx.strokeStyle = `rgba(${Math.min(255, Math.round(r0 * k))},${Math.min(255, Math.round(g0 * k))},${Math.min(255, Math.round(b0 * k))},0.55)`;
      cx.lineWidth = 1.3 + r() * 1.5;
      const px = r() * 256, py = r() * 256, l = 5 + r() * 8;
      cx.beginPath(); cx.moveTo(px, py); cx.lineTo(px + (r() - 0.5) * 3, py + l); cx.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const matPelo = guarda(K.mat(0xffffff, { map: tex, roughness: 0.85 }));
    const matLiso = guarda(K.mat(c.pelo, { roughness: 0.85 }));
    const matEscuro = guarda(K.mat(c.escuro, { roughness: 0.85 }));
    const matCreme = guarda(K.mat(c.creme, { roughness: 0.9 }));
    const matCabeca = guarda(K.mat(c.pelo, { roughness: 0.85 }));     // separados: esverdeiam no enjoo
    const matFocinho = guarda(K.mat(c.creme, { roughness: 0.9 }));
    const matNariz = guarda(K.mat(c.nariz, { roughness: 0.3 }));
    const basico = (cor) => guarda(new THREE.MeshBasicMaterial({ color: cor }));
    const deitada = (rr) => new THREE.SphereGeometry(rr, 28, 18).rotateZ(-Math.PI / 2);

    // Metades: a da frente (peito, pescoço, cabeça e patas da frente) e a de trás (quadril, patas de trás e rabo)
    const frente = new THREE.Group(), tras = new THREE.Group();
    cintura.add(frente, tras);
    // Tronco inteiriço torneado (peito cheio, cintura fina, quadril), peito creme, coxas e barriga creme
    const perfil = [[0, -0.335], [0.08, -0.322], [0.125, -0.29], [0.15, -0.22], [0.148, -0.15], [0.136, -0.05], [0.142, 0.04],
      [0.16, 0.12], [0.156, 0.2], [0.132, 0.27], [0.082, 0.316], [0, 0.332]].map(([rr, y]) => new THREE.Vector2(rr, y));
    const tronco = K.malha(new THREE.LatheGeometry(perfil, 36).rotateZ(-Math.PI / 2), matPelo);
    tronco.scale.set(1, 1, 0.9);
    cintura.add(tronco);
    const peitoB = K.malha(new THREE.SphereGeometry(0.12, 20, 14), matCreme);
    peitoB.position.set(0.25, -0.04, 0);
    peitoB.scale.set(0.7, 0.95, 0.82);
    frente.add(peitoB);
    [-1, 1].forEach((s) => {
      const coxa = K.malha(new THREE.SphereGeometry(0.1, 18, 12), matPelo);
      coxa.position.set(-0.19, -0.03, s * 0.075);
      coxa.scale.set(1.15, 1.1, 0.7);
      tras.add(coxa);
    });
    const barriga = K.malha(new THREE.SphereGeometry(0.11, 20, 14), matCreme);
    barriga.position.set(-0.02, -0.095, 0);
    barriga.scale.set(1.9, 0.55, 0.8);
    cintura.add(barriga);

    // Patas: ombro/quadril → cotovelo/jarrete → pata creme com três dedinhos
    const patas = [];
    const fazPata = (pai, x, y, z, s, frenteQ) => {
      const ombro = new THREE.Group();
      ombro.position.set(x, y, z);
      const sup = K.malha(new THREE.CapsuleGeometry(frenteQ ? 0.046 : 0.058, frenteQ ? 0.1 : 0.08, 6, 14), matLiso);
      sup.position.y = frenteQ ? -0.075 : -0.065;
      const cot = new THREE.Group();
      cot.position.y = frenteQ ? -0.16 : -0.17;
      const inf = K.malha(new THREE.CapsuleGeometry(0.038, 0.085, 6, 14), matLiso);
      inf.position.y = -0.055;
      const pata = new THREE.Group();
      pata.position.y = -0.125;
      const pe = K.malha(new THREE.SphereGeometry(0.05, 18, 12), matCreme);
      pe.scale.set(1.35, 0.62, 1.08);
      pe.position.x = 0.016;
      pata.add(pe);
      [-0.022, 0, 0.022].forEach((dz) => {
        const d = K.malha(new THREE.SphereGeometry(0.014, 10, 8), matCreme, false);
        d.position.set(0.058, -0.008, dz);
        pata.add(d);
      });
      cot.add(inf, pata);
      ombro.add(sup, cot);
      pai.add(ombro);
      const p = { ombro, cot, pata, s, frente: frenteQ };
      patas.push(p);
      return p;
    };
    [-1, 1].forEach((s) => fazPata(frente, 0.19, -0.08, s * 0.085, s, true));
    [-1, 1].forEach((s) => fazPata(tras, -0.21, -0.07, s * 0.09, s, false));

    // Rabo de vira-lata: gomos que afinam e enrolam pra cima, com a pontinha creme
    const rabo = [];
    let pai = new THREE.Group();
    pai.position.set(-0.3, 0.07, 0);
    tras.add(pai);
    for (let i = 0; i < 7; i++) {
      const gomo = new THREE.Group();
      if (i) gomo.position.x = -0.045;
      const m = K.malha(new THREE.CapsuleGeometry(0.034 - i * 0.0025, 0.04, 6, 12).rotateZ(Math.PI / 2), i >= 5 ? matCreme : matLiso);
      m.position.x = -0.022;
      gomo.add(m);
      pai.add(gomo);
      rabo.push(gomo);
      pai = gomo;
    }

    // Cabeça: crânio caramelo, focinho creme, nariz preto brilhando, boca que abre com a língua, olhão com pálpebra,
    // pintinhas claras de sobrancelha e orelhas caídas
    const cab = new THREE.Group();
    cab.position.set(0.34, 0.2, 0);
    frente.add(cab);
    const pescoco = K.malha(new THREE.SphereGeometry(0.105, 18, 12), matLiso);
    pescoco.position.set(0.27, 0.1, 0);
    pescoco.scale.set(1, 1.15, 0.95);
    frente.add(pescoco);
    const cranio = K.malha(new THREE.SphereGeometry(0.14, 30, 20), matCabeca);
    cranio.scale.set(1.0, 0.93, 0.98);
    cab.add(cranio);
    const focinho = K.malha(new THREE.SphereGeometry(0.075, 22, 14), matFocinho);
    focinho.position.set(0.105, -0.045, 0);
    focinho.scale.set(1.25, 0.84, 0.95);
    cab.add(focinho);
    const nariz = K.malha(new THREE.SphereGeometry(0.03, 16, 12), matNariz, false);
    nariz.position.set(0.198, -0.02, 0);
    nariz.scale.set(0.9, 0.72, 1.2);
    const brilhoNariz = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), basico(0xffffff));
    brilhoNariz.position.set(0.213, -0.008, 0.012);
    cab.add(nariz, brilhoNariz);
    // Queixo: abre a boca (escuro por dentro) e mastiga; a língua vai presa nele
    const queixoP = new THREE.Group();
    queixoP.position.set(0.06, -0.075, 0);
    cab.add(queixoP);
    const queixo = K.malha(new THREE.SphereGeometry(0.055, 18, 12), matFocinho);
    queixo.position.set(0.07, -0.008, 0);
    queixo.scale.set(1.2, 0.42, 0.78);
    queixoP.add(queixo);
    const dentroBoca = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 10), basico(0x3a1a14));
    dentroBoca.position.set(0.13, -0.075, 0);
    dentroBoca.scale.set(1.3, 0.5, 0.75);
    cab.add(dentroBoca);
    const lingua = new THREE.Group();
    lingua.position.set(0.11, -0.02, 0);
    queixoP.add(lingua);
    const lm = K.malha(new THREE.CapsuleGeometry(0.024, 0.05, 6, 12).rotateZ(Math.PI / 2).translate(0.04, 0, 0), guarda(K.mat(0xe8707e, { roughness: 0.4 })), false);
    lm.scale.set(1, 0.4, 1.15);
    lingua.add(lm);
    const olhos = [-1, 1].map((s) => {
      const og = new THREE.Group();
      og.position.set(0.085, 0.035, s * 0.072);
      og.rotation.y = Math.PI / 2 - s * 0.38;
      const branco = new THREE.Mesh(new THREE.SphereGeometry(0.04, 22, 16), guarda(new THREE.MeshStandardMaterial({ color: 0xfdfdf8, roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.15 })));
      branco.scale.set(1, 1.05, 0.6);
      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.031, 18, 12), basico(c.iris));
      iris.scale.set(1, 1.04, 0.35);
      iris.position.z = 0.016;
      const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 10), basico(0x0b0a08));
      pupila.position.z = 0.021;
      const brilho = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), basico(0xffffff));
      brilho.position.set(0.011, 0.014, 0.028);
      const olhar = new THREE.Group();
      olhar.add(iris, pupila, brilho);
      const palp = K.malha(new THREE.SphereGeometry(0.043, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), matCabeca, false);
      palp.scale.set(1.03, 1.08, 0.68);
      og.add(branco, olhar, palp);
      cab.add(og);
      const sobP = new THREE.Group();
      sobP.position.set(0.075, 0.085, s * 0.062);
      const sob = K.malha(new THREE.SphereGeometry(0.02, 12, 8), matCreme, false);
      sob.scale.set(0.6, 0.55, 1.5);
      sobP.add(sob);
      cab.add(sobP);
      return { og, olhar, pupila, palp, sobP, s };
    });
    const orelhas = [-1, 1].map((s) => {
      const piv = new THREE.Group();
      piv.position.set(-0.015, 0.09, s * 0.105);
      const o = K.malha(new THREE.SphereGeometry(0.075, 18, 12).translate(0, -0.07, 0), matEscuro);
      o.scale.set(0.62, 1.15, 0.32);
      piv.add(o);
      cab.add(piv);
      return { piv, s };
    });
    // Coleira azul com medalha dourada
    const coleira = K.malha(new THREE.TorusGeometry(0.098, 0.018, 10, 28).rotateY(Math.PI / 2), guarda(K.mat(c.coleira, { roughness: 0.5 })), false);
    coleira.position.set(0.27, 0.07, 0);
    coleira.rotation.z = -0.45;
    const medalha = K.malha(new THREE.CylinderGeometry(0.026, 0.026, 0.008, 18).rotateZ(Math.PI / 2),
      guarda(K.mat(0xf5c518, { roughness: 0.3, metalness: 0.5, emissive: 0x5a4000, emissiveIntensity: 0.3 })), false);
    medalha.position.set(0.335, -0.035, 0);
    frente.add(coleira, medalha);

    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    g.visible = false;
    K.scene.add(g);
    const mancha = K.redondo ? K.manchaSombra(0.4, 0.5) : null;
    if (mancha) { mancha.visible = false; K.scene.add(mancha); }

    let caraAtual = 'normal', fant = 1;
    const corCab = new THREE.Color(c.pelo), corFoc = new THREE.Color(c.creme);
    const verdeCab = new THREE.Color(0x9fbf5a), verdeFoc = new THREE.Color(0xd2e6a0);
    const pontos = {
      cabeca: [cab, [0, 0, 0]], focinho: [cab, [0.22, -0.02, 0]], boca: [cab, [0.15, -0.09, 0]], olho: [cab, [0.09, 0.04, 0.08]],
      orelha: [cab, [0, 0.02, 0.15]], peito: [frente, [0.2, -0.05, 0]], coracao: [frente, [0.12, -0.02, 0.03]],
      figado: [cintura, [0.08, -0.04, 0]], estomago: [cintura, [0.03, -0.01, -0.05]], pancreas: [cintura, [-0.01, -0.06, 0.04]],
      intestino: [tras, [-0.08, -0.05, 0]], rim: [tras, [-0.06, 0.06, 0]], barriga: [cintura, [0, -0.1, 0]],
      costas: [cintura, [0, 0.16, 0]], cintura: [cintura, [0, 0, 0]], rabo: [tras, [-0.42, 0.22, 0]]
    };
    const m = K.componente({
      g, corpoG, cintura, frente, tras, cab, patas, rabo, orelhas, olhos, altura: ALT,
      esconder() { g.visible = false; if (mancha) mancha.visible = false; },
      // pos: o chão embaixo do meio do corpo. op: rumo, incl, giro, escala, andar, sentado, deitado (esfinge), lado (deitado
      // de lado, patas pra +z), posefinal (de lado com a cabeça erguida e a pata da frente de cima acenando), treme, encolhe
      // (dor: costas curvas, cabeça baixa, rabo entre as pernas), abana (rabo; padrão 0.35), fareja (focinho no chão), come
      // (cabeça baixa mastigando), mastiga, cara (K.CACHORRO_CARAS), boca, lingua, verde (enjoo), pupila, olhar [x, y],
      // cabeca [x, y, z] (giro extra), orelha [abre, pra trás], chao (altura do chão pra sombra; null tira a sombra)
      em(pos, t, op = {}) {
        const { rumo = 0, incl = 0, giro = 0, escala = 1, andar = 0, sentado = 0, deitado = 0, treme = 0, encolhe = 0, fareja = 0, come = 0,
          olhar = [0, 0], cabeca = [0, 0, 0] } = op;
        const chao = op.chao !== undefined ? op.chao : pos[1];
        const pf = op.posefinal || 0;
        const lado = Math.max(op.lado || 0, pf);
        const C = K.CACHORRO_CARAS[op.cara] || K.CACHORRO_CARAS.normal;
        caraAtual = op.cara || 'normal';
        g.visible = true;
        const tr = treme * 0.012;
        g.position.set(pos[0] + tr * Math.sin(t * 61), pos[1], pos[2] + tr * Math.cos(t * 53));
        g.rotation.set(giro, rumo, -incl);
        g.scale.setScalar(escala);
        const agit = op.cara === 'agitado';
        const resp = Math.sin(t * (agit ? 9 : 2.8)) * (agit ? 0.01 : 0.006);
        // Altura do corpo: em pé, sentado (o quadril desce), deitado (esfinge) e de lado
        const passoY = andar * 0.012 * Math.abs(Math.sin(t * 9));
        corpoG.position.set(0, ALT - 0.1 * sentado - 0.24 * deitado * (1 - lado) - 0.25 * lado + passoY + resp, 0);
        corpoG.rotation.set(-1.35 * lado + 0.03 * treme * Math.sin(t * 47), 0, 0);
        // Corpo inteiro: sentado levanta a frente (o quadril encosta no chão); encolhido baixa a cabeça
        cintura.rotation.set(0, 0, 0.62 * sentado - 0.1 * encolhe - 0.06 * deitado * (1 - lado));
        // Patas: passada, sentado, esfinge e de lado (soltas, meio dobradas; na pose final, a de cima acena)
        const f = t * 9;
        patas.forEach((p) => {
          const fase = (p.frente ? 0 : Math.PI) + (p.s > 0 ? Math.PI * 0.5 : 0);
          const passo = Math.sin(f + fase) * andar;
          let oz = 0.45 * passo, cz = -0.5 * Math.max(0, Math.sin(f + fase + 1.2)) * andar;
          if (p.frente) {
            oz += -0.62 * sentado + 1.5 * deitado * (1 - lado) + 0.1 * encolhe + 0.5 * lado;
            cz += -0.2 * deitado * (1 - lado) - 0.6 * lado;
            if (pf && p.s > 0) { oz += pf * (0.9 + 0.25 * Math.sin(t * 6)); cz += pf * 0.8; }
          } else {
            oz += 0.55 * sentado + 1.4 * deitado * (1 - lado) + 0.1 * encolhe + 0.35 * lado;
            cz += -1.7 * sentado - 2.4 * deitado * (1 - lado) - 0.7 * lado;
          }
          p.ombro.rotation.set(0, 0, oz);
          p.cot.rotation.set(0, 0, cz);
          p.pata.rotation.set(0, 0, -(oz + cz) * 0.7);
        });
        // Rabo: enrolado pra cima e abanando pros lados; encolhido, vai pra baixo, entre as pernas
        const ab = Math.min(1.2, op.abana != null ? op.abana : 0.35);
        const freq = 4 + 8 * Math.min(1, ab);
        rabo.forEach((gm, i) => {
          const wag = Math.sin(t * freq - i * 0.35) * (0.15 + 0.5 * ab) * (i === 0 ? 1 : 0.35) * (1 - 0.8 * encolhe);
          const sobe = i === 0 ? -0.8 + 2.15 * encolhe + 0.6 * lado : -0.3 * (1 - encolhe) + 0.05 * encolhe;
          gm.rotation.set(0, wag, sobe);
        });
        // Cabeça: farejando (focinho no chão), comendo (cabeça baixa), sentado (olha pra frente) e o giro extra
        const baixa = Math.max(fareja, come);
        cab.position.set(0.34 + 0.04 * baixa, 0.2 - 0.33 * baixa, 0);
        pescoco.position.set(0.27 + 0.03 * baixa, 0.1 - 0.12 * baixa, 0);
        cab.rotation.set(cabeca[0] + 1.05 * pf, cabeca[1], cabeca[2] - 0.75 * baixa - 0.35 * encolhe - 0.3 * sentado + Math.sin(t * 13) * 0.03 * fareja);
        // Olhos: pálpebra (pisca de vez em quando), pupila, tamanho e sobrancelhas
        const pisca = op.cara !== 'dormindo' && (t + 0.7) % 3.9 < 0.11 ? 1 : 0;
        const lid = Math.max(C.lid ?? 0.12, pisca);
        const pup = op.pupila != null ? op.pupila : C.pup ?? 0.62;
        const oEsc = C.olho || 1;
        const [sInc, sAlt] = C.sobr || [0, 0];
        olhos.forEach(({ og, olhar: ol, pupila, palp, sobP, s }) => {
          og.scale.setScalar(oEsc);
          palp.rotation.set((lid - 0.5) * Math.PI, 0, 0);
          const ps = K.clamp(0.4 + 0.6 * pup, 0.3, 1.4);
          pupila.scale.set(ps, ps, 0.35);
          ol.position.set(olhar[0] * 0.01, olhar[1] * 0.01, 0);
          sobP.position.y = 0.085 + sAlt;
          sobP.rotation.x = s * sInc;
        });
        // Boca (abre e mastiga) e língua de fora
        const mast = Math.max(op.mastiga || 0, come);
        const bocaK = K.clamp((op.boca != null ? op.boca : C.boca || 0) + 0.3 * mast * Math.max(0, Math.sin(t * 14)));
        queixoP.rotation.z = -0.5 * bocaK;
        dentroBoca.visible = bocaK > 0.05;
        const lg = op.lingua != null ? op.lingua : C.lingua || 0;
        lingua.visible = lg > 0.02;
        lingua.scale.set(0.4 + 0.9 * lg, 1, 1);
        lingua.rotation.z = -0.35 - 0.4 * lg + 0.05 * Math.sin(t * 7);
        // Enjoo: a cabeça e o focinho puxam pro verde
        const vd = op.verde != null ? op.verde : C.verde || 0;
        matCabeca.color.copy(corCab).lerp(verdeCab, 0.6 * vd);
        matFocinho.color.copy(corFoc).lerp(verdeFoc, 0.6 * vd);
        // Orelhas: abrem, vão pra trás e balançam com o passo e a tremedeira
        const [oa, ot] = op.orelha || C.orelha || [0, 0];
        orelhas.forEach(({ piv, s }) => {
          const bal = Math.sin(t * 6 + s) * 0.04 + Math.sin(t * 9) * 0.1 * andar + treme * 0.06 * Math.sin(t * 40 + s);
          piv.rotation.set(-s * (0.08 + oa), 0, -ot + bal);
        });
        if (mancha) {
          mancha.visible = chao != null && fant > 0.5;
          if (mancha.visible) {
            mancha.position.set(pos[0], chao + 0.012, pos[2]);
            mancha.scale.setScalar(escala * (1.5 + 0.4 * lado));
            mancha.material.opacity = mancha.userData.forca;
          }
        }
      },
      // Ponto do cachorro no mundo: cabeca, focinho, boca, olho, orelha, peito, coracao, figado, estomago, pancreas,
      // intestino, rim, barriga, costas, cintura, rabo, ou a pata i (0 e 1 da frente, 2 e 3 de trás)
      ponto(nome) {
        g.updateMatrixWorld(true);
        if (typeof nome === 'number') return K.noMundo(patas[nome].pata, [0.02, -0.03, 0]);
        const [obj, local] = pontos[nome];
        return K.noMundo(obj, local);
      },
      // Fantasma (raio-X): 1 normal, menos que 1 deixa o cachorro transparente pra mostrar o que tem dentro
      fantasma(k = 1) {
        fant = k;
        mats.forEach((mt) => {
          const transp = k < 0.999;
          if (mt.transparent !== transp) { mt.transparent = transp; mt.needsUpdate = true; }
          if (mt.userData.op0 == null) mt.userData.op0 = mt.opacity;
          mt.opacity = transp ? k : mt.userData.op0;
          mt.depthWrite = !transp;
        });
      },
      cara: () => caraAtual
    });
    return m;
  };

  // ---------- Camaleão e mosca ----------

  // Cores da pele (a cena passa o nome, um número ou { de, para, k } em op.cor)
  K.CAMALEAO_CORES = {
    verde: 0x55b94a, amarelo: 0xf2cc2e, laranja: 0xf2862c, vermelho: 0xe0442e, escuro: 0x3c3b2e,
    palido: 0xe2ecd4, preto: 0x26241f, turquesa: 0x2fb5a6
  };
  // Caras: abre (abertura do olho: 1 aberto, 0 fechado), pup (pupila), olho (tamanho da torrinha), boca, aperta (olho
  // espremido), treme (tremedeira de força), sobr: [inclinação, altura] da sobrancelha (inclinação positiva = brava)
  K.CAMALEAO_CARAS = {
    normal: { abre: 1, pup: 1 },
    concentrado: { abre: 0, aperta: 1, treme: 1, sobr: [0.4, -0.004] },
    susto: { abre: 1, pup: 1.75, olho: 1.28, boca: 0.3, sobr: [-0.4, 0.012] },
    bravo: { abre: 0.85, pup: 0.55, boca: 1, sobr: [0.6, -0.006] },
    satisfeito: { abre: 0.42, pup: 1, sobr: [-0.1, 0.002] },
    paisagem: { abre: 0.38, pup: 0.85, sobr: [0, -0.003] },
    dormindo: { abre: 0, sobr: [-0.05, -0.004] },
    curioso: { abre: 1, pup: 1.35, olho: 1.1, sobr: [-0.25, 0.008] },
    apaixonado: { abre: 0.75, pup: 1.6, sobr: [-0.3, 0.006] },
    esperto: { abre: 0.55, pup: 0.8, sobr: [0.3, 0.004] }
  };
  // Camaleão-pantera: corpo achatado dos lados (parece folha), capacete na cabeça, crista nas costas, olhos de torrinha
  // que giram cada um pro seu lado, língua elástica com a bolinha grudenta na ponta, pés de pegador (dois feixes de
  // dedos) e rabo que enrola em espiral. A cor muda inteira (op.cor) por cima das escaminhas, das faixas e da listra
  // clara. O pos do em() é o galho (ou o chão) embaixo do meio do corpo, virado pra +x com rumo 0
  K.camaleao = function () {
    const ALT = 0.155;                   // do galho ao meio do corpo
    const g = new THREE.Group();
    g.rotation.order = 'YZX';
    const corpoG = new THREE.Group();    // altura, balanço de folha e deitar de lado
    g.add(corpoG);
    const cintura = new THREE.Group();
    corpoG.add(cintura);
    const mats = [];
    const guarda = (m) => { mats.push(m); return m; };
    const basico = (cor) => guarda(new THREE.MeshBasicMaterial({ color: cor }));
    const vT = new THREE.Vector3(), vD = new THREE.Vector3();
    const Z = new THREE.Vector3(0, 0, 1), Y = new THREE.Vector3(0, 1, 0);

    // Pele: escaminhas num cinza claro que multiplica a cor do momento. No corpo, ainda a barriga mais clara, as faixas
    // atravessadas, a listra clara de baixo e a risca das costas. u do canvas: 0 lado +z, 0.25 barriga, 0.5 lado -z,
    // 0.75 costas; v: ao longo do corpo
    function texPele(corpo) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 512;
      const cx = cv.getContext('2d');
      const r = K.rand(corpo ? 71 : 72);
      const cinza = (k, a = 1) => `rgba(${Math.round(255 * k)},${Math.round(255 * k)},${Math.round(255 * k)},${a})`;
      cx.fillStyle = cinza(0.9);
      cx.fillRect(0, 0, 512, 512);
      if (corpo) {
        cx.fillStyle = cinza(1);
        cx.fillRect(0.18 * 512, 0, 0.14 * 512, 512);
        for (let i = 0; i < 5; i++) {
          const y = (0.14 + i * 0.165 + (r() - 0.5) * 0.03) * 512, h = 20 + r() * 18;
          cx.fillStyle = cinza(0.76, 0.75);
          for (let u = 0; u < 512; u += 8) {
            if (u > 0.18 * 512 && u < 0.32 * 512) continue;
            cx.fillRect(u, y + Math.sin(u * 0.05 + i) * 7, 8, h);
          }
        }
        cx.fillStyle = cinza(1);
        [0.135, 0.365].forEach((u) => cx.fillRect(u * 512 - 7, 0.08 * 512, 14, 0.84 * 512));
        cx.fillStyle = cinza(0.74);
        cx.fillRect(0.75 * 512 - 5, 0, 10, 512);
      }
      for (let i = 0; i < 2600; i++) {
        cx.fillStyle = cinza(0.76 + r() * 0.32, 0.5);
        cx.beginPath();
        cx.arc(r() * 512, r() * 512, 2 + r() * 3.2, 0, Math.PI * 2);
        cx.fill();
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }
    const matCorpo = guarda(K.mat(0xffffff, { map: texPele(true), roughness: 0.55 }));
    const matPele = guarda(K.mat(0xffffff, { map: texPele(false), roughness: 0.55 }));
    const matBranco = guarda(K.mat(0xf4f1e4, { roughness: 0.6 }));

    // Tronco torneado, alto e fininho; a crista nas costas acompanha quando ele incha
    const perfil = [[0, -0.175], [0.03, -0.168], [0.047, -0.148], [0.063, -0.11], [0.078, -0.062], [0.086, -0.012],
      [0.085, 0.038], [0.078, 0.085], [0.066, 0.12], [0.05, 0.144], [0, 0.156]].map(([rr, y]) => new THREE.Vector2(rr, y));
    const tronco = K.malha(new THREE.LatheGeometry(perfil, 40).rotateZ(-Math.PI / 2), matCorpo);
    const ESC = [1, 1.32, 0.5];
    tronco.scale.set(...ESC);
    cintura.add(tronco);
    const raioEm = (x) => {
      for (let i = 1; i < perfil.length; i++) {
        const a = perfil[i - 1], b = perfil[i];
        if (x <= b.y) return K.lerp(a.x, b.x, K.clamp((x - a.y) / (b.y - a.y)));
      }
      return 0;
    };
    const crista = [];
    for (let i = 0; i < 13; i++) {
      const c = K.malha(new THREE.ConeGeometry(0.008, 0.022, 8), matPele, false);
      c.userData.x = -0.15 + i * 0.024;
      cintura.add(c);
      crista.push(c);
    }
    // Manchas laranja (a fêmea com ovos) e as pintinhas da cabeça que acendem azul na luz negra
    const matMancha = guarda(K.mat(0xff8a2a, { roughness: 0.6, emissive: 0x401800, emissiveIntensity: 0.25 }));
    const manchas = [];
    [[-0.1, 0.0], [-0.06, 0.03], [-0.02, -0.01], [0.02, 0.025], [0.06, -0.005], [0.09, 0.02], [-0.04, -0.035], [0.04, -0.03]].forEach(([x, y]) => [-1, 1].forEach((s) => {
      const m = K.malha(new THREE.SphereGeometry(0.011, 12, 8), matMancha, false);
      m.userData = { x, y, s };
      m.visible = false;
      cintura.add(m);
      manchas.push(m);
    }));

    // Cabeça: crânio comprido, focinho, capacete alto pra trás, risca da boca, queixo que abre, crista branca da
    // garganta, olhos de torrinha e sobrancelhas de couro
    const cab = new THREE.Group();
    cab.position.set(0.15, 0.035, 0);
    cintura.add(cab);
    const cranio = K.malha(new THREE.SphereGeometry(0.06, 30, 20), matPele);
    cranio.scale.set(1.3, 1.05, 0.66);
    cranio.position.x = 0.012;
    const focinho = K.malha(new THREE.SphereGeometry(0.036, 22, 14), matPele);
    focinho.position.set(0.075, -0.012, 0);
    focinho.scale.set(1.15, 0.82, 0.86);
    const capacete = K.malha(new THREE.ConeGeometry(0.045, 0.12, 20), matPele);
    capacete.scale.set(1, 1, 0.38);
    capacete.position.set(-0.035, 0.06, 0);
    capacete.rotation.z = 0.8;
    cab.add(cranio, focinho, capacete);
    cab.scale.setScalar(1.15);
    [-1, 1].forEach((s) => {
      const narina = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 6), basico(0x1e1e18));
      narina.position.set(0.11, -0.004, s * 0.012);
      cab.add(narina);
    });
    const queixoP = new THREE.Group();
    queixoP.position.set(-0.025, -0.028, 0);
    cab.add(queixoP);
    const queixo = K.malha(new THREE.SphereGeometry(0.05, 22, 12), matPele);
    queixo.scale.set(1.45, 0.34, 0.64);
    queixo.position.set(0.07, -0.004, 0);
    queixoP.add(queixo);
    for (let i = 0; i < 6; i++) {
      const d = K.malha(new THREE.ConeGeometry(0.0055, 0.016, 6), matBranco, false);
      d.rotation.z = Math.PI;
      d.position.set(0.015 + i * 0.015, -0.022, 0);
      queixoP.add(d);
    }
    const dentroBoca = new THREE.Mesh(new THREE.SphereGeometry(0.046, 18, 10), basico(0xb83a55));
    dentroBoca.scale.set(1.5, 0.42, 0.58);
    dentroBoca.position.set(0.05, -0.03, 0);
    cab.add(dentroBoca);
    const olhos = [1, -1].map((s) => {
      const base = new THREE.Group();
      base.position.set(0.035, 0.016, s * 0.042);
      cab.add(base);
      const gira = new THREE.Group();     // a abertura fica no +z local: gira aponta pra onde o olho olha
      base.add(gira);
      const torre = K.malha(new THREE.SphereGeometry(0.03, 26, 18), matPele);
      const bico = K.malha(new THREE.SphereGeometry(0.02, 20, 12), matPele, false);
      bico.position.z = 0.019;
      bico.scale.set(1, 1, 0.7);
      const abre = new THREE.Group();
      abre.position.z = 0.0335;
      const iris = new THREE.Mesh(new THREE.CircleGeometry(0.0155, 26), basico(0xe8b23a));
      const pupila = new THREE.Mesh(new THREE.CircleGeometry(0.009, 22), basico(0x0b0a08));
      pupila.position.z = 0.0006;
      const brilho = new THREE.Mesh(new THREE.CircleGeometry(0.003, 10), basico(0xffffff));
      brilho.position.set(0.0045, 0.0045, 0.0012);
      const fenda = new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.0036), basico(0x2a2a1a));
      fenda.position.z = 0.0008;
      abre.add(iris, pupila, brilho, fenda);
      gira.add(torre, bico, abre);
      const sobP = new THREE.Group();
      sobP.position.set(0.038, 0.044, s * 0.03);
      const sob = K.malha(new THREE.CapsuleGeometry(0.006, 0.026, 4, 10).rotateZ(Math.PI / 2), matPele, false);
      sobP.add(sob);
      cab.add(sobP);
      return { base, gira, iris, pupila, brilho, fenda, sobP, s };
    });
    const matUV = guarda(new THREE.MeshBasicMaterial({ color: 0x86d6ff, transparent: true, opacity: 0, depthWrite: false }));
    const pintasUV = [];
    [-1, 1].forEach((s) => {
      const lugares = [];
      for (let i = 0; i < 5; i++) { const k = 0.12 + i * 0.17; lugares.push([0.008 - 0.086 * k, 0.018 + 0.084 * k, s * (0.016 * (1 - k) + 0.004)]); }
      for (let i = 0; i < 4; i++) { const k = i / 3; lugares.push([0.03 + 0.06 * k, 0.058 - 0.025 * k, s * (0.03 - 0.01 * k)]); }
      lugares.forEach((p) => {
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.0058, 8, 6), matUV);
        d.position.set(...p);
        d.visible = false;
        cab.add(d);
        pintasUV.push(d);
      });
    });

    // Patas: ombro → cotovelo → pé de pegador (dois feixes de dedos que abrem e fecham em volta do galho)
    const patas = [];
    const fazPata = (x, s, frenteQ) => {
      const ombro = new THREE.Group();
      ombro.position.set(x, -0.05, s * 0.032);
      const sup = K.malha(new THREE.CapsuleGeometry(0.0145, 0.042, 6, 12), matPele);
      sup.position.y = -0.032;
      const cot = new THREE.Group();
      cot.position.y = -0.064;
      const inf = K.malha(new THREE.CapsuleGeometry(0.0122, 0.04, 6, 12), matPele);
      inf.position.y = -0.03;
      const pata = new THREE.Group();
      pata.position.y = -0.06;
      const feixes = [-1, 1].map((k) => {
        const f = new THREE.Group();
        const dedos = K.malha(new THREE.CapsuleGeometry(0.0095, 0.02, 6, 10), matPele, false);
        dedos.position.y = -0.016;
        f.add(dedos);
        pata.add(f);
        return { f, k };
      });
      cot.add(inf, pata);
      ombro.add(sup, cot);
      cintura.add(ombro);
      patas.push({ ombro, cot, pata, feixes, s, frente: frenteQ });
    };
    [-1, 1].forEach((s) => fazPata(0.085, s, true));
    [-1, 1].forEach((s) => fazPata(-0.1, s, false));

    // Rabo em gomos que afinam e enrolam em espiral pra baixo
    const rabo = [];
    let pai = new THREE.Group();
    pai.position.set(-0.165, -0.005, 0);
    cintura.add(pai);
    for (let i = 0; i < 14; i++) {
      const gomo = new THREE.Group();
      if (i) gomo.position.x = -0.028;
      const m = K.malha(new THREE.CapsuleGeometry(0.026 * (1 - i / 16) + 0.004, 0.02, 6, 12).rotateZ(Math.PI / 2), matPele);
      m.position.x = -0.014;
      gomo.add(m);
      pai.add(gomo);
      rabo.push(gomo);
      pai = gomo;
    }

    // Língua: fora do grupo (no mundo), da boca até o alvo, com a bolinha grudenta na ponta
    const lingua = new THREE.Group();
    const matLingua = guarda(K.mat(0xe86f8c, { roughness: 0.35 }));
    const cano = K.malha(new THREE.CylinderGeometry(1, 1, 1, 14, 1).translate(0, 0.5, 0), matLingua, false);
    const bola = K.malha(new THREE.SphereGeometry(1, 18, 12), guarda(K.mat(0xd24f7e, { roughness: 0.25 })), false);
    lingua.add(cano, bola);
    lingua.visible = false;
    K.scene.add(lingua);

    g.traverse((o) => { if (o.isMesh && o.material !== matUV) o.castShadow = true; });
    g.visible = false;
    K.scene.add(g);
    const mancha = K.redondo ? K.manchaSombra(0.3, 0.45) : null;
    if (mancha) { mancha.visible = false; K.scene.add(mancha); }

    // Olhada de vigia: cada olho pula de um ponto pro outro sozinho, de tempos em tempos
    const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const sacada = (t, sem) => {
      const per = 0.85 + 0.6 * hash(sem), k = Math.floor(t / per), f = t / per - k;
      return K.lerp(hash(sem * 7 + k) * 2 - 1, hash(sem * 7 + k + 1) * 2 - 1, K.suave(K.clamp((f - 0.82) / 0.18)));
    };
    const corA = new THREE.Color(), corB = new THREE.Color();
    const hexDe = (c) => (typeof c === 'string' ? K.CAMALEAO_CORES[c] ?? K.CAMALEAO_CORES.verde : c);
    let caraAtual = 'normal', fant = 1, pontaLingua = [0, 0, 0];
    const pontos = {
      cabeca: [cab, [0.02, 0.01, 0]], boca: [cab, [0.11, -0.03, 0]], casco: [cab, [-0.05, 0.09, 0]], focinho: [cab, [0.11, -0.01, 0]],
      costas: [cintura, [0, 0.11, 0]], barriga: [cintura, [0, -0.09, 0]], flanco: [cintura, [0, 0, 0.055]], cintura: [cintura, [0, 0, 0]]
    };
    const m = K.componente({
      g, corpoG, cintura, cab, olhos, patas, rabo, tronco, lingua, altura: ALT, matCorpo, matPele,
      esconder() { g.visible = false; lingua.visible = false; if (mancha) mancha.visible = false; },
      // pos: o galho (ou o chão) embaixo do meio do corpo. op: rumo, incl, giro, escala, andar (passo lento), balanco
      // (pra frente e pra trás, feito folha no vento), mira (estica o pescoço pra mirar), incha (engorda pra parecer
      // maior), chiado (boca aberta tremendo, inchado), deitado (barriga no chão, patas abertas), lado (deitado de lado,
      // barriga pra +z), posefinal (de lado, cabeça erguida e joia com o pé de cima), cara (K.CAMALEAO_CARAS), abre,
      // pupila, boca, mastiga, treme, olhos: alvo (os dois olham pro mesmo ponto do mundo), alvoE / alvoD (cada olho o
      // seu ponto), olhar [a, p] (a: -1 pra trás, 0 pro lado, 1 pra frente; p: -1 baixo, 1 cima), olhoE / olhoD;
      // sem nada, cada olho vigia sozinho. lingua (0 a 1) + alvoLingua (ponto do mundo; sem ele, 1,5 corpo pra frente),
      // enrola (rabo, 0 a 1), aperta (pés no galho, 0 a 1), cabeca [x, y, z], cor (nome, número ou { de, para, k }),
      // pisca (0 a 1: troca de cor sem parar, feito pisca-pisca), manchas (0 a 1), uv (0 a 1: pintinhas azuis),
      // chao (altura do chão pra sombra; null tira a sombra)
      em(pos, t, op = {}) {
        const { rumo = 0, incl = 0, giro = 0, escala = 1, andar = 0, mira = 0, deitado = 0, cabeca = [0, 0, 0] } = op;
        const chao = op.chao !== undefined ? op.chao : pos[1];
        const pf = op.posefinal || 0;
        const lado = Math.max(op.lado || 0, pf);
        const C = K.CAMALEAO_CARAS[op.cara] || K.CAMALEAO_CARAS.normal;
        caraAtual = op.cara || 'normal';
        g.visible = true;
        const chiado = op.chiado || 0;
        const treme = Math.max(op.treme || 0, C.treme || 0);
        const incha = Math.max(op.incha || 0, 0.8 * chiado);
        const tr = treme * 0.0035 + chiado * 0.003;
        g.position.set(pos[0] + tr * Math.sin(t * 63), pos[1] + tr * 0.5 * Math.sin(t * 71), pos[2] + tr * Math.cos(t * 57));
        g.rotation.set(giro, rumo, -incl);
        g.scale.setScalar(escala);
        // Balanço de folha: o corpo vai pra frente e pra trás, com os pés parados no galho
        const bal = op.balanco || 0;
        const fb = Math.sin(t * 5.2) * 0.022 * bal;
        const resp = Math.sin(t * 2.2) * 0.003;
        corpoG.position.set(fb + 0.014 * mira, ALT - 0.112 * deitado * (1 - lado) - 0.105 * lado + resp, Math.sin(t * 2.6) * 0.005 * bal);
        corpoG.rotation.set(-1.4 * lado, 0, -0.05 * mira + 0.03 * Math.sin(t * 5.2 + 0.6) * bal);
        // Incha: o tronco engorda pros lados e pra cima (a crista sobe junto); as manchas ficam na pele
        const iy = 1 + 0.16 * incha, iz = 1 + 0.6 * incha;
        tronco.scale.set(ESC[0], ESC[1] * iy, ESC[2] * iz);
        crista.forEach((c) => { const x = c.userData.x; c.position.set(x, raioEm(x) * ESC[1] * iy + 0.006, 0); });
        const mch = op.manchas || 0;
        manchas.forEach((mm) => {
          mm.visible = mch > 0.01;
          if (!mm.visible) return;
          const { x, y, s } = mm.userData, rr = raioEm(x), ry = rr * ESC[1] * iy;
          mm.position.set(x, y, s * (rr * ESC[2] * iz * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)) + 0.001));
          mm.scale.set(mch, mch, 0.32 * mch);
        });
        // Patas: passo lento em diagonal, pés de pegador, deitado com as patas abertas, de lado com a joia
        const ap = op.aperta != null ? op.aperta : deitado > 0.5 || lado > 0.5 ? 0.15 : 1;
        const f = t * 2.6;
        patas.forEach((p) => {
          const fase = f + (p.frente ? 0 : Math.PI) + (p.s > 0 ? 0 : Math.PI);
          const passo = Math.sin(fase) * andar, sobe = Math.max(0, Math.cos(fase)) * andar;
          let abre = -p.s * 0.62, dobra = p.s * 1.15;
          let fr = (p.frente ? 0.22 : -0.22) + 0.32 * passo - fb * 4;
          abre = K.lerp(abre, -p.s * 1.32, deitado * (1 - lado));
          dobra = K.lerp(dobra, p.s * 0.32, deitado * (1 - lado));
          const joia = pf && p.frente && p.s > 0 ? pf : 0;
          abre = K.lerp(abre, -1.55, joia);
          dobra = K.lerp(dobra, 0.15 + 0.12 * Math.sin(t * 5), joia);
          fr = K.lerp(fr, 0.35, joia);
          p.ombro.rotation.set(abre, 0, fr);
          p.cot.rotation.set(dobra + p.s * 0.4 * sobe, 0, -0.45 * sobe);
          p.pata.rotation.set(-(abre + dobra) * 0.8 * (1 - joia), 0, -fr * 0.5);
          const ab = K.lerp(1.05, 0.36, ap);
          p.feixes.forEach(({ f: fe, k }) => { fe.rotation.set(joia ? (k < 0 ? -1.5 : 0.08) : k * ab, 0, 0); });
        });
        // Rabo: espiral pra baixo (enrola); deitado, quase reto no chão
        const enrola = op.enrola != null ? op.enrola : deitado > 0.5 ? 0.12 : 0.55;
        rabo.forEach((gm, i) => {
          const wag = Math.sin(t * 1.6 - i * 0.4) * 0.03 * (1 + 2 * bal);
          gm.rotation.set(0, wag, enrola * (0.07 + 0.052 * i) + (i === 0 ? 0.25 - 0.2 * deitado : 0));
        });
        // Cabeça: mira (estica pra frente), o giro extra e, na pose final, erguida olhando pra câmera
        cab.position.set(0.15 + 0.012 * mira, 0.028, 0);
        cab.rotation.set(cabeca[0] + 1.2 * pf, cabeca[1], cabeca[2] - 0.08 * mira);
        // Boca: abre (mastiga), e abre sozinha quando a língua sai
        const lg = op.lingua || 0;
        const mast = op.mastiga || 0;
        const bocaK = K.clamp(Math.max(op.boca != null ? op.boca : C.boca || 0, chiado, lg > 0.01 ? 0.5 : 0) + 0.22 * mast * Math.max(0, Math.sin(t * 13)));
        queixoP.rotation.z = -0.62 * bocaK;
        dentroBoca.visible = bocaK > 0.05;
        // Cor da pele, pisca-pisca, manchas e luz negra
        const cor = op.cor != null ? op.cor : 'verde';
        if (cor && typeof cor === 'object') corA.setHex(hexDe(cor.de)).lerp(corB.setHex(hexDe(cor.para)), K.clamp(cor.k));
        else corA.setHex(hexDe(cor));
        if (op.pisca) corA.lerp(corB.setHSL((t * 0.55) % 1, 0.8, 0.52), K.clamp(op.pisca));
        matCorpo.color.copy(corA);
        matPele.color.copy(corA);
        const uv = op.uv || 0;
        matUV.opacity = K.clamp(uv);
        pintasUV.forEach((d) => { d.visible = uv > 0.01; d.scale.setScalar(0.6 + 0.5 * uv); });
        // Olhos: vigia (cada um sozinho), um ponto pros dois, um ponto pra cada, ou a direção pedida
        g.updateMatrixWorld(true);
        const abreK = K.clamp(op.abre != null ? op.abre : C.abre ?? 1);
        const pup = op.pupila != null ? op.pupila : C.pup ?? 1;
        const [sInc, sAlt] = C.sobr || [0, 0];
        olhos.forEach((o, i) => {
          o.base.scale.set(C.olho || 1, (C.olho || 1) * (1 - 0.12 * (C.aperta || 0)), C.olho || 1);
          const alvo = i === 0 ? op.alvoE || op.alvo : op.alvoD || op.alvo;
          if (alvo) o.base.worldToLocal(vT.set(alvo[0], alvo[1], alvo[2])).normalize();
          else {
            const ol = i === 0 ? op.olhoE || op.olhar : op.olhoD || op.olhar;
            const a = ol ? ol[0] : sacada(t, 11 + i * 5) * 0.85, pp = ol ? ol[1] : sacada(t, 31 + i * 7) * 0.4;
            const th = (a * Math.PI) / 2 * 0.95, ph = (pp * Math.PI) / 3;
            vT.set(Math.sin(th) * Math.cos(ph), Math.sin(ph), o.s * Math.cos(th) * Math.cos(ph));
          }
          if (vT.z * o.s < -0.15) { vT.z = -0.15 * o.s; vT.normalize(); }
          o.gira.quaternion.setFromUnitVectors(Z, vT);
          const aberto = abreK > 0.08;
          o.iris.visible = o.pupila.visible = aberto;
          o.brilho.visible = abreK > 0.3;
          o.fenda.visible = !aberto;
          o.iris.scale.set(1, Math.max(0.2, abreK), 1);
          o.pupila.scale.set(pup, pup * Math.max(0.2, abreK), 1);
          o.sobP.position.y = 0.044 + sAlt;
          o.sobP.rotation.z = -sInc;
        });
        // Língua: da boca até o alvo (lingua de 0 a 1 é quanto ela já esticou)
        const pb = K.noMundo(cab, [0.11, -0.03, 0]);
        lingua.visible = lg > 0.002;
        pontaLingua = pb;
        if (lingua.visible) {
          if (op.alvoLingua) vD.set(op.alvoLingua[0] - pb[0], op.alvoLingua[1] - pb[1], op.alvoLingua[2] - pb[2]);
          else { const fr = K.noMundo(cab, [1.11, -0.03, 0]); vD.set(fr[0] - pb[0], fr[1] - pb[1], fr[2] - pb[2]).normalize().multiplyScalar(0.62 * escala); }
          const L = vD.length() * lg;
          vD.normalize();
          lingua.position.set(pb[0], pb[1], pb[2]);
          lingua.quaternion.setFromUnitVectors(Y, vD);
          const rl = 0.0135 * escala;
          cano.scale.set(rl, Math.max(L, 0.001), rl);
          bola.position.set(0, L, 0);
          bola.scale.setScalar(0.026 * escala * (op.bolaLingua || 1));
          pontaLingua = [pb[0] + vD.x * L, pb[1] + vD.y * L, pb[2] + vD.z * L];
        }
        if (mancha) {
          mancha.visible = chao != null && fant > 0.5;
          if (mancha.visible) {
            mancha.position.set(pos[0], chao + 0.012, pos[2]);
            mancha.scale.setScalar(escala * (1.4 + 0.4 * lado));
            mancha.material.opacity = mancha.userData.forca;
          }
        }
      },
      // Ponto do camaleão no mundo: cabeca, boca, casco, focinho, costas, barriga, flanco, cintura, olhoE, olhoD, rabo
      // (a ponta), lingua (a ponta da língua agora) ou a pata i (0 e 1 da frente, 2 e 3 de trás)
      ponto(nome) {
        g.updateMatrixWorld(true);
        if (typeof nome === 'number') return K.noMundo(patas[nome].pata, [0, -0.02, 0]);
        if (nome === 'lingua') return pontaLingua;
        if (nome === 'olhoE' || nome === 'olhoD') return K.noMundo(olhos[nome === 'olhoE' ? 0 : 1].gira, [0, 0, 0.036]);
        if (nome === 'rabo') return K.noMundo(rabo[rabo.length - 1], [-0.02, 0, 0]);
        const [obj, local] = pontos[nome];
        return K.noMundo(obj, local);
      },
      // Fantasma (raio-X): 1 normal, menos que 1 deixa o camaleão transparente
      fantasma(k = 1) {
        fant = k;
        mats.forEach((mt) => {
          if (mt === matUV) return;
          const transp = k < 0.999;
          if (mt.transparent !== transp) { mt.transparent = transp; mt.needsUpdate = true; }
          if (mt.userData.op0 == null) mt.userData.op0 = mt.opacity;
          mt.opacity = transp ? k : mt.userData.op0;
          mt.depthWrite = !transp;
        });
      },
      cara: () => caraAtual
    });
    return m;
  };

  // Mosca de desenho: corpo escuro com reflexo verde, olhão vermelho e asas transparentes, de frente pra +x.
  // em(pos, t, op): rumo, escala, voa (0 pousada, 1 voando: asas batendo e sobe-e-desce), dorme (asas baixas)
  K.mosca = function () {
    const g = new THREE.Group();
    const escuro = K.mat(0x23262a, { roughness: 0.35, metalness: 0.4, emissive: 0x0a2a14, emissiveIntensity: 0.4 });
    const torax = K.malha(new THREE.SphereGeometry(0.018, 14, 10), escuro, false);
    torax.scale.set(1.1, 0.95, 0.95);
    const barriga = K.malha(new THREE.SphereGeometry(0.02, 14, 10), escuro, false);
    barriga.position.set(-0.026, -0.002, 0);
    barriga.scale.set(1.35, 0.85, 0.95);
    const cabeca = K.malha(new THREE.SphereGeometry(0.012, 12, 10), escuro, false);
    cabeca.position.set(0.02, 0.002, 0);
    g.add(torax, barriga, cabeca);
    const olhoM = K.mat(0xb3262a, { roughness: 0.3, emissive: 0x3a0505, emissiveIntensity: 0.3 });
    [-1, 1].forEach((s) => {
      const o = K.malha(new THREE.SphereGeometry(0.0085, 12, 8), olhoM, false);
      o.position.set(0.024, 0.006, s * 0.008);
      g.add(o);
      for (let i = 0; i < 3; i++) {
        const pe = K.malha(new THREE.CylinderGeometry(0.0018, 0.0012, 0.022, 4), escuro, false);
        pe.position.set(0.006 - i * 0.01, -0.014, s * 0.009);
        pe.rotation.x = s * 0.5;
        g.add(pe);
      }
    });
    const matAsa = new THREE.MeshStandardMaterial({ color: 0xdfe8f0, transparent: true, opacity: 0.55, roughness: 0.2, side: THREE.DoubleSide, depthWrite: false });
    const asas = [-1, 1].map((s) => {
      const p = new THREE.Group();
      p.position.set(0.002, 0.014, s * 0.004);
      p.add(new THREE.Mesh(new THREE.CircleGeometry(0.022, 14).scale(1.4, 0.6, 1).rotateX(-Math.PI / 2).translate(-0.012, 0, s * 0.02), matAsa));
      g.add(p);
      return { p, s };
    });
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      g,
      esconder() { g.visible = false; },
      em(pos, t, op = {}) {
        const { rumo = 0, escala = 1, voa = 0, dorme = 0 } = op;
        g.visible = true;
        g.position.set(pos[0], pos[1] + voa * 0.012 * Math.sin(t * 9), pos[2]);
        g.rotation.set(0, rumo, 0);
        g.scale.setScalar(escala);
        asas.forEach(({ p, s }) => { p.rotation.set(s * (0.25 - 0.18 * dorme) + s * (voa ? Math.sin(t * 95) * 0.9 * voa : 0), 0, 0.1); });
      }
    });
  };


  // ---------- Efeitos: estrelinhas, coraçõezinhos e fedor ----------

  // Estrelinhas da tontura: rodam em volta da cabeça. em(centro, t, op = { raio, forca })
  K.estrelinhas = function (n = 5) {
    const g = new THREE.Group();
    const forma = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 0.4 : 1;
      if (i) forma.lineTo(Math.cos(a) * r, Math.sin(a) * r); else forma.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.25, bevelEnabled: false }).translate(0, 0, -0.125);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffd60a });
    const es = [];
    for (let i = 0; i < n; i++) { const e = new THREE.Mesh(geo, mat); e.scale.setScalar(0.05); g.add(e); es.push(e); }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      esconder() { g.visible = false; },
      em(centro, t, op = {}) {
        const { raio = 0.28, forca = 1 } = op;
        if (forca <= 0.01) return;
        g.visible = true;
        g.position.set(...centro);
        es.forEach((e, i) => {
          const a = t * 5 + (i / n) * Math.PI * 2;
          e.position.set(Math.cos(a) * raio, Math.sin(a * 2) * 0.03, Math.sin(a) * raio * 0.55);
          e.lookAt(K.camera.position);
          e.rotateZ(t * 4 + i);
          e.scale.setScalar(0.05 * forca * (0.85 + 0.25 * Math.sin(t * 8 + i)));
        });
      }
    });
  };

  // Coraçõezinhos subindo de um ponto (alguém apaixonado). em(origem, t, forca)
  K.coracoes = function (seed = 23, n = 9) {
    const g = new THREE.Group();
    const forma = new THREE.Shape();
    forma.moveTo(0, -0.5); forma.bezierCurveTo(-0.15, -0.35, -0.55, -0.1, -0.5, 0.2); forma.bezierCurveTo(-0.45, 0.5, -0.05, 0.55, 0, 0.25);
    forma.bezierCurveTo(0.05, 0.55, 0.45, 0.5, 0.5, 0.2); forma.bezierCurveTo(0.55, -0.1, 0.15, -0.35, 0, -0.5);
    const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 });
    const r = K.rand(seed);
    const cs = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: i % 3 ? 0xe8202e : 0xff6f9a, transparent: true }));
      m.userData = { fase: i / n, dx: (r() - 0.5) * 0.5, dz: (r() - 0.5) * 0.3, w: r() * 6 };
      g.add(m);
      cs.push(m);
    }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      esconder() { g.visible = false; },
      em(origem, t, forca = 1) {
        if (forca <= 0.01 || t < 0) return;
        g.visible = true;
        g.position.set(...origem);
        cs.forEach((m) => {
          const { fase, dx, dz, w } = m.userData;
          const k = (t * 0.7 + fase) % 1;
          m.position.set(dx + Math.sin(w + t * 3) * 0.06, k * 0.9, dz);
          m.scale.setScalar(0.09 * forca * K.saiVolta(K.clamp(k * 5)));
          m.material.opacity = 1 - K.faixa(k, 0.7, 1);
          m.lookAt(K.camera.position);
        });
      }
    });
  };

  let texFedor = null;
  // Cheiro ruim visível: linhas onduladas verdes subindo e mosquitinhos rodando em volta (pé, queijo, lixo).
  // em(pos, t, op): op = { forca, escala, mosquitos (quantos rodam) }
  K.fedor = function (seed = 17, n = 4, nMosq = 4) {
    if (!texFedor) {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 256;
      const c2 = cv.getContext('2d');
      const onda = () => { c2.beginPath(); for (let y = 250; y >= 6; y -= 4) { const x = 32 + Math.sin(y / 26) * 15; if (y === 250) c2.moveTo(x, y); else c2.lineTo(x, y); } c2.stroke(); };
      c2.lineCap = 'round';
      c2.strokeStyle = 'rgba(30,60,20,0.85)'; c2.lineWidth = 15; onda();
      c2.strokeStyle = '#8fd14f'; c2.lineWidth = 9; onda();
      texFedor = new THREE.CanvasTexture(cv);
      texFedor.colorSpace = THREE.SRGBColorSpace;
    }
    const r = K.rand(seed);
    const g = new THREE.Group();
    const linhas = [];
    for (let i = 0; i < n; i++) {
      const mat = new THREE.SpriteMaterial({ map: texFedor, transparent: true, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.renderOrder = 6;
      g.add(sp);
      linhas.push({ sp, mat, fase: i / n, dx: (r() - 0.5) * 0.5, dz: (r() - 0.5) * 0.3 });
    }
    const preto = K.mat(0x1d1714), matAsa = new THREE.MeshBasicMaterial({ color: 0xe6f2ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
    const mosq = [];
    for (let i = 0; i < nMosq; i++) {
      const m = new THREE.Group();
      const corpo = K.malha(new THREE.SphereGeometry(0.025).scale(2.2, 0.9, 0.9), preto, false);
      const asas = [-1, 1].map((s) => { const a = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.07).translate(0, 0, s * 0.035).rotateX(-Math.PI / 2), matAsa); m.add(a); return a; });
      m.add(corpo);
      g.add(m);
      mosq.push({ m, asas, fase: r() * 6, raio: 0.7 + r() * 0.5, alt: 0.3 + r() * 0.6, vel: 2.2 + r() * 1.5 });
    }
    g.visible = false;
    K.scene.add(g);
    return K.componente({
      g,
      esconder() { g.visible = false; },
      em(pos, t, op = {}) {
        const { forca = 1, escala = 1, mosquitos = nMosq } = op;
        if (forca <= 0.01) return;
        g.visible = true;
        g.position.set(...pos);
        linhas.forEach((l) => {
          const k = (t * 0.45 + l.fase) % 1;
          l.sp.position.set((l.dx + Math.sin(t * 2 + l.fase * 6) * 0.08) * escala, (0.15 + k * 1.1) * escala, l.dz * escala);
          l.sp.scale.set(0.22 * escala, 0.85 * escala, 1);
          l.mat.opacity = forca * K.clamp(k * 6) * (1 - k);
        });
        mosq.forEach((q, i) => {
          q.m.visible = i < mosquitos;
          const a = t * q.vel + q.fase;
          q.m.position.set(Math.cos(a) * q.raio * 0.45 * escala, (q.alt + Math.sin(a * 2.3) * 0.12) * escala, Math.sin(a) * q.raio * 0.45 * escala);
          q.m.rotation.y = -a;
          q.m.scale.setScalar(escala * forca);
          const bate = Math.sin(t * 90 + i) * 0.7;
          q.asas[0].rotation.x = bate; q.asas[1].rotation.x = -bate;
        });
      }
    });
  };

  // Os bichos deste arquivo (o nome de cada função)
  K.BICHOS = ['gato', 'cachorro', 'ornitorrinco', 'camaleao', 'mosca', 'mosquita'];
})();
