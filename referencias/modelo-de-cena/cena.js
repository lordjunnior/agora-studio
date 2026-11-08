// Modelo de cena (Máquina Preguiça 3D): o guarda-chuva gigante no quintal, na chuva, feito só com os ajudantes do
// kit (K.pecas, K.entraNo, K.filmar, menino.reagir, K.entrar, K.falhar, K.brilhar), sem coordenada de câmera na mão.
//
// Como usar num vídeo novo:
//   1. Copie esta pasta (roteiro.json e cena.js) pra videos/<tema>/
//   2. Troque tudo o que está marcado com TROQUE: as peças do objeto, os lugares, as cores do personagem e um plano
//      em P pra cada frase do roteiro.json (o nome do plano é o campo "plano" da frase)
//   3. Cada plano tem as 4 coisas de toda frase: CÂMERA (K.filmar), PERSONAGEM (colocar + uma ação), ALGO
//      ACONTECENDO (peça entrando, falha, efeito) e TEXTO ou SOM. Ideias prontas: referencias/cardapio-de-cenas.md
//   4. node motor/render.js videos/<tema> --voz-teste --revisar   até dar APROVADO, e abrir a folha (testes/folha.jpg)
//
// Tudo é função do tempo da cena (tc): nada guarda estado de um quadro pro outro (o ⏪, as prévias e o --trecho pulam
// pra qualquer instante). O kit já faz sozinho, em todo quadro: põe cada peça no lugar dela, mostra cada peça só a
// partir do plano em que ela entra (K.entraNo) e volta o personagem ao neutro. O plano só diz o que muda na frase.
(function () {
  // TROQUE: onde fica o objeto e os lugares do personagem (y = 0 é o chão; o personagem tem 1,55 de altura)
  const BASE = [0, 0, 0];                       // o guarda-chuva gigante fica fincado aqui
  const EMBAIXO = [0.42, 0, 0.35];              // o personagem embaixo da copa
  const LADO = [1.55, 0, 0.95];                 // o personagem do lado do guarda-chuva
  const CASA = [-5.2, 0, -5.5];                 // a casa do quintal
  const mais = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  const PORTA = mais(CASA, [0.6, 0, 2.6]);      // a porta da K.casa fica em x 0,6, na frente (z 2,5)
  const COPA = mais(BASE, [0, 1.99, 0]);        // o meio do tecido
  const CHUVA = [0, 0, -5];                     // a chuva fica atrás: nada de gota grudada na câmera

  let tl, bl, menino, guarda, casa, pc;
  const fx = {};
  let abrigo = null;                            // embaixo do guarda-chuva aberto não chove

  // Os pontos das varetas: do alto da haste até a borda do tecido e de volta, uma por vez. Começam meia volta de lado
  // (π/n): nenhuma aponta direto pra câmera de frente (vareta na linha da câmera vira um espeto na tela)
  function varetas(n, raio, topo, borda) {
    const p = [[0, topo, 0]];
    for (let i = 0; i < n; i++) {
      const a = ((i + 0.5) / n) * Math.PI * 2;
      p.push([Math.cos(a) * raio, borda, Math.sin(a) * raio], [0, topo, 0]);
    }
    return p;
  }
  // Instante em que a narração fala a palavra nesta frase (se não achar, a fração frac da frase)
  const quando = (palavra, B, frac) => { const t = K.quando(palavra, B.inicio); return t != null && t < B.ate ? t : B.inicio + frac * B.dur; };
  const cabecaDo = (b) => b.cabeca.getWorldPosition(new THREE.Vector3()).toArray();

  // ---------- Montagem (uma vez só) ----------

  function montar(timeline) {
    tl = timeline;
    bl = K.blocos(tl);
    K.mundo(7);
    casa = K.casa();
    casa.position.set(...CASA);

    // TROQUE: as peças do objeto, no formato do jeito por chat (forma, tam, cor, pos, metal, transparente...). Ficam
    // dentro do grupo guarda, que dá pra mover inteiro (na frase da porta o personagem carrega ele)
    guarda = new THREE.Group();
    guarda.position.set(...BASE);
    K.scene.add(guarda);
    K.lugar(guarda);                            // todo quadro começa com ele aqui
    K.nomear('guarda-chuva', guarda);           // grupo feito à mão: ganha o nome aqui (as peças do K.pecas já têm)
    pc = K.pecas({
      tecido: { forma: 'funil', tam: [0.06, 1.08, 0.46], cor: '#2f7fe0', pos: [0, 1.99, 0] },
      haste: { forma: 'cilindro', tam: [0.025, 1.9], cor: '#2b2f36', metal: true, pos: [0, 1.25, 0] },
      cabo: { forma: 'cano', pontos: [[0, 0.35, 0], [0, 0.15, 0], [0.07, 0.04, 0], [0.17, 0.09, 0]], tam: [0.04], cor: '#7a4a22' },
      varetas: { forma: 'cano', pontos: varetas(8, 1.08, 2.2, 1.76), tam: [0.014], cor: '#c9ced6', metal: true },
      trava: { forma: 'cilindro', tam: [0.06, 0.16], cor: '#e8352b', pos: [0, 1.62, 0] }
    }, guarda);

    // TROQUE: em que plano cada peça entra e como ('cai' 'desliza' 'encaixa' 'cresce' 'gira' 'sobe'), na palavra certa.
    // Antes desse plano a peça não aparece (só no gancho e na capa, que mostram o objeto pronto); depois, fica no lugar
    K.entraNo('tecido', pc.tecido, 'cai', { palavra: 'tecido', som: 'whoosh', poeira: false });
    K.entraNo('varetas', pc.haste, 'sobe', { palavra: 'esqueleto' });
    K.entraNo('varetas', pc.varetas, 'cresce', { palavra: 'hastes' });
    K.entraNo('varetas', pc.cabo, 'desliza', { palavra: 'cabo', de: [1.4, 0.3, 0] });
    K.entraNo('trava', pc.trava, 'desliza', { palavra: 'sobe', de: [0, -1.0, 0] });

    // TROQUE: o personagem com as cores de canal/identidade.md (bloco "No roteiro.json")
    menino = K.boneco({ roupa: 'camiseta', cores: { camiseta: 0xff7a59, bermuda: 0x2f6f5e, tenis: 0xf4f1ea, cabelo: 0x7a4a22 } });

    // Coisas que só aparecem em algumas frases (o pano na cabeça, a poça em cima do tecido murcho)
    fx.pano = K.peca({ nome: 'pano', forma: 'caixa', tam: [0.62, 0.03, 0.5], cor: '#d9c7a3' });
    fx.poca = K.peca({ forma: 'cilindro', tam: [0.42, 0.035], cor: '#6bb8f0', transparente: 0.25, pos: [0, 2.24, 0] }, guarda);

    // Efeitos, textos e sons (cada um criado uma vez; o plano só chama .em() quando ele aparece)
    fx.chuva = K.chuva(12, 900);
    fx.pingos = K.pingos(3, 8);
    fx.pingos2 = K.pingos(5, 8);
    fx.respingo = K.respingo(6);
    fx.certo = K.marca('certo');
    fx.errado = K.marca('errado');
    fx.seguir = K.cartaoSeguir();
    // TROQUE: o nome de cada peça (rótulo amarelo do "Esse é o X") e as etiquetas (vermelho = problema, verde = funciona,
    // azul = informação, laranja = curiosidade)
    fx.rot = { tecido: K.rotulo('Tecido<br>impermeável'), varetas: K.rotulo('Varetas'), trava: K.rotulo('Trava') };
    const e = (txt, cor) => K.etiqueta(txt, cor);
    fx.et = {
      encharcado: e('Encharcado', 'vermelho'), passa: e('A água passa', 'vermelho'), escorre: e('A gota escorre', 'verde'),
      murchou: e('Murchou', 'vermelho'), esticado: e('Esticado', 'verde'), porta: e('Não passa na porta', 'vermelho'),
      clique: e('Clique!', 'verde'), seco: e('Seco', 'verde'),
      pTecido: e('Tecido', 'azul'), pVaretas: e('Varetas', 'azul'), pTrava: e('Trava (a molinha)', 'azul')
    };
  }

  // ---------- Planos: um por frase do roteiro.json ----------
  // Cada plano recebe B (o tempo do bloco: B.p de 0 a 1, B.t em segundos, B.inicio, B.dur, B.q/B.tq depois do ⏪) e tc

  const P = {
    gancho(B, tc) {
      // O guarda-chuva pronto no temporal, o menino seco embaixo, surpreso; a câmera desce do alto até ele
      fx.chuva.em(CHUVA, tc, 1, abrigo);
      menino.colocar(EMBAIXO, 0.35);
      menino.reagir('surpreso', B.t);
      menino.apontar(0.9);
      K.filmar([guarda, menino], 'mergulho', B.p, { plano: 'medio', lado: -20, espacoCima: 0.35 });
    },

    encharcado(B, tc) {
      // Ele atravessa o quintal com um pano na cabeça, pingando, e chega encharcado. A câmera vai junto, de lado
      fx.chuva.em(CHUVA, tc, 1);
      const anda = K.faixa(B.p, 0, 0.7);
      const pos = menino.irPara([-1.8, 0, -2.2], [1.0, 0, 0.9], anda, tc, { vel: 0.8 });  // vem na direção da câmera
      if (anda >= 1) { menino.reagir('cansado', tc - (B.inicio + 0.7 * B.dur)); menino.olharPara([pos[0] + 1, 0, pos[2] + 3]); }
      for (let k = 0.04; k < 0.7; k += 0.1) K.som('passo', B.inicio + k * B.dur, 0.5);
      noPano(tc, 3);
      fx.et.encharcado.em(mais(pos, [0, 2.15, 0]), tc - (B.inicio + 0.72 * B.dur));
      K.filmar(menino, 'passando', B.p, { plano: 'medio', lado: 'direita', altura: 'olho' });
    },

    furinhos(B, tc) {
      // Close de baixo no pano: a água passando pelos furinhos e pingando nele
      fx.chuva.em(CHUVA, tc, 1);
      menino.colocar([1.0, 0, 0.9], 0.6);
      menino.reagir('triste', B.t);
      menino.suar(tc);
      const pano = noPano(tc, 7);
      const tP = quando('passa', B, 0.6);
      fx.et.passa.em(mais(pano, [0, 0.5, 0]), tc - tP);
      fx.errado.em(mais(pano, [0.55, 0.85, 0]), tc - tP - 0.3);
      for (let k = 0.15; k < 0.9; k += 0.18) K.som('pingo', B.inicio + k * B.dur, 0.5);
      K.filmar(pano, 'chegando', B.p, { plano: 'perto', tam: 1.3, lado: 'esquerda', altura: 'baixo' });
    },

    tecido(B, tc) {
      // Depois do ⏪: o tecido cai do céu (K.entraNo cuida disso) e ele segura em cima da cabeça. As gotas escorrem
      // pela borda e caem longe dele
      fx.chuva.em(CHUVA, tc, 1, B.q > 0.35 ? abrigo : null);
      menino.colocar(EMBAIXO, 0.35);
      if (B.q < 0.3) menino.reagir('surpreso', B.tq); else menino.reagir('erguendo', B.tq - 0.3 * B.dur);
      const tE = quando('escorrer', B, 0.75);
      if (tc > tE) { fx.pingos.em(mais(BASE, [1.02, 1.74, 0.1]), tc, 2.5, 1.7); fx.pingos2.em(mais(BASE, [-0.7, 1.74, 0.75]), tc + 0.3, 2.5, 1.7); }
      fx.et.escorre.em(mais(COPA, [0, 0.75, 0]), tc - tE);
      K.filmar([pc.tecido, menino], 'subindo', B.q, { plano: 'medio', lado: 'esquerda' });
    },

    tecido_rotulo(B, tc) {
      // O nome da peça: close no tecido brilhando, um pouco de cima, girando devagar
      fx.chuva.em(CHUVA, tc, 0.8, abrigo);
      menino.colocar(EMBAIXO, 0.35);
      menino.reagir('erguendo', 1);
      K.brilhar(pc.tecido, B.t);
      fx.rot.tecido.em(mais(COPA, [0, 0.55, 0]), B.t - 0.05);
      K.filmar(pc.tecido, 'girando', B.p, { plano: 'perto', altura: 28, angulo: 40 });
    },

    murcha(B, tc) {
      // O tecido sem esqueleto murcha, a água empoça em cima e pinga na cabeça dele. Vista de cima, pra ver a poça
      fx.chuva.em(CHUVA, tc, 1, abrigo);
      menino.colocar(EMBAIXO, 0.35);
      const tM = quando('murcha', B, 0.25), tP = quando('empoça', B, 0.5), tC = quando('cabeça', B, 0.8);
      K.falhar(pc.tecido, 'murcha', tc - tM, { dur: 0.8, forca: 0.9 });
      const enche = K.suave(K.faixa(tc, tP, tP + 0.8));
      fx.poca.visible = enche > 0.01;
      fx.poca.scale.set(enche, 1, enche);
      fx.poca.position.y = 2.24 - 0.18 * K.faixa(tc, tM, tM + 0.8);
      if (tc > tC) { fx.pingos.em(mais(BASE, [0.3, 1.8, 0.28]), tc, 4, 0.5); menino.reagir('cansado', tc - tC); menino.suar(tc); } else menino.reagir('erguendo', 1);
      fx.et.murchou.em(mais(COPA, [0, 0.8, 0]), tc - tM - 0.3);
      const [ex, ey] = K.tela(mais(COPA, [0, 0.8, 0]));         // o ✗ logo acima da etiqueta, sem tampar o texto
      fx.errado.em({ tela: [ex, ey - 150] }, tc - tC);
      K.filmar([pc.tecido, menino], 'descendo', B.p, { plano: 'medio', lado: 'direita', altura: 'alto' });
    },

    varetas(B, tc) {
      // O esqueleto entra (haste sobe do chão, varetas crescem, cabo desliza), o tecido estica e ele sai de baixo
      fx.chuva.em(CHUVA, tc, 1, abrigo);
      menino.irPara(EMBAIXO, LADO, K.faixa(B.p, 0, 0.3), tc);
      if (B.p > 0.3) { menino.olharPara(BASE); menino.reagir('ideia', tc - (B.inicio + 0.3 * B.dur)); }
      fx.et.esticado.em(mais(COPA, [0, 0.75, 0]), tc - (B.inicio + 0.7 * B.dur));
      fx.certo.em(mais(COPA, [0.9, 1.05, 0]), tc - (B.inicio + 0.8 * B.dur));
      K.filmar(guarda, 'subindo', B.p, { plano: 'medio', lado: 'esquerda' });
    },

    varetas_rotulo(B, tc) {
      // As varetas brilhando, vistas de baixo (dá pra ver o esqueleto todo)
      fx.chuva.em(CHUVA, tc, 0.8, abrigo);
      menino.colocar(LADO, BASE);
      menino.reagir('mostrando', B.t);
      K.brilhar(pc.varetas, B.t);
      fx.rot.varetas.em(mais(BASE, [0, 2.5, 0]), B.t - 0.05);
      K.filmar(pc.varetas, 'chegando', B.p, { plano: 'perto', lado: 'direita', altura: 'baixo' });
    },

    porta(B, tc) {
      // Ele tenta entrar em casa com o guarda-chuva aberto na frente: visto por trás do ombro dele, a copa tampa a porta
      // inteira (é bem maior que ela) e trava na parede. No fim ele vira pra câmera, bravo
      fx.chuva.em(CHUVA, tc, 1);
      const pos = mais(PORTA, [0, 0, 2.7]);
      const vira = B.p > 0.72;
      menino.colocar(pos, vira ? mais(pos, [0.6, 0, 3]) : PORTA);
      menino.reagir(vira ? 'bravo' : 'empurrando', B.t);
      // O guarda-chuva deitado nas mãos dele, com a copa virada pra porta
      guarda.position.set(pos[0], 1.15, PORTA[2] + 2.34);
      guarda.rotation.x = -Math.PI / 2;
      const tP = quando('porta', B, 0.6);
      K.falhar(pc.tecido, 'treme', tc - tP, { forca: 1.2, som: 'baque' });
      fx.et.porta.em(mais(PORTA, [0, 2.6, 0.4]), tc - tP - 0.1);
      const [ex, ey] = K.tela(mais(PORTA, [0, 2.6, 0.4]));
      fx.errado.em({ tela: [ex, ey - 150] }, tc - tP - 0.4);
      K.filmar([mais(PORTA, [0, 1.1, 0.3]), menino], 'chegando', B.p, { plano: 'medio', lado: 12, tam: 2.2 });
    },

    trava(B, tc) {
      // De volta no lugar: a pecinha sobe pela haste, o tecido abre de vez e a mola prende (clique)
      fx.chuva.em(CHUVA, tc, 1, abrigo);
      menino.colocar([0.8, 0, 0.75], BASE);
      const tA = quando('abre', B, 0.55), tC = quando('prende', B, 0.8);
      const abre = K.saiVolta(K.faixa(tc, tA, tA + 0.4));
      pc.tecido.scale.set(0.82 + 0.18 * abre, 1, 0.82 + 0.18 * abre);
      pc.varetas.scale.set(0.82 + 0.18 * abre, 1, 0.82 + 0.18 * abre);
      if (tc < tC) menino.reagir('duvida', B.t); else menino.reagir('vitoria', tc - tC);
      K.som('clique', tC, 1);
      fx.et.clique.em(mais(BASE, [0.1, 2.35, 0]), tc - tC);
      K.filmar([mais(BASE, [0, 1.65, 0]), menino], 'chegando', B.p, { plano: 'medio', tam: 0.8, lado: 'direita', altura: 'olho' });
    },

    trava_rotulo(B, tc) {
      // A trava brilhando, bem de perto, girando
      fx.chuva.em(CHUVA, tc, 0.8, abrigo);
      K.brilhar(pc.trava, B.t);
      fx.rot.trava.em(mais(BASE, [0, 1.95, 0]), B.t - 0.05);
      K.filmar([pc.trava, mais(BASE, [0, 1.95, 0])], 'girando', B.p, { plano: 'perto', tam: 0.3, altura: 0, angulo: 50 });
    },

    clique(B, tc) {
      // Ele fecha e abre o guarda-chuva: na palavra "abre", clique e o ✓
      fx.chuva.em(CHUVA, tc, 1, B.p > 0.6 ? abrigo : null);
      menino.colocar(LADO, BASE);
      const tA = quando('abre', B, 0.7);
      const fecha = K.suave(K.faixa(B.p, 0, 0.3)) * (1 - K.saiVolta(K.faixa(tc, tA - 0.1, tA + 0.25)));
      const k = 1 - 0.85 * fecha;
      pc.tecido.scale.set(k, 1 + 0.6 * fecha, k);
      pc.tecido.position.y = 1.99 - 0.25 * fecha;
      pc.varetas.scale.set(k, 1, k);
      K.som('whoosh', B.inicio + 0.05, 0.4);
      K.som('clique', tA, 1);
      if (tc > tA) menino.reagir('vitoria', tc - tA); else menino.reagir('segurando', B.t);
      fx.certo.em(mais(COPA, [0, 0.9, 0]), tc - tA - 0.15);
      K.filmar([guarda, menino], 'revelando', B.p, { plano: 'aberto', lado: 'esquerda' });
    },

    por_fora(B, tc) {
      // O guarda-chuva inteiro na chuva, ele seco embaixo; a câmera se afasta pra mostrar tudo
      fx.chuva.em(CHUVA, tc, 1, abrigo);
      menino.colocar(EMBAIXO, 0.35);
      menino.reagir('mostrando', B.t);
      fx.pingos.em(mais(BASE, [1.02, 1.74, 0.1]), tc, 2, 1.7);
      K.som('whoosh', B.inicio + 0.05, 0.4);
      fx.et.seco.em(mais(COPA, [-0.2, 0.75, 0.3]), B.t - 0.6);
      K.filmar([guarda, menino], 'afastando', B.p, { plano: 'aberto', lado: 'esquerda', altura: 15 });
    },

    por_dentro(B, tc) {
      // As peças se separam no ar, uma por vez, na palavra de cada uma, com o nome do lado
      fx.chuva.em(CHUVA, tc, 0.7);
      menino.colocar(LADO, BASE);
      menino.reagir('surpreso', B.t);
      const sai = (palavra, frac) => { const t0 = quando(palavra, B, frac); K.som('whoosh', t0, 0.5); return [K.saiVolta(K.faixa(tc, t0, t0 + 0.8)), t0]; };
      const [kT, tT] = sai('tecido', 0.15), [kV, tV] = sai('varetas', 0.45), [kM, tMo] = sai('molinha', 0.75);
      pc.tecido.position.y += 0.9 * kT;
      pc.varetas.position.x -= 0.55 * kV;
      pc.varetas.position.y += 0.35 * kV;
      pc.trava.position.x += 0.7 * kM;
      pc.trava.rotation.z = 0.4 * kM;
      fx.et.pTecido.em(mais(COPA, [0, 1.55, 0]), tc - tT - 0.3);
      fx.et.pVaretas.em(mais(BASE, [-1.2, 2.55, 0.3]), tc - tV - 0.3);
      fx.et.pTrava.em(mais(BASE, [0.95, 1.35, 0.2]), tc - tMo - 0.3);
      K.filmar([guarda, mais(BASE, [0, 3.2, 0])], 'girando', B.p, { plano: 'medio', altura: 12, angulo: 40 });
    },

    segue(B, tc) {
      // O cartão de seguir entra no topo e ele aponta pra ele (o topo da tela fica livre)
      fx.chuva.em(CHUVA, tc, 0.8, abrigo);
      menino.colocar(LADO, 0.2);
      const tS = quando('segue', B, 0.1);
      fx.seguir.em(tc - tS);
      K.som('brilho', tS, 0.5);
      K.som('clique', tS + K.SEGUIR_CLIQUE, 0.9);
      menino.humor('feliz');
      menino.apontar(1);
      K.filmar([guarda, menino], 'parado', B.p, { plano: 'aberto', espacoCima: 0.45 });
    },

    cartao(B, tc) {
      // A cauda: o cartão fica (já em "Seguindo") e ele acena
      fx.chuva.em(CHUVA, tc, 0.8, abrigo);
      menino.colocar(LADO, 0.2);
      fx.seguir.em(9);
      menino.reagir('chamando', tc);
      K.som('final', B.inicio, 0.7);
      K.filmar([guarda, menino], 'parado', 1, { plano: 'aberto', espacoCima: 0.45 });
    },

    capa(B, tc) {
      // A capa (1º quadro do vídeo): o guarda-chuva no temporal e ele seco embaixo, apontando pra cima, com o topo
      // livre pra pergunta (o motor põe a pergunta numa caixa branca)
      fx.chuva.em(CHUVA, 0.4, 1, abrigo);
      menino.colocar(EMBAIXO, 0.35);
      menino.reagir('surpreso', 1);
      menino.apontar(0.9);
      K.filmar([guarda, menino], 'parado', 0, { plano: 'medio', lado: -20, espacoCima: 0.35 });
    }
  };

  // O pano na cabeça dele (só nas frases do começo), pingando. Devolve onde o pano está
  function noPano(tc, ritmo) {
    menino.g.updateMatrixWorld(true);
    const c = cabecaDo(menino);
    fx.pano.visible = true;
    fx.pano.position.set(c[0], c[1] + 0.2, c[2]);
    fx.pano.rotation.set(0.08, menino.g.rotation.y, 0);
    fx.pingos.em([c[0] + 0.3, c[1] + 0.15, c[2] + 0.1], tc, ritmo, c[1] + 0.15);
    fx.pingos2.em([c[0] - 0.28, c[1] + 0.15, c[2] - 0.05], tc + 0.2, ritmo, c[1] + 0.15);
    return [c[0], c[1] + 0.2, c[2]];
  }

  // ---------- Quadro ----------

  function cena(tc, t, plano) {
    const B = plano ? { plano, p: 0.5, t: 1, dur: 2, inicio: 0, ate: 2, q: 0.5, tq: 1, bloco: { reb: 0 } } : K.blocoEm(bl, tc);
    K.ceu('dia', 'tarde', 0.6);                  // TROQUE: o céu ('dia', 'tarde', 'noite') e a mistura entre dois
    // O que só aparece em algumas frases começa escondido; o plano mostra o que precisa
    menino.g.visible = false;
    fx.pano.visible = false;
    fx.poca.visible = false;
    abrigo = pc.tecido.visible ? { pos: mais(BASE, [0, 1.76, 0]), raio: 1.05 } : null;
    if (!P[B.plano]) throw new Error(`Falta o plano "${B.plano}" no cena.js (um por frase do roteiro.json)`);
    P[B.plano](B, tc);
  }

  window.CENA = { montar, cena, capa: () => cena(0, 0, 'capa') };
})();
