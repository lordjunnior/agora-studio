// Preguiça 3D: transforma uma pasta de vídeo (roteiro.json + cena) num vídeo 9:16 com narração, legenda, som e capa.
//
//   node motor/render.js videos/<tema>                     vídeo completo (video.mp4 + capa.png)
//   node motor/render.js videos/<tema> --previa 1,5.5      só os quadros desses segundos (testes/previa-*.jpg), pra conferir rápido
//   node motor/render.js videos/<tema> --trecho 20,35      só esse pedaço, com som (testes/trecho-20s-35s.mp4)
//   node motor/render.js videos/<tema> --capa              só a capa 1080x1920 (capa.png)
//   node motor/render.js videos/<tema> --revisar           confere a cena frase por frase (câmera, personagem, o que
//                                                          a frase mostra, o que acontece, textos) e faz a folha com
//                                                          uma imagem por frase (testes/folha.jpg e testes/revisao.txt,
//                                                          e cada cena solta em testes/cenas/, que o painel mostra);
//                                                          não faz vídeo
//   --mesmo-assim                                          o vídeo completo mesmo com a revisão dizendo pra corrigir
//                                                          (sem isso, com cena.js própria, ele para e mostra o que corrigir)
//   --sem-revisar                                          o vídeo completo sem a revisão rápida que roda antes
//   --sem-painel                                           não abre o painel no fim (ele abre sozinho depois do
//                                                          --revisar aprovado, nas cenas, e do vídeo completo, no vídeo)
//   --voz-teste                                            voz do computador (grátis), mesmo se o roteiro pedir ElevenLabs;
//                                                          o vídeo completo com ela é teste (testes/video-voz-teste.mp4)
//
// Na pasta do vídeo fica a entrega (video.mp4, capa.png, publicacao.md) e o roteiro; todo teste vai pra <pasta>/testes/.
//
// A cena: se a pasta tiver cena.js, usa ele. Senão, usa a cena-modelo do roteiro ("modelo": "montagem" → motor/cenas-modelo/montagem.js).
//
// roteiro.json:
//   voz: { motor: 'teste' }  ou  { motor: 'elevenlabs', id, modelo, velocidade, estabilidade, estilo, acelerar }
//        ou  { motor: 'voicestudio', id (nome da voz no VoiceStudio), modelo, idioma, velocidade, acelerar }
//     sem voz: a do canal (bloco "No roteiro.json" de canal/identidade.md)
//     acelerar: 'auto' (chega no alvoPpm, até 1.35x) ou um número (1.2 = 20% mais rápido)
//   alvoPpm: palavras por minuto (os vídeos curtos que prendem ficam em 188 a 198)
//   frases: [{ texto, plano, ... }]   *palavra* no texto = termo-chave amarelo na legenda
//     gancho: true = a pergunta da capa (roteiro.capa) fica no topo durante a frase: a capa ganha vida no 1º segundo
//   capa: pergunta da capa (*palavra* na cor do canal, \n quebra a linha)      cauda: { segundos, plano }
//   cor: '#rrggbb' (cor do canal: a palavra da capa e o botão de seguir)   arroba: '@seucanal' (no cartão de seguir do fim)
//   trilha: { arquivo (em motor/sons/), ganho }      efeitos: { ganho } (volume dos efeitos, padrão 0.855)
//     efeitos.abaixa: true   efeitos por baixo da voz (compressor + limitador + abaixam quando a voz fala); ganho padrão 1.2
//   estilo: 'redondo'   sombreamento liso, quinas arredondadas, cenário vivo, sombra macia, personagem mais realista
//   fps: 60             movimento mais fluido (padrão 30; o render leva o dobro do tempo)
//
// A chave da ElevenLabs fica no arquivo .env na raiz do projeto: ELEVENLABS_API_KEY=... (motor/voz.js acha a chave
// também nos nomes errados mais comuns, como .env.local e .env.txt). O VoiceStudio precisa estar aberto no computador.
// Cada frase narrada é guardada em <pasta>/narracao/: renderizar de novo não gasta caracteres, só frase nova ou alterada.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const V = require('./voz');
const N = require('./navegador');

const RAIZ = path.resolve(__dirname, '..');
const SONS = path.join(__dirname, 'sons');

V.carregarEnv(RAIZ);

// ffmpeg e ffprobe vêm junto pelo npm; se não, usa os do sistema
const opcional = (fn) => { try { return fn(); } catch (e) { return null; } };
const FFMPEG = opcional(() => require('ffmpeg-static')) || 'ffmpeg';
const FFPROBE = opcional(() => require('ffprobe-static').path) || 'ffprobe';

const pasta = path.resolve(process.argv[2] || '.');
if (!fs.existsSync(path.join(pasta, 'roteiro.json'))) {
  console.error(`Não achei ${path.join(pasta, 'roteiro.json')}. Uso: node motor/render.js videos/<tema>`);
  process.exit(1);
}
const arg = (nome) => { const i = process.argv.indexOf(nome); return i > 0 ? process.argv[i + 1] : null; };
const previa = arg('--previa') ? arg('--previa').split(',').map(Number) : null;
const trecho = arg('--trecho') ? arg('--trecho').split(',').map(Number) : null;
const vozTeste = process.argv.includes('--voz-teste');
const capa = process.argv.includes('--capa');
const revisar = process.argv.includes('--revisar');
const roteiro = JSON.parse(fs.readFileSync(path.join(pasta, 'roteiro.json'), 'utf8'));
// O que faltar no roteiro (voz, cor do canal e @) vem da identidade do canal
const canal = V.blocoDoCanal(RAIZ) || {};
for (const k of ['voz', 'cor', 'arroba']) if (roteiro[k] == null && canal[k] != null) roteiro[k] = canal[k];
// Vídeo completo só com o canal configurado (os textos do canal e a voz, a mesma conta do npm run conferir): antes
// disso, só a prévia, a revisão e a capa. O vídeo de exemplo, que vem pronto, não passa por aqui
if (!previa && !trecho && !capa && !revisar && path.basename(pasta) !== 'exemplo') {
  const MODELO_CANAL = /\[[^\]]*\b(ex|Ex|ej|Ej|Descreva)[:.][^\]]*\]/;
  const lerCanal = (f) => { try { return fs.readFileSync(path.join(RAIZ, 'canal', f), 'utf8'); } catch { return ''; } };
  const falta = [];
  if (!lerCanal('canal.md') || MODELO_CANAL.test(lerCanal('canal.md'))) falta.push('o canal (o nome, o assunto e o jeito de falar)');
  if (!lerCanal('identidade.md') || MODELO_CANAL.test(lerCanal('identidade.md'))) falta.push('o visual do canal (o personagem, o cenário e a cor)');
  if (!V.vozDoCanal(RAIZ)) falta.push('a voz do canal');
  if (falta.length) {
    console.error(`\nO VÍDEO NÃO FOI FEITO: falta terminar de configurar ${falta.join(', ')}.\nAntes do primeiro vídeo, a Máquina precisa conhecer o seu canal.`);
    console.error('PRA IA: rode npm run conferir e siga comandos/instalar.md só no que falta, uma pergunta de cada vez. Diga pra pessoa, em palavras simples, o que falta e dê uma resposta pronta pra ela copiar ("Me ajuda a terminar de configurar"). Com tudo PRONTO, faça o vídeo de novo.');
    process.exit(6);
  }
}
const FPS = roteiro.fps || 30;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'preguica3d-'));
// Os quadros temporários somem mesmo se o render der erro ou for interrompido (Ctrl+C): nada fica esquecido no computador
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
process.on('SIGINT', () => process.exit(130));
const emTestes = (nome) => { fs.mkdirSync(path.join(pasta, 'testes'), { recursive: true }); return path.join(pasta, 'testes', nome); };

