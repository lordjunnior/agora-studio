// Quanto cada vídeo gastou: os tokens da IA que fez o vídeo e os créditos da ElevenLabs (só quando a voz é a
// ElevenLabs). Fica em videos/<tema>/custos.json, e o painel mostra no vídeo.
//
//   npm run custos -- <tema>     mede os tokens da conversa de agora e mostra o gasto do vídeo (a IA roda na entrega)
//   npm run custos -- --auto     o mesmo, no vídeo mexido nesta conversa, sem falar nada (o Claude Code roda sozinho no
//                                fim de toda resposta; quieto quando a conversa não mexeu em vídeo nenhum)
//
// Os créditos da ElevenLabs o render anota sozinho, na hora de narrar: só as frases novas gastam (as guardadas em
// narracao/ não). Os tokens vêm do registro que o programa da IA guarda no computador: o Claude Code
// (~/.claude/projects/) e o Codex (~/.codex/sessions/). Nos outros (Cursor, Copilot, IA de chat) não dá pra medir, e o
// comando diz isso, sem inventar número. Conta a conversa toda (um vídeo por conversa, regra número 3); se a mesma
// conversa fez outro vídeo antes, conta só o que veio depois dele
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const RAIZ = path.resolve(__dirname, '..');
const COMO_LER = 'Quanto este vídeo gastou (npm run custos). "elevenlabs": os créditos gastos pra narrar (o render anota a cada vez que narra; ' +
  'frase já narrada não gasta de novo). "ia": os tokens da IA, por conversa: entrada (o que ela leu de novo), cache (o que ela releu ' +
  'da memória da conversa, bem mais barato) e saída (o que ela escreveu, com o raciocínio).';

const lerJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const mil = (n) => Math.round(n).toLocaleString('pt-BR');
// 1234567 → "1,2 milhão"
const curto = (n) => (n >= 1e6 ? `${(n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${n >= 2e6 ? 'milhões' : 'milhão'}` : n >= 1e3 ? `${Math.round(n / 1e3)} mil` : String(n));
const arquivoDe = (pasta) => path.join(pasta, 'custos.json');
function salvar(pasta, c) {
  const { comoLer, ...resto } = c;
  fs.writeFileSync(arquivoDe(pasta), JSON.stringify({ comoLer: COMO_LER, ...resto }, null, 2) + '\n');
}

// ---------- ElevenLabs (o render chama) ----------

function anotarElevenlabs(pasta, { caracteres, creditos, modelo, sobraram }) {
  const c = lerJson(arquivoDe(pasta)) || {};
  const e = c.elevenlabs || { creditos: 0, caracteres: 0, vezes: [] };
  e.vezes.push({ quando: new Date().toISOString(), caracteres, creditos, modelo, ...(sobraram != null ? { sobraram } : {}) });
  e.caracteres = e.vezes.reduce((n, v) => n + v.caracteres, 0);
  e.creditos = e.vezes.reduce((n, v) => n + v.creditos, 0);
  if (sobraram != null) e.sobraram = sobraram;
  salvar(pasta, { ...c, elevenlabs: e });
}

// ---------- Os registros das IAs ----------

const casa = os.homedir();
const listar = (d) => { try { return fs.readdirSync(d, { withFileTypes: true }); } catch { return []; } };
const quando = (f) => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } };
function linhas(f, cada) {
  let txt = '';
  try { txt = fs.readFileSync(f, 'utf8'); } catch { return; }
  for (const l of txt.split('\n')) { if (!l) continue; try { cada(JSON.parse(l)); } catch { /* linha pela metade */ } }
}

