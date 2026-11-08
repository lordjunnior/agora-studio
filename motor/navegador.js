// O navegador que desenha os quadros do vídeo (invisível: ninguém vê a janela). Tenta, nesta ordem: o que funcionou da
// última vez, o Chromium que a Máquina baixa (npm run instalar), o Microsoft Edge (já vem em todo Windows) e o Google
// Chrome. Se um não abrir ou não desenhar 3D, passa pro próximo sozinho e guarda o que funcionou pra começar por ele.
// Usado pelo render, pelo conferir e pelo instalar. Pra forçar um: PREGUICA_NAVEGADOR=chromium (ou msedge, chrome).
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const GUARDADO = path.join(RAIZ, 'node_modules', '.cache', 'preguica3d', 'navegador.json');
const CANAIS = ['chromium', 'msedge', 'chrome'];
const NOMES = { chromium: 'o Chromium da Máquina', msedge: 'o Microsoft Edge', chrome: 'o Google Chrome' };
// GPU de cada sistema (no Mac, Metal; no resto, o padrão do navegador)
const ARGS = process.platform === 'darwin' ? ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] : ['--enable-gpu', '--ignore-gpu-blocklist'];

// Só depois do npm install existe o playwright: até lá, null
function playwright() {
  try { return require(path.join(RAIZ, 'node_modules', 'playwright')); } catch { return null; }
}