const voz = roteiro.voz || { motor: 'teste' };
let motor = vozTeste ? 'teste' : voz.motor || 'teste';
let semVozDoCanal = '';
if (!['teste', 'elevenlabs', 'voicestudio'].includes(motor)) {
  semVozDoCanal = `a voz "${motor}" não existe (use elevenlabs, voicestudio ou teste)`;
  motor = 'teste';
}
if (motor === 'elevenlabs' && !process.env.ELEVENLABS_API_KEY) {
  semVozDoCanal = 'falta a chave da ElevenLabs no arquivo .env (ELEVENLABS_API_KEY=...; npm run chave salva do jeito certo)';
  motor = 'teste';
}
if (semVozDoCanal) console.warn(`ATENÇÃO: ${semVozDoCanal}. Usando a voz de teste do computador.`);
const PAUSA = motor === 'teste' ? 0.18 : 0.1; // respiro entre frases, em segundos

const duracao = (arq) =>
  parseFloat(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arq]).toString());
const ffmpeg = (args) => execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });

// "*caixa d'água*." → [{ texto: 'caixa', chave: true }, { texto: "d'água", chave: true }]
function tokens(marcado) {
  let dentro = false;
  return marcado.split(/\s+/).filter(Boolean).map((tok) => {
    const abre = tok.startsWith('*');
    if (abre) dentro = true;
    const chave = dentro;
    if (tok.slice(abre ? 1 : 0).includes('*')) dentro = false;
    return { texto: tok.replace(/\*/g, '').replace(/[.,!?;:]+$/, ''), chave };
  });
}
const limpo = (marcado) => marcado.replace(/\*/g, '');

// ---------- Narração ----------

// Voz de teste: a do próprio computador (Mac: say; Windows: voz do sistema; Linux: espeak-ng)
function falarTeste(texto, wav) {
  const bruto = path.join(tmp, 'bruto' + (process.platform === 'darwin' ? '.aiff' : '.wav'));
  if (process.platform === 'darwin') {
    execFileSync('say', ['-v', voz.nomeTeste || 'Luciana', '-r', '190', '-o', bruto, texto]);
  } else if (process.platform === 'win32') {
    // O texto vai por arquivo em UTF-8: pela entrada do console, o PowerShell 5.1 lê na página de código antiga e
    // estraga os acentos (ç, ã, é)
    const fala = path.join(tmp, 'fala.txt');
    fs.writeFileSync(fala, texto, 'utf8');
    const ps = "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; " +
      "$v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'pt*' } | Select-Object -First 1; " +
      "if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }; $s.Rate = 2; " +
      `$s.SetOutputToWaveFile('${bruto.replace(/'/g, "''")}'); ` +
      `$s.Speak([IO.File]::ReadAllText('${fala.replace(/'/g, "''")}', [Text.Encoding]::UTF8)); $s.Dispose()`;
    execFileSync('powershell', ['-NoProfile', '-Command', ps]);
  } else {
    execFileSync('espeak-ng', ['-v', 'pt-br', '-s', '175', '-w', bruto, texto]);
  }
  ffmpeg(['-i', bruto, '-ar', '48000', '-ac', '1', wav]);
}

// Sem tempo por letra: distribui as palavras da frase pelas sílabas (aproximação)
function silabas(marcado, dur) {
  const tk = tokens(marcado);
  const peso = tk.map((w) => (w.texto.match(/[aeiouáéíóúâêôãõà]+/gi) || ['']).length + 0.35);
  const total = peso.reduce((a, b) => a + b, 0);
  let t = 0;
  return tk.map((w, j) => { const d = (peso[j] / total) * dur * 0.94; const p = { ...w, inicio: t, fim: t + d }; t += d; return p; });
}

// Aceleração: vídeo curto que prende roda a ~190 palavras/min
function fatorVoz(palavras, natural) {
  const ppm = palavras / (natural / 60);
  const fator = voz.acelerar && voz.acelerar !== 'auto' ? voz.acelerar : Math.min(1.35, Math.max(1, (roteiro.alvoPpm || 190) / ppm));
  console.log(`voz: ${ppm.toFixed(0)} palavras/min natural → acelerada ${fator.toFixed(2)}x → ${(ppm * fator).toFixed(0)} palavras/min`);
  return fator;
}

// Erro que o render explica em português e para (sem a pilha de erro do Node)
const pararCom = (msg) => { const e = new Error(msg); e.explicado = true; return e; };

function narrarTeste() {
  return roteiro.frases.map((f, i) => {
    const wav = path.join(tmp, `frase-${i}.wav`);
    falarTeste(limpo(f.texto), wav);
    const dur = duracao(wav);
    return { wav, dur, palavras: silabas(f.texto, dur) };
  });
}

const cfgElevenlabs = () => ({ id: voz.id, modelo: voz.modelo || 'eleven_multilingual_v2', estabilidade: voz.estabilidade ?? 0.45, similaridade: voz.similaridade ?? 0.8, estilo: voz.estilo ?? 0.25, velocidade: voz.velocidade ?? 1.1 });
function guardadoElevenlabs(texto) {
  const hash = crypto.createHash('sha1').update(JSON.stringify([cfgElevenlabs(), texto])).digest('hex').slice(0, 16);
  const dir = path.join(pasta, 'narracao');
  return { mp3: path.join(dir, hash + '.mp3'), json: path.join(dir, hash + '.json') };
}

async function elevenlabs(texto, anterior, proximo) {
  const cfg = cfgElevenlabs();
  const { mp3, json } = guardadoElevenlabs(texto);
  fs.mkdirSync(path.dirname(mp3), { recursive: true });
  if (fs.existsSync(mp3) && fs.existsSync(json)) return { mp3, al: JSON.parse(fs.readFileSync(json, 'utf8')), novo: false };
  // Até 3 tentativas: a ElevenLabs às vezes responde "ocupada" (429) ou cai a internet por um instante
  for (let tentativa = 1; ; tentativa++) {
    let res;
    try {
      res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.id}/with-timestamps?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: texto, model_id: cfg.modelo, previous_text: anterior || undefined, next_text: proximo || undefined,
          voice_settings: { stability: cfg.estabilidade, similarity_boost: cfg.similaridade, style: cfg.estilo, speed: cfg.velocidade, use_speaker_boost: true }
        }),
        signal: AbortSignal.timeout(120000)
      });
    } catch (e) {
      if (tentativa < 3) { await new Promise((ok) => setTimeout(ok, 4000 * tentativa)); continue; }
      throw pararCom(`Não consegui falar com a ElevenLabs (sem internet?): ${e.message}`);
    }
    if (res.ok) {
      const r = await res.json();
      fs.writeFileSync(mp3, Buffer.from(r.audio_base64, 'base64'));
      fs.writeFileSync(json, JSON.stringify(r.alignment));
      return { mp3, al: r.alignment, novo: true };
    }
    const corpo = await res.text();
    const { tipo, msg } = V.erroElevenlabs(res.status, corpo);
    if ((tipo === 'ocupado' || res.status >= 500) && tentativa < 3) { await new Promise((ok) => setTimeout(ok, 5000 * tentativa)); continue; }
    throw pararCom(V.explicarElevenlabs(tipo, msg, { id: cfg.id, pasta: path.relative(RAIZ, pasta) }));
  }
}

