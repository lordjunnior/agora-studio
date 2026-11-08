// Modelo de cena com CENÁRIO PRONTO (Máquina Preguiça 3D): "Como a árvore bebe água?", no campo com montanhas
// (K.cenario('natureza')). O cenário já traz a grama, as poucas árvores, as montanhas com neve, o céu azul, as flores, as
// borboletas e os pássaros; aqui só entra o objeto do vídeo (a árvore que se explica), o personagem e um plano por frase.
//
// Como usar num vídeo novo:
//   1. Copie esta pasta (roteiro.json e cena.js) pra videos/<tema>/
//   2. Troque tudo o que está marcado com TROQUE: o cenário (lista em referencias/cenarios.md), as peças do objeto, as
//      cores do personagem e um plano em P pra cada frase do roteiro.json
//   3. Outro cenário: troque 'natureza' pelo nome de outro (floresta, fazenda, casa, praia...). Os lugares C.centro,
//      C.personagem, C.entrada, C.esquerda, C.direita, C.fundo e C.vista existem em todos
//   4. node motor/render.js videos/<tema> --voz-teste --revisar   até dar APROVADO, e abrir a folha (testes/folha.jpg)
(function () {
  let tl, bl, C, menino, arvore, pc, raizes, canudos, vaso;
  const fx = {};
  const mais = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  const quando = (palavra, B, frac) => { const t = K.quando(palavra, B.inicio); return t != null && t < B.ate ? t : B.inicio + frac * B.dur; };
  // Ponto na tela que nunca desce até a legenda (ela fica entre y 1165 e 1315) nem passa de teto: chamar depois do
  // K.filmar. Dois textos na mesma frase: um teto diferente pra cada (um não cai em cima do outro)
  const semLegenda = (p, teto = 1040) => { const [x, y] = K.tela(p); return { tela: [x, Math.min(y, teto)] }; };
  let BASE, LADO, COPA;

  // ---------- Montagem (uma vez só) ----------

  function montar(timeline) {
    tl = timeline;
    bl = K.blocos(tl);
    // TROQUE: o cenário (ele monta o lugar inteiro e devolve os lugares)
    C = K.cenario('natureza');
    BASE = C.centro;
    LADO = mais(C.personagem, [0.5, 0, 0.3]);  // um pouco mais longe: a árvore é larga
    COPA = mais(BASE, [0, 3.9, 0]);

    // TROQUE: as peças do objeto. A árvore: tronco (dá pra ver por dentro), copa e os canudinhos de água dentro do tronco
    arvore = new THREE.Group();
    arvore.position.set(...BASE);
    K.scene.add(arvore);
    K.lugar(arvore);
    K.nomear('arvore', arvore);                // grupo feito à mão: ganha o nome aqui (as peças do K.pecas já têm)
    pc = K.pecas({
      tronco: { forma: 'cilindro', tam: [0.3, 0.42, 3.0], cor: '#7a4a2a', pos: [0, 1.5, 0], transparente: 0.01 },
      copa: { forma: 'esfera', tam: [1.45], cor: '#5aa83f', pos: [0, 3.95, 0] },
      copa2: { forma: 'esfera', tam: [0.95], cor: '#4f9a3a', pos: [-0.95, 3.55, 0.25] },
      copa3: { forma: 'esfera', tam: [1.0], cor: '#6cb548', pos: [0.95, 3.6, -0.15] }
    }, arvore);
    // As raízes espalhadas no chão (canos tortos saindo da base) e os canudinhos dentro do tronco
    raizes = new THREE.Group();
    arvore.add(raizes);
    K.lugar(raizes);
    K.nomear('raizes', raizes);
    const r = {};
    [0, 1.2, 2.3, 3.4, 4.6, 5.6].forEach((a, i) => {
      const c = Math.cos(a), s = Math.sin(a);
      r['raiz' + i] = { forma: 'cano', pontos: [[c * 0.3, 0.12, s * 0.3], [c * 0.9, 0.06, s * 0.9], [c * 1.5 + s * 0.2, 0.05, s * 1.5 - c * 0.2], [c * 2.1, 0.04, s * 2.1]], tam: [0.07], cor: '#6b4a2e' };
    });
    K.pecas(r, raizes);
    canudos = new THREE.Group();
    arvore.add(canudos);
    K.lugar(canudos);
    K.nomear('canudos', canudos);
    K.pecas({
      c0: { forma: 'cilindro', tam: [0.04, 3.0], cor: '#6bb8f0', pos: [0.13, 1.5, 0.05] },
      c1: { forma: 'cilindro', tam: [0.04, 3.0], cor: '#6bb8f0', pos: [-0.12, 1.5, 0.08] },
      c2: { forma: 'cilindro', tam: [0.04, 3.0], cor: '#6bb8f0', pos: [0, 1.5, -0.13] }
    }, canudos);

    // TROQUE: em que plano cada peça entra e como, na palavra certa
    K.entraNo('raizes', raizes, 'cresce', { palavra: 'raízes' });
    K.entraNo('canudos', canudos, 'sobe', { palavra: 'canudinhos' });

    // TROQUE: o personagem com as cores de canal/identidade.md
    menino = K.boneco({ roupa: 'camiseta', cores: { camiseta: 0xff7a59, bermuda: 0x2f6f5e, tenis: 0xf4f1ea, cabelo: 0x7a4a22 } });

    // A planta no vaso (a da frase que murcha), a água subindo, o vapor saindo das folhas e os textos
    vaso = K.flor(0xff5a8a);
    vaso.g.position.set(...mais(C.esquerda, [-0.6, 0, 0.6]));
    vaso.g.scale.setScalar(1.6);
    K.lugar(vaso.g);
    K.nomear('vaso', vaso);
    const subida = K.caminho([mais(BASE, [1.9, 0.08, 0.5]), mais(BASE, [0.9, 0.08, 0.3]), mais(BASE, [0.1, 0.3, 0.05]), mais(BASE, [0.1, 3.0, 0.05]), mais(BASE, [0.2, 3.7, 0.1])]);
    fx.agua = K.fluxo(subida, 34, K.cores.aguaClara, 1.2);
    fx.vapor = K.fumaca(15, 0xffffff, 16);
    fx.pingos = K.pingos(2, 8);
    fx.pingos2 = K.pingos(5, 8);
    fx.seta = K.seta(K.cores.vermelho, 1.1);
    fx.certo = K.marca('certo');
    fx.errado = K.marca('errado');
    fx.contador = K.contador();
    fx.seguir = K.cartaoSeguir();
    // TROQUE: os nomes e as etiquetas
    fx.rot = { raizes: K.rotulo('Raízes'), xilema: K.rotulo('Xilema') };
    const e = (txt, cor) => K.etiqueta(txt, cor);
    fx.et = {
      murcha: e('Murchou', 'vermelho'), chao: e('A água tá no chão', 'vermelho'), bebe: e('Bebem a água', 'verde'),
      gravidade: e('A gravidade puxa', 'vermelho'), sobe: e('A água sobe!', 'verde'),
      pRaiz: e('Raízes: bebem', 'azul'), pCanudo: e('Canudinhos: sobem', 'azul'), pFolha: e('Folhas: soltam vapor', 'azul')
    };
  }

  // Deixa ver o tronco por dentro (0 = casca fechada, 1 = quase transparente)
  function verDentro(k) {
    pc.tronco.traverse((o) => { if (o.isMesh) { o.material.opacity = 1 - 0.7 * k; o.material.depthWrite = k < 0.05; } });
  }

  // ---------- Planos: um por frase do roteiro.json ----------

  const P = {
    gancho(B, tc) {
      // A árvore com a água subindo por dentro do tronco e ele olhando pra cima, surpreso; a câmera desce do céu
      verDentro(0.7);
      fx.agua.em(tc, 0.35);
      menino.colocar(LADO, mais(LADO, [-0.8, 0, 3]));
      menino.reagir('surpreso', B.t);
      menino.apontar(1);
      K.filmar([arvore, menino], 'mergulho', B.p, { plano: 'medio', lado: -20, espacoCima: 0.3 });
    },

    murcha(B, tc) {
      // A planta no vaso, no sol, murchando na palavra; ele sua, cansado
      const tM = quando('murcham', B, 0.65);
      vaso.em(1 - K.faixa(tc, tM - 0.3, tM + 0.6));
      const pv = vaso.g.position.toArray();
      menino.colocar(mais(pv, [1.1, 0, 0.5]), pv);
      menino.reagir('cansado', B.t);
      fx.et.murcha.em(mais(pv, [0, 1.6, 0]), tc - tM);
      K.filmar([vaso.g, menino], 'chegando', B.p, { plano: 'perto', lado: 'esquerda', tam: 1.4 });
    },

    chao(B, tc) {
      // A chuva caiu: a água pingando e parada no chão, longe das folhas. Ele não entende
      fx.pingos.em(mais(BASE, [1.4, 2.6, 0.6]), tc, 3, 2.6);
      fx.pingos2.em(mais(BASE, [-1.2, 2.6, 0.8]), tc + 0.4, 3, 2.6);
      menino.colocar(LADO, BASE);
      menino.reagir('duvida', B.t);
      const tC = quando('terra', B, 0.6);
      fx.et.chao.em(mais(BASE, [0.4, 1.0, 1.2]), tc - tC);
      const [ex, ey] = K.tela(mais(BASE, [0.4, 1.0, 1.2]));
      fx.errado.em({ tela: [ex, ey - 150] }, tc - tC - 0.3);
      K.filmar([mais(BASE, [0, 0.3, 0.6]), menino], 'descendo', B.p, { plano: 'medio', lado: 'direita', altura: 'alto', tam: 2.5 });
    },

    raizes(B, tc) {
      // Depois do ⏪: as raízes crescem pelo chão (o K.entraNo cuida) e a água começa a entrar por elas
      menino.colocar(LADO, BASE);
      if (B.q < 0.4) menino.reagir('surpreso', B.tq); else menino.reagir('ideia', B.tq - 0.4 * B.dur);
      const tR = quando('raízes', B, 0.45);
      if (tc > tR + 0.4) fx.agua.em(tc, 0.35, K.clamp((tc - tR - 0.4) / 2) * 0.45);
      fx.et.bebe.em(mais(BASE, [1.3, 0.9, 0.9]), tc - tR - 0.6);
      K.filmar([raizes, menino], 'subindo', B.q, { plano: 'medio', lado: 'direita', altura: 'alto' });
    },

    raizes_rotulo(B, tc) {
      // O nome: as raízes brilhando, vistas de cima
      menino.colocar(LADO, BASE);
      menino.reagir('mostrando', B.t);
      K.brilhar(raizes, B.t);
      fx.rot.raizes.em(mais(BASE, [0, 1.0, 1.4]), B.t - 0.05);
      K.filmar(raizes, 'girando', B.p, { plano: 'medio', altura: 'cima', angulo: 40 });
    },

    gravidade(B, tc) {
      // A seta da gravidade puxando a água pra baixo, ao longo do tronco alto; ele fica bravo
      menino.colocar(LADO, BASE);
      menino.reagir('bravo', B.t);
      const tG = quando('gravidade', B, 0.3);
      fx.seta.em(mais(BASE, [0.6, 3.4, 0.4]), [0, -1, 0], 2.4, tc - tG);
      fx.et.gravidade.em(mais(BASE, [0.9, 3.0, 0.5]), tc - tG - 0.3);
      K.filmar(arvore, 'subindo', B.p, { plano: 'medio', lado: 'esquerda', altura: 'baixo' });
    },

    canudos(B, tc) {
      // O tronco fica transparente: os canudinhos sobem (o K.entraNo cuida), a água sobe por eles e as folhas soltam vapor
      verDentro(0.75);
      menino.colocar(LADO, BASE);
      const tV = quando('vapor', B, 0.7);
      fx.agua.em(tc, 0.4);
      if (tc > tV) fx.vapor.em(mais(COPA, [0.3, 1.3, 0.4]), tc, { altura: 1.6, escala: 0.6, forca: 0.45 * K.clamp((tc - tV) / 0.6) });
      if (tc > tV) menino.reagir('vitoria', tc - tV); else menino.reagir('pensando', B.t);
      fx.et.sobe.em(mais(BASE, [0.9, 2.2, 0.5]), tc - tV);
      fx.certo.em(mais(BASE, [0.9, 2.8, 0.5]), tc - tV - 0.3);
      K.filmar([arvore, menino], 'chegando', B.p, { plano: 'medio', lado: 'frente', altura: 'olho' });
    },

    xilema_rotulo(B, tc) {
      // O nome: os canudinhos brilhando dentro do tronco, de perto
      verDentro(0.85);
      fx.agua.em(tc, 0.4);
      K.brilhar(canudos, B.t);
      fx.rot.xilema.em(mais(BASE, [0, 2.0, 0.6]), B.t - 0.05);
      K.filmar(pc.tronco, 'girando', B.p, { plano: 'perto', altura: 10, angulo: 40, fora: arvore });
    },

    litros(B, tc) {
      // A vida real: o campo todo com as montanhas, o contador dos litros e ele comemorando
      fx.agua.em(tc, 0.5);
      fx.vapor.em(mais(COPA, [0.3, 1.3, 0.4]), tc, { altura: 1.6, escala: 0.6, forca: 0.45 });
      menino.colocar(LADO, mais(LADO, [-0.8, 0, 3]));
      menino.reagir('vitoria', B.t);
      const tL = quando('litros', B, 0.55);
      K.filmar([arvore, menino], 'revelando', B.p, { plano: 'aberto', lado: 25, altura: 'olho', espacoCima: 0.2 });
      fx.contador.em('400 LITROS', { tela: [540, 420] }, tc - tL, 'POR DIA');
    },

    por_fora(B, tc) {
      // A árvore inteira, parada no campo; a câmera se afasta
      menino.colocar(LADO, BASE);
      menino.reagir('mostrando', B.t);
      K.som('whoosh', B.inicio + 0.05, 0.4);
      K.filmar([arvore, menino], 'afastando', B.p, { plano: 'aberto', lado: 'esquerda', altura: 15 });
    },

    por_dentro(B, tc) {
      // Por dentro: tronco transparente, água subindo, vapor saindo e o nome de cada parte, na palavra dela
      verDentro(0.8);
      fx.agua.em(tc, 0.45);
      fx.vapor.em(mais(COPA, [0.3, 1.3, 0.4]), tc, { altura: 1.6, escala: 0.6, forca: 0.45 });
      menino.colocar(mais(LADO, [0.3, 0, 0.3]), BASE);
      menino.reagir('surpreso', B.t);
      const tR = quando('raízes', B, 0.2), tC = quando('canudinhos', B, 0.45), tF = quando('folhas', B, 0.7);
      K.filmar([arvore, mais(COPA, [0, 2, 0])], 'girando', B.p, { plano: 'medio', altura: 12, angulo: 35 });
      fx.et.pRaiz.em(semLegenda(mais(BASE, [-1.6, 0.6, 1.0])), tc - tR);
      fx.et.pCanudo.em(semLegenda(mais(BASE, [1.0, 2.1, 0.4]), 900), tc - tC);
      fx.et.pFolha.em(semLegenda(mais(COPA, [0, 1.8, 0]), 760), tc - tF);
    },

    segue(B, tc) {
      menino.colocar(LADO, 0.2);
      const tS = quando('segue', B, 0.1);
      fx.seguir.em(tc - tS);
      K.som('brilho', tS, 0.5);
      K.som('clique', tS + K.SEGUIR_CLIQUE, 0.9);
      menino.humor('feliz');
      menino.apontar(1);
      K.filmar([arvore, menino], 'parado', B.p, { plano: 'aberto', espacoCima: 0.45 });
    },

    cartao(B, tc) {
      menino.colocar(LADO, 0.2);
      fx.seguir.em(9);
      menino.reagir('chamando', tc);
      K.som('final', B.inicio, 0.7);
      K.filmar([arvore, menino], 'parado', 1, { plano: 'aberto', espacoCima: 0.45 });
    },

    capa(B, tc) {
      verDentro(0.7);
      fx.agua.em(0.8, 0.35);
      menino.colocar(LADO, mais(LADO, [-0.8, 0, 3]));
      menino.reagir('surpreso', 1);
      menino.apontar(1);
      K.filmar([arvore, menino], 'parado', 0, { plano: 'medio', lado: -20, espacoCima: 0.3 });
    }
  };

  // ---------- Quadro ----------

  function cena(tc, t, plano) {
    const B = plano ? { plano, p: 0.5, t: 1, dur: 2, inicio: 0, ate: 2, q: 0.5, tq: 1, bloco: { reb: 0 } } : K.blocoEm(bl, tc);
    // O céu vem do cenário. O vaso só aparece na frase dele; o plano mostra o que precisa
    menino.g.visible = false;
    vaso.g.visible = B.plano === 'murcha';
    vaso.em(1);
    verDentro(0);
    if (!P[B.plano]) throw new Error(`Falta o plano "${B.plano}" no cena.js (um por frase do roteiro.json)`);
    P[B.plano](B, tc);
  }

  window.CENA = { montar, cena, capa: () => cena(0, 0, 'capa') };
})();