// Onde o Edge e o Chrome ficam instalados (os mesmos lugares em que o Playwright procura)
const NO_SISTEMA = {
  msedge: { win32: '\\Microsoft\\Edge\\Application\\msedge.exe', darwin: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', linux: '/opt/microsoft/msedge/msedge' },
  chrome: { win32: '\\Google\\Chrome\\Application\\chrome.exe', darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', linux: '/opt/google/chrome/chrome' }
};

function caminho(canal) {
  if (canal === 'chromium') {
    const pw = playwright();
    try { const c = pw && pw.chromium.executablePath(); return c && fs.existsSync(c) ? c : null; } catch { return null; }
  }
  const fim = (NO_SISTEMA[canal] || {})[process.platform];
  if (!fim) return null;
  const bases = process.platform === 'win32'
    ? [process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'],
      process.env.HOMEDRIVE && process.env.HOMEDRIVE + '\\Program Files', process.env.HOMEDRIVE && process.env.HOMEDRIVE + '\\Program Files (x86)'].filter(Boolean)
    : [''];
  return bases.map((b) => path.join(b, fim)).find((c) => fs.existsSync(c)) || null;
}

function guardado() {
  try { const c = JSON.parse(fs.readFileSync(GUARDADO, 'utf8')).canal; return CANAIS.includes(c) ? c : null; } catch { return null; }
}
function guardar(canal) {
  try { fs.mkdirSync(path.dirname(GUARDADO), { recursive: true }); fs.writeFileSync(GUARDADO, JSON.stringify({ canal }) + '\n'); } catch { /* sem node_modules: tudo bem */ }
}

// Os navegadores que existem neste computador, na ordem de tentar
function instalados() {
  const forcado = process.env.PREGUICA_NAVEGADOR;
  const g = guardado();
  const ordem = CANAIS.includes(forcado) ? [forcado] : g ? [g, ...CANAIS.filter((c) => c !== g)] : CANAIS;
  return ordem.filter((c) => caminho(c));
}

// O motivo de um navegador não abrir, em palavras simples (a mensagem do Playwright é longa e em inglês)
function motivo(e) {
  const m = String((e && e.message) || e).replace(/\x1b\[[0-9;]*m/g, '');
  if (/Executable doesn't exist|not found at|is not found/i.test(m)) return 'não está instalado';
  if (/side-by-side|lado a lado|0xc0000135|0xc0000142|0xc0000022|3221225781|3221225794|3221225506/i.test(m)) {
    return 'erro de configuração do Windows ao abrir (costuma ser o download que veio incompleto ou um antivírus bloqueando)';
  }
  if (/EPERM|EACCES|access is denied|acesso negado|operation not permitted|sandbox/i.test(m)) return 'o computador (ou o programa da IA) não deixou abrir: falta permissão';
  if (/missing dependencies|shared libraries|install-deps/i.test(m)) return 'faltam peças do Linux (sudo npx playwright install-deps chromium)';
  if (/Timeout|timed out/i.test(m)) return 'demorou demais pra abrir';
  if (/WebGL/i.test(m)) return 'abriu, mas não desenha 3D (WebGL desligado)';
  const linha = m.split('\n').map((l) => l.trim()).find((l) => l && !/^browserType\.launch:?$/i.test(l)) || 'erro sem mensagem';
  return linha.replace(/^browserType\.launch:\s*/i, '').slice(0, 160);
}

// Abre um navegador que funciona e desenha 3D. Devolve { browser, canal, nome } ou dá um erro já explicado (e.explicado)
async function abrir() {
  const pw = playwright();
  if (!pw) throw explicado('Faltam as peças do motor neste computador. Rode npm run instalar (ele instala tudo e testa).');
  const lista = instalados();
  const falhas = [];
  for (const canal of lista) {
    let browser = null;
    try {
      browser = await pw.chromium.launch({ channel: canal, args: ARGS, timeout: 90000 });
      const p = await browser.newPage();
      const temWebgl = await p.evaluate(() => { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); });
      await p.close();
      if (!temWebgl) throw new Error('WebGL');
      if (guardado() !== canal) guardar(canal);
      return { browser, canal, nome: NOMES[canal] };
    } catch (e) {
      if (browser) await browser.close().catch(() => {});
      falhas.push(`${NOMES[canal]}: ${motivo(e)}`);
    }
  }
  throw explicado(explicar(falhas));
}

// Abre, confere e fecha (pro instalar e pra quem quiser testar): { ok, canal, nome } ou { ok: false, erro }
async function testar() {
  try {
    const r = await abrir();
    await r.browser.close();
    return { ok: true, canal: r.canal, nome: r.nome };
  } catch (e) {
    return { ok: false, erro: e.message };
  }
}

function explicar(falhas) {
  const tentou = falhas.length ? `Tentei:\n${falhas.map((f) => `  - ${f}`).join('\n')}` : 'Não achei nenhum navegador que sirva neste computador.';
  return [
    'Não consegui abrir o navegador que desenha o vídeo (ele trabalha escondido, só tira a "foto" de cada quadro).',
    tentou,
    'O que fazer, nesta ordem:',
    '  1. Rodar npm run instalar: ele baixa o navegador de novo e testa sozinho.',
    '  2. Se o programa da IA pedir permissão pra abrir um programa ou usar a internet, aceitar. Rodando "na caixa de',
    '     areia" (sandbox), o navegador não abre: no Codex, dá pra escolher "Acesso completo".',
    '  3. Antivírus: se ele bloqueou o navegador baixado, liberar a pasta da Máquina, ou instalar o Google Chrome',
    '     (google.com/chrome) e rodar de novo. A Máquina usa o Chrome ou o Edge sozinha quando acha.',
    'Não resolveu? Escreva pra desconstruindouniverso@gmail.com com o print desta mensagem.'
  ].join('\n');
}

function explicado(msg) {
  const e = new Error(msg);
  e.explicado = true;
  e.codigo = 4; // o render sai com 4: o que parou foi o navegador, não o roteiro nem a voz
  return e;
}

// Pro conferir: qual navegador vai ser usado (sem abrir nada). { canal, nome } ou null
function qual() {
  const c = instalados()[0];
  return c ? { canal: c, nome: NOMES[c] } : null;
}

// Antes de gastar a voz: tem navegador pra abrir? null (tem) ou a explicação do que falta
function falta() {
  if (!playwright()) return 'Faltam as peças do motor neste computador. Rode npm run instalar (ele instala tudo e testa).';
  return instalados().length ? null : explicar([]);
}

module.exports = { abrir, testar, qual, falta, instalados, caminho, motivo, NOMES };