async function narrarElevenlabs() {
  if (!voz.id) throw pararCom('Falta o "id" da voz da ElevenLabs em "voz" no roteiro.json (o mesmo do bloco "No roteiro.json" de canal/identidade.md). npm run vozes lista as vozes da conta.');
  const fs_ = roteiro.frases.map((f) => limpo(f.texto));
  // Antes de gastar: quanto falta narrar (frase já guardada não gasta) e quanto sobra no plano
  // (os modelos flash e turbo gastam meio crédito por letra)
  const porLetra = /flash|turbo/.test(cfgElevenlabs().modelo) ? 0.5 : 1;
  const falta = Math.ceil(porLetra * fs_.filter((t) => { const g = guardadoElevenlabs(t); return !(fs.existsSync(g.mp3) && fs.existsSync(g.json)); }).reduce((n, t) => n + t.length, 0));
  if (falta) {
    const c = await V.contaElevenlabs(process.env.ELEVENLABS_API_KEY);
    if (c.ok && c.restante < falta && !c.estende) {
      throw pararCom(V.explicarElevenlabs('creditos', `este vídeo precisa de uns ${V.mil(falta)} caracteres e sobram ${V.mil(c.restante)} no plano`, { renova: c.renova, pasta: path.relative(RAIZ, pasta) }));
    }
    if (!c.ok && c.erro === 'chave') throw pararCom(V.explicarElevenlabs('chave'));
    if (c.ok) console.log(`ElevenLabs: vai gastar uns ${V.mil(falta)} caracteres (sobram ${V.mil(c.restante)} no plano)`);
  }
  const brutos = [];
  let gastos = 0;
  for (let i = 0; i < fs_.length; i++) {
    const r = await elevenlabs(fs_[i], fs_[i - 1], fs_[i + 1]);
    if (r.novo) { gastos += fs_[i].length; process.stdout.write(`  voz ${i + 1}/${fs_.length}\r`); }
    brutos.push(r);
  }
  if (gastos) {
    console.log(`ElevenLabs: ${gastos} caracteres gastos`);
    // O gasto do vídeo (videos/<tema>/custos.json, que o painel mostra): os créditos e quanto sobrou no plano
    const c = await V.contaElevenlabs(process.env.ELEVENLABS_API_KEY).catch(() => ({}));
    require('./custos').anotarElevenlabs(pasta, { caracteres: gastos, creditos: Math.ceil(porLetra * gastos), modelo: cfgElevenlabs().modelo, sobraram: c.ok ? c.restante : null });
  }

  // Palavras a partir do tempo de cada letra; corta o silêncio das pontas
  const fatias = brutos.map(({ mp3, al }, i) => {
    const ch = al.characters, ini = al.character_start_times_seconds, fim = al.character_end_times_seconds;
    const pal = [];
    let atual = null;
    ch.forEach((c, k) => {
      if (/\s/.test(c)) { atual = null; return; }
      if (!atual) { atual = { inicio: ini[k], fim: fim[k] }; pal.push(atual); }
      atual.fim = fim[k];
    });
    const s0 = Math.max(0, pal[0].inicio - 0.03), e0 = Math.min(duracao(mp3), pal[pal.length - 1].fim + 0.1);
    const tk = tokens(roteiro.frases[i].texto);
    if (tk.length !== pal.length) console.warn(`aviso: frase ${i + 1} tem ${tk.length} palavras no texto e ${pal.length} no áudio`);
    return { mp3, s0, e0, pal: pal.map((p, j) => ({ ...(tk[j] || { texto: '', chave: false }), inicio: p.inicio - s0, fim: p.fim - s0 })) };
  });

  const palavras = fatias.reduce((n, f) => n + f.pal.length, 0);
  const natural = fatias.reduce((s, f) => s + (f.e0 - f.s0) + PAUSA, 0);
  const fator = fatorVoz(palavras, natural);

  return fatias.map((f, i) => {
    const wav = path.join(tmp, `frase-${i}.wav`);
    ffmpeg(['-i', f.mp3, '-af', `atrim=${f.s0.toFixed(3)}:${f.e0.toFixed(3)},asetpts=PTS-STARTPTS,atempo=${fator.toFixed(4)}`, '-ar', '48000', '-ac', '1', wav]);
    return { wav, dur: duracao(wav), palavras: f.pal.map((p) => ({ ...p, inicio: p.inicio / fator, fim: p.fim / fator })) };
  });
}

