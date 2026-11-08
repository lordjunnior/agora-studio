// Modelo de cena com CENÁRIO PRONTO (Máquina Preguiça 3D): "Por que o concreto tem ferro dentro?", no canteiro de obras
// (K.cenario('construcao')). O cenário já traz o prédio em obra, o guindaste, a betoneira, os operários e a poeira; aqui
// só entra o objeto do vídeo (a coluna), o personagem e um plano por frase, todos com os ajudantes do kit.
//
// Como usar num vídeo novo:
//   1. Escreva antes o roteiro.md com a ficha de cena completa (o roteiro.md desta pasta é o exemplo: o inventário dos
//      objetos e um bloco por frase com as 10 linhas: NA TELA, MOSTRA, CENÁRIO, ENTRA AGORA, OBJETOS SE MEXENDO,
//      PERSONAGEM, INTERAÇÃO, CÂMERA, EFEITOS VISUAIS e SONS)
//   2. Copie esta pasta (roteiro.json e cena.js) pra videos/<tema>/
//   3. Troque tudo o que está marcado com TROQUE: o cenário (lista em referencias/cenarios.md), as peças do objeto, as
//      cores do personagem e um plano em P pra cada frase do roteiro.json. Em cada plano, cole primeiro as linhas da
//      ficha daquela frase como comentário (como aqui) e escreva o código embaixo de cada uma: assim nada fica esquecido
//   4. Outro cenário: troque 'construcao' pelo nome de outro (natureza, cidade, casa, cozinha...). Os lugares C.centro,
//      C.personagem, C.entrada, C.esquerda, C.direita, C.fundo e C.vista existem em todos. As frases que usam
//      C.objetos.betoneira ou C.lugares.laje só existem na construção: troque pelo destaque do cenário novo
//      (referencias/cenarios.md diz o que cada um tem)
//   5. node motor/render.js videos/<tema> --voz-teste --revisar   até dar APROVADO, e abrir a folha (testes/folha.jpg)
//
// Tudo é função do tempo da cena (tc). O cenário cuida sozinho do céu, da luz e do que se mexe (guindaste, tambor da
// betoneira, operários); a câmera dos ajudantes não entra no prédio nem nas máquinas.
(function () {
  let tl, bl, C, menino, coluna, gaiola, pc;
  const fx = {};
  const mais = (p, d) => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  // Instante em que a narração fala a palavra nesta frase (se não achar, a fração frac da frase)
  const quando = (palavra, B, frac) => { const t = K.quando(palavra, B.inicio); return t != null && t < B.ate ? t : B.inicio + frac * B.dur; };
  let BASE, LADO, TOPO;

  // ---------- Montagem (uma vez só) ----------

  function montar(timeline) {
    tl = timeline;
    bl = K.blocos(tl);
    // TROQUE: o cenário. Ele monta o lugar inteiro e devolve os lugares (C.centro, C.personagem...) e os objetos
    C = K.cenario('construcao');
    BASE = C.centro;                           // a coluna fica no centro do cenário
    LADO = C.personagem;                       // o personagem fica do lado dela
    TOPO = mais(BASE, [0, 3.0, 0]);            // o alto da coluna

    // TROQUE: as peças do objeto (forma, tam, cor, pos, metal, transparente...), dentro do grupo coluna. Cada objeto do
    // inventário do roteiro.md vira uma peça aqui, com o mesmo nome (é o nome que vai no "mostra" do roteiro.json)
    coluna = new THREE.Group();
    coluna.position.set(...BASE);
    K.scene.add(coluna);
    K.lugar(coluna);
    K.nomear('coluna', coluna);                // grupo feito à mão: ganha o nome aqui (as peças do K.pecas já têm)
    pc = K.pecas({
      sapata: { forma: 'caixa', tam: [1.3, 0.3, 1.3], cor: '#a9a59c', pos: [0, 0.15, 0] },
      concreto: { forma: 'caixa', tam: [0.62, 2.7, 0.62], cor: '#c3bfb6', pos: [0, 1.65, 0], transparente: 0.01 }
    }, coluna);
    // A gaiola de vergalhões: 4 ferros em pé e os estribos (anéis) em volta, num grupo só
    gaiola = new THREE.Group();
    coluna.add(gaiola);
    K.lugar(gaiola);
    K.nomear('gaiola', gaiola);
    const ferros = {};
    [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z], i) => { ferros['ferro' + i] = { forma: 'cilindro', tam: [0.03, 3.3], cor: '#8a4b2a', metal: true, pos: [x, 1.95, z] }; });
    [0.6, 1.05, 1.5, 1.95, 2.4, 2.85].forEach((y, i) => { ferros['estribo' + i] = { forma: 'anel', tam: [0.29, 0.02], cor: '#8a4b2a', metal: true, pos: [0, y, 0] }; });
    pc.ferros = K.pecas(ferros, gaiola);

    // TROQUE: em que plano cada peça entra e como ('cai' 'desliza' 'encaixa' 'cresce' 'gira' 'sobe'), na palavra certa
    // (a coluna "Aparece" do inventário do roteiro.md)
    K.entraNo('coluna', pc.concreto, 'sobe', { palavra: 'concreto' });
    K.entraNo('gaiola', gaiola, 'cai', { palavra: 'gaiola', altura: 5 });

    // TROQUE: o personagem com as cores de canal/identidade.md (bloco "No roteiro.json")
    menino = K.boneco({ roupa: 'camiseta', cores: { camiseta: 0xff7a59, bermuda: 0x2f6f5e, tenis: 0xf4f1ea, cabelo: 0x7a4a22 } });

    // Efeitos, textos e sons (cada um criado uma vez; o plano só chama .em() quando ele aparece)
    fx.vento = K.vento(13, 26);
    fx.chuva = K.chuva(12, 700);
    fx.seta = K.seta(K.cores.vermelho, 1.2);
    fx.lascas = K.lascas(4, 0xb9b6ae, 16);
    fx.certo = K.marca('certo');
    fx.errado = K.marca('errado');
    fx.seguir = K.cartaoSeguir();
    // TROQUE: o nome das peças (rótulo amarelo do "Esse é o X") e as etiquetas (vermelho = problema, verde = funciona,
    // azul = informação, laranja = curiosidade)
    fx.rot = { armadura: K.rotulo('Armadura'), concreto: K.rotulo('Concreto<br>armado') };
    const e = (txt, cor) => K.etiqueta(txt, cor);
    fx.et = {
      seca: e('Secando', 'azul'), racha: e('Racha!', 'vermelho'), puxa: e('Não aguenta puxão', 'vermelho'), gaiola: e('Aço por dentro', 'verde'),
      ferrugem: e('Enferruja', 'vermelho'), protegido: e('Protegido', 'verde'), espera: e('Ferro esperando', 'laranja'),
      aco: e('Aço: aguenta o puxão', 'azul'), conc: e('Concreto: aguenta o aperto', 'azul')
    };
  }

  // Deixa ver o ferro por dentro do concreto (0 = cinza fechado, 1 = quase transparente)
  function verDentro(k) {
    pc.concreto.traverse((o) => { if (o.isMesh) { o.material.opacity = 1 - 0.65 * k; o.material.depthWrite = k < 0.05; } });
  }

  // ---------- Planos: um por frase do roteiro.json ----------
  // Cada plano recebe B (o tempo do bloco: B.p de 0 a 1, B.t em segundos, B.inicio, B.dur, B.q/B.tq depois do ⏪) e tc.
  // Cada um começa com as linhas da ficha de cena daquela frase (roteiro.md), e embaixo de cada linha, o código dela.
  // A câmera vem sempre por último, com o personagem e as peças já no lugar.

  const P = {
    gancho(B, tc) {
      // NA TELA: a coluna pronta no centro, com o ferro aparecendo por dentro; o personagem à direita · MOSTRA: coluna, personagem
      // CENÁRIO: o canteiro; atrás, o caminhão betoneira e os tijolos; o prédio em obra mais ao fundo (o K.cenario cuida)
      // OBJETOS SE MEXENDO: o tambor da betoneira e os operários no fundo (o cenário cuida); a coluna parada, com o ferro à mostra
      verDentro(0.7);
      // PERSONAGEM: em C.personagem, meio de frente pra câmera · começo: surpreso · na palavra "ferro": aponta pra coluna
      // INTERAÇÃO: na palavra "ferro", ele aponta pro ferro dentro da coluna
      menino.colocar(LADO, mais(LADO, [-0.6, 0, 3]));
      menino.reagir('surpreso', B.t);
      if (tc > quando('ferro', B, 0.5)) menino.apontar(0.9);
      // EFEITOS VISUAIS: a pergunta da capa no topo (o motor põe sozinho) · o concreto meio transparente
      // SONS: só a voz
      // CÂMERA: alvo [coluna, personagem], a coluna no centro · mergulho · médio · um pouco pela esquerda (-25) · topo livre pra pergunta
      K.filmar([coluna, menino], 'mergulho', B.p, { plano: 'medio', lado: -25, espacoCima: 0.35 });
    },

    coluna(B, tc) {
      // NA TELA: a sapata no centro, o concreto subindo dela, o personagem chegando pela direita · MOSTRA: concreto, personagem
      // CENÁRIO: atrás, o caminhão betoneira girando o tambor, o carrinho de mão com areia e os tijolos (o K.cenario cuida)
      // ENTRA AGORA: o concreto, subindo do chão na palavra "concreto" (o K.entraNo do montar cuida)
      // OBJETOS SE MEXENDO: o concreto sobe até 2,7 m em menos de 1 s; o tambor da betoneira girando no fundo
      // PERSONAGEM: anda de C.entrada até C.personagem na 1ª metade · depois: pensando (mão no queixo), esperando secar
      // INTERAÇÃO: ele chega pra conferir o concreto e fica do lado dele, esperando secar
      menino.irPara(C.entrada, LADO, K.faixa(B.p, 0, 0.45), tc, { olhar: BASE });
      if (B.p > 0.45) menino.reagir('pensando', tc - (B.inicio + 0.45 * B.dur));
      // EFEITOS VISUAIS: etiqueta azul "Secando" na palavra "secar"
      const tS = quando('secar', B, 0.75);
      fx.et.seca.em(mais(TOPO, [0, 0.5, 0]), tc - tS);
      // SONS: whoosh do concreto subindo (o K.entraNo põe) · o da etiqueta (o kit põe)
      // CÂMERA: alvo [coluna, personagem], a coluna no centro · passando · médio · esquerda · altura do olho
      K.filmar([coluna, menino], 'passando', B.p, { plano: 'medio', lado: 'esquerda', altura: 'olho' });
    },

    racha(B, tc) {
      // NA TELA: a coluna de concreto (sem ferro) no centro; o personagem à direita; o vento, a seta vermelha, as lascas · MOSTRA: concreto
      // CENÁRIO: atrás, a escavadeira amarela, o monte de areia e o andaime com a tela verde (o K.cenario cuida)
      // PERSONAGEM: em C.personagem, olhando a coluna · começo: dúvida · na palavra "racha": susto
      // INTERAÇÃO: a coluna assusta o personagem: ele acompanha ela balançar e leva o susto quando ela racha
      menino.colocar(LADO, BASE);
      const tV = quando('vento', B, 0.55), tR = quando('racha', B, 0.8);
      if (tc > tR) menino.reagir('susto', tc - tR); else menino.reagir('duvida', B.t);
      // ENTRA AGORA e OBJETOS SE MEXENDO: o vento e a seta, pela direita (palavra "vento"); a coluna quebra no meio e solta lascas (palavra "racha")
      fx.vento.em(BASE, tc, K.clamp((tc - tV) / 0.5), -1);
      fx.seta.em(mais(BASE, [2.2, 2.4, 0]), [-1, 0, 0], 1.4, tc - tV);
      K.falhar(pc.concreto, 'quebra', tc - tR, { forca: 1 });
      fx.lascas.em(mais(BASE, [0, 2.2, 0.2]), tc - tR, 0);
      // EFEITOS VISUAIS: etiqueta vermelha "Não aguenta puxão" (palavra "vento") · ✗ em cima dela (palavra "racha") · P&B no fim (o jogo)
      fx.et.puxa.em(mais(TOPO, [0, 0.4, 0]), tc - tV);
      const [ex, ey] = K.tela(mais(TOPO, [0, 0.4, 0]));
      fx.errado.em({ tela: [ex, ey - 150] }, tc - tR);
      // SONS: whoosh do vento (palavra "vento") · racha da coluna (o K.falhar põe) · a etiqueta e o congela (o kit e o jogo põem)
      K.som('whoosh', tV, 0.5);
      // CÂMERA: alvo a coluna, no centro e inteira · chegando · perto · direita · altura do olho
      K.filmar(coluna, 'chegando', B.p, { plano: 'perto', lado: 'direita', altura: 'olho' });
    },

    gaiola(B, tc) {
      // NA TELA: a sapata vazia no centro (o concreto sumiu, depois do ⏪), a gaiola caindo nela, o personagem à direita · MOSTRA: gaiola, personagem
      // CENÁRIO: atrás, a escavadeira amarela, o monte de areia e os operários com o carrinho de mão (o K.cenario cuida)
      pc.concreto.visible = false;
      // ENTRA AGORA e OBJETOS SE MEXENDO: a gaiola cai do alto, quica na sapata e levanta poeira, na palavra "gaiola" (o K.entraNo do montar cuida)
      // PERSONAGEM: em C.personagem · depois do ⏪: surpreso · na palavra "gaiola": ideia (aponta pra cima, pulinho)
      // INTERAÇÃO: a gaiola cai bem do lado dele, e ele tem a ideia na hora
      menino.colocar(LADO, BASE);
      if (B.q < 0.35) menino.reagir('surpreso', B.tq); else menino.reagir('ideia', B.tq - 0.35 * B.dur);
      // EFEITOS VISUAIS: o ⏪ (o jogo) · etiqueta verde "Aço por dentro" logo depois da palavra "gaiola" · a poeira
      const tG = quando('gaiola', B, 0.4);
      fx.et.gaiola.em(mais(TOPO, [0, 0.6, 0]), tc - tG - 0.6);
      // SONS: rebobina (o jogo põe) · whoosh e baque da gaiola caindo (o K.entraNo põe) · a etiqueta (o kit põe)
      // CÂMERA: alvo [gaiola, personagem], a gaiola no centro · subindo · médio · direita (B.q: o tempo depois do ⏪)
      K.filmar([gaiola, menino], 'subindo', B.q, { plano: 'medio', lado: 'direita' });
    },

    armadura_rotulo(B, tc) {
      // NA TELA: a gaiola amarela brilhando, de cima a baixo na tela · MOSTRA: gaiola
      // CENÁRIO: o andaime com a tela verde e os operários lá atrás (o K.cenario cuida)
      // OBJETOS SE MEXENDO: a gaiola brilha amarelo enquanto a câmera gira em volta dela
      pc.concreto.visible = false;
      K.brilhar(gaiola, B.t);
      // PERSONAGEM: em C.personagem, mostrando a gaiola (no close ele pode sair do quadro)
      // INTERAÇÃO: nenhuma na tela (ele está fora do quadro)
      menino.colocar(LADO, BASE);
      menino.reagir('mostrando', B.t);
      // EFEITOS VISUAIS: o brilho amarelo · rótulo amarelo "Armadura" no topo
      fx.rot.armadura.em(mais(TOPO, [0, 0.5, 0]), B.t - 0.05);
      // SONS: o do rótulo (o kit põe)
      // CÂMERA: alvo a gaiola, no centro, de cima a baixo · girando · perto · de cima (25) · topo livre pro rótulo
      K.filmar(gaiola, 'girando', B.p, { plano: 'perto', altura: 25, angulo: 40, espacoCima: 0.3 });
    },

    ferrugem(B, tc) {
      // NA TELA: a gaiola sozinha na sapata, no centro; a chuva; o personagem à direita, molhado · MOSTRA: gaiola, personagem
      // CENÁRIO: o canteiro debaixo de chuva; atrás, o caminhão betoneira, os tijolos e os sacos de cimento (o K.cenario cuida)
      pc.concreto.visible = false;
      // ENTRA AGORA e OBJETOS SE MEXENDO: a chuva a frase toda; o ferro escurece, enferrujando em 1,2 s (palavra "enferruja")
      fx.chuva.em(mais(BASE, [0, 0, -4]), tc, 1);
      const tE = quando('enferruja', B, 0.6);
      K.falhar(gaiola, 'apaga', tc - tE, { dur: 1.2, forca: 0.9 });
      // PERSONAGEM: perto da gaiola · começo: dúvida, olhando a chuva · na palavra "enferruja": triste
      // INTERAÇÃO: a chuva molha o ferro e o personagem; ele vê o ferro escurecer e fica triste
      menino.colocar(mais(LADO, [0.3, 0, 0.4]), BASE);
      if (tc > tE) menino.reagir('triste', tc - tE); else menino.reagir('duvida', B.t);
      // EFEITOS VISUAIS: a chuva · etiqueta vermelha "Enferruja" + ✗ (palavra "enferruja") · P&B no fim (o jogo)
      fx.et.ferrugem.em(mais(TOPO, [0, 0.5, 0]), tc - tE);
      const [ex, ey] = K.tela(mais(TOPO, [0, 0.5, 0]));
      fx.errado.em({ tela: [ex, ey - 150] }, tc - tE - 0.3);
      // SONS: a água da chuva, baixinho, a frase toda · desliga do ferro (o K.falhar põe) · a etiqueta e o congela (o kit e o jogo)
      K.som('agua', B.inicio, 0.3, B.dur);
      // CÂMERA: alvo [gaiola, personagem], a gaiola no centro · descendo · médio · esquerda · do alto
      K.filmar([gaiola, menino], 'descendo', B.p, { plano: 'medio', lado: 'esquerda', altura: 'alto' });
    },

    cobre(B, tc) {
      // NA TELA: a coluna no centro, o concreto crescendo em volta da gaiola (dá pra ver o ferro); o personagem à direita · MOSTRA: concreto, personagem
      // CENÁRIO: o canteiro de volta ao normal, sem chuva; atrás, o andaime com a tela verde (o K.cenario cuida)
      // ENTRA AGORA e OBJETOS SE MEXENDO: a cor volta (o jogo corrige); o concreto cresce de dentro pra fora em 0,8 s, na palavra "concreto"
      const tC = quando('concreto', B, 0.3);
      K.entrar(pc.concreto, 'cresce', tc - tC, { dur: 0.8 });
      verDentro(0.6);
      // PERSONAGEM: em C.personagem · começo: segurando · quando o concreto fecha: vitória
      // INTERAÇÃO: ele segura a coluna enquanto o concreto cresce e comemora quando ela fecha
      menino.colocar(LADO, BASE);
      if (tc > tC + 0.8) menino.reagir('vitoria', tc - tC - 0.8); else menino.reagir('segurando', B.t);
      // EFEITOS VISUAIS: etiqueta verde "Protegido" + ✓ quando o concreto fecha
      fx.et.protegido.em(mais(TOPO, [0, 0.5, 0]), tc - tC - 0.9);
      fx.certo.em(mais(TOPO, [0.9, 0.95, 0]), tc - tC - 1.1);
      // SONS: brilho do concreto crescendo (o K.entrar põe) · a etiqueta (o kit põe)
      // CÂMERA: alvo [coluna, personagem], a coluna no centro · subindo · médio · de frente · altura do olho
      K.filmar([coluna, menino], 'subindo', B.p, { plano: 'medio', lado: 'frente', altura: 'olho' });
    },

    concreto_rotulo(B, tc) {
      // NA TELA: a coluna inteira no centro, amarela e brilhando · MOSTRA: coluna
      // CENÁRIO: o andaime e o prédio em obra atrás (o K.cenario cuida)
      // OBJETOS SE MEXENDO: a coluna brilha enquanto a câmera gira em volta dela, pro outro lado
      verDentro(0.3);
      K.brilhar(pc.concreto, B.t);
      // PERSONAGEM: em C.personagem, mostrando a coluna
      // INTERAÇÃO: ele mostra a coluna pra quem assiste
      menino.colocar(LADO, BASE);
      menino.reagir('mostrando', B.t);
      // EFEITOS VISUAIS: o brilho amarelo · rótulo amarelo "Concreto armado" no topo
      fx.rot.concreto.em(mais(TOPO, [0, 0.6, 0]), B.t - 0.05);
      // SONS: o do rótulo (o kit põe)
      // CÂMERA: alvo a coluna, no centro · girando pro outro lado · médio · do alto
      K.filmar(coluna, 'girando', B.p, { plano: 'medio', altura: 'alto', angulo: 30, sentido: -1 });
    },

    obra(B, tc) {
      // NA TELA: o prédio em obra do cenário, com os ferros saindo do topo das colunas (C.lugares.laje), e o personagem
      // MOSTRA: predio, personagem. TROQUE se o cenário for outro: filme o destaque dele (C.fundo)
      const laje = C.lugares.laje || C.fundo;
      // CENÁRIO: a vida real é o assunto: o prédio em obra, o guindaste com a carga girando, os cones e os operários (o K.cenario cuida)
      // PERSONAGEM: virado pra obra · começo: surpreso · na palavra "ferro": aponta pro alto da obra
      // INTERAÇÃO: na palavra "ferro", ele aponta pros ferros no topo do prédio
      const tF = quando('ferro', B, 0.55);
      menino.colocar(LADO, laje);
      if (tc > tF) { menino.reagir('mostrando', tc - tF); menino.apontar(1); } else menino.reagir('surpreso', B.t);
      // EFEITOS VISUAIS: etiqueta laranja "Ferro esperando" (palavra "ferro"), na frente do alto da obra
      const alvo = mais(laje, [0, 0.5, 4.5]);
      fx.et.espera.em(mais(alvo, [0, 1.2, 0]), tc - tF);
      // SONS: o da etiqueta (o kit põe)
      // CÂMERA: alvo [personagem, ponto na frente do alto da obra], o prédio no centro · revelando · médio · um pouco pela direita (20) · de baixo
      K.filmar([menino, alvo], 'revelando', B.p, { plano: 'medio', lado: 20, altura: 'baixo' });
    },

    por_fora(B, tc) {
      // NA TELA: a coluna cinza no centro, o personagem à direita, o canteiro inteiro em volta · MOSTRA: coluna, personagem
      // CENÁRIO: o canteiro todo: a betoneira, o carrinho de mão com areia, os tijolos e o prédio ao fundo (o K.cenario cuida)
      // PERSONAGEM: dá dois passos pra trás na 1ª metade · depois: mostrando a coluna
      // INTERAÇÃO: ele se afasta pra ver a coluna inteira e mostra ela
      menino.irPara(mais(LADO, [-0.3, 0, -0.3]), LADO, K.faixa(B.p, 0, 0.4), tc, { olhar: BASE });
      if (B.p > 0.4) menino.reagir('mostrando', tc - (B.inicio + 0.4 * B.dur));
      // EFEITOS VISUAIS: nenhum texto (o vídeo respira antes do fim)
      // SONS: whoosh da câmera se afastando, no começo
      K.som('whoosh', B.inicio + 0.05, 0.4);
      // CÂMERA: alvo [coluna, personagem], a coluna no centro · afastando · aberto · esquerda · um pouco do alto (15)
      K.filmar([coluna, menino], 'afastando', B.p, { plano: 'aberto', lado: 'esquerda', altura: 15 });
    },

    por_dentro(B, tc) {
      // NA TELA: a coluna no centro, o concreto subindo e saindo de lado, a gaiola ficando no lugar · MOSTRA: concreto, gaiola
      // CENÁRIO: o andaime e o prédio atrás, a areia no chão (o K.cenario cuida)
      const tA = quando('aço', B, 0.25), tC = quando('concreto', B, 0.6);
      // OBJETOS SE MEXENDO: o concreto sobe 1,2 m e vai 1,1 m pra esquerda em 0,8 s (palavra "aço"); a gaiola fica
      const k = K.saiVolta(K.faixa(tc, tA, tA + 0.8));
      pc.concreto.position.y += 1.2 * k;
      pc.concreto.position.x -= 1.1 * k;
      verDentro(0.15);
      // PERSONAGEM: perto da coluna · na palavra "aço": surpreso · na palavra "concreto": ideia
      // INTERAÇÃO: as peças se abrem na frente dele, e cada uma ganha o seu trabalho escrito do lado
      menino.colocar(mais(LADO, [0.4, 0, 0.3]), BASE);
      if (tc > tC) menino.reagir('ideia', tc - tC); else menino.reagir('surpreso', B.t);
      // EFEITOS VISUAIS: etiqueta azul "Aço: aguenta o puxão" (palavra "aço") · "Concreto: aguenta o aperto" (palavra "concreto")
      fx.et.aco.em(mais(BASE, [0.9, 2.4, 0.3]), tc - tA - 0.3);
      fx.et.conc.em(mais(BASE, [-1.1, 3.6, 0]), tc - tC);
      // SONS: whoosh do concreto saindo (palavra "aço") · o das etiquetas (o kit põe)
      K.som('whoosh', tA, 0.5);
      // CÂMERA: alvo [coluna, ponto do concreto lá em cima], as duas peças no quadro · girando · médio · um pouco do alto (12)
      K.filmar([coluna, mais(BASE, [-1.1, 4.4, 0])], 'girando', B.p, { plano: 'medio', altura: 12, angulo: 35 });
    },

    segue(B, tc) {
      // NA TELA: o cartão de seguir no topo, a coluna no meio, o personagem embaixo, à direita · MOSTRA: personagem
      // CENÁRIO: o prédio em obra e o andaime atrás (o K.cenario cuida)
      // PERSONAGEM: feliz, apontando pro cartão
      // INTERAÇÃO: ele aponta pro botão de seguir, convidando quem assiste
      menino.colocar(LADO, 0.2);
      menino.humor('feliz');
      menino.apontar(1);
      // ENTRA AGORA e EFEITOS VISUAIS: o cartão de seguir (palavra "segue"); o botão vira "Seguindo"
      const tS = quando('segue', B, 0.1);
      fx.seguir.em(tc - tS);
      // SONS: brilho do cartão entrando · clique do botão
      K.som('brilho', tS, 0.5);
      K.som('clique', tS + K.SEGUIR_CLIQUE, 0.9);
      // CÂMERA: alvo [coluna, personagem] · parado · aberto (com o topo livre pro cartão, o médio corta o personagem)
      K.filmar([coluna, menino], 'parado', B.p, { plano: 'aberto', espacoCima: 0.45 });
    },

    cartao(B, tc) {
      // A cauda: o cartão fica (já em "Seguindo") e ele acena
      menino.colocar(LADO, 0.2);
      fx.seguir.em(9);
      menino.reagir('chamando', tc);
      K.som('final', B.inicio, 0.7);
      K.filmar([coluna, menino], 'parado', 1, { plano: 'aberto', espacoCima: 0.45 });
    },

    capa(B, tc) {
      // A capa (1º quadro): a coluna com o ferro aparecendo por dentro e ele surpreso, o topo livre pra pergunta
      verDentro(0.7);
      menino.colocar(LADO, mais(LADO, [-0.6, 0, 3]));
      menino.reagir('surpreso', 1);
      menino.apontar(0.9);
      K.filmar([coluna, menino], 'parado', 0, { plano: 'medio', lado: -25, espacoCima: 0.35 });
    }
  };

  // ---------- Quadro ----------

  function cena(tc, t, plano) {
    const B = plano ? { plano, p: 0.5, t: 1, dur: 2, inicio: 0, ate: 2, q: 0.5, tq: 1, bloco: { reb: 0 } } : K.blocoEm(bl, tc);
    // O céu vem do cenário (troque com K.ceu('tarde') se quiser outra hora). O que só aparece em algumas frases começa
    // escondido; o plano mostra o que precisa
    menino.g.visible = false;
    verDentro(0);
    if (!P[B.plano]) throw new Error(`Falta o plano "${B.plano}" no cena.js (um por frase do roteiro.json)`);
    P[B.plano](B, tc);
  }

  window.CENA = { montar, cena, capa: () => cena(0, 0, 'capa') };
})();
