// Confere o VoiceStudio (a voz grátis que roda no computador) e diz o próximo passo em palavras simples: se o computador
// aguenta, se o programa está instalado, aberto, com o motor de voz e com a voz do canal salva e anotada.
// Uso: npm run voicestudio              confere tudo
//      npm run voicestudio -- --abrir   abre o VoiceStudio (se estiver fechado) e espera ele ficar pronto (até 5 minutos)
// O passo a passo completo, pra IA conduzir a pessoa, está em comandos/voicestudio.md.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const V = require('./voz');

V.carregarEnv();
const ENDERECO = V.voicestudioUrl();
const item = (status, texto) => console.log(`[${status}] ${texto}`);
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));
const roda = (cmd, args, ms = 15000) => {
  try { return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: ms }).trim(); } catch { return null; }
};

function terminar(pronto, praIa) {
  console.log(`\nRESULTADO: ${pronto ? 'PRONTO' : 'FALTA'}`);
  console.log(`PRA IA: ${praIa}`);
  process.exit(pronto ? 0 : 1);
}

// O computador aguenta? { ok, aviso, texto }
function computador() {
  let livre = null;
  try { const s = fs.statfsSync(os.homedir()); livre = (s.bavail * s.bsize) / 1e9; } catch { /* sem como medir */ }
  const disco = livre == null ? '' : `, ${Math.floor(livre)} GB livres`;
  const pouco = livre != null && livre < 10;
  if (process.platform === 'darwin') {
    // Node rodando pelo Rosetta diz x64: o sysctl conta o chip de verdade
    const apple = os.arch() === 'arm64' || roda('sysctl', ['-n', 'hw.optional.arm64']) === '1';
    const versao = roda('sw_vers', ['-productVersion']) || '';
    const [ma, mi] = versao.split('.').map(Number);
    if (!apple) return { ok: false, texto: 'Mac com chip Intel: o VoiceStudio não faz a voz nele (só roda em Mac com chip M1 ou mais novo)' };
    if (ma && (ma < 13 || (ma === 13 && (mi || 0) < 3))) return { ok: false, texto: `macOS ${versao}: o VoiceStudio pede o 13.3 ou mais novo (atualize o Mac em Ajustes do Sistema > Geral > Atualização de Software)` };
    return { ok: true, aviso: pouco, texto: `Mac com chip Apple (macOS ${versao})${disco}` };
  }
  if (process.platform === 'win32') {
    const placas = roda('powershell', ['-NoProfile', '-Command', '(Get-CimInstance Win32_VideoController).Name -join "; "']) || '';
    const nvidia = /nvidia/i.test(placas);
    return {
      ok: true, aviso: pouco || !nvidia, nvidia,
      texto: `Windows ${os.arch() === 'arm64' ? 'ARM (experimental no VoiceStudio)' : '64 bits'}${disco}` +
        (nvidia ? ', com placa de vídeo NVIDIA (a voz sai rápido)' : ', sem placa de vídeo NVIDIA (funciona, só que a voz demora bem mais)')
    };
  }
  return { ok: true, aviso: pouco, texto: `Linux${disco}` };
}

// Onde o VoiceStudio costuma ficar instalado: { caminho, versao } ou null
function instalado() {
  const casa = os.homedir();
  if (process.platform === 'darwin') {
    for (const app of ['/Applications/VoiceStudio.app', path.join(casa, 'Applications/VoiceStudio.app')]) {
      if (!fs.existsSync(app)) continue;
      let versao = '';
      try { versao = (fs.readFileSync(path.join(app, 'Contents/Info.plist'), 'utf8').match(/CFBundleShortVersionString<\/key>\s*<string>([^<]+)/) || [])[1] || ''; } catch { /* plist binário */ }
      return { caminho: app, versao };
    }
    return null;
  }
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || path.join(casa, 'AppData', 'Local');
    const exes = [path.join(local, 'Programs', 'VoiceStudio', 'VoiceStudio.exe'), path.join(local, 'Programs', 'voicestudio', 'VoiceStudio.exe'),
      process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'VoiceStudio', 'VoiceStudio.exe')].filter(Boolean);
    const atalho = path.join(process.env.APPDATA || path.join(casa, 'AppData', 'Roaming'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'VoiceStudio.lnk');
    const exe = exes.find((e) => fs.existsSync(e));
    if (exe) return { caminho: exe, versao: '' };
    if (fs.existsSync(atalho)) return { caminho: atalho, versao: '' };
    return null;
  }
  const appimages = [path.join(casa, 'Applications'), path.join(casa, 'Downloads'), casa]
    .flatMap((d) => { try { return fs.readdirSync(d).filter((n) => /^VoiceStudio.*\.AppImage$/i.test(n)).map((n) => path.join(d, n)); } catch { return []; } });
  const deb = ['/usr/bin/voicestudio', '/opt/VoiceStudio/voicestudio'].find((c) => fs.existsSync(c));
  return appimages[0] || deb ? { caminho: appimages[0] || deb, versao: '' } : null;
}