// VoiceStudio (grátis, roda no computador): a API no jeito da OpenAI (POST /v1/audio/speech). Cada frase vira um wav
// guardado em <pasta>/narracao/, já sem o silêncio das pontas
async function voicestudio(texto) {
  const cfg = { id: voz.id || 'default', modelo: voz.modelo || 'omnivoice', idioma: voz.idioma || 'pt-BR', velocidade: voz.velocidade ?? 1 };
  const hash = crypto.createHash('sha1').update(JSON.stringify(['voicestudio', cfg, texto])).digest('hex').slice(0, 16);
  const dir = path.join(pasta, 'narracao');
  fs.mkdirSync(dir, { recursive: true });
  const wav = path.join(dir, hash + '.wav');
  if (fs.existsSync(wav)) return { wav, novo: false };
  let res;
  try {
    res = await fetch(`${V.voicestudioUrl()}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: cfg.modelo, input: texto, voice: cfg.id, response_format: 'wav', speed: cfg.velocidade, language: cfg.idioma }),
      signal: AbortSignal.timeout(300000)
    });
  } catch (e) {
    throw pararCom(V.explicarVoicestudio(null));
  }
  if (!res.ok) throw pararCom(V.explicarVoicestudio(res.status, await res.text(), { id: cfg.id }));
  const bruto = path.join(tmp, `vs-${hash}.wav`), pronto = path.join(tmp, `vs-${hash}-pronto.wav`);
  fs.writeFileSync(bruto, Buffer.from(await res.arrayBuffer()));
  const corta = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.03';
  ffmpeg(['-i', bruto, '-af', `${corta},areverse,${corta},areverse,apad=pad_dur=0.06`, '-ar', '48000', '-ac', '1', pronto]);
  fs.copyFileSync(pronto, wav);
  return { wav, novo: true };
}

async function narrarVoicestudio() {
  const textos = roteiro.frases.map((f) => limpo(f.texto));
  const brutos = [];
  let novas = 0;
  for (let i = 0; i < textos.length; i++) {
    const r = await voicestudio(textos[i]);
    if (r.novo) { novas++; process.stdout.write(`  voz ${i + 1}/${textos.length}\r`); }
    brutos.push(r.wav);
  }
  if (novas) console.log(`VoiceStudio: ${novas} frases narradas`);
  const palavras = roteiro.frases.reduce((n, f) => n + tokens(f.texto).length, 0);
  const natural = brutos.reduce((s, a) => s + duracao(a) + PAUSA, 0);
  const fator = fatorVoz(palavras, natural);
  return brutos.map((a, i) => {
    const wav = path.join(tmp, `frase-${i}.wav`);
    ffmpeg(['-i', a, '-af', `atempo=${fator.toFixed(4)}`, '-ar', '48000', '-ac', '1', wav]);
    const dur = duracao(wav);
    return { wav, dur, palavras: silabas(roteiro.frases[i].texto, dur) };
  });
}

function montarTimeline(audios) {
  let t = 0.15;
  const frases = roteiro.frases.map((f, i) => {
    const { dur, palavras } = audios[i];
    const { texto, ...resto } = f;
    const fr = { ...resto, texto: limpo(texto), marcado: texto, inicio: t, fim: t + dur, palavras: palavras.map((p) => ({ ...p, inicio: t + p.inicio, fim: t + p.fim })) };
    t += dur + PAUSA;
    return fr;
  });
  if (roteiro.cauda) {
    frases.push({ texto: '', marcado: '', plano: roteiro.cauda.plano, inicio: t, fim: t + roteiro.cauda.segundos, palavras: [] });
    t += roteiro.cauda.segundos;
  }
  return { frases, total: t, cta: roteiro.cta || '', capa: roteiro.capa || '', estilo: roteiro.estilo || '' };
}

// ---------- Som ----------

// motor/sons/<nome>.wav|ogg; variações <nome>-1, <nome>-2... são sorteadas pelo instante (sempre igual)
const biblioteca = fs.existsSync(SONS) ? fs.readdirSync(SONS).filter((f) => /\.(wav|ogg|mp3)$/.test(f)) : [];
function arquivoSom(nome, em) {
  const op = biblioteca.filter((f) => f.replace(/\.\w+$/, '').replace(/-\d+$/, '') === nome).sort();
  if (!op.length) return null;
  return path.join(SONS, op[Math.floor(em * 7.31) % op.length]);
}

function mixar(audios, tl, sons, saidaVoz, saidaFinal, janela) {
  // Voz
  const a = [];
  audios.forEach((x) => a.push('-i', x.wav));
  const fv = audios.map((_, i) => `[${i}]adelay=delays=${Math.round(tl.frases[i].inicio * 1000)}:all=1[a${i}]`);
  fv.push(`${audios.map((_, i) => `[a${i}]`).join('')}amix=inputs=${audios.length}:normalize=0,apad=whole_dur=${tl.total.toFixed(3)}[out]`);
  fs.writeFileSync(path.join(tmp, 'voz.txt'), fv.join(';'));
  ffmpeg([...a, '-filter_complex_script', path.join(tmp, 'voz.txt'), '-map', '[out]', '-ar', '48000', '-ac', '1', saidaVoz]);

  // Efeitos
  const usados = sons.map((s) => ({ ...s, arq: arquivoSom(s.nome, s.em) })).filter((s) => s.arq && s.em < tl.total);
  const faltando = [...new Set(sons.filter((s) => !arquivoSom(s.nome, s.em)).map((s) => s.nome))];
  if (faltando.length) console.warn('sons sem arquivo em motor/sons/:', faltando.join(', '));
  const efeitos = path.join(tmp, 'efeitos.wav');
  if (usados.length) {
    const e = [];
    usados.forEach((s) => e.push('-i', s.arq));
    const fe = usados.map((s, i) => {
      const corte = s.dur ? `atrim=0:${s.dur},afade=t=out:st=${Math.max(0, s.dur - 0.25)}:d=0.25,` : '';
      return `[${i}]aformat=sample_rates=48000:channel_layouts=stereo,${corte}volume=${s.ganho},adelay=delays=${Math.round(s.em * 1000)}:all=1[e${i}]`;
    });
    fe.push(`${usados.map((_, i) => `[e${i}]`).join('')}amix=inputs=${usados.length}:normalize=0,apad=whole_dur=${tl.total.toFixed(3)}[out]`);
    fs.writeFileSync(path.join(tmp, 'efeitos.txt'), fe.join(';'));
    ffmpeg([...e, '-filter_complex_script', path.join(tmp, 'efeitos.txt'), '-map', '[out]', '-ar', '48000', '-ac', '2', '-t', tl.total.toFixed(3), efeitos]);
  } else ffmpeg(['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', tl.total.toFixed(3), efeitos]);

  // Voz + efeitos + trilha (abaixa um pouco quando a voz fala), normalizado em −14 LUFS
  const ent = ['-i', saidaVoz, '-i', efeitos];
  const cfgEf = roteiro.efeitos || {};
  const ganhoEf = cfgEf.ganho ?? (cfgEf.abaixa ? 1.2 : 0.855);
  // abaixa: os efeitos ficam por baixo da voz. Compressor e limitador no barramento (som longo e forte e vários
  // sons juntos não estouram) e abaixam quando a voz fala, como a trilha
  let f = cfgEf.abaixa
    ? `[0]aformat=channel_layouts=stereo,asplit=3[voz][sc][scEf];[1]volume=${ganhoEf},` +
      'acompressor=threshold=0.06:ratio=4:attack=5:release=150,alimiter=limit=0.18:attack=3:release=80:level=false[efc];' +
      '[efc][scEf]sidechaincompress=threshold=0.012:ratio=3:attack=8:release=350[ef];'
    : `[0]aformat=channel_layouts=stereo,asplit[voz][sc];[1]volume=${ganhoEf}[ef];`;
  const trilha = roteiro.trilha && arquivoSom(roteiro.trilha.arquivo, 0);
  if (trilha) {
    ent.push('-stream_loop', '-1', '-i', trilha);
    f += `[2]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:${tl.total.toFixed(3)},volume=${roteiro.trilha.ganho ?? 0.25},` +
      `afade=t=in:d=0.6,afade=t=out:st=${(tl.total - 1.5).toFixed(3)}:d=1.5[tr];` +
      '[tr][sc]sidechaincompress=threshold=0.04:ratio=3:attack=30:release=400[trd];[voz][ef][trd]amix=inputs=3:normalize=0';
  } else f += '[sc]anullsink;[voz][ef]amix=inputs=2:normalize=0';
  if (janela) f += `,atrim=${janela[0]}:${janela[1]},asetpts=PTS-STARTPTS`;
  // Folga de 3 dB: o AAC sobe o pico ~1,5 dB nos transientes (cliques, chimbal)
  f += ',loudnorm=I=-14:TP=-3:LRA=11,aresample=48000,alimiter=limit=0.66:level=false:attack=1[out]';
  ffmpeg([...ent, '-filter_complex', f, '-map', '[out]', '-ar', '48000', '-ac', '2', saidaFinal]);
}

const PAGINA = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&display=block">
<style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}
#palco{position:relative;width:1080px;height:1920px;overflow:hidden}</style>
</head><body><div id="palco"><div class="legenda" id="legenda"></div></div></body></html>`;

// Logo do canal (canal/logo.png) pro cartão de seguir do fim; sem logo, o cartão mostra a inicial do canal
function logoDataUrl() {
  const arq = ['logo.png', 'logo.jpg'].map((n) => path.join(RAIZ, 'canal', n)).find((a) => fs.existsSync(a));
  if (!arq) return '';
  return `data:image/${arq.endsWith('.png') ? 'png' : 'jpeg'};base64,` + fs.readFileSync(arq).toString('base64');
}

// O resto do motor, carregado depois do kit.js: os modelos 3D prontos (motor/modelos/*.js), os bichos e os cenários
// prontos (o motor/ver-cenarios.js carrega a mesma lista)
function motorExtra() {
  const modelos = path.join(__dirname, 'modelos');
  const prontos = fs.existsSync(modelos) ? fs.readdirSync(modelos).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(modelos, f)) : [];
  // Por último, as peças próprias do canal (canal/pecas/*.js): o que a IA fez só pro canal fica fora do motor, e a
  // versão nova da Máquina não apaga
  const pecas = path.join(RAIZ, 'canal', 'pecas');
  const proprias = fs.existsSync(pecas) ? fs.readdirSync(pecas).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(pecas, f)) : [];
  return [...prontos, ...['bichos.js', 'cenarios.js'].map((f) => path.join(__dirname, f)).filter((f) => fs.existsSync(f)), ...proprias];
}

function arquivoCena() {
  const propria = path.join(pasta, 'cena.js');
  if (fs.existsSync(propria)) return propria;
  const modelo = path.join(__dirname, 'cenas-modelo', (roteiro.modelo || 'montagem') + '.js');
  if (!fs.existsSync(modelo)) throw new Error(`Cena-modelo "${roteiro.modelo}" não existe em motor/cenas-modelo/`);
  return modelo;
}

// ---------- Revisão das cenas ----------
// Confere, frase por frase, se cada uma tem a sua cena: câmera mexendo e diferente da frase anterior, personagem
// atuando e inteiro no quadro, o que a frase mostra (o "mostra" do roteiro.json) aparecendo na tela, alguma coisa
// acontecendo (som, texto) e nenhum texto em cima de outro ou da legenda.
// Pega 4 instantes de cada frase. Com folha: uma imagem por frase, numa folha só (testes/folha.jpg)

const NOME_TEXTO = { rotulo: 'rótulo', etiqueta: 'etiqueta', marca: '✓/✗', contador: 'contador', seguir: 'cartão de seguir',
  'capa-titulo': 'pergunta da capa', cta: 'chamada', medida: 'medida', 'medida-txt': 'medida', termometro: 'termômetro', circulo: 'círculo' };
const LEGENDA = [100, 1165, 980, 1315]; // onde a legenda palavra por palavra aparece
const distancia = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const angulo = (a, b) => (Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])) * 180) / Math.PI;
const diferenca = (a, b) => a.reduce((s, v, k) => s + Math.abs(v - b[k]), 0) / a.length; // 0 a 255 por ponto
const cruza = (a, b) => {
  const x = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), y = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  const area = (r) => Math.max(1, (r[2] - r[0]) * (r[3] - r[1]));
  return (x * y) / Math.min(area(a), area(b));
};

