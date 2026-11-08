// Lanterna (exemplo da Máquina Preguiça 3D, estilo redondo): uma lanterna gigante deitada num cavalete no quintal, à
// noite, com o corpo transparente pra ver por dentro. Ela vai se montando peça por peça (lâmpada → pilha → refletor →
// botão) e o facho vai do quintal até a chave caída na grama. No fim, as peças se separam no ar (vista explodida) e
// entra o cartão de seguir do canal.
// Tudo é função do tempo da cena (tc): nada guarda estado de um quadro pro outro, então o ⏪, as prévias e o --trecho
// funcionam em qualquer instante. Cada plano do roteiro.json é uma função em P.
(function () {
  const LAN = [-2.2, 0.82, 4.8];          // base da lanterna (a ponta de trás); ela aponta pra +x, um pouco pra baixo
  const TILT = 0.11;                       // inclinação do facho pra baixo (rad)
  const COMP = 1.6;                        // comprimento da lanterna
  const KEY = [5.2, 0.03, 4.8];            // onde o facho bate no chão: a chave
  const MEN = [-2.75, 0, 6.05];            // lugar do menino ao lado da lanterna
  const DEGRAU = [0.6, 0.09, 2.85];        // degrau da porta da casa

  let tl, bl, menino, mundo, casa;
  const I = {}, fx = {};
  let ref, lan, cavalete, corpo, matCorpo, tampaFundo, soquete, lampada, matLampada, pilha, refletor, matRefletor, lente, botao, contato, chave;
  let fioA, ponte, fioB, caminhoTodo, luzPonto, spot, alvoSpot, halo, feixe, matFeixe, poca, matPoca, brilhoChave;

  const mais = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  const v3 = new THREE.Vector3();
  // Ponto local da lanterna (em repouso) → mundo
  const W = (x, y, z = 0) => { ref.updateMatrixWorld(true); return ref.localToWorld(v3.set(x, y, z)).toArray(); };

  // ---------- Montagem ----------

  function montar(timeline) {
    tl = timeline;
    bl = K.blocos(tl);
    bl.forEach((b, i) => { if (I[b.plano] == null) I[b.plano] = i; });
    mundo = K.mundo(5);
    casa = K.casa();

    const degrau = K.malha(new THREE.BoxGeometry(1.3, 0.18, 0.55), K.mat(K.cores.concreto));
    degrau.position.set(...DEGRAU);
    K.scene.add(degrau);

    // Referência invisível com a pose de repouso (pra calcular pontos no mundo)
    ref = new THREE.Object3D();
    ref.position.set(...LAN);
    ref.rotation.z = -(Math.PI / 2 + TILT);
    K.scene.add(ref);

    // Cavalete de madeira
    cavalete = new THREE.Group();
    const madeira = K.mat(0x8a5a32);
    [[-1.9, 0.367], [-0.95, 0.262]].forEach(([x, alt]) => {
      const b = K.malha(new THREE.BoxGeometry(0.3, alt, 0.8), madeira);
      b.position.set(x, alt / 2, LAN[2]);
      cavalete.add(b);
    });
    K.scene.add(cavalete);

    // Lanterna: eixo local +y (base em y = 0, lente em y = COMP); o lado de cima é o x negativo
    lan = new THREE.Group();
    lan.position.set(...LAN);
    lan.rotation.z = ref.rotation.z;
    K.scene.add(lan);
    K.nomear('lanterna', lan);   // o nome que vai no "mostra" do roteiro.json (a revisão confere se aparece)

    matCorpo = new THREE.MeshStandardMaterial({ color: 0x2f7fe0, transparent: true, opacity: 0.28, roughness: 0.25, side: THREE.DoubleSide, depthWrite: false });
    corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.24, 40, 1, true), matCorpo);
    corpo.position.y = 0.62;
    corpo.renderOrder = 5;
    tampaFundo = K.malha(new THREE.CylinderGeometry(0.43, 0.43, 0.06, 40), K.mat(0x1d4f9a));
    tampaFundo.position.y = 0.0;
    soquete = K.malha(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 20), K.mat(0x9aa0a6, { metalness: 0.4, roughness: 0.4 }));
    soquete.position.y = 1.17;
    matLampada = new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xffd36a, emissiveIntensity: 0.05, roughness: 0.2, transparent: true, opacity: 0.95 });
    lampada = new THREE.Group();
    K.nomear('lampada', lampada);
    const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.15, 28, 18), matLampada);
    bulbo.position.y = 0.18;
    const rosca = K.malha(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 16), K.mat(0xc9ccd1, { metalness: 0.5 }));
    rosca.position.y = 0.04;
    lampada.add(bulbo, rosca);
    lampada.position.y = 1.2;

    pilha = new THREE.Group();
    K.nomear('pilha', pilha);
    const corpoPilha = K.malha(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 36), K.mat(0x26262c, { roughness: 0.5 }));
    corpoPilha.position.y = 0.5;
    const faixa = K.malha(new THREE.CylinderGeometry(0.305, 0.305, 0.24, 36), K.mat(0xf39a1e, { roughness: 0.5 }));
    faixa.position.y = 0.72;
    const polo = K.malha(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 20), K.mat(0xd08a2e, { metalness: 0.6, roughness: 0.3 }));
    polo.position.y = 0.98;
    const mola = K.malha(new THREE.CylinderGeometry(0.035, 0.035, 0.1, 10), K.mat(0xd08a2e, { metalness: 0.6 }));
    mola.position.y = 1.06;
    pilha.add(corpoPilha, faixa, polo, mola);

    matRefletor = K.mat(0xe6e9ee, { metalness: 0.35, roughness: 0.25, side: THREE.DoubleSide, emissive: 0xfff2c0, emissiveIntensity: 0 });
    refletor = new THREE.Group();
    K.nomear('refletor', refletor);
    const tigela = K.malha(new THREE.CylinderGeometry(0.4, 0.12, 0.34, 40, 1, true), matRefletor);
    tigela.position.y = 1.41;
    lente = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false }));
    lente.position.y = 1.6;
    const aro = K.malha(new THREE.TorusGeometry(0.43, 0.05, 12, 48).rotateX(Math.PI / 2), K.mat(0x1d4f9a));
    aro.position.y = 1.6;
    refletor.add(tigela, lente, aro);

    botao = new THREE.Group();
    K.nomear('botao', botao);
    const capa = K.malha(new THREE.BoxGeometry(0.14, 0.26, 0.18), K.mat(0xe8352b, { roughness: 0.4 }));
    capa.position.set(-0.47, 0.7, 0);
    contato = K.malha(new THREE.BoxGeometry(0.03, 0.3, 0.07), K.mat(0xd08a2e, { metalness: 0.6 }));
    contato.position.set(-0.4, 0.7, 0.05);
    botao.add(capa, contato);

    lan.add(corpo, tampaFundo, soquete, lampada, pilha, refletor, botao);

    // Fios (no mundo, calculados com a pose de repouso): pilha → botão, a ponte do botão, botão → lâmpada
    const pA = [W(0, 0.06, 0.05), W(-0.36, 0.06, 0.05), W(-0.36, 0.58, 0.05)];
    const pP = [W(-0.36, 0.58, 0.05), W(-0.36, 0.82, 0.05)];
    const pB = [W(-0.36, 0.82, 0.05), W(-0.36, 1.16, 0.05), W(-0.06, 1.22, 0.05)];
    const cobre = 0xc8762a;
    fioA = K.cano(pA, 0.025, cobre);
    ponte = K.cano(pP, 0.025, cobre);
    fioB = K.cano(pB, 0.025, cobre);
    caminhoTodo = K.caminho([...pA, ...pP.slice(1), ...pB.slice(1)]);
    fx.eletricidade = K.fluxo(caminhoTodo, 26, 0xffe14a, 0.75);

    // Luz: brilho em volta da lâmpada, luz pontual (espalhada) e o facho (spot + cone + mancha no chão)
    halo = K.halo(0xfff2a0, 1);
    luzPonto = new THREE.PointLight(0xfff0b0, 0, 7, 1.6);
    K.scene.add(luzPonto);
    alvoSpot = new THREE.Object3D();
    alvoSpot.position.set(...KEY);
    K.scene.add(alvoSpot);
    spot = new THREE.SpotLight(0xfff2c0, 0, 16, 0.3, 0.55, 1.2);
    spot.target = alvoSpot;
    K.scene.add(spot);
    const ponta = W(0, COMP);
    const dir = new THREE.Vector3(KEY[0] - ponta[0], KEY[1] - ponta[1], KEY[2] - ponta[2]);
    const L = dir.length();
    matFeixe = new THREE.MeshBasicMaterial({ color: 0xfff0a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    feixe = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.5, L, 40, 1, true).translate(0, -L / 2, 0), matFeixe);
    feixe.position.set(...ponta);
    feixe.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir.normalize());
    feixe.renderOrder = 8;
    K.scene.add(feixe);
    K.nomear('facho', feixe);
    matPoca = new THREE.MeshBasicMaterial({ color: 0xfff0a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    poca = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48).rotateX(-Math.PI / 2), matPoca);
    poca.position.set(KEY[0], 0.02, KEY[2]);
    poca.scale.set(1.25, 1, 1);
    K.scene.add(poca);

    // Chave caída na grama
    chave = new THREE.Group();
    K.nomear('chave', chave);
    const ouro = K.mat(0xe0b040, { metalness: 0.7, roughness: 0.3 });
    const argola = K.malha(new THREE.TorusGeometry(0.12, 0.035, 10, 28).rotateX(Math.PI / 2), ouro);
    const haste = K.malha(new THREE.BoxGeometry(0.34, 0.04, 0.07), ouro);
    haste.position.x = 0.27;
    const dente = K.malha(new THREE.BoxGeometry(0.06, 0.04, 0.1), ouro);
    dente.position.set(0.4, 0, 0.07);
    chave.add(argola, haste, dente);
    chave.position.set(...KEY);
    chave.rotation.y = 0.5;
    K.scene.add(chave);
    brilhoChave = K.halo(0xfff6c0, 0.6);
    brilhoChave.position.set(KEY[0], 0.15, KEY[2]);

    menino = K.boneco({ roupa: 'camiseta', cores: { camiseta: 0xff7a59, bermuda: 0x2f6f5e, tenis: 0xf4f1ea, cabelo: 0x7a4a22 } });

    fx.seguir = K.cartaoSeguir();
    fx.certo = K.marca('certo');
    fx.errado = K.marca('errado');
    fx.poeira = K.poeira(2, 0xcfc8bd);
    fx.dq = { pilha: K.destaque(pilha), refletor: K.destaque(refletor), botao: K.destaque(botao) };
    fx.rot = { pilha: K.rotulo('Pilha'), refletor: K.rotulo('Refletor'), botao: K.rotulo('Botão') };
    const e = (txt, cor) => K.etiqueta(txt, cor);
    fx.et = {
      escuro: e('Escuro total', 'vermelho'), lampada: e('Acende com eletricidade', 'azul'), apagada: e('Apagada', 'vermelho'),
      acendeu: e('Acendeu', 'verde'), fraca: e('Luz fraca', 'vermelho'), todoLado: e('Pra todo lado', 'laranja'),
      forte: e('Luz forte', 'verde'), acabando: e('Pilha acabando', 'vermelho'), desligou: e('Desligou: a pilha dura mais', 'verde'),
      fechado: e('Caminho fechado: acende', 'verde'), aberto: e('Caminho aberto: apaga', 'vermelho'),
      pPilha: e('Pilha', 'azul'), pRefletor: e('Refletor', 'azul'), pBotao: e('Botão', 'azul'), pLampada: e('Lâmpada', 'azul')
    };
  }

  // ---------- Ajudantes ----------

  function noMenino(pos, rumo, tc) {
    menino.g.visible = true;
    menino.g.position.set(...pos);
    menino.g.rotation.y = rumo;
    menino.reset(tc);
  }
  const quando = (palavra, B, frac) => {
    const t = K.quando(palavra, B.inicio);
    return t != null && t < B.ate ? t : B.inicio + frac * B.dur;
  };
  const cam = (de, ate, x) => K.plano(de, ate, x);
  const PILHA_W = () => W(0, 0.5, 0.3);
  const LAMP_W = () => W(0, 1.38, 0);
  const BOT_W = () => W(-0.5, 0.7, 0);
  const REF_W = () => W(0, 1.42, 0);
  // Em 9:16 a câmera enxerga pouco de lado (~0,52 x a distância): planos abertos olham ao longo do facho
  const CAM_LAN = { pos: [-1.5, 2.3, 11.4], alvo: [-1.6, 0.9, 4.8] };
  const CAM_LAN_PERTO = { pos: [-1.45, 1.75, 9.4], alvo: [-1.5, 0.85, 4.8] };
  const CAM_ABERTO = { pos: [-5.4, 3.0, 9.2], alvo: [2.0, 0.35, 4.6] };      // atrás da lanterna, olhando o facho
  const CAM_PILHA = { pos: [-1.75, 1.45, 8.6], alvo: [-1.75, 0.8, 4.8] };
  const CAM_LAMP = { pos: [-0.75, 1.4, 8.3], alvo: [-0.95, 0.72, 4.8] };
  const CAM_BOT = { pos: [-1.35, 2.2, 8.9], alvo: [-1.45, 1.1, 4.8] };

  // ---------- Planos ----------
  // Cada plano recebe B (tempo do bloco) e S (estado do quadro) e mexe só no que precisa.

  const P = {
    gancho(B, S, tc) {
      S.luz = 1; S.feixe = 1;
      noMenino([-0.6, 0, 6.3], 1.25, tc);
      menino.apontar(0.15);
      menino.humor('surpreso');
      cam({ pos: [-5.8, 3.4, 10.2], alvo: [1.6, 0.4, 4.6] }, CAM_ABERTO, B.p);
    },

    tropeca(B, S, tc) {
      S.lan = false; S.chaveBrilho = 0.15;
      const p = B.p;
      const andando = K.faixa(p, 0, 0.72);
      const pos = K.lerp3([3.6, 0, 6.6], [0.75, 0, 3.25], andando);
      noMenino(pos, Math.atan2(0.75 - 3.6, 3.25 - 6.6), tc);
      if (p < 0.72) {
        menino.andar(B.t, 0.55);
        menino.pose({ x: -1.2, z: 0.2 }, { x: -1.2, z: 0.2 });   // tateando com as mãos pra frente
        menino.humor('triste');
        for (let k = 0.04; k < 0.72; k += 0.1) K.som('passo', B.inicio + k * B.dur, 0.5);
      } else {
        menino.cair(K.faixa(p, 0.72, 0.9));
        K.som('baque', B.inicio + 0.78 * B.dur, 0.8);
        fx.poeira.em([pos[0], 0, pos[2] - 0.3], tc - (B.inicio + 0.78 * B.dur), 0.6);
      }
      fx.et.escuro.em(mais(pos, [0, 2.0, 0]), B.t - 0.25 * B.dur);
      cam({ pos: [pos[0] + 1.6, 2.0, pos[2] + 4.4], alvo: [pos[0] - 0.2, 0.7, pos[2]] }, { pos: [pos[0] + 1.3, 1.8, pos[2] + 3.9], alvo: [pos[0] - 0.2, 0.6, pos[2]] }, p);
      K.neblina(6, 30);
    },

    lampada(B, S, tc) {
      S.pilha = -1; S.refletor = false; S.botao = false; S.fios = 0; S.luz = 0;
      const q = B.q;
      S.lanY = K.queda(B.tq, 5, 0.7);                       // corpo e cavalete caem no lugar
      const imp = B.inicio + B.bloco.reb + 0.7 * K.QUICA_IMPACTO;
      K.som('whoosh', imp - 0.4, 0.6);
      K.som('baque', imp, 0.8);
      fx.poeira.em([-1.5, 0, LAN[2]], tc - imp, 1);
      // O menino traz a lâmpada na mão e encaixa no soquete
      noMenino([0.15, 0, 5.15], -1.1, tc);
      const enc = K.suave(K.faixa(q, 0.35, 0.6));
      if (q < 0.6) { menino.segurar(); S.lampNaMao = 1 - enc; } else menino.apontar(0.1);
      K.som('clique', B.inicio + B.bloco.reb + 0.6 * (B.dur - B.bloco.reb), 0.7);
      const tA = quando('acende', B, 0.7);
      S.piscaLamp = tc > tA && tc < tA + 0.5 ? 0.6 : 0;
      fx.et.lampada.em(mais(LAMP_W(), [0, 0.75, 0]), tc - tA);
      cam(CAM_LAN, CAM_LAMP, K.suave(K.faixa(q, 0.2, 0.8)));
    },

    apagada(B, S, tc) {
      S.pilha = -1; S.refletor = false; S.botao = false; S.fios = 0; S.luz = 0;
      noMenino([-0.3, 0, 5.55], -0.95, tc);
      menino.pensar();
      menino.humor('triste');
      fx.et.apagada.em(mais(LAMP_W(), [0, 0.7, 0]), B.t - 0.15);
      fx.errado.em(mais(LAMP_W(), [0.75, 0.65, 0]), B.t - 0.45);
      // Câmera com o ajudante do kit (sem coordenada na mão): a lanterna inteira apagada e o menino pensando, vistas
      // da direita e um pouco do alto, chegando perto. Outro ângulo que o da frase anterior
      K.filmar([W(0, 0.1), LAMP_W(), menino], 'chegando', B.p, { plano: 'medio', lado: 22, altura: 16, tam: 0.4 });
    },

    pilha(B, S, tc) {
      S.refletor = false; S.botao = false;
      const q = B.q;
      S.pilha = K.suave(K.faixa(q, 0, 0.3));                // entra deslizando por trás
      K.som('whoosh', B.inicio + 0.05 * B.dur, 0.5);
      K.som('trava', B.inicio + 0.3 * B.dur, 0.8);
      S.fios = K.faixa(q, 0.32, 0.55);
      const tE = quando('empurra', B, 0.45);
      S.corrente = tc > tE ? 1 : 0;
      const tL = quando('lampada', B, 0.85);
      S.luz = K.suave(K.faixa(tc, tL, tL + 0.35));
      K.som('liga', tL, 0.7);
      noMenino([-3.35, 0, 5.4], 1.35, tc);
      if (q < 0.32) menino.segurar(); else { menino.comemorar(tc); menino.humor('feliz'); }
      fx.et.acendeu.em(mais(LAMP_W(), [0, 0.75, 0]), tc - tL - 0.2);
      fx.certo.em(mais(LAMP_W(), [0.85, 0.7, 0]), tc - tL - 0.4);
      cam({ pos: [-2.4, 1.9, 10.8], alvo: [-2.25, 0.85, 4.8] }, CAM_LAN, K.suave(q));
    },

    pilha_rotulo(B, S, tc) {
      S.refletor = false; S.botao = false; S.corrente = 1;
      fx.dq.pilha.em(B.t);
      fx.rot.pilha.em(mais(PILHA_W(), [0, 0.75, 0]), B.t - 0.05);
      noMenino(MEN, 0.6, tc);
      menino.apontar(0.2);
      cam(CAM_PILHA, { pos: [-1.75, 1.4, 8.1], alvo: [-1.75, 0.82, 4.8] }, B.p);
    },

    fraca(B, S, tc) {
      S.refletor = false; S.botao = false; S.chaveBrilho = 0.2;
      const p = B.p;
      const x = K.suave(K.faixa(p, 0, 0.5));
      const pos = K.lerp3([0.2, 0, 5.7], [3.2, 0, 5.4], x);
      noMenino(pos, 1.35, tc);
      if (p < 0.5) menino.andar(B.t, 0.6); else { menino.pose({ x: -1.0, z: 0.2 }, { x: -1.0, z: 0.2 }); menino.humor('triste'); }
      menino.corpo.rotation.x = 0.25 * K.faixa(p, 0.5, 0.7);
      fx.et.todoLado.em(mais(LAMP_W(), [0, 1.0, 0]), B.t - 0.15 * B.dur);
      fx.et.fraca.em(mais(KEY, [0, 1.3, 0]), B.t - 0.6 * B.dur);
      cam({ pos: [-5.8, 3.2, 9.6], alvo: [1.8, 0.4, 4.6] }, CAM_ABERTO, p);
    },

    refletor(B, S, tc) {
      S.botao = false;
      const q = B.q;
      S.refletor = true;
      S.refY = K.queda(B.tq, 4, 0.65);
      const imp = B.inicio + B.bloco.reb + 0.65 * K.QUICA_IMPACTO;
      K.som('whoosh', imp - 0.4, 0.6);
      K.som('metal', imp, 0.8);
      const f = K.suave(K.faixa(q, 0.4, 0.6));
      S.feixe = f;
      K.som('brilho', B.inicio + 0.45 * B.dur, 0.6);
      S.chaveBrilho = 0.2 + 0.8 * f;
      noMenino([3.0, 0, 5.75], 1.9, tc);
      if (q > 0.62) { menino.comemorar(tc); menino.humor('feliz'); } else menino.humor('surpreso');
      fx.et.forte.em(mais(KEY, [0, 1.3, 0]), tc - (B.inicio + 0.65 * B.dur));
      // O ✓ logo acima da etiqueta, sem tampar o texto dela
      const [ex, ey] = K.tela(mais(KEY, [0, 1.3, 0]));
      fx.certo.em({ tela: [ex, ey - 150] }, tc - (B.inicio + 0.75 * B.dur));
      cam(CAM_LAMP, CAM_ABERTO, K.suave(K.faixa(q, 0.35, 0.6)));
    },

    refletor_rotulo(B, S, tc) {
      S.botao = false;
      fx.dq.refletor.em(B.t);
      fx.rot.refletor.em(mais(REF_W(), [0, 0.8, 0]), B.t - 0.05);
      cam({ pos: [-0.55, 1.45, 8.3], alvo: [-0.85, 0.72, 4.8] }, { pos: [-0.65, 1.4, 7.9], alvo: [-0.85, 0.72, 4.8] }, B.p);
    },

    acabando(B, S, tc) {
      S.botao = false;
      const p = B.p;
      const fim = K.faixa(p, 0.3, 0.95);
      S.forca = K.lerp(1, 0.18, fim) * (fim > 0.6 ? 0.8 + 0.2 * Math.sin(tc * 40) : 1);
      noMenino(MEN, 0.5, tc);
      menino.suar(tc);
      menino.humor('triste');
      K.som('zumbido', B.inicio + 0.5 * B.dur, 0.35, 0.45 * B.dur);
      fx.et.acabando.em(mais(PILHA_W(), [0, 0.8, 0]), B.t - 0.35 * B.dur);
      cam(CAM_LAN, CAM_LAN_PERTO, p);
    },

    botao(B, S, tc) {
      const q = B.q;
      S.botao = true;
      S.botY = K.queda(B.tq, 3, 0.6);
      const imp = B.inicio + B.bloco.reb + 0.6 * K.QUICA_IMPACTO;
      K.som('whoosh', imp - 0.35, 0.5);
      K.som('clique', imp, 0.9);
      const tAbre = B.inicio + 0.45 * B.dur;
      S.fechado = tc < tAbre;
      S.forca = 0.3;
      S.luz = tc < tAbre ? 1 : 0;
      S.corrente = tc < tAbre ? 1 : 0;
      K.som('desliga', tAbre, 0.8);
      noMenino(MEN, 0.55, tc);
      menino.apontar(0.35);
      menino.humor(tc < tAbre ? 'surpreso' : 'feliz');
      fx.et.desligou.em(mais(BOT_W(), [0, 0.7, 0]), tc - tAbre - 0.15);
      cam(CAM_LAN_PERTO, CAM_BOT, K.suave(K.faixa(q, 0, 0.5)));
    },

    botao_rotulo(B, S, tc) {
      S.botao = true; S.fechado = false; S.luz = 0; S.corrente = 0;
      fx.dq.botao.em(B.t);
      fx.rot.botao.em(mais(BOT_W(), [0, 0.65, 0]), B.t - 0.05);
      cam(CAM_BOT, { pos: [-1.4, 2.1, 8.5], alvo: [-1.45, 1.1, 4.8] }, B.p);
    },

    aperta(B, S, tc) {
      S.botao = true;
      const t1 = quando('aperta', B, 0.05), t2 = quando('acende', B, 0.4), t3 = quando('solta', B, 0.65), t4 = quando('apaga', B, 0.85);
      const preso = tc > t1 + 0.1 && tc < t3 + 0.1;
      S.prensa = preso ? 1 : 0;
      S.fechado = preso;
      S.luz = preso ? 1 : 0;
      S.corrente = preso ? 1 : 0;
      S.feixe = 1;
      K.som('clique', t1 + 0.1, 0.9);
      K.som('liga', t1 + 0.12, 0.6);
      K.som('clique', t3 + 0.1, 0.7);
      K.som('desliga', t3 + 0.12, 0.6);
      // O menino atrás da lanterna, com a mão em cima do botão
      noMenino([-1.5, 0, 4.05], 0, tc);
      menino.pose({ z: 0.15 }, { x: -1.05 + (preso ? 0.12 : 0), z: -0.25, c: -0.35 });
      menino.humor(preso ? 'feliz' : 'surpreso');
      // Uma etiqueta de cada vez: "fechado" até ele soltar, "aberto" depois
      if (tc < t3 + 0.1) fx.et.fechado.em(mais(BOT_W(), [0, 0.95, 0]), tc - t2);
      else fx.et.aberto.em(mais(BOT_W(), [0, 0.95, 0]), tc - t3 - 0.1);
      cam({ pos: [-1.2, 2.9, 11.0], alvo: [-1.35, 1.0, 4.6] }, { pos: [-1.25, 2.7, 10.2], alvo: [-1.35, 1.0, 4.6] }, B.p);
    },

    por_fora(B, S, tc) {
      S.corpoOp = K.lerp(0.28, 0.92, K.suave(K.faixa(B.p, 0, 0.4)));
      K.som('tampa', B.inicio + 0.1, 0.6);                    // o corpo fecha: por fora, é só um tubo
      noMenino([1.2, 0, 6.0], 1.6, tc);
      menino.apontar(0.1);
      // A lanterna inteira e ele do lado: o K.filmar enquadra os dois (o "mostra" da frase pede a lanterna)
      K.filmar([lan, menino], 'afastando', B.p, { plano: 'aberto', lado: -30, altura: 15 });
    },

    por_dentro(B, S, tc) { fechamento(B, S, tc, true); },

    segue(B, S, tc) {
      fechamento(B, S, tc, false);
      const tS = quando('segue', B, 0.1);
      fx.seguir.em(tc - tS);
      K.som('brilho', tS, 0.5);
      K.som('clique', tS + K.SEGUIR_CLIQUE, 0.9);
      menino.humor('feliz');
      menino.apontar(1);
    },

    cartao(B, S, tc) {
      fechamento(B, S, tc, false);
      fx.seguir.em(9);
      menino.humor('feliz');
      menino.acenar(tc);
      K.som('final', B.inicio, 0.7);
    },

    capa(B, S, tc) {
      S.luz = 1; S.feixe = 1; S.chaveBrilho = 1;
      noMenino([-0.3, 0, 7.0], -0.7, tc);
      menino.apontar(0.55);
      menino.humor('surpreso');
      K.mirar([-1.3, 1.75, 10.6], [-1.3, 0.85, 4.8]);
    }
  };

  // Fechamento: a lanterna se abre no ar, uma peça por vez (no "pilha", no "espelho" e no "botão"); com
  // abrindo = false, ela fica montada e acesa (segue e cartão)
  const SOLTA = {
    pilha: { local: [-1.1, -0.85, 0.5], giro: 0.6 },
    refletor: { local: [-1.25, 0.9, 0.5], giro: -0.5 },
    botao: { local: [-1.75, 0.1, 0.6], giro: 0.4 },
    lampada: { local: [-0.9, 0.35, 0.7], giro: 0 }
  };
  function fechamento(B, S, tc, abrindo) {
    S.luz = 1; S.feixe = 1; S.corpoOp = 0.28;
    noMenino(abrindo ? MEN : [-2.45, 0, 6.15], 0.4, tc);
    if (abrindo) {
      const tP = quando('pilha', B, 0.15), tR = quando('espelho', B, 0.45), tB = quando('botao', B, 0.75);
      const k = (ta) => K.saiVolta(K.faixa(tc, ta, ta + 0.8));
      S.solta = { pilha: k(tP), refletor: k(tR), botao: k(tB), lampada: k(tR + 0.2) };
      K.som('whoosh', tP, 0.6); K.som('whoosh', tR, 0.6); K.som('whoosh', tB, 0.6);
      menino.humor('surpreso');
      menino.cabeca.rotation.x = -0.25;
      const p = (obj) => { obj.updateMatrixWorld(true); return obj.getWorldPosition(new THREE.Vector3()).toArray(); };
      fx.et.pPilha.em(mais(p(pilha), [0.2, 0.15, 0]), tc - tP - 0.3);
      fx.et.pRefletor.em(mais(p(refletor), [0.6, 0.15, 0]), tc - tR - 0.3);
      fx.et.pBotao.em(mais(p(botao), [-0.2, 0.25, 0]), tc - tB - 0.3);
      cam(CAM_LAN, { pos: [-1.5, 2.9, 12.6], alvo: [-1.5, 1.45, 4.8] }, K.suave(K.faixa(B.p, 0, 0.3)));
    } else {
      cam({ pos: [-1.75, 2.0, 11.8], alvo: [-1.8, 0.95, 5.0] }, { pos: [-1.8, 1.95, 11.2], alvo: [-1.8, 0.95, 5.0] }, B.p);
    }
  }

  // ---------- Quadro ----------

  function cena(tc, t, plano) {
    const B = plano ? { plano, p: 0.5, t: 1, dur: 2, inicio: 0, ate: 2, q: 0.5, tq: 1, bloco: { reb: 0 } } : K.blocoEm(bl, tc);
    const bi = plano ? -1 : bl.indexOf(B.bloco);
    const ja = (n) => plano === 'capa' || plano === 'gancho' || (I[n] != null && bi > I[n]);
    K.ceu('noite');

    // Estado padrão do quadro, a partir das peças que já foram montadas
    const S = {
      lan: true, lanY: 0, lampNaMao: 0, piscaLamp: 0,
      pilha: ja('pilha') ? 1 : -1, fios: ja('pilha') ? 1 : 0, corrente: ja('pilha') ? 1 : 0,
      refletor: ja('refletor'), refY: 0, botao: ja('botao'), botY: 0, prensa: 0,
      fechado: !ja('botao') || ja('aperta'),
      luz: ja('pilha') && (!ja('botao') || ja('aperta')) ? 1 : 0, forca: 1, feixe: ja('refletor') ? 1 : 0,
      corpoOp: 0.28, chaveBrilho: ja('refletor') ? 1 : 0.15, solta: null
    };
    if (B.plano === 'gancho' || plano === 'capa') Object.assign(S, { pilha: 1, fios: 1, corrente: 1, refletor: true, botao: true, fechado: true, luz: 1, feixe: 1 });

    menino.g.visible = false;
    P[B.plano](B, S, tc);
    aplicar(S, tc);
  }

  function aplicar(S, tc) {
    lan.visible = cavalete.visible = S.lan;
    lan.position.set(LAN[0], LAN[1] + S.lanY, LAN[2]);
    cavalete.position.y = S.lanY;
    matCorpo.opacity = S.corpoOp;
    matCorpo.depthWrite = S.corpoOp > 0.8;

    // Lâmpada: no soquete ou na mão do menino
    lampada.position.set(0, 1.2, 0);
    lampada.rotation.set(0, 0, 0);
    if (S.lampNaMao > 0.01) {
      const m = menino.mao(1);
      lan.updateMatrixWorld(true);
      const local = lan.worldToLocal(new THREE.Vector3(m[0], m[1] + 0.05, m[2] + 0.12));
      lampada.position.lerp(local, S.lampNaMao);
    }
    // Pilha: entra por trás (pilha < 0 = ainda não existe)
    pilha.visible = S.pilha >= 0;
    pilha.position.set(0, K.lerp(-1.6, 0, Math.max(0, S.pilha)), 0);
    pilha.rotation.set(0, 0, 0);
    // Refletor e botão caem do céu
    refletor.visible = S.refletor;
    refletor.position.set(-S.refY, 0, 0);
    refletor.rotation.set(0, 0, 0);
    botao.visible = S.botao;
    botao.position.set(-S.botY - 0.05 * S.prensa, 0, 0);
    botao.rotation.set(0, 0, 0);
    contato.position.x = -0.4 + (S.fechado ? 0.02 : -0.03);

    // Vista explodida
    const sol = S.solta;
    if (sol) {
      [['pilha', pilha], ['refletor', refletor], ['botao', botao], ['lampada', lampada]].forEach(([nome, obj]) => {
        const k = sol[nome], d = SOLTA[nome].local;
        obj.position.x += d[0] * k; obj.position.y += d[1] * k; obj.position.z += d[2] * k;
        obj.rotation.set(0.3 * k * Math.sin(tc * 0.9), SOLTA[nome].giro * k + tc * 0.4 * k, 0);
      });
    }
    const aberto = sol && Math.max(sol.pilha, sol.refletor, sol.botao) > 0.05;

    // Fios e eletricidade
    const fios = S.lan && !aberto ? S.fios : 0;
    fioA.em(K.faixa(fios, 0, 0.5));
    ponte.em(S.fechado ? K.faixa(fios, 0.5, 0.65) : 0);
    fioB.em(K.faixa(fios, 0.65, 1));
    if (S.corrente > 0 && fios >= 1 && S.fechado) fx.eletricidade.em(tc, 0.6);

    // Luz
    const luz = S.lan && S.pilha >= 1 && !aberto ? S.luz * S.forca : S.lan && sol ? S.forca : 0;
    const pisca = S.piscaLamp;
    matLampada.emissiveIntensity = 0.05 + 2.6 * Math.max(luz, pisca);
    const pl = LAMP_W();
    lampada.updateMatrixWorld(true);
    const pb = lampada.children[0].getWorldPosition(new THREE.Vector3());
    halo.position.copy(pb);
    const espalha = 1 - S.feixe;
    halo.scale.setScalar(K.lerp(0.9, 1.6 + 2.6 * espalha, luz));
    halo.material.opacity = Math.max(luz, pisca) * K.lerp(0.95, 0.55, espalha);
    halo.visible = Math.max(luz, pisca) > 0.01;
    luzPonto.position.set(pl[0], pl[1] + 0.1, pl[2] + 0.3);
    luzPonto.intensity = luz * K.lerp(3.5, 9, espalha);
    luzPonto.distance = K.lerp(3.5, 7, espalha);
    const ponta = W(0, COMP);
    spot.position.set(...ponta);
    spot.intensity = luz * S.feixe * 60;
    const fe = !aberto && S.refletor ? luz * S.feixe : 0;
    matFeixe.opacity = 0.22 * fe;
    feixe.visible = fe > 0.01;
    matPoca.opacity = 0.45 * fe;
    poca.visible = fe > 0.01;
    matRefletor.emissiveIntensity = 0.35 * luz;
    brilhoChave.visible = S.chaveBrilho > 0.05;
    brilhoChave.material.opacity = S.chaveBrilho * (0.7 + 0.3 * Math.sin(tc * 6));
    brilhoChave.scale.setScalar(0.4 + 0.5 * S.chaveBrilho);
  }

  window.CENA = { montar, cena, capa: () => cena(0, 0, 'capa') };
})();
