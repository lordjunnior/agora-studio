// Fotos de tudo que a Máquina sabe desenhar (cenários, personagens, bichos, objetos e modelos 3D prontos), pro painel
// (npm run painel, em "Modelos 3D") e pra IA mostrar pra pessoa o que dá pra usar:
//
//   npm run modelos                  tira as fotos que faltam e atualiza o catálogo
//   npm run modelos -- --todos       tira todas de novo (depois de mudar o motor)
//   npm run modelos -- gato praia    só esses (o nome do item: gato, praia, kenney-cidade/building-garage...)
//
// Grava em referencias/modelos/: uma foto por item (o cenário em pé, 9:16, com o personagem no lugar dele; o resto
// quadrado, num estúdio da cor do painel) e o catalogo.json, com o nome de cada item, como pedir pra IA e o código do
// cena.js. Os modelos dos pacotes extras (motor/modelos/*.js) entram sozinhos: o painel roda isto quando um pacote é
// vinculado
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const N = require('./navegador');

const RAIZ = path.resolve(__dirname, '..');
const SAIDA = path.join(RAIZ, 'referencias', 'modelos');
const args = process.argv.slice(2);
const todos = args.includes('--todos');
const pedidos = args.filter((a) => !a.startsWith('--'));
// Só uma rodada por vez (o painel confere este arquivo pra mostrar "tirando as fotos")
const TRAVA = path.join(os.tmpdir(), `preguica3d-fotos-${crypto.createHash('sha1').update(RAIZ).digest('hex').slice(0, 10)}.txt`);