async function revisarCenas(page, tl, comFolha) {
  const frases = tl.frases;
  const r = [];
  for (let i = 0; i < frases.length; i++) {
    const f = frases[i], fim = i + 1 < frases.length ? frases[i + 1].inicio : tl.total, dur = fim - f.inicio;
    const mostra = [].concat(f.mostra || []).filter((n) => n && typeof n === 'string');
    const amostras = [];
    for (const x of [0.1, 0.37, 0.63, 0.9]) {
      await page.evaluate((t) => K.quadro(t), f.inicio + x * dur);
      amostras.push(await page.evaluate((m) => Object.assign(K.medir(m), { mini: K.miniatura() }), mostra));
    }
    let imagem = null;
    if (comFolha) {
      await page.evaluate((t) => K.quadro(t), f.inicio + 0.6 * dur);
      imagem = (await page.screenshot({ type: 'jpeg', quality: 60 })).toString('base64');
    }
    r.push({ f, fim, dur, A: amostras, mostra, imagem, corrigir: [], conferir: [], tem: [] });
  }
  const sons = await page.evaluate(() => K.sons);
  const comCena = fs.existsSync(path.join(pasta, 'cena.js'));
  const nomesDaCena = [...new Set(await page.evaluate(() => (K.nomesDasPecas ? K.nomesDasPecas() : [])))];
  const algumMostra = r.some((x) => x.mostra.length);

  r.forEach((x, k) => {
    const { A, f } = x, cauda = !f.texto;
    // Câmera: mexendo na frase e diferente da frase anterior
    const mexe = A.some((a) => distancia(a.cam.pos, A[0].cam.pos) > 0.04 || angulo(a.cam.dir, A[0].cam.dir) > 0.6);
    if (mexe) x.tem.push('câmera mexendo');
    else if (!cauda) x.corrigir.push('câmera parada: use K.filmar(alvo, "chegando" (ou outro movimento), B.p)');
    if (k > 0 && !cauda) {
      // A mesma câmera: todo instante desta frase perto de algum instante da anterior. Frase curta (o "Esse é o X")
      // pode continuar o enquadramento: só pra conferir
      const B0 = r[k - 1].A;
      const igual = A.every((a) => B0.some((b) => distancia(a.cam.pos, b.cam.pos) < 0.5 && angulo(a.cam.dir, b.cam.dir) < 6));
      const lista = x.dur < 1.6 ? x.conferir : x.corrigir;
      if (igual) lista.push(`mesma câmera da frase ${k}: mude o plano (perto ↔ aberto), o lado ou a altura`);
      else if (diferenca(B0[2].mini, A[2].mini) < 3) lista.push(`imagem quase igual à da frase ${k}: mostre outra coisa (outra peça, outro lugar, outro ângulo)`);
    }
    if (!cauda && diferenca(A[0].mini, A[3].mini) < 1.2) x.conferir.push('a imagem quase não muda durante a frase');
    // Personagem: atuando, inteiro e sem ficar colado na câmera
    // (dentro: quanto da largura dele está na tela; fora de propósito, saindo pela borda, só pra conferir)
    let aparece = false, atua = false, colado = false, fora = false, cabeca = false;
    const dentro = (b) => Math.max(0, Math.min(1080, b.tela[2]) - Math.max(0, b.tela[0])) / Math.max(1, b.tela[2] - b.tela[0]);
    A[0].bonecos.forEach((_, j) => {
      const v = A.map((a) => a.bonecos[j]).filter((b) => b && b.visivel && dentro(b) > 0);
      if (!v.length) return;
      aparece = true;
      if (v.some((b) => b.suando || Math.max(...b.pose.map(Math.abs)) > 0.3) || v.some((b) => distancia(b.pos, v[0].pos) > 0.25)) atua = true;
      if (v.some((b) => b.atras || (b.tela[3] - b.tela[1] > 0.85 * 1920 && dentro(b) > 0.5))) colado = true;
      if (v.filter((b) => dentro(b) < 0.4).length > v.length / 2) fora = true;
      if (v.some((b) => b.tela[1] < -20 && b.tela[3] < 1920 && dentro(b) > 0.5)) cabeca = true;
    });
    if (!aparece) { if (!cauda && A[0].bonecos.length) x.conferir.push('o personagem não aparece'); }
    else if (atua) x.tem.push('personagem atuando');
    else x.corrigir.push('personagem parado: dê uma ação (menino.reagir("susto", B.t), apontar, andar, segurar...)');
    if (colado) x.corrigir.push('personagem colado na câmera: plano "medio" ou "aberto", ou afaste o personagem');
    if (fora) x.conferir.push('o personagem fica quase todo fora da tela (se não foi de propósito, afaste a câmera ou mude ele de lugar)');
    if (cabeca) x.corrigir.push('a cabeça do personagem sai por cima da tela: afaste a câmera ou mire mais alto');
    // Alguma coisa acontecendo: som (peça caindo, encaixe, texto entrando) ou texto na tela
    const sonsFrase = sons.filter((s) => s.em >= f.inicio - 0.05 && s.em < x.fim);
    const textos = new Set(A.flatMap((a) => a.textos.map((t) => NOME_TEXTO[t.tipo] || t.tipo)));
    if (sonsFrase.length) x.tem.push(`${sonsFrase.length} ${sonsFrase.length > 1 ? 'sons' : 'som'}`);
    if (textos.size) x.tem.push(`texto: ${[...textos].join(', ')}`);
    if (!cauda && !sonsFrase.length && !textos.size) x.corrigir.push('nada acontece: ponha uma peça entrando (K.entrar), uma falha (K.falhar), um efeito, uma etiqueta ou um som');
    // O que a frase mostra (o "mostra" do roteiro.json, a linha NA TELA da ficha de cena): cada coisa aparece, no
    // quadro e num tamanho que dá pra ver. Vale depois do começo da frase (a peça pode entrar na palavra)
    const vistos = [];
    x.mostra.forEach((nome, j) => {
      const v = A.slice(1).map((a) => (a.pecas || [])[j] || {});
      if (!v[0].achou) {
        const lista = nomesDaCena.filter((n) => !/\d$/.test(n)).slice(0, 24).join(', ');
        return x.corrigir.push(`"${nome}" está no "mostra", mas nenhuma peça do cena.js tem esse nome: use o nome do K.pecas ou de um objeto do cenário, ou dê o nome no montar com K.nomear('${nome}', peça)${lista ? ` (os nomes que existem: ${lista})` : ''}`);
      }
      if (!v.some((p) => p.visivel)) return x.corrigir.push(`${nome} não aparece nesta frase (está escondida ou só entra numa frase depois): confira o K.entraNo dela e se algum .visible = false esconde`);
      // No quadro: quase inteira (60%), ou grande na tela (um close de uma parte dela)
      const boas = v.filter((p) => p.visivel && !p.atras && (p.dentro >= 0.6 || p.ocupa >= 0.2 || p.tam >= 0.5));
      if (!boas.length) {
        return x.corrigir.push(v.some((p) => p.visivel && !p.atras && p.dentro > 0.05)
          ? `${nome} aparece cortada pela borda da tela (só um pedaço): ponha ${nome} no alvo do K.filmar desta frase, ou afaste a câmera (plano "medio" ou "aberto")`
          : `a câmera não mostra ${nome} (fica fora do quadro ou atrás da câmera): ponha ${nome} no alvo do K.filmar desta frase`);
      }
      if (Math.max(...boas.map((p) => p.tam)) < 0.06) x.conferir.push(`${nome} aparece pequena demais: plano "perto" ou "detalhe", ou só ela no alvo do K.filmar`);
      else vistos.push(nome);
    });
    if (vistos.length) x.tem.push(`mostra ${vistos.join(', ')}`);
    if (comCena && algumMostra && !cauda && !x.mostra.length) x.corrigir.push('falta o "mostra" desta frase no roteiro.json: a lista do que tem que aparecer na tela (a linha NA TELA da ficha de cena), ex. "mostra": ["coluna", "personagem"]');
    // Frase longa: precisa de uma segunda coisa acontecendo
    if (!cauda && x.dur > 4.5) {
      const meio = f.inicio + x.dur * 0.5;
      const noComeco = new Set(A.slice(0, 2).flatMap((a) => a.textos.map((t) => t.tipo)));
      const novo = sonsFrase.some((s) => s.em >= meio) || A.slice(2).some((a) => a.textos.some((t) => !noComeco.has(t.tipo)));
      if (!novo) x.conferir.push(`frase longa (${x.dur.toFixed(1).replace('.', ',')} s) sem nada novo na 2ª metade: ponha outra coisa acontecendo na palavra certa (K.quando)`);
    }
    // Textos encavalados, em cima da legenda ou demais na tela
    const encav = new Set();
    let demais = false;
    A.forEach((a) => {
      const ts = a.textos;
      if (ts.length > 3) demais = true;
      ts.forEach((t, m) => {
        if (t.tipo !== 'seguir' && cruza(t.caixa, LEGENDA) > 0.2) encav.add(`${NOME_TEXTO[t.tipo] || t.tipo} em cima da legenda`);
        ts.slice(m + 1).forEach((u) => { if (cruza(t.caixa, u.caixa) > 0.2) encav.add(`${NOME_TEXTO[t.tipo] || t.tipo} em cima de ${NOME_TEXTO[u.tipo] || u.tipo}`); });
      });
    });
    encav.forEach((e) => x.corrigir.push(e));
    if (demais) x.conferir.push('mais de 3 textos na tela ao mesmo tempo');
  });

  // Cena própria: cada frase com o seu plano (o mesmo plano em frases separadas costuma ser a mesma animação)
  const repetidos = [];
  if (comCena) {
    const ondes = {};
    r.forEach((x, k) => { if (x.f.texto) (ondes[x.f.plano] = ondes[x.f.plano] || []).push(k + 1); });
    Object.entries(ondes).forEach(([pl, ks]) => { if (ks.some((n, j) => j > 0 && n !== ks[j - 1] + 1)) repetidos.push(`o plano "${pl}" aparece nas frases ${ks.join(', ')}: cada frase deve ter o seu plano e a sua cena`); });
  }
  const conserta = frases.filter((f) => f.jogo === 'conserta').length;
  const gerais = [...repetidos];
  if (conserta > 2) gerais.push(`${conserta} ⏪ (jogo "conserta"): o máximo é 2 por vídeo; troque os outros por "corrige"`);
  if (comCena && !algumMostra) gerais.push('nenhuma frase tem "mostra" no roteiro.json: em cada frase, a lista do que tem que aparecer na tela (a linha NA TELA da ficha de cena, no roteiro.md), ex. "mostra": ["coluna", "personagem"]. É assim que a revisão confere se a câmera mostra a peça certa');
  const avisoGeral = [];
  if (comCena && !frases.some((f) => f.jogo)) avisoGeral.push('nenhum momento de videogame (jogo: "falha" na frase do problema e "corrige" na da solução)');

  const nCorrigir = r.reduce((n, x) => n + x.corrigir.length, 0) + gerais.length;
  const nConferir = r.reduce((n, x) => n + x.conferir.length, 0) + avisoGeral.length;
  const seg = (t) => t.toFixed(1).replace('.', ',');
  const linhas = [`REVISÃO DAS CENAS: ${path.relative(RAIZ, pasta) || pasta} (${frases.filter((f) => f.texto).length} frases)`, ''];
  r.forEach((x, k) => {
    const txt = x.f.texto ? `"${x.f.texto.length > 46 ? x.f.texto.slice(0, 45) + '…' : x.f.texto}"` : '(cauda)';
    linhas.push(`${k + 1}. ${x.f.plano} (${seg(x.f.inicio)} a ${seg(x.fim)} s) ${txt}`);
    linhas.push(`   tem: ${x.tem.join(' · ') || 'nada'}`);
    x.corrigir.forEach((c) => linhas.push(`   [corrigir] ${c}`));
    x.conferir.forEach((c) => linhas.push(`   [conferir] ${c}`));
  });
  if (gerais.length || avisoGeral.length) linhas.push('', 'NO VÍDEO TODO:');
  gerais.forEach((c) => linhas.push(`   [corrigir] ${c}`));
  avisoGeral.forEach((c) => linhas.push(`   [conferir] ${c}`));
  linhas.push('', nCorrigir
    ? `RESULTADO: CORRIGIR (${nCorrigir} ${nCorrigir > 1 ? 'coisas' : 'coisa'} pra corrigir, ${nConferir} pra conferir). Ajuste o cena.js e rode --revisar de novo antes do vídeo completo.`
    : `RESULTADO: APROVADO${nConferir ? ` (${nConferir} ${nConferir > 1 ? 'coisas' : 'coisa'} pra conferir na folha: veja se foram de propósito)` : ''}.`);
  // Só o que tem pra corrigir (o vídeo completo mostra assim quando para)
  const soCorrigir = [];
  r.forEach((x, k) => { if (x.corrigir.length) soCorrigir.push(`${k + 1}. ${x.f.plano}`, ...x.corrigir.map((c) => `   [corrigir] ${c}`)); });
  if (gerais.length) soCorrigir.push('NO VÍDEO TODO:', ...gerais.map((c) => `   [corrigir] ${c}`));
  return { linhas, soCorrigir, nCorrigir, nConferir, r };
}