// Claude Code: um .jsonl por conversa, na pasta com o caminho do projeto (cada letra fora de a-z e 0-9 vira "-"). Cada
// resposta tem o "usage"; a mesma resposta aparece em várias linhas (uma por bloco), então conta uma vez por id. Os
// ajudantes (subagentes) ficam na pasta da conversa
function conversasClaude() {
  const base = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(casa, '.claude'), 'projects', RAIZ.replace(/[^a-zA-Z0-9]/g, '-'));
  return listar(base).filter((d) => d.isFile() && d.name.endsWith('.jsonl')).map((d) => {
    const f = path.join(base, d.name), id = d.name.slice(0, -6);
    return { programa: 'Claude Code', id, arquivo: f, quando: quando(f), medir: (desde) => medirClaude(f, path.join(base, id), desde) };
  });
}
function medirClaude(arquivo, pastaDaConversa, desde) {
  const vistas = new Map();
  let inicio = null, fim = null;
  const extras = [];
  const juntar = (d) => { for (const x of listar(d)) { const f = path.join(d, x.name); if (x.isDirectory()) juntar(f); else if (x.name.endsWith('.jsonl')) extras.push(f); } };
  juntar(pastaDaConversa);
  for (const f of [arquivo, ...extras]) {
    linhas(f, (d) => {
      const m = d.message;
      if (d.type !== 'assistant' || !m || !m.usage) return;
      const t = d.timestamp ? Date.parse(d.timestamp) : 0;
      if (desde && t && t <= desde) return;
      if (t && (!inicio || t < inicio)) inicio = t;
      if (t && (!fim || t > fim)) fim = t;
      vistas.set(m.id || d.uuid, { u: m.usage, modelo: m.model });
    });
  }
  const s = { entrada: 0, cache: 0, saida: 0, modelos: {} };
  for (const { u, modelo } of vistas.values()) {
    s.entrada += (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    s.cache += u.cache_read_input_tokens || 0;
    s.saida += u.output_tokens || 0;
    if (modelo && !/synthetic/.test(modelo)) s.modelos[modelo] = (s.modelos[modelo] || 0) + 1;
  }
  return { ...s, respostas: vistas.size, inicio, fim };
}

// Codex: os registros por dia, em ~/.codex/sessions/AAAA/MM/DD/rollout-*.jsonl, com a pasta (cwd) no começo e o total
// acumulado da conversa a cada resposta (token_count)
function conversasCodex() {
  const base = path.join(process.env.CODEX_HOME || path.join(casa, '.codex'), 'sessions');
  const arquivos = [];
  const dias = listar(base).filter((a) => a.isDirectory()).map((a) => a.name).sort().reverse().slice(0, 2)
    .flatMap((a) => listar(path.join(base, a)).filter((m) => m.isDirectory()).map((m) => path.join(base, a, m.name)))
    .flatMap((m) => listar(m).filter((d) => d.isDirectory()).map((d) => path.join(m, d.name))).sort().reverse().slice(0, 45);
  for (const d of dias) for (const x of listar(d)) if (x.name.endsWith('.jsonl')) arquivos.push(path.join(d, x.name));
  return arquivos.map((f) => {
    let cwd = null;
    // Só o começo do arquivo (a 1ª linha diz a pasta): o registro inteiro pode ter muitos MB
    try {
      const fd = fs.openSync(f, 'r'), b = Buffer.alloc(262144), n = fs.readSync(fd, b, 0, b.length, 0);
      fs.closeSync(fd);
      const j = JSON.parse(b.subarray(0, n).toString('utf8').split('\n', 1)[0]);
      cwd = j.payload && j.payload.cwd;
    } catch { /* sem cabeça */ }
    return cwd && path.resolve(cwd) === RAIZ
      ? { programa: 'Codex', id: path.basename(f, '.jsonl').replace(/^rollout-[\dT-]+-/, ''), arquivo: f, quando: quando(f), medir: (desde) => medirCodex(f, desde) } : null;
  }).filter(Boolean);
}
function medirCodex(arquivo, desde) {
  let antes = null, ultimo = null, inicio = null, fim = null, modelo = null;
  linhas(arquivo, (d) => {
    const p = d.payload || {}, t = d.timestamp ? Date.parse(d.timestamp) : 0;
    if (d.type === 'turn_context' && p.model) modelo = p.model;
    if (d.type !== 'event_msg' || p.type !== 'token_count' || !p.info || !p.info.total_token_usage) return;
    if (desde && t && t <= desde) { antes = p.info.total_token_usage; return; }
    if (t && !inicio) inicio = t;
    if (t) fim = t;
    ultimo = p.info.total_token_usage;
  });
  if (!ultimo) return { entrada: 0, cache: 0, saida: 0, modelos: {}, respostas: 0, inicio, fim };
  const menos = (k) => (ultimo[k] || 0) - ((antes && antes[k]) || 0);
  const cache = menos('cached_input_tokens');
  return { entrada: menos('input_tokens') - cache, cache, saida: menos('output_tokens'), modelos: modelo ? { [modelo]: 1 } : {}, respostas: null, inicio, fim };
}

// A conversa de agora: a que o programa da IA escreveu por último, nesta pasta
function conversaAtual() {
  // Rodando dentro do Claude Code (CLAUDECODE=1), a conversa é dele: nem olha o Codex
  const todas = [...conversasClaude(), ...(process.env.CLAUDECODE ? [] : conversasCodex())];
  return todas.sort((a, b) => b.quando - a.quando)[0] || null;
}

// ---------- Medir um vídeo ----------

function medirIa(pasta) {
  const conversa = conversaAtual();
  if (!conversa) return { medido: false };
  // A mesma conversa já fez outro vídeo antes: conta só o que veio depois do último pedaço contado lá
  let desde = 0;
  for (const outro of listar(path.join(RAIZ, 'videos')).filter((d) => d.isDirectory() && path.join(RAIZ, 'videos', d.name) !== pasta)) {
    const c = lerJson(path.join(RAIZ, 'videos', outro.name, 'custos.json'));
    const ja = c && c.ia && (c.ia.conversas || []).find((x) => x.id === conversa.id);
    if (ja && ja.ate) desde = Math.max(desde, Date.parse(ja.ate));
  }
  const m = conversa.medir(desde);
  const c = lerJson(arquivoDe(pasta)) || {};
  const ia = c.ia || { conversas: [] };
  const modelo = Object.entries(m.modelos).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0] || null;
  const entrada = { id: conversa.id, programa: conversa.programa, modelo, entrada: m.entrada, cache: m.cache, saida: m.saida,
    total: m.entrada + m.cache + m.saida, de: m.inicio ? new Date(m.inicio).toISOString() : null, ate: m.fim ? new Date(m.fim).toISOString() : null, medido: new Date().toISOString() };
  ia.conversas = [...(ia.conversas || []).filter((x) => x.id !== conversa.id), entrada];
  for (const k of ['entrada', 'cache', 'saida', 'total']) ia[k] = ia.conversas.reduce((n, x) => n + (x[k] || 0), 0);
  salvar(pasta, { ...c, ia });
  return { medido: true, conversa: entrada, ia };
}