// O programa está aberto? { estado: 'pronto' | 'abrindo' | 'fechado', versao, aparelho, etapa }
async function saude() {
  try {
    const r = await fetch(`${ENDERECO}/health`, { signal: AbortSignal.timeout(4000) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.status === 'ok') return { estado: 'pronto', versao: j.version || '', aparelho: j.device || '' };
    if (r.status === 503 || j.status === 'starting') return { estado: 'abrindo', etapa: j.label || j.step || '' };
    return { estado: 'abrindo', etapa: `respondeu ${r.status}` };
  } catch {
    return { estado: 'fechado' };
  }
}

// Os motores de voz instalados no VoiceStudio (omnivoice, voxcpm2...)
async function motores() {
  try {
    const r = await fetch(`${ENDERECO}/v1/models`, { signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    return (j.data || []).filter((m) => m.voicestudio && m.voicestudio.kind === 'tts' && !m.voicestudio.alias_for_active_engine).map((m) => m.id);
  } catch { return null; }
}

function abrirPrograma(app) {
  // O VoiceStudio é feito em Electron. Quem roda dentro do VS Code, do Cursor e de outros apps Electron herda o
  // ELECTRON_RUN_AS_NODE, e com ele o VoiceStudio abre "sem tela" e fecha na hora, sem erro nenhum
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^ELECTRON_/i.test(k)));
  const op = { detached: true, stdio: 'ignore', env };
  try {
    const p = process.platform === 'darwin' ? spawn('open', ['-a', app.caminho], op)
      : app.caminho.endsWith('.lnk') ? spawn('cmd', ['/c', 'start', '', app.caminho], { ...op, windowsHide: true })
        : spawn(app.caminho, [], op);
    p.on('error', () => {});
    p.unref();
    return true;
  } catch { return false; }
}

(async () => {
  console.log('VoiceStudio: a voz grátis no computador\n');
  const abrir = process.argv.includes('--abrir');
  const guia = 'comandos/voicestudio.md';

  // 1. O computador
  const pc = computador();
  item(pc.ok ? (pc.aviso ? 'aviso' : 'ok') : 'falta', `Computador: ${pc.texto}`);
  if (!pc.ok) terminar(false, `o VoiceStudio não roda neste computador. Explique em uma frase e recomende a ElevenLabs (passo 3a de comandos/instalar.md); se a pessoa só quer testar, a voz do computador (passo 3c).`);

  // 2. Instalado e aberto
  let app = instalado();
  let s = await saude();
  if (s.estado === 'fechado' && abrir && app) {
    console.log('... Abrindo o VoiceStudio e esperando ele ficar pronto (de 30 segundos a 5 minutos)');
    if (abrirPrograma(app)) {
      const inicio = Date.now();
      let ultimo = 0;
      while (Date.now() - inicio < 5 * 60 * 1000) {
        await dormir(3000);
        s = await saude();
        if (s.estado === 'pronto') break;
        if (Date.now() - ultimo > 30000) { ultimo = Date.now(); console.log(`   ...${s.estado === 'abrindo' ? `abrindo${s.etapa ? ` (${s.etapa})` : ''}` : 'ainda não respondeu'}`); }
      }
    }
  }
  if (!app && s.estado !== 'fechado') app = { caminho: '', versao: s.versao };
  if (!app) {
    item('falta', 'VoiceStudio instalado: não achei o programa neste computador');
    terminar(false, `siga o passo 2 de ${guia} (baixar e instalar). Se a pessoa jura que instalou, peça pra ela abrir o VoiceStudio pelo menu de programas e rode npm run voicestudio de novo.`);
  }
  item('ok', `VoiceStudio instalado${app.versao || s.versao ? ` (versão ${app.versao || s.versao})` : ''}`);

  if (s.estado === 'fechado') {
    item('falta', `VoiceStudio aberto: está fechado (procurei em ${ENDERECO})`);
    terminar(false, abrir
      ? `não consegui abrir o VoiceStudio sozinho (o seu programa pode não deixar abrir apps). Peça pra pessoa abrir o VoiceStudio, esperar a tela principal aparecer e dizer "abri"; aí rode npm run voicestudio de novo. Se é a primeira vez que ele abre, siga o passo 3 de ${guia}.`
      : `rode npm run voicestudio -- --abrir (abre e espera), ou peça pra pessoa abrir o VoiceStudio e dizer "abri". Se é a primeira vez que ele abre, siga o passo 3 de ${guia}.`);
  }
  if (s.estado === 'abrindo') {
    item('aviso', `VoiceStudio aberto: ainda está carregando${s.etapa ? ` (${s.etapa})` : ''}`);
    terminar(false, `espere 1 ou 2 minutos e rode npm run voicestudio de novo. Na primeira vez ele baixa vários GB: se a tela do VoiceStudio pedir pra escolher ou confirmar alguma coisa, siga o passo 3 de ${guia}.`);
  }
  item('ok', `VoiceStudio aberto e respondendo${s.aparelho ? ` (fazendo a voz com: ${s.aparelho})` : ''}`);

  // 3. O motor de voz (o OmniVoice é o que fala português de saída)
  const ms = await motores();
  if (ms && !ms.includes('omnivoice')) item('aviso', `Motor de voz: não achei o OmniVoice (instalados: ${ms.join(', ') || 'nenhum'}). Ele é o que fala português: passo 4 de ${guia}`);
  else if (ms) item('ok', `Motor de voz: OmniVoice${ms.length > 1 ? ` (também instalados: ${ms.filter((m) => m !== 'omnivoice').join(', ')})` : ''}`);

  // 4. As vozes salvas
  const vs = await V.voicestudio(8000);
  const vozes = vs.ok ? vs.vozes : [];
  const demo = (v) => /^demo/i.test(v.id) || /^demo voice$/i.test(v.nome);
  const doCanal = vozes.filter((v) => !demo(v));
  const nome = (v) => (v.porNome ? v.nome : v.id);
  if (!doCanal.length) {
    item('falta', `Voz do canal salva no VoiceStudio: ainda não tem${vozes.length ? ' (só a Demo Voice, que fala inglês: com ela o português sai com sotaque gringo)' : ''}`);
    terminar(false, `siga o passo 5 de ${guia} (criar a voz do canal e salvar com o nome Narrador).`);
  }
  item('ok', `Vozes salvas no VoiceStudio: ${doCanal.map((v) => `"${nome(v)}"${v.idioma ? ` (${v.idioma})` : ''}`).join(', ')}`);

  // 5. A voz anotada no canal
  const voz = V.vozDoCanal();
  if (!voz || voz.motor !== 'voicestudio') {
    item('falta', `Voz do canal na Máquina: ${voz ? `hoje é "${voz.motor}", não o VoiceStudio` : 'ainda não escolhida'}`);
    terminar(false, `siga o passo 6 de ${guia}: faça a amostra (npm run testar-voz -- --voicestudio "${nome(doCanal[0])}"), mostre pra pessoa e, se ela aprovar, anote a voz no bloco "No roteiro.json" de canal/identidade.md.`);
  }
  if (voz.id && voz.id !== 'default' && !vozes.some((v) => V.mesmaVoz(v, voz.id))) {
    item('falta', `Voz do canal na Máquina: a anotada é "${voz.id}", mas o VoiceStudio não tem uma voz com esse nome`);
    terminar(false, `troque o "id" da voz em canal/identidade.md por um destes nomes, exatamente igual: ${doCanal.map((v) => `"${nome(v)}"`).join(', ')} (ou crie a voz com esse nome no VoiceStudio).`);
  }
  item('ok', `Voz do canal na Máquina: "${voz.id || 'default'}", pelo VoiceStudio`);
  terminar(true, 'está tudo pronto pra narrar com o VoiceStudio. Lembre a pessoa de deixar o VoiceStudio aberto enquanto o vídeo é feito.');
})();