const PAGINA = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}
#palco{position:relative;width:1080px;height:1920px;overflow:hidden}</style>
</head><body><div id="palco"><div class="legenda" id="legenda"></div></div></body></html>`;

// O mesmo resto do motor que o render carrega depois do kit.js
function motorExtra() {
  const modelos = path.join(__dirname, 'modelos');
  const prontos = fs.existsSync(modelos) ? fs.readdirSync(modelos).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(modelos, f)) : [];
  return [...prontos, ...['bichos.js', 'cenarios.js'].map((f) => path.join(__dirname, f)).filter((f) => fs.existsSync(f))];
}

// A vitrine: a lista do que fotografar e como montar cada um (roda dentro da página, depois do motor)
function vitrine() {
  const K = window.K;
  const hex = (n) => '#' + n.toString(16).padStart(6, '0');
  const humano = (s) => s.replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const ITENS = [];
  // criar() monta o item e devolve o que pôr no lugar a cada quadro (ou nada). olhar: de onde a câmera vê (o que é
  // virado pra +x, como os bichos e o carro, pede a câmera mais do lado)
  const item = (categoria, chave, nome, uso, criar, extra = {}) => ITENS.push({ id: `${categoria}/${chave}`, categoria, chave, nome, uso, criar, ...extra });
  const DE_LADO = [1, 0.5, 0.75];

  const CENARIOS = { construcao: 'Canteiro de obras', natureza: 'Natureza', cidade: 'Cidade', casa: 'Casa', cozinha: 'Cozinha', sala: 'Sala',
    praia: 'Praia', fundo_do_mar: 'Fundo do mar', espaco: 'Espaço', lua: 'Lua', fazenda: 'Fazenda', floresta: 'Floresta', deserto: 'Deserto',
    consultorio: 'Consultório', oficina: 'Oficina', escritorio: 'Escritório', estudio: 'Estúdio' };
  for (const c of K.CENARIOS || []) {
    const nome = CENARIOS[c] || humano(c);
    item('cenarios', c, nome, `K.cenario('${c}')`, null, { cenario: c, pedir: `faz no cenário ${nome.toLowerCase()}` });
  }

  // Personagens, com as cores que dá pra trocar em cada um (as do doutor e do operário são as do K.boneco)
  const DOUTOR = { jaleco: 0xf4f7f6, camisa: 0x12355b, gravata: 0x2ec4b6, calca: 0x6b7280, sapato: 0x6b3f22, cabelo: 0xececec };
  const OPERARIO = { camiseta: 0xf27c22, calca: 0x31577e, bota: 0x2a221c, colete: 0xf5d20a, faixa: 0xdfe6e8, capacete: 0xf5c518, pele: 0xc98f62, cabelo: 0x2b1b16, barba: 0x2b1b16 };
  const pessoa = (chave, nome, op, chaves, base = {}) => item('personagens', chave, nome, `K.boneco(${JSON.stringify(op)})`, () => {
    const b = K.boneco(op);
    return () => { b.colocar([0, 0, 0], [0.9, 0, 4]); b.humor('feliz'); };
  }, { zoom: 1.2, tipo: op.tipo || 'menino', roupa: op.tipo ? null : op.roupa || 'camiseta', cores: Object.fromEntries(chaves.map((k) => [k, hex(k in base ? base[k] : K.cores[k])])), pedir: `o personagem é ${nome.toLowerCase()}` });
  pessoa('menino', 'Menino', {}, ['camiseta', 'bermuda', 'tenis', 'cabelo', 'pele']);
  pessoa('menino-moletom', 'Menino de moletom', { roupa: 'moletom' }, ['moletom', 'punho', 'calca', 'mochila', 'cabelo', 'pele']);
  pessoa('menina', 'Menina', { tipo: 'menina' }, ['vestido', 'cabeloMenina', 'pele']);
  pessoa('doutor', 'Doutor', { tipo: 'doutor' }, ['jaleco', 'camisa', 'gravata', 'calca', 'sapato', 'cabelo', 'pele'], DOUTOR);
  pessoa('operario', 'Operário', { tipo: 'operario' }, ['camiseta', 'colete', 'calca', 'bota', 'capacete', 'cabelo', 'barba', 'pele'], OPERARIO);

  const bicho = (chave, nome, fazer, em, extra = {}) => K[fazer] && item('bichos', chave, nome, `K.${fazer}()`, () => {
    const m = K[fazer](extra.op);
    return (t) => em(m, t);
  }, { olhar: DE_LADO, zoom: 1.2, pedir: `põe ${extra.artigo || 'o'} ${nome.toLowerCase()} no vídeo` });
  bicho('gato', 'Gato', 'gato', (m, t) => m.em([0, m.altura, 0], t, { cara: 'feliz', rumo: -0.35 }));
  bicho('cachorro', 'Cachorro', 'cachorro', (m, t) => m.em([0, 0, 0], t, { cara: 'feliz', rumo: -0.35 }));
  bicho('ornitorrinco', 'Ornitorrinco', 'ornitorrinco', (m, t) => m.em([0, m.altura, 0], t, { cara: 'feliz', rumo: -0.35 }));
  bicho('camaleao', 'Camaleão', 'camaleao', (m, t) => m.em([0, 0, 0], t, { cara: 'curioso', rumo: -0.35 }));
  bicho('mosquita', 'Mosquito', 'mosquita', (m, t) => m.em([0, 0.6, 0], t, { voo: 0, feliz: 1, rumo: -0.35 }));
  bicho('mosca', 'Mosca', 'mosca', (m, t) => m.em([0, 0.05, 0], t, { escala: 8, rumo: -0.35 }), { artigo: 'a' });

  // Objetos do kit (cada um com o jeito dele de entrar na cena)
  const objeto = (chave, nome, uso, criar, extra = {}) => item('objetos', chave, nome, uso, criar, { pedir: `põe ${extra.artigo || 'o'} ${nome.toLowerCase()} no vídeo`, ...extra });
  objeto('computador', 'Computador', 'K.computador()', () => { K.computador(); });
  objeto('celular', 'Celular', 'K.celular()', () => { K.celular(); });
  objeto('carro', 'Carro', 'K.carro()', () => { K.carro(); }, { olhar: DE_LADO });
  objeto('casa', 'Casa', 'K.casa()', () => { K.casa(); }, { artigo: 'a' });
  objeto('predio', 'Prédio', 'K.predio(10)', () => { K.predio(10); });
  objeto('arvore', 'Árvore', 'K.arvore(x, z, tamanho)', () => { K.scene.add(K.arvore(0, 0, 1, false, K.rand(3))); }, { artigo: 'a' });
  objeto('coqueiro', 'Coqueiro', 'K.coqueiro(pos)', () => { K.coqueiro([0, 0, 0]); });
  objeto('bicicleta', 'Bicicleta', 'K.bicicleta()', () => { K.bicicleta(); }, { artigo: 'a' });
  objeto('navio', 'Navio', 'K.navio()', () => { K.navio(); }, { olhar: DE_LADO });
  objeto('peixe', 'Peixe', 'K.peixe()', () => { const p = K.peixe(); return (t) => p.em([0, 0.5, 0], t, -0.35); }, { olhar: DE_LADO });
  objeto('tubarao', 'Tubarão', 'K.tubarao()', () => { const p = K.tubarao(); return (t) => p.em([0, 1, 0], t, -0.35, 0.4); }, { olhar: DE_LADO });
  objeto('foguete', 'Foguete', 'K.foguete()', () => { K.foguete(); });
  objeto('modulo-lunar', 'Módulo lunar', 'K.moduloLunar()', () => { K.moduloLunar(); });
  objeto('capsula', 'Cápsula espacial', 'K.capsula()', () => { K.capsula(); }, { artigo: 'a' });
  objeto('satelite', 'Satélite', 'K.satelite()', () => { K.satelite(); });
  objeto('terra', 'Planeta Terra', "K.planeta('terra')", () => { const p = K.planeta('terra'); p.g.position.y = p.raio; });
  objeto('lua', 'Lua', "K.planeta('lua')", () => { const p = K.planeta('lua'); p.g.position.y = p.raio; }, { artigo: 'a' });
  objeto('paraquedas', 'Paraquedas', 'K.paraquedas()', () => { const p = K.paraquedas(); return (t) => p.abrir && p.abrir(1, t, 0); });
  objeto('balao', 'Balão', 'K.balao()', () => { K.balao(); });
  objeto('torneira', 'Torneira', 'K.torneira(pos)', () => { K.torneira([0, 0, 0]); }, { artigo: 'a' });
  objeto('balde', 'Balde', 'K.balde()', () => { K.balde(); });
  objeto('regador', 'Regador', 'K.regador()', () => { K.regador(); });
  objeto('flor', 'Flor no vaso', 'K.flor()', () => { const f = K.flor(); return () => f.em && f.em(1); }, { artigo: 'a' });
  objeto('tambor', 'Tambor', 'K.tambor()', () => { K.tambor(); });
  objeto('fogo', 'Fogo', 'K.fogo()', () => { const f = K.fogo(); return (t) => f.em([0, 0, 0], t, 1, 1); });

  // Modelos 3D prontos (motor/modelos/*.js, com os pacotes extras)
  const PECAS = {
    'kenney-cidade/building-garage': 'Garagem', 'kenney-cidade/building-small-a': 'Casinha 1', 'kenney-cidade/building-small-b': 'Casinha 2',
    'kenney-cidade/building-small-c': 'Casinha 3', 'kenney-cidade/building-small-d': 'Casinha 4', 'kenney-cidade/grass': 'Lote de grama',
    'kenney-cidade/grass-trees': 'Grama com árvores', 'kenney-cidade/grass-trees-tall': 'Grama com árvores altas',
    'kenney-cidade/pavement': 'Calçada', 'kenney-cidade/pavement-fountain': 'Praça com chafariz', 'kenney-cidade/road-straight': 'Rua reta',
    'kenney-cidade/road-straight-lightposts': 'Rua com postes', 'kenney-cidade/road-corner': 'Esquina', 'kenney-cidade/road-split': 'Rua em T',
    'kenney-cidade/road-intersection': 'Cruzamento'
  };
  for (const m of K.MODELOS || []) {
    const [pacote, ...resto] = m.split('/');
    const nome = PECAS[m] || humano(resto.join(' ') || m);
    // Um pouco acima do chão do estúdio, como nos cenários: a rua e a calçada ficam bem no 0 e brigariam com ele
    item('modelos', m, nome, `K.modelo('${m}', { escala: 5 })`, () => { K.modelo(m, { escala: 5, pos: [0, 0.14, 0] }); }, { pacote, pedir: `usa o modelo ${m}` });
  }

  let atual = null, mexer = null, novos = [], C = null, menino = null;
  // O que aparece na foto (só o que está visível): a caixa em volta, pra câmera enquadrar
  function caixa() {
    const b = new THREE.Box3(), m = new THREE.Box3();
    K.scene.updateMatrixWorld(true);
    novos.forEach((o) => o.traverseVisible((x) => {
      if (!(x.isMesh || x.isSkinnedMesh) || !x.geometry) return;
      const mat = Array.isArray(x.material) ? x.material[0] : x.material;
      if (mat && (mat.transparent || mat.depthWrite === false)) return; // sombra de contato, brilho, asa: não contam
      if (!x.geometry.boundingBox) x.geometry.computeBoundingBox();
      b.union(m.copy(x.geometry.boundingBox).applyMatrix4(x.matrixWorld));
    }));
    return b;
  }
  window.VITRINE = {
    lista: () => ITENS.map(({ criar, zoom, olhar, ...resto }) => resto),
    montar(id) {
      atual = ITENS.find((i) => i.id === id);
      if (atual.cenario) {
        window.CENA = {
          montar() { C = K.cenario(atual.cenario); menino = K.boneco({ roupa: 'camiseta' }); },
          cena() {
            menino.colocar(C.personagem, [C.personagem[0] - 0.4, 0, C.personagem[2] + 3]);
            menino.reagir('mostrando', 2);
            K.mirar(C.vista.pos, C.vista.alvo);
          }
        };
      } else {
        window.CENA = {
          montar() {
            K.cenario('estudio', { cor: 0xf3ebdc, pedestal: false });
            const antes = new Set(K.scene.children);
            const r = atual.criar();
            mexer = typeof r === 'function' ? r : null;
            novos = K.scene.children.filter((o) => !antes.has(o));
          },
          cena(tc) {
            if (mexer) mexer(tc);
            const b = caixa();
            if (b.isEmpty()) return;
            const c = b.getCenter(new THREE.Vector3()), r = Math.max(0.05, b.getSize(new THREE.Vector3()).length() / 2);
            // A foto é o quadrado do meio do quadro (1080 x 1080): o campo de visão dele é ~23°
            const d = ((r / Math.sin(((K.camera.fov * (1080 / 1920)) / 2) * (Math.PI / 180))) * 1.02) / (atual.zoom || 1);
            const dir = new THREE.Vector3(...(atual.olhar || [0.55, 0.42, 1])).normalize();
            K.mirar(c.clone().addScaledVector(dir, d).toArray(), c.toArray());
            K.camera.near = Math.max(0.01, d / 200);
            K.camera.updateProjectionMatrix();
          }
        };
      }
      const tl = { frases: [{ texto: 'x', marcado: 'x', plano: 'vista', inicio: 0, fim: 4, palavras: [] }], total: 4, capa: '', estilo: 'redondo', roteiro: {} };
      K.init();
      K.preparar(tl);
      window.CENA.montar(tl);
    }
  };
}

const arquivoDaFoto = (it) => `${it.categoria}-${it.chave.replace(/\//g, '--')}.jpg`;

async function abrirPagina(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.setContent(PAGINA, { waitUntil: 'load' });
  await page.addScriptTag({ path: path.join(RAIZ, 'node_modules', 'three', 'build', 'three.min.js') });
  await page.addScriptTag({ path: path.join(__dirname, 'kit.js') });
  for (const extra of motorExtra()) await page.addScriptTag({ path: extra });
  await page.addScriptTag({ content: `(${vitrine.toString()})();` });
  return { page, erros };
}

async function fotografar(browser, it) {
  const { page, erros } = await abrirPagina(browser);
  try {
    await page.evaluate((id) => window.VITRINE.montar(id), it.id);
    await page.evaluate(() => K.quadro(1.2));
    if (erros.length) throw new Error(erros.join(' | '));
    const alto = it.categoria === 'cenarios';
    const png = await page.screenshot(alto ? { type: 'png' } : { type: 'png', clip: { x: 0, y: 420, width: 1080, height: 1080 } });
    // Pequena, pro painel abrir rápido
    const [w, h] = alto ? [405, 720] : [480, 480];
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.setContent(`<html><body style="margin:0"><img src="data:image/png;base64,${png.toString('base64')}" style="width:${w}px;height:${h}px;display:block"></body></html>`, { waitUntil: 'load' });
    await p.screenshot({ path: path.join(SAIDA, arquivoDaFoto(it)), type: 'jpeg', quality: 80 });
    await p.close();
  } finally {
    await page.close();
  }
}

(async () => {
  try {
    const pid = Number(fs.readFileSync(TRAVA, 'utf8'));
    if (pid && pid !== process.pid) { process.kill(pid, 0); console.log('Já estou tirando as fotos em outra janela. Espere ela acabar.'); return; }
  } catch { /* livre */ }
  fs.writeFileSync(TRAVA, String(process.pid));
  const soltar = () => fs.rmSync(TRAVA, { force: true });
  process.on('exit', soltar);

  const semNavegador = N.falta();
  if (semNavegador) { console.error(semNavegador); process.exit(4); }
  const { browser } = await N.abrir();
  const { page, erros } = await abrirPagina(browser);
  const lista = await page.evaluate(() => window.VITRINE.lista());
  await page.close();
  if (erros.length) throw new Error(erros.join(' | '));
  fs.mkdirSync(SAIDA, { recursive: true });

  const alvos = lista.filter((it) => (pedidos.length ? pedidos.includes(it.chave) || pedidos.includes(it.id)
    : todos || !fs.existsSync(path.join(SAIDA, arquivoDaFoto(it)))));
  const falhas = [];
  for (const [i, it] of alvos.entries()) {
    const inicio = Date.now();
    try {
      await fotografar(browser, it);
      console.log(`${i + 1}/${alvos.length} ${it.id} (${((Date.now() - inicio) / 1000).toFixed(1)} s)`);
    } catch (e) {
      falhas.push(it.id);
      console.log(`${i + 1}/${alvos.length} ${it.id}: NÃO SAIU (${e.message.split('\n')[0]})`);
    }
  }
  await browser.close();

  const catalogo = {
    comoLer: 'Tudo que a Máquina sabe desenhar, com a foto (referencias/modelos/<foto>), como pedir pra IA e o código do cena.js. Gerado por npm run modelos: não editar à mão.',
    feito: new Date().toISOString(),
    itens: lista.map((it) => ({ ...it, foto: fs.existsSync(path.join(SAIDA, arquivoDaFoto(it))) ? arquivoDaFoto(it) : null }))
  };
  fs.writeFileSync(path.join(SAIDA, 'catalogo.json'), JSON.stringify(catalogo, null, 2) + '\n');
  console.log(`\nFOTOS: ${alvos.length - falhas.length} de ${alvos.length} em referencias/modelos/ (catálogo com ${lista.length} itens em referencias/modelos/catalogo.json)`);
  if (falhas.length) console.log(`Não saíram: ${falhas.join(', ')}`);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