function resumo(pasta) {
  const c = lerJson(arquivoDe(pasta)) || {};
  const l = [];
  if (c.ia && c.ia.total) {
    const ps = [...new Set(c.ia.conversas.map((x) => x.programa))].join(' e ');
    l.push(`IA: ${curto(c.ia.total)}${c.ia.total >= 1e6 ? ' de' : ''} tokens (${ps}${c.ia.conversas.length > 1 ? `, em ${c.ia.conversas.length} conversas` : ''}): ${curto(c.ia.cache)} relidos da memória da conversa, ${curto(c.ia.entrada)} lidos de novo e ${curto(c.ia.saida)} escritos.`);
  }
  if (c.elevenlabs) l.push(`ElevenLabs: ${mil(c.elevenlabs.creditos)} créditos (${mil(c.elevenlabs.caracteres)} letras narradas)${c.elevenlabs.sobraram != null ? `; sobraram ${mil(c.elevenlabs.sobraram)} no plano` : ''}.`);
  return l;
}

// O vídeo feito nesta conversa (pro --auto): o de roteiro, cena ou entrega mais novos, se mudaram depois que a conversa
// começou. O exemplo fica de fora: a instalação desenha prévias dele, e a conversa da instalação não é de vídeo
const DO_VIDEO = ['roteiro.md', 'roteiro.json', 'cena.js', 'video.mp4', 'capa.png', 'publicacao.md'];
function videoDaConversa(conversa) {
  const m = conversa.medir(0);
  if (!m.inicio) return null;
  let melhor = null;
  for (const d of listar(path.join(RAIZ, 'videos')).filter((x) => x.isDirectory() && !/^[._]/.test(x.name) && x.name !== 'exemplo')) {
    const p = path.join(RAIZ, 'videos', d.name);
    const t = Math.max(0, ...DO_VIDEO.map((f) => quando(path.join(p, f))));
    if (t > m.inicio && (!melhor || t > melhor.t)) melhor = { p, t };
  }
  return melhor && melhor.p;
}

module.exports = { anotarElevenlabs, medirIa, resumo };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--auto')) {
    try {
      const conversa = conversaAtual();
      const pasta = conversa && videoDaConversa(conversa);
      if (pasta) medirIa(pasta);
    } catch { /* quieto: nunca atrapalha a conversa */ }
    process.exit(0);
  }
  const tema = (args.find((a) => !a.startsWith('--')) || '').replace(/\\/g, '/').replace(/^\.?\/?(videos\/)?/, '').replace(/\/+$/, '');
  const pasta = path.join(RAIZ, 'videos', tema);
  if (!tema || !fs.existsSync(pasta)) { console.log(`Não achei o vídeo videos/${tema}. Uso: npm run custos -- <tema>`); process.exit(1); }
  const r = medirIa(pasta);
  console.log(`CUSTOS: videos/${tema} (anotado em videos/${tema}/custos.json; o painel mostra no vídeo)`);
  const l = resumo(pasta);
  l.forEach((x) => console.log(`- ${x}`));
  if (r.medido && !r.conversa.total) console.log('- IA: nenhum token novo (esta conversa já foi contada num vídeo anterior).');
  if (!r.medido) console.log('- IA: não deu pra medir os tokens: o programa desta IA não guarda o registro da conversa no computador (dá pra medir no Claude Code e no Codex).');
  if (!l.some((x) => x.startsWith('ElevenLabs'))) console.log('- ElevenLabs: nada gasto neste vídeo (a voz é outra, ou as frases já estavam narradas).');
  console.log('PRA IA: conte pra pessoa, em uma linha, quanto o vídeo gastou (tokens da IA e créditos da ElevenLabs).');
}
