// Cena-modelo "montagem" (Preguiça 3D): o objeto do vídeo é montado peça por peça, sem escrever código de cena, e cada
// frase sai com uma cena diferente (câmera, lugar e ação do personagem, entrada da peça, falha). Tudo vem do roteiro.json
// (exemplo completo no Prompt B de comandos/modo-chat.md; campos em referencias/montagem.md):
//
//   lugar: 'quintal' | 'praia' | 'cozinha' | 'espaco' | 'lua' | 'escuro'      hora: 'dia' | 'tarde' | 'noite'      casa: true (no quintal)
//   cenario: um cenário pronto no lugar do "lugar" (o lugar inteiro, com céu, luz e o que se mexe): 'construcao',
//     'natureza', 'cidade', 'casa', 'cozinha', 'sala', 'praia', 'fundo_do_mar', 'espaco', 'lua', 'fazenda', 'floresta',
//     'deserto', 'consultorio', 'oficina', 'escritorio', 'estudio' (fotos em referencias/cenarios.md)
//   personagem: { tipo: 'menino' | 'menina', roupa: 'camiseta' | 'moletom', cores: { camiseta, bermuda, ... }, capacete: 'obra' | 'espaco' }
//   cor: '#rrggbb' (cor do canal: a palavra da capa e o botão de seguir)      arroba: '@seucanal' (no cartão de seguir)
//   objeto: { pecas: [...] }
//   peça: { nome, forma, tam, cor, pos, giro (graus), brilho, transparente (0 a 1), metal, pontos (cano), texto (placa), kit }
//     formas: caixa [larg, alt, prof] · cilindro [raio, alt] ou [raioCima, raioBaixo, alt] · tubo [raio, alt] (oco)
//             funil [raioCima, raioBaixo, alt] · esfera [raio] · cone [raio, alt] · anel [raio, grossura]
//             cano (pontos: [[x,y,z],...], tam: [raio]) · placa (texto, tam: [larg, alt]) · kit (kit: 'carro', 'arvore', 'balde', ...)
//   frases[].plano:
//     gancho      a capa ganhando vida (objeto inteiro, câmera chegando)
//     problema    o que dá errado sem a próxima peça (etiqueta vermelha, personagem sofrendo)
//     monta       a peça (peca: nº ou lista) cai do céu e encaixa
//     nome        "Esse é o X": rótulo amarelo na peça (peca)
//     mostra      o objeto funcionando, câmera girando em volta
//     por_fora    o objeto inteiro    por_dentro    as peças se afastam (vista explodida)
//     segue       cartão de seguir    cartao        (cauda) o personagem acena
//   opcionais por frase: peca, etiqueta, cor ('verde', 'vermelho', 'azul', 'laranja', 'amarelo'), marca ('certo' | 'errado'),
//     humor ('feliz', 'triste', 'surpreso', 'bravo', 'assustado'),
//     acao ('cair', 'suar', 'pensar', 'pular', 'comemorar', 'apontar', 'acenar', 'andar', 'correr' e as reações do kit:
//       'susto', 'surpreso', 'ideia', 'vitoria', 'cansado', 'duvida', 'bravo', 'triste', 'mostrando', 'chamando',
//       'empurrando', 'segurando'),
//     contador: { texto, sub }, efeito: { tipo: 'luz' | 'fogo' | 'fumaca' | 'vapor' | 'agua' | 'brilho' | 'chuva' | 'vento' | 'festa',
//     peca, forca (0 a 1), mantem: true (continua nas próximas frases) }, apaga: 'luz' (ou outro tipo, ou 'tudo')
//   cena de cada frase (sem o campo, a montagem escolhe sozinha e não repete a câmera da frase anterior):
//     camera   'chegando' 'afastando' 'girando' 'subindo' 'descendo' 'passando' 'mergulho' 'revelando' (movimento) ou
//              'aberto' 'perto' 'detalhe' 'de_cima' 'de_baixo' 'lateral' 'personagem' (plano), ou
//              { movimento, plano, lado, altura } como no K.filmar
//     onde     lugar do personagem: 'direita' 'esquerda' 'frente'
//     entra    como a peça nova entra (monta): 'cai' 'desliza' 'encaixa' 'cresce' 'gira' 'sobe'
//     falha    o problema na peça (problema): 'treme' 'tomba' 'murcha' 'apaga' 'esquenta' 'congela' 'pisca' 'quebra'
//              ou 'nenhuma'
//     jogo     sem o campo, "problema" seguido de "monta" vira falha (congela em preto e branco) → corrige; "nenhum" tira
(function () {
  const TAN_V = Math.tan((25 * Math.PI) / 180), TAN_H = TAN_V * (9 / 16);
  const FINAIS = ['por_dentro', 'segue', 'cartao'];

  let R, tl, bl, objeto, pecas = [], estados = [], efeitosFrase = [], efeitosFinais = [];
  let menino, chaoLua, M, caixaObj, escolhas = [], cenario = null;
  const fx = {}, rotulos = {}, etiquetas = {};
  const v3 = new THREE.Vector3(), cx = new THREE.Box3();

  const lista = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
  const corDe = (c, padrao) => (c == null ? padrao : typeof c === 'number' ? c : parseInt(String(c).replace('#', ''), 16));
  const rad = (g) => (g || [0, 0, 0]).map((x) => (x * Math.PI) / 180);
  const temChao = () => !['espaco', 'escuro'].includes(R.lugar);
  // Instante da palavra dentro do bloco (se não estiver nele, usa a fração fr do bloco)
  const quando = (palavra, B, fr = 0.5) => {
    const t = palavra ? K.quando(palavra, B.inicio) : null;
    return t != null && t < B.ate ? t : B.inicio + fr * (B.ate - B.inicio);
  };
  const termo = (f) => { const m = (f.marcado || '').match(/\*([^*]+)\*/); return m ? m[1] : null; };

  // ---------- Peças ----------

  // A peça vem do kit (K.peca): o mesmo formato serve pro cena.js
  const criarPeca = (p) => K.peca(p, objeto);

  // ---------- Montagem ----------

  function montar(timeline) {
    tl = timeline;
    R = tl.roteiro || {};
    R.lugar = R.lugar || 'quintal';
    R.objeto = R.objeto || { pecas: [] };
    // Um bloco por frase (o K.blocos junta frases seguidas com o mesmo plano; aqui cada frase tem a sua peça)
    bl = tl.frases.map((f, i) => ({ plano: f.plano, inicio: f.inicio, fim: f.fim, reb: f.reb || 0, frase: i }));
    bl.forEach((b, i) => { b.ate = i + 1 < bl.length ? bl[i + 1].inicio : tl.total; });
    montarLugar();

    objeto = new THREE.Group();
    K.scene.add(objeto);
    pecas = R.objeto.pecas.map((p, i) => ({ p, i, g: criarPeca(p) }));
    // Centraliza o objeto na origem e apoia no chão
    objeto.updateMatrixWorld(true);
    cx.setFromObject(objeto);
    const c = cx.getCenter(new THREE.Vector3());
    objeto.position.set(-c.x, temChao() ? -Math.min(0, cx.min.y) : -c.y + 1.2, -c.z);
    if (cenario) objeto.position.add(new THREE.Vector3(...cenario.centro)); // o centro do cenário pronto (a calçada é mais alta)
    objeto.updateMatrixWorld(true);
    caixaObj = new THREE.Box3().setFromObject(objeto);
    const nP = pecas.length, oc0 = caixaObj.getCenter(new THREE.Vector3()), os0 = caixaObj.getSize(new THREE.Vector3());
    const passo = Math.max(os0.x, os0.z, os0.y * 0.45) * 0.75 + 0.25;
    // Objeto alto (cabe melhor no 9:16): as peças se empilham pra cima, com espaço entre elas; objeto largo: ficam em fila
    const vertical = os0.y >= os0.x * 0.8;
    const ordem = pecas.map((x, i) => i);
    pecas.forEach((x) => {
      x.casa = x.g.position.clone();
      x.rot = x.g.rotation.clone();
      x.caixa = new THREE.Box3().setFromObject(x.g);
      x.centro = x.caixa.getCenter(new THREE.Vector3());
      x.tam = x.caixa.getSize(new THREE.Vector3());
      if (!vertical && !x.p.fixa) {
        const alvoX = oc0.x + (x.i - (nP - 1) / 2) * passo, alvoY = Math.max(oc0.y + os0.y * 0.15, x.tam.y / 2 + 0.25);
        x.desloca = [alvoX - x.centro.x, alvoY - x.centro.y, 0.5 + 0.12 * (x.i % 2)];
      }
      x.giro = [0.25, 0.6, 0.15].map((v, k) => v * (((x.i + k) % 3) - 1 || 0.5));
      x.lado = x.i % 2 ? 1 : -1;
    });
    pecas.forEach((x) => { if (x.p.fixa) x.desloca = [0, 0, 0]; });
    if (vertical) {
      // Pilha de baixo pra cima, na ordem da altura original; cada peça um pouco pro lado, alternando.
      // As peças fixas (fogão, mesa, base) ficam no lugar e a pilha começa em cima delas
      const soltas = ordem.filter((n) => !pecas[n].p.fixa);
      const topoFixas = Math.max(0, ...pecas.filter((x) => x.p.fixa).map((x) => x.caixa.max.y));
      ordem.length = 0;
      ordem.push(...soltas);
      ordem.sort((a, b) => pecas[a].centro.y - pecas[b].centro.y);
      const vao = Math.max(0.25, os0.y * 0.12);
      let y = topoFixas + 0.3;
      ordem.forEach((n, k) => {
        const x = pecas[n];
        x.lado = k % 2 ? 1 : -1;
        const alvoY = y + x.tam.y / 2;
        y += x.tam.y + vao;
        x.desloca = [oc0.x + x.lado * os0.x * 0.18 - x.centro.x, alvoY - x.centro.y, 0.4];
      });
    }

    // Quais peças existem em cada frase: as montadas antes + as que caem nela. Peça nunca montada está sempre lá
    const montadas = new Set();
    tl.frases.forEach((f) => { if (f.plano === 'monta') lista(f.peca).forEach((n) => montadas.add(n)); });
    const ja = new Set(pecas.map((x) => x.i).filter((i) => !montadas.has(i)));
    estados = tl.frases.map((f) => {
      const antes = new Set(ja);
      const novas = f.plano === 'monta' ? lista(f.peca) : [];
      novas.forEach((n) => ja.add(n));
      return { antes, novas, depois: new Set(ja) };
    });
    // Efeitos: os da frase + os que ficaram ligados (mantem); o mais novo de cada tipo vale
    let mantidos = [];
    efeitosFrase = tl.frases.map((f) => {
      if (f.apaga) mantidos = f.apaga === 'tudo' ? [] : mantidos.filter((e) => e.tipo !== f.apaga);
      const proprios = lista(f.efeito);
      const ativos = dedup([...mantidos, ...proprios]);
      proprios.filter((e) => e.mantem).forEach((e) => { mantidos = dedup([...mantidos, e]); });
      return FINAIS.includes(f.plano) ? [] : ativos;
    });
    efeitosFinais = dedup(mantidos);

    // Personagem à direita do objeto
    const per = R.personagem || {};
    const cores = {};
    Object.entries(per.cores || {}).forEach(([k, v]) => { cores[k] = corDe(v); });
    // Os mesmos nomes de cor valem pra qualquer roupa (o kit usa nomes diferentes pra menina e pro moletom)
    if (cores.cabelo != null && per.tipo === 'menina') cores.cabeloMenina = cores.cabelo;
    if (cores.tenis != null && per.roupa === 'moletom') cores.tenisBranco = cores.tenis;
    menino = K.boneco({ tipo: per.tipo, roupa: per.roupa, cores });
    const os = caixaObj.getSize(new THREE.Vector3());
    M = [caixaObj.max.x + 0.75, 0, caixaObj.max.z + 0.25];

    fx.feixe = feixe();
    fx.halo = K.halo(0xfff2a0, 2);
    fx.fogo = K.fogo(14);
    fx.fumaca = K.fumaca(15, 0x3a3a3a, 18);
    fx.vapor = K.fumaca(16, 0xffffff, 16);
    fx.jato = K.jato(0.06);
    fx.chuva = K.chuva(12);
    fx.vento = K.vento(13);
    fx.festa = K.festa([M[0] - 0.4, 0, M[2] + 0.2]);
    fx.poeira = K.poeira(1);
    fx.certo = K.marca('certo');
    fx.errado = K.marca('errado');
    fx.contador = K.contador();
    fx.seguir = K.cartaoSeguir();
    fx.sonda = R.objeto.ajudante === 'sonda' ? K.sonda() : null;
    fx.aneis = R.objeto.assinatura === 'aneis' ? K.desconstrucao(9) : null;
    if (fx.aneis) pecas.forEach((x) => fx.aneis.peca(x.g, [0, 0, 0]));
    fx.dq = pecas.map((x) => K.destaque(x.g));
    fx.nomes = pecas.map((x) => K.etiqueta(x.p.nome || `peça ${x.i + 1}`, ['azul', 'laranja', 'verde', 'roxo', 'vermelho'][x.i % 5]));
    tl.frases.forEach((f, i) => {
      if (f.etiqueta) etiquetas[i] = K.etiqueta(f.etiqueta, f.cor || (f.plano === 'problema' ? 'vermelho' : f.plano === 'monta' ? 'verde' : 'azul'));
      if (f.plano === 'nome') rotulos[i] = K.rotulo(quebra(f.rotulo || termo(f) || (pecas[lista(f.peca)[0]] || { p: {} }).p.nome || ''));
    });
    // A peça que entra usa o mesmo brilho amarelo do "Esse é o X"
    pecas.forEach((x, i) => { x.g.userData.dq = fx.dq[i]; });
    escolher();
    jogoSozinho();
  }

  // ---------- Variedade: cada frase com a sua câmera, o seu lugar, a sua ação e a sua entrada ----------
  // Sem o campo na frase, a montagem escolhe girando pelas listas (e nunca repete a câmera da frase anterior).
  // Com o campo, vale o que o roteiro pediu.
  const CAMERAS = {
    problema: [
      { movimento: 'chegando', lado: 'esquerda', altura: 'olho', plano: 'medio' },
      { movimento: 'girando', lado: 'direita', altura: 'baixo', plano: 'medio' },
      { movimento: 'descendo', lado: 'frente', altura: 'alto', plano: 'aberto' },
      { movimento: 'passando', lado: 'perfil_direita', altura: 'olho', plano: 'medio' }
    ],
    // Na peça entrando, nada muito do alto: ela pode encaixar embaixo de outra
    monta: [
      { movimento: 'subindo', lado: 'direita', altura: 'olho', plano: 'medio' },
      { movimento: 'chegando', lado: 'esquerda', altura: 'olho', plano: 'medio' },
      { movimento: 'girando', lado: 'frente', altura: 'baixo', plano: 'medio' },
      { movimento: 'afastando', lado: 'direita', altura: 18, plano: 'perto' }
    ],
    // No "Esse é o X" a câmera fica na altura da peça ou abaixo: ela pode estar embaixo de outra (a trava embaixo do pano)
    nome: [
      { movimento: 'girando', lado: 'frente', altura: 0, plano: 'perto' },
      { movimento: 'chegando', lado: 'direita', altura: 'baixo', plano: 'perto' },
      { movimento: 'passando', lado: 'esquerda', altura: 0, plano: 'perto' }
    ],
    mostra: [
      { movimento: 'girando', lado: 'frente', altura: 'alto', plano: 'aberto', angulo: 60 },
      { movimento: 'revelando', lado: 'direita', altura: 'olho', plano: 'aberto' },
      { movimento: 'mergulho', lado: 'esquerda', altura: 'olho', plano: 'medio' }
    ]
  };
  // "camera" do roteiro em palavras de quem não sabe de câmera
  const PLANOS_PRONTOS = {
    aberto: { movimento: 'afastando', plano: 'aberto' }, perto: { movimento: 'chegando', plano: 'perto' },
    detalhe: { movimento: 'chegando', plano: 0.75 }, de_cima: { movimento: 'descendo', altura: 'cima', plano: 'medio' },
    de_baixo: { movimento: 'subindo', altura: 'baixo', plano: 'medio' }, lateral: { movimento: 'passando', lado: 'perfil_direita' },
    personagem: { movimento: 'chegando', plano: 'perto', alvo: 'personagem' }
  };
  const ACOES = {
    problema: ['susto', 'cansado', 'duvida', 'bravo', 'triste'],
    monta: ['ideia', 'vitoria', 'mostrando', 'segurando'],
    nome: ['mostrando', 'apontar', 'ideia'],
    mostra: ['vitoria', 'chamando', 'mostrando']
  };
  const ONDES = ['direita', 'esquerda', 'frente'];
  const ENTRA = ['cai', 'desliza', 'encaixa', 'cresce', 'gira'];
  function cameraDe(c) {
    if (typeof c === 'string') return PLANOS_PRONTOS[c] || { movimento: c };
    return Object.assign({}, c, { movimento: c.movimento || c.mov || 'chegando' });
  }
  const mesmaCamera = (a, b) => a && b && a.movimento === b.movimento && a.lado === b.lado && a.altura === b.altura && a.plano === b.plano;
  function escolher() {
    const conta = {};
    let ant = null, ondeAnt = null, tropecou = false;
    escolhas = tl.frases.map((f, i) => {
      const tipo = f.plano, n = (conta[tipo] = (conta[tipo] || 0) + 1) - 1;
      const e = { onde: f.onde || ONDES[i % ONDES.length], falha: f.falha || 'treme' };
      if (!f.onde && e.onde === ondeAnt && tipo !== 'nome') e.onde = ONDES[(i + 1) % ONDES.length];
      ondeAnt = e.onde;
      if (CAMERAS[tipo]) {
        const op = CAMERAS[tipo];
        let c = f.camera ? cameraDe(f.camera) : op[n % op.length];
        if (!f.camera && mesmaCamera(c, ant)) c = op[(n + 1) % op.length];
        e.cam = c;
      }
      ant = e.cam || null;
      e.acao = f.acao || (ACOES[tipo] ? ACOES[tipo][n % ACOES[tipo].length] : null);
      // "Se você...": a primeira frase de problema ainda sem peça. Ele chega andando e tropeça (uma vez só)
      e.inicio = tipo === 'problema' && estados[i].antes.size === 0 && !tropecou;
      if (e.inicio) tropecou = true;
      if (e.inicio && !f.acao) e.acao = 'cair';
      e.entra = (k) => f.entra || ENTRA[k % ENTRA.length];
      return e;
    });
  }
  // Ritmo de videogame sozinho: o problema congela em preto e branco no fim (falha) e a solução corta direto pra
  // montagem (corrige). Frase com "jogo" no roteiro fica como está; "jogo": "nenhum" tira
  function jogoSozinho() {
    let mudou = false;
    tl.frases.forEach((f, i) => {
      const prox = tl.frases[i + 1];
      if (f.jogo === 'nenhum') { f.jogo = undefined; mudou = true; return; }
      if (f.jogo == null && f.plano === 'problema' && prox && prox.plano === 'monta' && prox.jogo == null) {
        f.jogo = 'falha';
        prox.jogo = 'corrige';
        mudou = true;
      }
    });
    if (mudou) K.prepararJogo(tl);
  }
  // Rótulo com mais de 12 letras quebra em duas linhas, no espaço mais perto do meio (senão corta na borda da tela)
  function quebra(t) {
    if (t.length <= 12 || !t.includes(' ')) return t;
    const meio = t.length / 2;
    let melhor = -1;
    for (let k = 0; k < t.length; k++) if (t[k] === ' ' && (melhor < 0 || Math.abs(k - meio) < Math.abs(melhor - meio))) melhor = k;
    return t.slice(0, melhor) + '<br>' + t.slice(melhor + 1);
  }
  function dedup(l) { const m = new Map(); l.forEach((e) => m.set(e.tipo, e)); return [...m.values()]; }

  // ---------- Lugar ----------

  function montarLugar() {
    // Cenário pronto (motor/cenarios.js): o lugar inteiro com um nome, no lugar dos lugares simples abaixo
    if (R.cenario) { cenario = K.cenario(R.cenario, { hora: R.hora, pedestal: false }); return; }
    if (R.lugar === 'quintal' || R.lugar === 'praia') {
      const mundo = K.mundo(21);
      mundo.children.forEach((c) => { if (c.isGroup && c.position.y === 0 && Math.abs(c.position.x) < 12 && c.position.z > -14) c.visible = false; });
      if (R.casa) { const c = K.casa(); c.position.set(-7, 0, -9); c.rotation.y = 0.3; }
      if (R.lugar === 'praia') {
        const agua = K.malha(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), K.mat(0x2f8fd8, { roughness: 0.2, metalness: 0.1 }), false);
        agua.position.set(0, 0.05, -212);
        const areia = K.malha(new THREE.BoxGeometry(400, 0.06, 14), K.mat(0xe8d49a), false);
        areia.position.set(0, 0.0, -6);
        K.scene.add(agua, areia);
      }
    } else if (R.lugar === 'cozinha') {
      // Cozinha: piso de lajotas, duas paredes (fundo e esquerda), janela, bancada e armário em cima
      const g = new THREE.Group();
      const piso = K.malha(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), K.mat(0xd9cbb4), false);
      piso.receiveShadow = true;
      g.add(piso);
      const linhas = new THREE.MeshBasicMaterial({ color: 0xbfae94 });
      for (let i = -14; i <= 14; i += 1.2) {
        const a = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 30).rotateX(-Math.PI / 2), linhas);
        a.position.set(i, 0.005, 0);
        const b = new THREE.Mesh(new THREE.PlaneGeometry(30, 0.03).rotateX(-Math.PI / 2), linhas);
        b.position.set(0, 0.005, i);
        g.add(a, b);
      }
      const parede = (l, a, x, z, ry, cor) => {
        const m = K.malha(new THREE.BoxGeometry(l, a, 0.2), K.mat(cor), false);
        m.position.set(x, a / 2, z);
        m.rotation.y = ry;
        m.castShadow = false;
        g.add(m);
        return m;
      };
      parede(30, 4.2, 0, -3.2, 0, 0xf2e6cf);
      parede(30, 4.2, -5.5, 0, Math.PI / 2, 0xeadcc2);
      const azulejo = K.malha(new THREE.BoxGeometry(30, 1.2, 0.05), K.mat(0x8fc7c0), false);
      azulejo.position.set(0, 1.55, -3.08);
      const janela = K.malha(new THREE.BoxGeometry(1.8, 1.2, 0.06), new THREE.MeshBasicMaterial({ color: 0xbfe3ff }), false);
      janela.position.set(2.6, 2.6, -3.06);
      const moldura = K.malha(new THREE.BoxGeometry(2.0, 1.4, 0.04), K.mat(0xffffff), false);
      moldura.position.set(2.6, 2.6, -3.08);
      const bancada = K.malha(new THREE.BoxGeometry(5, 0.95, 0.8), K.mat(0x7a5236));
      bancada.position.set(-2.6, 0.475, -2.6);
      const pedra = K.malha(new THREE.BoxGeometry(5.1, 0.06, 0.86), K.mat(0x3a3f48));
      pedra.position.set(-2.6, 0.98, -2.6);
      const armario = K.malha(new THREE.BoxGeometry(3.2, 0.9, 0.5), K.mat(0x7a5236), false);
      armario.position.set(-3.4, 3.2, -2.85);
      g.add(azulejo, moldura, janela, bancada, pedra, armario);
      K.scene.add(g);
    } else if (R.lugar === 'lua') {
      chaoLua = K.malha(new THREE.CircleGeometry(170, 60).rotateX(-Math.PI / 2), K.mat(0xa9a9ae), false);
      chaoLua.receiveShadow = true;
      K.scene.add(chaoLua);
      const terra = K.planeta('terra', 8, 4);
      terra.g.position.set(-28, 44, -125);
    } else if (R.lugar === 'espaco') {
      const terra = K.planeta('terra', 60, 4);
      terra.g.position.set(0, -75, -40);
    }
  }
  function ceu() {
    if (cenario) return; // o cenário pronto põe o céu e a neblina dele em todo quadro
    const h = R.hora || 'dia';
    if (R.lugar === 'espaco') K.ceu('espaco');
    else if (R.lugar === 'lua') K.ceu('lua');
    else if (R.lugar === 'cozinha') K.ceu('dia');
    else if (R.lugar === 'escuro') K.ceu('escuro');
    else if (h === 'noite') K.ceu('noite', 'tarde', 0.28);
    else if (h === 'tarde') K.ceu('dia', 'tarde', 0.85);
    else K.ceu('dia');
    K.neblina(60, 220, 600);
  }

  // Feixe de luz (lanterna, farol, holofote): cone que abre a partir de um ponto
  function feixe() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 28, 1, true).translate(0, -0.5, 0), mat);
    m.visible = false;
    K.scene.add(m);
    const de = new THREE.Vector3(), d = new THREE.Vector3(), baixo = new THREE.Vector3(0, -1, 0);
    return K.componente({
      esconder() { m.visible = false; },
      em(origem, dir, comp, larg, forca, t) {
        if (forca <= 0.01) return;
        m.visible = true;
        de.set(...origem);
        d.set(...dir).normalize();
        m.position.copy(de);
        m.quaternion.setFromUnitVectors(baixo, d);
        m.scale.set(larg, comp, larg);
        mat.opacity = (0.22 + 0.06 * Math.sin(t * 7)) * forca;
      }
    });
  }

  // ---------- Ajudantes de quadro ----------

  const mundoDe = (x, local) => K.noMundo(x.g, local);
  const topo = (x) => [x.centro.x, x.caixa.max.y, x.centro.z];
  const fundo = (x) => [x.centro.x, x.caixa.min.y, x.centro.z];
  const centro = (x) => [x.centro.x, x.centro.y, x.centro.z];

  function caixaDe(indices, comMenino = true, onde = 'direita') {
    const b = new THREE.Box3();
    indices.forEach((i) => b.union(pecas[i].caixa));
    if (b.isEmpty()) b.copy(caixaObj);
    const m = lugar(onde);
    if (comMenino) b.union(new THREE.Box3(new THREE.Vector3(m[0] - 0.4, 0, m[2] - 0.3), new THREE.Vector3(m[0] + 0.4, 1.55, m[2] + 0.3)));
    return b;
  }
  const caixaMenino = (onde) => { const m = lugar(onde); return new THREE.Box3(new THREE.Vector3(m[0] - 0.4, 0, m[2] - 0.3), new THREE.Vector3(m[0] + 0.4, 1.55, m[2] + 0.3)); };
  // Lugar do personagem em volta do objeto: à direita (o padrão), à esquerda ou na frente, meio de lado
  function lugar(onde) {
    const c = caixaObj, meio = (c.min.x + c.max.x) / 2, y0 = cenario ? cenario.centro[1] : 0;
    if (onde === 'esquerda') return [c.min.x - 0.75, y0, c.max.z + 0.25];
    if (onde === 'frente') return [meio + (c.max.x - meio) * 0.5 + 0.35, y0, c.max.z + 1.0];
    return cenario ? [M[0], y0, M[2]] : M;
  }
  // Câmera que enquadra a caixa b no 9:16, olhando de um ângulo (az, el em radianos), com folga zoom
  function vista(b, az = 0, el = 0.12, zoom = 1.25) {
    const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    const d = Math.max(s.y / 2 / TAN_V, Math.max(s.x, s.z * 0.6) / 2 / TAN_H) * zoom + Math.max(s.x, s.z) * 0.5;
    const pos = [c.x + Math.sin(az) * Math.cos(el) * d, c.y + Math.sin(el) * d, c.z + Math.cos(az) * Math.cos(el) * d];
    if (temChao()) pos[1] = Math.max(0.5, pos[1]);
    return { pos, alvo: [c.x, c.y, c.z] };
  }
  const cam = (de, ate, p) => K.plano(de, ate, p);

  function noMenino(tc, olhar = null, onde = 'direita') {
    const m = lugar(onde);
    menino.g.visible = true;
    menino.g.position.set(...m);
    const oc = caixaObj.getCenter(new THREE.Vector3());
    const r = Math.atan2(oc.x - m[0], oc.z - m[2]);
    menino.g.rotation.y = olhar != null ? olhar : r * 0.55; // meio virado pro objeto, meio pra câmera
    menino.reset(tc);
    const per = R.personagem || {};
    if (per.capacete === 'obra') menino.capacete();
    if (per.capacete === 'espaco') menino.capaceteEspacial();
  }
  function acao(f, tc, B, padrao) {
    const a = f.acao || padrao;
    const x = K.faixa(tc, B.inicio + 0.15 * B.dur, B.inicio + 0.6 * B.dur);
    const desde = tc - (B.inicio + 0.3 * B.dur); // as reações começam perto de um terço da frase
    if (a === 'cair') { if (x > 0) menino.cair(x); }
    else if (a === 'suar') { menino.suar(tc); menino.humor('triste'); }
    else if (a === 'pensar') menino.pensar();
    else if (a === 'pular') menino.pular(K.faixa(tc, B.inicio, B.inicio + 0.8), 0.5);
    else if (a === 'comemorar') menino.comemorar(tc);
    else if (a === 'apontar') menino.apontar(0.6);
    else if (a === 'acenar') menino.acenar(tc);
    else if (a === 'andar' || a === 'correr') andarAte(tc, B, a === 'correr', 0.6);
    else if (a) { if (desde >= 0) menino.reagir(a, desde); else menino.humor('surpreso'); }
    if (f.humor) menino.humor(f.humor);
  }
  // Chega andando (ou correndo) de fora da cena até o lugar dele, no começo da frase (até a fração ate)
  function andarAte(tc, B, correr, ate) {
    // Vem de lado (e um pouco de trás), cruzando a tela: nunca na direção da câmera
    const m = menino.g.position.toArray(), lado = m[0] >= caixaObj.getCenter(v3).x ? 1 : -1;
    menino.irPara([m[0] + lado * 2.6, 0, m[2] - 0.6], m, K.faixa(tc, B.inicio, B.inicio + ate * B.dur), tc, { correr });
    if (K.faixa(tc, B.inicio, B.inicio + ate * B.dur) < 1) {
      for (let k = 0.05; k < ate; k += correr ? 0.07 : 0.1) K.som('passo', B.inicio + k * B.dur, 0.45);
    }
  }
  // A câmera da frase (K.filmar) em volta do que importa nela
  function filmar(e, B, caixa, extra = {}) {
    const c = e.cam || { movimento: 'chegando' };
    const alvo = c.alvo === 'personagem' ? menino : caixa;
    // fora: a câmera nunca entra no objeto (close de peça que fica dentro de outra)
    K.filmar(alvo, c.movimento, B.p, Object.assign({ plano: c.plano || 'medio', lado: c.lado, altura: c.altura, angulo: c.angulo, sentido: c.sentido, fora: objeto }, extra));
  }

  // Liga as peças da lista e devolve as visíveis
  function mostrarPecas(conj) {
    pecas.forEach((x) => {
      x.g.visible = conj.has(x.i);
      x.g.position.copy(x.casa);
      x.g.rotation.copy(x.rot);
    });
  }

  function efeitosEm(lista_, tc, B) {
    lista_.forEach((e) => {
      const x = pecas[e.peca != null ? e.peca : 0];
      if (!x || !x.g.visible) return;
      const forca = e.forca != null ? e.forca : 1;
      const s = Math.max(x.tam.x, x.tam.z, 0.3), o = caixaObj.getSize(new THREE.Vector3());
      switch (e.tipo) {
        case 'luz': {
          const comp = Math.max(3, o.y * 2.2) * (0.5 + 0.5 * forca);
          fx.feixe.em(topo(x), e.dir || [0, 1, 0], comp, comp * 0.32, forca, tc);
          fx.halo.visible = true;
          fx.halo.position.set(...centro(x));
          fx.halo.scale.setScalar(s * 4 * (0.4 + 0.6 * forca));
          fx.halo.material.opacity = 0.9 * forca;
          K.som('liga', B.inicio, 0.4);
          break;
        }
        case 'brilho':
          fx.halo.visible = true;
          fx.halo.position.set(...centro(x));
          fx.halo.scale.setScalar(s * 3 * (0.85 + 0.15 * Math.sin(tc * 6)));
          fx.halo.material.opacity = 0.8 * forca;
          break;
        case 'fogo': fx.fogo.em(topo(x), tc, e.escala || Math.max(0.5, s), forca); K.som('fogo', B.inicio, 0.3, B.dur); break;
        case 'fumaca': fx.fumaca.em(topo(x), tc, { altura: 3, escala: e.escala || Math.max(0.5, s), forca }); break;
        case 'vapor': fx.vapor.em(topo(x), tc, { altura: e.altura || 2, escala: e.escala || Math.max(0.4, s * 0.7), forca, ritmo: 0.5 }); K.som('vapor', B.inicio, 0.3); break;
        case 'agua': { const f0 = fundo(x); fx.jato.em(f0, Math.max(0.1, f0[1]), tc, forca); K.som('agua', B.inicio, 0.35, B.dur); break; }
        case 'chuva': fx.chuva.em([0, 0, -5], tc, forca); break; // atrás do objeto: nada de gota grudada na câmera
        case 'vento': fx.vento.em([0, 0, 0], tc, forca); break;
        case 'festa': fx.festa.em(tc - B.inicio); break;
        default: break;
      }
    });
  }

  // ---------- Planos ----------

  const P = {
    gancho(B, tc, f, i) {
      mostrarPecas(new Set(pecas.map((x) => x.i)));
      efeitosEm(efeitosFinais, tc, B);
      layoutCapa(B.p, tc);
      K.som('whoosh', B.inicio + 0.1, 0.5);
    },

    problema(B, tc, f, i) {
      const e = escolhas[i];
      mostrarPecas(estados[i].antes);
      efeitosEm(efeitosFrase[i], tc, B);
      noMenino(tc, null, e.onde);
      menino.humor('triste');
      if (e.inicio && !f.acao) {
        // "Se você...": chega andando, tropeça e cai, com poeira e baque
        andarAte(tc, B, false, 0.5);
        const xc = K.faixa(tc, B.inicio + 0.55 * B.dur, B.inicio + 0.75 * B.dur);
        if (xc > 0) {
          menino.cair(xc);
          K.som('baque', B.inicio + 0.62 * B.dur, 0.8);
          fx.poeira.em([menino.g.position.x, 0, menino.g.position.z - 0.3], tc - (B.inicio + 0.62 * B.dur), 0.7);
        }
      } else acao(f, tc, B, e.acao);
      // O problema na peça mais nova (treme, apaga, tomba...)
      const ultima = [...estados[i].antes].pop();
      if (ultima != null && e.falha !== 'nenhuma') K.falhar(pecas[ultima].g, e.falha, tc - (B.inicio + 0.3 * B.dur), { forca: 0.8 });
      const tE = B.inicio + 0.45 * B.dur;
      if (etiquetas[i]) etiquetas[i].em({ tela: [540, 430] }, tc - tE);
      if (f.marca !== 'certo') { fx.errado.em({ tela: [540, 560] }, tc - tE - 0.2); K.som('errado', tE + 0.2, 0.6); }
      if (f.contador) fx.contador.em(f.contador.texto, { tela: [540, 560] }, tc - tE, f.contador.sub || '');
      // Sem peça ainda ("Se você..."): a câmera fica nele; depois, no objeto com ele do lado
      if (!estados[i].antes.size && !(f.camera && f.camera !== 'personagem')) filmar({ cam: Object.assign({}, e.cam, { alvo: 'personagem', plano: 'medio' }) }, B, null);
      else filmar(e, B, caixaDe(estados[i].antes.size ? [...estados[i].antes] : [], true, e.onde));
    },

    monta(B, tc, f, i) {
      const e = escolhas[i];
      const novas = estados[i].novas;
      mostrarPecas(estados[i].depois);
      efeitosEm(efeitosFrase[i], tc, B);
      let imp0 = null;
      novas.forEach((n, k) => {
        const x = pecas[n];
        if (!x) return;
        const nome = (x.p.nome || '').split(/\s+/)[0];
        const t0 = quando(nome, B, 0.3) - 0.35 + k * 0.3;
        const tipo = e.entra(n);
        const som = x.p.som || (tipo === 'cai' ? (x.p.metal ? 'metal' : x.tam.y > 1.5 ? 'baque' : 'tampa') : undefined);
        K.entrar(x.g, tipo, tc - t0, { altura: Math.max(4, caixaObj.getSize(v3).y * 2.5), som, de: tipo === 'desliza' ? [x.lado * 2.6, 0.4, 0] : undefined });
        const imp = t0 + (tipo === 'cai' ? 0.7 * K.QUICA_IMPACTO : 0.45);
        if (k === 0) imp0 = imp;
        // Frase longa: a etiqueta entra na segunda metade, como uma segunda coisa acontecendo
        const tEt = B.dur > 4.5 ? Math.max(imp + 0.3, B.inicio + 0.55 * B.dur) : imp + 0.3;
        if (k === 0 && etiquetas[i]) etiquetas[i].em({ tela: [540, 430] }, tc - tEt);
      });
      noMenino(tc, null, e.onde);
      // Espera a peça chegar e reage quando ela encaixa
      if (imp0 != null && tc < imp0) { menino.apontar(0.6); menino.humor('surpreso'); } else acao(f, tc, B, e.acao);
      if (f.marca === 'certo') { fx.certo.em({ tela: [540, 560] }, tc - B.inicio - 0.7 * B.dur); K.som('certo', B.inicio + 0.7 * B.dur, 0.6); }
      if (f.contador) fx.contador.em(f.contador.texto, { tela: [540, 560] }, tc - B.inicio - 0.5 * B.dur, f.contador.sub || '');
      // A câmera acompanha a peça nova, com um pouco do objeto em volta (peça pequena também aparece entrando). Peça
      // grande: o personagem entra junto no quadro
      const bn = new THREE.Box3();
      novas.forEach((n) => { if (pecas[n]) bn.union(pecas[n].caixa); });
      if (bn.isEmpty()) filmar(e, B, caixaDe([...estados[i].depois], true, e.onde));
      else {
        const tam = Math.max(...bn.getSize(new THREE.Vector3()).toArray());
        bn.expandByScalar(Math.max(0.45, tam * 0.5));
        if (tam > 0.8) bn.union(caixaMenino(e.onde));
        filmar(e, B, bn);
      }
    },

    nome(B, tc, f, i) {
      const e = escolhas[i];
      mostrarPecas(estados[i].depois);
      efeitosEm(efeitosFrase[i], tc, B);
      const n = lista(f.peca)[0] != null ? lista(f.peca)[0] : [...estados[i].depois].pop();
      const x = pecas[n];
      if (x) {
        fx.dq[n].em(B.t, 1.6);
        // Close na peça com um pouco de contexto em volta (peça pequena fica grande na tela), o rótulo logo em cima e
        // tudo acima da faixa da legenda
        const m = Math.max(x.tam.x, x.tam.y, x.tam.z);
        if (rotulos[i]) rotulos[i].em([x.centro.x, x.caixa.max.y + Math.min(0.35, 0.12 + m * 0.2), x.centro.z], B.t - 0.05);
        const b = new THREE.Box3().copy(x.caixa).expandByScalar(Math.max(0.28, Math.min(0.6, m * 0.6)));
        b.max.y += 0.25;
        // Peça grande: o personagem entra no close, apontando. Peça pequena: o close é só dela (ele ficaria cortado)
        if (m > 0.8) {
          noMenino(tc, null, e.onde);
          menino.humor('feliz');
          acao(f, tc, B, e.acao);
          b.union(caixaMenino(e.onde));
        }
        // Sem altura no roteiro, a câmera fica na altura da peça (de cima, ela pode sumir embaixo de outra)
        filmar({ cam: Object.assign({ altura: 0 }, e.cam) }, B, b, { espacoBaixo: 0.22 });
      } else {
        noMenino(tc, null, e.onde);
        acao(f, tc, B, e.acao);
        filmar(e, B, caixaObj);
      }
    },

    mostra(B, tc, f, i) {
      const e = escolhas[i];
      mostrarPecas(estados[i].depois);
      efeitosEm(efeitosFrase[i], tc, B);
      noMenino(tc, null, e.onde);
      acao(f, tc, B, e.acao || 'comemorar');
      if (etiquetas[i]) etiquetas[i].em({ tela: [540, 430] }, tc - B.inicio - 0.3 * B.dur);
      if (f.contador) fx.contador.em(f.contador.texto, { tela: [540, 560] }, tc - B.inicio - 0.4 * B.dur, f.contador.sub || '');
      if (f.marca) { fx[f.marca === 'certo' ? 'certo' : 'errado'].em({ tela: [540, 560] }, tc - B.inicio - 0.6 * B.dur); }
      filmar(e, B, caixaDe([...estados[i].depois], true, e.onde));
    },

    por_fora(B, tc, f, i) {
      mostrarPecas(new Set(pecas.map((x) => x.i)));
      efeitosEm(efeitosFinais, tc, B);
      noMenino(tc);
      acao(f, tc, B, 'mostrando');
      K.som('whoosh', B.inicio + 0.05, 0.4);
      const b = caixaDe(pecas.map((x) => x.i), true);
      cam(vista(b, 0.0, 0.08, 1.35), vista(b, 0.08, 0.1, 1.2), B.p);
    },

    por_dentro(B, tc, f, i) {
      mostrarPecas(new Set(pecas.map((x) => x.i)));
      const e = abrir(tc, B.inicio + 0.2, B.ate - B.inicio);
      noMenino(tc);
      menino.humor('surpreso');
      menino.apontar(0.8);
      K.som(fx.aneis ? 'desconstrucao' : 'whoosh', B.inicio + 0.2, fx.aneis ? 0.9 : 0.6);
      const b = caixaExplodida(e);
      cam(vista(b, 0.0, 0.1, 1.15), vista(b, 0.1, 0.12, 1.08), B.p);
      // Nome de cada peça aparecendo enquanto ela sai (fora da faixa da legenda, pra não brigar com ela)
      pecas.forEach((x, k) => {
        if (x.p.fixa) return;
        const t0 = B.inicio + 0.4 + (k / Math.max(1, pecas.length)) * 0.75 * B.dur;
        const pc = new THREE.Box3().setFromObject(x.g).getCenter(new THREE.Vector3());
        const [sx, sy] = K.tela([pc.x + x.lado * (Math.max(x.tam.x, 0.3) / 2 + 0.75), pc.y, pc.z + 0.1]);
        fx.nomes[k].em({ tela: [sx, sy > 1130 && sy < 1350 ? (sy < 1240 ? 1130 : 1350) : sy] }, tc - t0);
        K.som('brilho', t0, 0.25);
      });
    },

    segue(B, tc, f, i) { final(B, tc, f, false); },
    cartao(B, tc, f, i) { final(B, tc, f, true); },

    // Capa: objeto inteiro e o personagem do lado, apontando
    capa(B, tc) {
      mostrarPecas(new Set(pecas.map((x) => x.i)));
      efeitosEm(efeitosFinais, 0, { inicio: -1, dur: 1 });
      layoutCapa(0, 0);
    }
  };

  // Abre as peças (vista explodida) de t0 até t0 + dur; devolve o quanto abriu
  function abrir(tc, t0, dur) {
    const e = K.saiVolta(K.faixa(tc, t0, t0 + Math.min(1.4, dur * 0.4)));
    pecas.forEach((x, k) => {
      if (x.p.fixa) return;
      const ek = K.saiVolta(K.faixa(tc, t0 + (k / Math.max(1, pecas.length)) * 0.6 * dur, t0 + (k / Math.max(1, pecas.length)) * 0.6 * dur + 0.7));
      const bob = Math.sin(tc * 1.6 + k) * 0.04 * ek;
      x.g.position.set(x.casa.x + x.desloca[0] * ek, x.casa.y + x.desloca[1] * ek + bob, x.casa.z + x.desloca[2] * ek);
      x.g.rotation.set(x.rot.x + x.giro[0] * ek * Math.sin(tc * 0.5 + k), x.rot.y + x.giro[1] * ek * tc * 0.3, x.rot.z + x.giro[2] * ek);
    });
    const oc = caixaObj.getCenter(new THREE.Vector3()), os = caixaObj.getSize(new THREE.Vector3());
    if (fx.aneis) fx.aneis.em(e, tc, { centro: [oc.x, oc.y, oc.z], escala: Math.max(os.x, os.y) / 3.2, pecas: pecas.map(() => 0) });
    if (fx.sonda) fx.sonda.em([M[0] - 0.4, 1.7, M[2] + 0.3], tc, [oc.x, oc.y, oc.z], e > 0.05 && e < 0.98 ? Math.max(os.x, os.y) * 0.5 : 0);
    return e;
  }
  function caixaExplodida(e) {
    const b = new THREE.Box3();
    pecas.forEach((x) => { b.union(new THREE.Box3().setFromObject(x.g)); });
    b.union(caixaDe([], true));
    return b;
  }

  function final(B, tc, f, cauda) {
    mostrarPecas(new Set(pecas.map((x) => x.i)));
    efeitosEm(efeitosFinais, tc, B);
    if (fx.aneis) abrir(tc, -10, 3);
    const t0 = cauda ? B.inicio - 3 : quando('segue', B, 0.1);
    // Cartão de seguir no topo; o personagem aponta pra ele e, na cauda, acena
    fx.seguir.em(tc - t0);
    noMenino(tc);
    menino.humor('feliz');
    if (cauda) { menino.acenar(tc); K.som('final', B.inicio, 0.7); }
    else {
      menino.apontar(1);
      K.som('brilho', t0, 0.5);
      K.som('clique', t0 + K.SEGUIR_CLIQUE, 0.9);
    }
    const b = fx.aneis ? caixaExplodida(1) : new THREE.Box3().copy(caixaObj);
    b.union(caixaDe([], true));
    // Espaço livre em cima pro cartão: a caixa sobe e o objeto fica na parte de baixo da tela
    b.max.y += (b.max.y - b.min.y) * 0.75;
    cam(vista(b, 0.0, 0.08, 1.05), vista(b, 0.0, 0.08, 0.98), B.p);
  }

  // Capa e gancho: objeto e personagem lado a lado, chão perto da base da tela, espaço no topo pra pergunta
  function layoutCapa(p, tc) {
    noMenino(tc, -1.05);
    menino.humor('surpreso');
    menino.apontar(0.55);
    menino.cabeca.rotation.y = 0.75;
    const b = caixaDe(pecas.map((x) => x.i), true);
    const s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    // A altura do conjunto ocupa ~50% da tela, da linha ~1600 px pra cima
    const vh = Math.max(s.y / 0.5, (s.x * 1.15) / (9 / 16));
    const d = vh / 2 / TAN_V;
    const yBase = b.min.y, pxPorUn = 1920 / vh;
    const yCentro = yBase + (1600 - 960) / pxPorUn;
    const de = { pos: [c.x + d * 0.18, yCentro + 0.1 * d * 0.18, c.z + d], alvo: [c.x, yCentro, c.z] };
    const ate = { pos: [c.x + d * 0.12, yCentro, c.z + d * 0.9], alvo: [c.x, yCentro, c.z] };
    K.plano(de, ate, p);
  }

  // ---------- Quadro ----------

  function cena(tc, t, plano) {
    const B = plano ? { plano, p: 0, t: 0, dur: 1, inicio: 0, ate: 1, bloco: { frase: 0 } } : K.blocoEm(bl, tc);
    const i = plano ? 0 : B.bloco.frase;
    const f = tl.frases[i] || {};
    ceu();
    K.focoSombra(0, 1);
    menino.g.visible = false;
    fx.halo.visible = false;
    if (!P[B.plano]) throw new Error(`Plano desconhecido: "${B.plano}" (use gancho, problema, monta, nome, mostra, por_fora, por_dentro, segue)`);
    P[B.plano](B, tc, f, i);
  }

  window.CENA = { montar, cena, capa: () => cena(0, 0, 'capa') };
})();
