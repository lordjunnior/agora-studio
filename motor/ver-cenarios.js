// Fotos dos cenários prontos (motor/cenarios.js), pra escolher o lugar do vídeo:
//
//   npm run cenarios                          todos, em referencias/cenarios/ (uma foto por cenário e a grade todos.jpg)
//   npm run cenarios -- construcao natureza   só esses
//   npm run cenarios -- cidade --hora noite   numa hora do dia ('dia', 'tarde', 'noite')
//   --saida <pasta>                           grava em outra pasta (padrão: referencias/cenarios/)
//
// Cada foto tem 3 vistas do mesmo cenário (o lugar todo, de frente e da esquerda), com o personagem no lugar dele
// (C.personagem) e o centro livre, onde fica o objeto do vídeo.
const fs = require('fs');
const path = require('path');
const N = require('./navegador');

const RAIZ = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const arg = (nome) => { const i = args.indexOf(nome); return i >= 0 ? args[i + 1] : null; };
const hora = arg('--hora') || 'dia';
const saida = path.resolve(arg('--saida') || path.join(RAIZ, 'referencias', 'cenarios'));
const pedidos = args.filter((a, i) => !a.startsWith('--') && !['--hora', '--saida'].includes(args[i - 1]));

const PAGINA = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=block">
<style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}
#palco{position:relative;width:1080px;height:1920px;overflow:hidden}</style>
</head><body><div id="palco"><div class="legenda" id="legenda"></div></div></body></html>`;

// O mesmo resto do motor que o render carrega depois do kit.js
function motorExtra() {
  const modelos = path.join(__dirname, 'modelos');
  const prontos = fs.existsSync(modelos) ? fs.readdirSync(modelos).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(modelos, f)) : [];
  return [...prontos, ...['bichos.js', 'cenarios.js'].map((f) => path.join(__dirname, f)).filter((f) => fs.existsSync(f))];
}

const VISTAS = [
  { nome: 'o lugar todo (C.vista)', geral: true },
  { nome: 'de frente, médio', lado: 'frente', plano: 'medio', altura: 'olho' },
  { nome: 'da esquerda, aberto', lado: 'esquerda', plano: 'aberto', altura: 'alto' }
];

async function fotografar(browser, nome) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.setContent(PAGINA, { waitUntil: 'networkidle' });
  await page.addScriptTag({ path: path.join(RAIZ, 'node_modules', 'three', 'build', 'three.min.js') });
  await page.addScriptTag({ path: path.join(__dirname, 'kit.js') });
  for (const extra of motorExtra()) await page.addScriptTag({ path: extra });
  await page.evaluate(({ nome, hora }) => {
    const tl = { frases: [{ texto: 'x', marcado: 'x', plano: 'vista', inicio: 0, fim: 4, palavras: [] }], total: 4, capa: '', estilo: 'redondo', roteiro: {} };
    let C, menino;
    window.CENA = {
      montar() {
        C = K.cenario(nome, { hora });
        menino = K.boneco({ roupa: 'camiseta' });
        window.VISTA = { lado: 'frente', plano: 'aberto', altura: 'olho' };
      },
      cena() {
        menino.colocar(C.personagem, [C.personagem[0] - 0.4, 0, C.personagem[2] + 3]);
        menino.reagir('mostrando', 2);
        if (window.VISTA.geral) K.mirar(C.vista.pos, C.vista.alvo);
        else K.filmar([C.centro, menino, [C.centro[0], C.centro[1] + 1.2, C.centro[2]]], 'parado', 0.5, Object.assign({ tam: 2.4 }, window.VISTA));
      }
    };
    K.init();
    K.preparar(tl);
    CENA.montar(tl);
  }, { nome, hora });
  const fotos = [];
  for (const v of VISTAS) {
    await page.evaluate((v) => { window.VISTA = v; K.quadro(2); }, v);
    fotos.push((await page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64'));
  }
  const info = await page.evaluate(() => ({ lugares: Object.keys(K.cenarioAtual.lugares), objetos: Object.keys(K.cenarioAtual.objetos) }));
  await page.close();
  if (erros.length) throw new Error(`${nome}: ${erros.join(' | ')}`);
  return { nome, fotos, info };
}

// Folha de um cenário: as 3 vistas lado a lado, com o nome em cima
async function folha(browser, cenas, arq, titulo) {
  const larg = 344, alt = Math.round((larg * 16) / 9);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#1d1f24;width:1080px;font-family:Montserrat,Arial,sans-serif;color:#fff}
h1{font-size:30px;margin:16px 16px 6px}.c{padding:0 12px 14px}.c h2{font-size:26px;margin:8px 4px;color:#f5c518}
.g{display:grid;grid-template-columns:repeat(3,${larg}px);gap:12px}.g img{width:${larg}px;height:${alt}px;object-fit:cover;border-radius:10px;display:block}
.g p{margin:4px 2px 0;font-size:16px;color:#cfd3da}
</style></head><body>${titulo ? `<h1>${titulo}</h1>` : ''}${cenas.map((c) => `<div class="c"><h2>${c.nome}</h2><div class="g">${c.fotos.map((f, i) => `<div><img src="data:image/jpeg;base64,${f}"><p>${VISTAS[i].nome}</p></div>`).join('')}</div></div>`).join('')}</body></html>`;
  const p = await browser.newPage({ viewport: { width: 1080, height: 800 } });
  await p.setContent(html, { waitUntil: 'load' });
  await p.screenshot({ path: arq, type: 'jpeg', quality: 78, fullPage: true });
  await p.close();
}