// Folha: uma imagem por frase, com o número, o plano e o começo do texto (borda vermelha = tem o que corrigir)
async function montarFolha(browser, rev, arq) {
  const cols = rev.r.length > 12 ? 5 : 4, larg = Math.floor((1080 - (cols + 1) * 12) / cols), alt = Math.round((larg * 16) / 9);
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#1d1f24;width:1080px;font-family:Montserrat,Arial,sans-serif;color:#fff}
h1{font-size:30px;margin:18px 16px 4px}p.s{margin:0 16px;color:#b9bec8;font-size:20px}
.g{display:grid;grid-template-columns:repeat(${cols},${larg}px);gap:12px;padding:12px}
.c{background:#2a2d34;border-radius:12px;overflow:hidden;border:5px solid #2a2d34}.c.ruim{border-color:#e8352b}
.c img{display:block;width:100%;height:${alt}px;object-fit:cover}
.t{padding:8px 10px 10px;font-size:19px;font-weight:800}.t b{color:#f5c518}.t i{display:block;font-style:normal;font-weight:500;color:#cfd3da;font-size:16px;margin-top:3px}
.t em{display:block;font-style:normal;color:#ff8a80;font-size:16px;margin-top:4px}
</style></head><body><h1>${esc(path.basename(pasta))}: uma imagem por frase</h1>
<p class="s">${rev.nCorrigir ? `${rev.nCorrigir} pra corrigir (borda vermelha)` : 'Nada pra corrigir'} · cada frase deve ter uma cena diferente</p>
<div class="g">${rev.r.map((x, k) => `<div class="c${x.corrigir.length ? ' ruim' : ''}"><img src="data:image/jpeg;base64,${x.imagem}"><div class="t"><b>${k + 1}.</b> ${esc(x.f.plano)}
<i>${esc(x.f.texto ? x.f.texto.slice(0, 60) : '(cauda)')}</i>${x.corrigir.length ? `<em>${x.corrigir.length} pra corrigir</em>` : ''}</div></div>`).join('')}</div></body></html>`;
  const p = await browser.newPage({ viewport: { width: 1080, height: 900 } });
  await p.setContent(html, { waitUntil: 'load' });
  await p.screenshot({ path: arq, type: 'jpeg', quality: 82, fullPage: true });
  await p.close();
}

// Cada imagem da folha, solta (testes/cenas/01.jpg...), e a lista com a frase de cada uma (testes/cenas.json): o painel
// (npm run painel) mostra as cenas assim, pra pessoa dar a opinião de cena por cena
function salvarCenas(rev) {
  const dir = emTestes('cenas');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cenas = rev.r.map((x, k) => {
    const arq = `${String(k + 1).padStart(2, '0')}.jpg`;
    fs.writeFileSync(path.join(dir, arq), Buffer.from(x.imagem, 'base64'));
    return { n: k + 1, plano: x.f.plano, texto: x.f.texto, inicio: +x.f.inicio.toFixed(2), fim: +x.fim.toFixed(2), imagem: `testes/cenas/${arq}`, corrigir: x.corrigir };
  });
  fs.writeFileSync(emTestes('cenas.json'), JSON.stringify({ feito: new Date().toISOString(), cenas }, null, 2));
}
// Antes do vídeo completo: a pessoa já deu a opinião das cenas de agora no painel (opiniao.json)? Só avisa
function avisoDaOpiniao() {
  const ler = (f) => { try { return JSON.parse(fs.readFileSync(path.join(pasta, f), 'utf8')); } catch { return null; } };
  const c = ler('testes/cenas.json'), op = ler('opiniao.json'), tema = path.basename(pasta);
  if (!c) return '';
  if (!op || op.cenasDe !== c.feito || !(op.cenas || []).length) {
    return `AVISO: a pessoa ainda não deu a opinião destas cenas no painel (npm run painel -- ${tema}). Se o jeito de trabalhar dela é ver cada etapa (canal/aprendizados.md), mostre as cenas antes do vídeo completo.`;
  }
  const mudar = op.cenas.filter((x) => x.opiniao === 'mudar').map((x) => x.cena);
  return mudar.length ? `AVISO: no painel, a pessoa pediu pra mudar ${mudar.length > 1 ? `as cenas ${mudar.join(', ')}` : `a cena ${mudar[0]}`} (npm run painel -- ${tema} --opiniao mostra o pedido). Arrume e rode o --revisar antes do vídeo completo.` : '';
}

(async () => {
  // Sem navegador não sai vídeo: para antes de gastar a voz
  const semNavegador = N.falta();
  if (semNavegador) throw Object.assign(new Error(semNavegador), { explicado: true, codigo: 4 });
  console.log(`narração (${{ teste: 'voz de teste do computador', elevenlabs: 'ElevenLabs', voicestudio: 'VoiceStudio' }[motor]})...`);
  const audios = motor === 'elevenlabs' ? await narrarElevenlabs() : motor === 'voicestudio' ? await narrarVoicestudio() : narrarTeste();
  const tl = montarTimeline(audios);
  tl.roteiro = roteiro;
  fs.writeFileSync(path.join(pasta, 'timeline.json'), JSON.stringify(tl, null, 2));
  const nPal = tl.frases.reduce((n, f) => n + f.palavras.length, 0);
  console.log(`duração: ${tl.total.toFixed(1)}s, ${nPal} palavras, ${(nPal / (tl.total / 60)).toFixed(0)} palavras/min`);
  if (tl.total > 180) console.warn('ATENÇÃO: passou de 3:00, o limite do YouTube Shorts. Encurte o roteiro.');

  // O Chromium da Máquina, o Edge ou o Chrome: o primeiro que abrir e desenhar 3D (motor/navegador.js)
  const { browser, canal: navegador, nome: nomeNavegador } = await N.abrir();
  if (navegador !== 'chromium') console.log(`navegador: ${nomeNavegador}`);
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('erro na cena:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('página:', m.text()); });
  await page.setContent(PAGINA, { waitUntil: 'networkidle' });
  await page.evaluate((logo) => { window.LOGO = logo; }, logoDataUrl());
  await page.addScriptTag({ path: path.join(RAIZ, 'node_modules', 'three', 'build', 'three.min.js') });
  await page.addScriptTag({ path: path.join(__dirname, 'kit.js') });
  for (const extra of motorExtra()) await page.addScriptTag({ path: extra });
  await page.addScriptTag({ path: arquivoCena() });
  await page.evaluate(() => Promise.all([document.fonts.load('900 80px Montserrat'), document.fonts.load('800 80px Montserrat')]));
  await page.evaluate((tl) => {
    K.init();
    K.preparar(tl);
    CENA.montar(tl);
  }, tl);

  const quadro = async (t, arq) => {
    await page.evaluate((t) => K.quadro(t), t);
    await page.screenshot({ path: arq, type: 'jpeg', quality: 92 });
  };

  let rev = null;
  if (revisar) {
    rev = await revisarCenas(page, tl, true);
    const folha = emTestes('folha.jpg');
    await montarFolha(browser, rev, folha);
    salvarCenas(rev);
    fs.writeFileSync(emTestes('revisao.txt'), rev.linhas.join('\n') + '\n');
    console.log('\n' + rev.linhas.join('\n'));
    console.log(`\nFolha (uma imagem por frase): ${folha}\nEste relatório também fica em ${emTestes('revisao.txt')}`);
  } else if (capa) {
    await page.evaluate((titulo) => K.capa(titulo), roteiro.capa || roteiro.titulo);
    await page.screenshot({ path: path.join(pasta, 'capa.png'), type: 'png' });
    console.log('capa salva:', path.join(pasta, 'capa.png'));
  } else if (previa) {
    for (const t of previa) await quadro(t, emTestes(`previa-${t.toFixed(1)}s.jpg`));
    console.log('prévias salvas em', path.join(pasta, 'testes'));
  } else {
    // Antes do vídeo completo, a revisão rápida das cenas. Com cena própria (cena.js) e algo pra corrigir, para aqui: o
    // vídeo completo leva minutos e sairia com a cena errada (--mesmo-assim faz assim mesmo, quando a pessoa pede). Na
    // montagem (o jeito por chat) só avisa
    if (!trecho && !process.argv.includes('--sem-revisar')) {
      const rev = await revisarCenas(page, tl, false);
      if (rev.nCorrigir && fs.existsSync(path.join(pasta, 'cena.js')) && !process.argv.includes('--mesmo-assim')) {
        console.log('\n' + rev.soCorrigir.join('\n'));
        const e = new Error(`O VÍDEO COMPLETO NÃO FOI FEITO: a revisão das cenas achou ${rev.nCorrigir} ${rev.nCorrigir > 1 ? 'coisas' : 'coisa'} pra corrigir (a lista está acima).\nPRA IA: arrume cada [corrigir] no cena.js (ou no "mostra" do roteiro.json) e rode node motor/render.js ${path.relative(RAIZ, pasta) || pasta} --voz-teste --revisar até dar APROVADO; depois, o vídeo completo de novo (a voz que já foi feita não gasta de novo). Só se a pessoa pedir pra fazer assim mesmo, com os erros: o mesmo comando com --mesmo-assim.`);
        e.explicado = true;
        e.codigo = 5;
        throw e;
      }
      if (rev.nCorrigir) console.warn(`ATENÇÃO: a revisão das cenas achou ${rev.nCorrigir} ${rev.nCorrigir > 1 ? 'coisas' : 'coisa'} pra corrigir (rode com --revisar pra ver quais). Fazendo o vídeo assim mesmo.`);
      else console.log('revisão das cenas: aprovada');
      const aviso = avisoDaOpiniao();
      if (aviso) console.warn(aviso);
    }
    const [a, b] = trecho || [0, tl.total];
    const f0 = Math.floor(a * FPS), f1 = Math.ceil(Math.min(b, tl.total) * FPS);
    const inicio = Date.now();
    for (let f = f0; f < f1; f++) {
      await quadro(f / FPS, path.join(tmp, `q${String(f - f0).padStart(5, '0')}.jpg`));
      if ((f - f0) % 150 === 0) console.log(`quadro ${f - f0}/${f1 - f0}`);
    }
    console.log(`quadros em ${((Date.now() - inicio) / 1000).toFixed(0)}s`);
    // Sons de toda a timeline: passa uma vez por cada plano pra registrar os eventos de cena fora do trecho
    if (trecho) for (let t = 0; t < tl.total; t += 0.25) await page.evaluate((t) => K.quadro(t), t);
    const sons = await page.evaluate(() => K.sons);
    // Capa nos primeiros quadros (0,1 s): o YouTube Shorts só deixa escolher a capa entre os quadros do vídeo
    const temCapa = !trecho && roteiro.capa && (await page.evaluate(() => !!(window.CENA && CENA.capa)));
    if (temCapa) {
      await page.evaluate((titulo) => K.capa(titulo), roteiro.capa);
      await page.screenshot({ path: path.join(pasta, 'capa.png'), type: 'png' });
      for (let f = 0; f < Math.round(FPS / 10); f++) await page.screenshot({ path: path.join(tmp, `q${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
      console.log('capa salva e colocada nos primeiros quadros');
    }
    tl.sons = sons;
    fs.writeFileSync(path.join(pasta, 'timeline.json'), JSON.stringify(tl, null, 2));
    console.log(`${sons.length} efeitos sonoros`);

    const final = path.join(tmp, 'final.wav');
    mixar(audios, tl, sons, path.join(tmp, 'narracao.wav'), final, trecho ? [a, Math.min(b, tl.total)] : null);
    // Sem a voz do canal (faltou a chave), o vídeo é só teste: não vira o video.mp4 da entrega
    const saida = trecho ? emTestes(`trecho-${a}s-${b}s.mp4`) : vozTeste || semVozDoCanal ? emTestes('video-voz-teste.mp4') : path.join(pasta, 'video.mp4');
    ffmpeg(['-framerate', String(FPS), '-i', path.join(tmp, 'q%05d.jpg'), '-i', final,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
      '-shortest', saida]);
    console.log('pronto:', saida);
    if (semVozDoCanal && !trecho) console.warn(`\nATENÇÃO: este é um vídeo de teste, com a voz do computador, porque ${semVozDoCanal}.\nO video.mp4 da entrega não foi feito. Resolva a voz e rode de novo, ou ponha "voz": {"motor": "teste"} no roteiro.json se a pessoa quiser mesmo a voz do computador.`);
    if (!trecho && !vozTeste && !semVozDoCanal && !fs.existsSync(path.join(pasta, 'publicacao.md'))) console.log('Falta o texto de postar: rode /publicar');
  }
  await browser.close();
  // O gasto do vídeo até aqui (os tokens da IA desta conversa, junto com os créditos da ElevenLabs que a narração anotou)
  if (!capa && !previa && !trecho && !revisar) {
    try {
      const K = require('./custos');
      K.medirIa(pasta);
      const l = K.resumo(pasta);
      if (l.length) console.log(`\nCUSTOS (em custos.json; npm run custos -- ${path.basename(pasta)} mede de novo na entrega):\n${l.map((x) => `- ${x}`).join('\n')}`);
    } catch { /* medir nunca atrapalha o vídeo */ }
  }
  // O painel abre sozinho no vídeo, sem depender da IA lembrar: nas cenas depois da revisão aprovada (antes disso a IA
  // ainda está arrumando, e o painel que já estiver aberto atualiza sozinho), no vídeo depois do vídeo completo
  // (--sem-painel não abre)
  const id = path.relative(path.join(RAIZ, 'videos'), pasta);
  if (revisar && rev && rev.nCorrigir) console.log('\nPAINEL: abro nas cenas quando a revisão der APROVADO (o painel que já estiver aberto atualiza sozinho).');
  else if ((revisar || (!capa && !previa && !trecho)) && !process.argv.includes('--sem-painel') && id && !/^\.\.|[\\/]/.test(id)) {
    const P = require('./abrir-painel');
    const url = P.abrir(revisar ? [id] : [id, '--pronto']);
    console.log('\n' + P.avisar(url, revisar ? 'as cenas do vídeo, uma por frase, pra ela clicar em Gostei ou Mudar em cada uma'
      : 'o vídeo pronto pra assistir e baixar, o texto de postar e as cenas').join('\n'));
  }
})().catch((e) => {
  // Erro já explicado: só a mensagem, sem a pilha do Node, e o código 3 (voz, créditos) ou 4 (navegador). O colar avisa
  // que o roteiro está certo
  console.error(e.explicado ? `\n${e.message}\n` : e);
  process.exit(e.explicado ? e.codigo || 3 : 1);
});