// Todos numa folha só: a vista do lugar todo de cada cenário, em grade, com o nome embaixo (pra escolher de olho)
async function grade(browser, cenas, arq) {
  const cols = 4, larg = Math.floor((1080 - (cols + 1) * 12) / cols), alt = Math.round((larg * 16) / 9);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#1d1f24;width:1080px;font-family:Montserrat,Arial,sans-serif;color:#fff}
h1{font-size:32px;margin:18px 16px 2px}p.s{margin:0 16px 4px;color:#b9bec8;font-size:19px}
.g{display:grid;grid-template-columns:repeat(${cols},${larg}px);gap:12px;padding:12px}
.c img{width:${larg}px;height:${alt}px;object-fit:cover;border-radius:10px;display:block}
.c b{display:block;font-size:22px;margin:6px 2px 0;color:#f5c518}
</style></head><body><h1>Cenários prontos</h1><p class="s">No cena.js: K.cenario('nome') · no roteiro.json da montagem: "cenario": "nome"</p>
<div class="g">${cenas.map((c) => `<div class="c"><img src="data:image/jpeg;base64,${c.fotos[0]}"><b>${c.nome}</b></div>`).join('')}</div></body></html>`;
  const p = await browser.newPage({ viewport: { width: 1080, height: 800 } });
  await p.setContent(html, { waitUntil: 'load' });
  await p.screenshot({ path: arq, type: 'jpeg', quality: 80, fullPage: true });
  await p.close();
}

(async () => {
  const semNavegador = N.falta();
  if (semNavegador) { console.error(semNavegador); process.exit(4); }
  const { browser } = await N.abrir();
  // A lista de cenários vem do próprio motor
  const p0 = await browser.newPage();
  await p0.setContent('<!doctype html><html><body></body></html>');
  await p0.addScriptTag({ path: path.join(RAIZ, 'node_modules', 'three', 'build', 'three.min.js') });
  await p0.addScriptTag({ path: path.join(__dirname, 'kit.js') });
  for (const extra of motorExtra()) await p0.addScriptTag({ path: extra });
  const todos = await p0.evaluate(() => K.CENARIOS);
  await p0.close();
  const nomes = pedidos.length ? pedidos : todos;
  fs.mkdirSync(saida, { recursive: true });
  const feitos = [];
  for (const nome of nomes) {
    const inicio = Date.now();
    const c = await fotografar(browser, nome);
    const sufixo = hora === 'dia' ? '' : '-' + hora;
    await folha(browser, [c], path.join(saida, `${c.nome}${sufixo}.jpg`));
    console.log(`${nome}: ${path.join(saida, `${nome}${sufixo}.jpg`)} (${((Date.now() - inicio) / 1000).toFixed(1)} s)`);
    console.log(`   lugares: ${c.info.lugares.join(', ')}`);
    if (c.info.objetos.length) console.log(`   objetos: ${c.info.objetos.join(', ')}`);
    feitos.push(c);
  }
  if (!pedidos.length) {
    const sufixo = hora === 'dia' ? '' : '-' + hora;
    await grade(browser, feitos, path.join(saida, `todos${sufixo}.jpg`));
    console.log('todos juntos:', path.join(saida, `todos${sufixo}.jpg`));
  }
  await browser.close();
})().catch((e) => { console.error(e.message || e); process.exit(1); });
