// Voz do canal: a chave da ElevenLabs (lida do .env sem nunca mostrar), os créditos da conta, o VoiceStudio (voz grátis
// que roda no próprio computador) e a voz que a pessoa escolheu (bloco "No roteiro.json" de canal/identidade.md).
// Usado pelo render, pelo conferir, pelo colar, pelo testar-voz, pelo vozes e pelo chave.
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');

// O arquivo certo é o .env. Os outros são os erros mais comuns: IA que cria .env.local, Bloco de Notas que salva
// .env.txt, chave colada direto no .env.exemplo. A chave funciona do mesmo jeito e o conferir avisa pra renomear
const ARQUIVOS = ['.env', '.env.local', '.env.txt', 'env.txt', '.env.local.txt', 'env', '.env.exemplo'];
// Nomes da linha aceitos (o certo é ELEVENLABS_API_KEY), comparados sem _ e sem diferença de maiúscula
const NOMES = ['ELEVENLABSAPIKEY', 'ELEVENLABSKEY', 'ELEVENLABSAPI', 'ELEVENLABS', 'ELEVENAPIKEY', 'XIAPIKEY'];
// Chave da ElevenLabs: sk_ + letras e números (a nova) ou 32 hexadecimais (a antiga)
const JEITO_DE_CHAVE = /^(sk_[a-z0-9]{20,}|[a-f0-9]{32})$/i;
// 1 minuto de narração gasta uns 1.000 caracteres do plano
const CARACTERES_POR_MINUTO = 1000;

// Tira aspas, <>, espaços e comentário do fim: sobra só a chave
const limpar = (v) => String(v || '').trim().replace(/^["'<\s]+|["'>\s]+$/g, '').split(/\s+/)[0] || '';
// Linha ainda com o texto do modelo ("sua-chave", "cole aqui", "...")
const vazia = (v) => !v || (!JEITO_DE_CHAVE.test(v) && /sua|chave|cole|aqui|coloque|^\.+$|^x{3,}$|^sk_\.*$/i.test(v));

function lerArquivo(arq) {
  let txt;
  try { txt = fs.readFileSync(arq, 'utf8'); } catch { return null; }
  const vars = {};
  let solta = null;
  for (const bruta of txt.split(/\r?\n/)) {
    const linha = bruta.replace(/^﻿/, '').trim();
    if (!linha || linha.startsWith('#')) continue;
    const m = linha.match(/^(?:export\s+)?([A-Za-z0-9_.-]+)\s*[=:]\s*(.*)$/);
    if (m) vars[m[1]] = limpar(m[2]);
    else if (JEITO_DE_CHAVE.test(limpar(linha))) solta = limpar(linha); // só a chave, sem o "ELEVENLABS_API_KEY="
  }
  return { vars, solta };
}

// A chave da ElevenLabs: { chave, arquivo (onde achou), linha (o nome antes do =; null se colada sozinha), certo (no .env,
// na linha ELEVENLABS_API_KEY) }. Sem chave: { chave: null, arquivo (o arquivo que tem a linha, mas vazia) }
function chaveElevenlabs(raiz = RAIZ) {
  let comLinhaVazia = null;
  for (const nome of ARQUIVOS) {
    const r = lerArquivo(path.join(raiz, nome));
    if (!r) continue;
    for (const [k, v] of Object.entries(r.vars)) {
      if (!NOMES.includes(k.toUpperCase().replace(/[^A-Z]/g, ''))) continue;
      if (!vazia(v)) return { chave: v, arquivo: nome, linha: k, certo: nome === '.env' && k === 'ELEVENLABS_API_KEY' };
      if (nome !== '.env.exemplo') comLinhaVazia = comLinhaVazia || nome;
    }
    if (r.solta) return { chave: r.solta, arquivo: nome, linha: null, certo: false };
  }
  // Sem arquivo: a variável do sistema (quem configura assim sabe o que faz)
  const env = limpar(process.env.ELEVENLABS_API_KEY);
  if (!vazia(env)) return { chave: env, arquivo: null, certo: true };
  return { chave: null, arquivo: comLinhaVazia, certo: false };
}

// Põe no process.env o que estiver no .env (VOICESTUDIO_URL, por exemplo) e a chave da ElevenLabs, ache onde achar
function carregarEnv(raiz = RAIZ) {
  for (const nome of ARQUIVOS.filter((n) => n !== '.env.exemplo')) {
    const r = lerArquivo(path.join(raiz, nome));
    if (r) for (const [k, v] of Object.entries(r.vars)) if (!process.env[k] && v) process.env[k] = v;
  }
  const { chave } = chaveElevenlabs(raiz);
  if (chave) process.env.ELEVENLABS_API_KEY = chave;
  return chave;
}

// Bloco "No roteiro.json" de canal/identidade.md (a identidade que vai em todo vídeo)
function blocoDoCanal(raiz = RAIZ) {
  try {
    const txt = fs.readFileSync(path.join(raiz, 'canal/identidade.md'), 'utf8');
    const m = txt.match(/## No roteiro\.json[\s\S]*?```json\s*([\s\S]*?)```/);
    if (m) return JSON.parse(`{${m[1].trim().replace(/,\s*$/, '')}}`);
  } catch { /* identidade sem o bloco ou com erro de formato */ }
  return null;
}
// A voz que a pessoa escolheu: { motor: 'elevenlabs' | 'voicestudio' | 'teste', id, ... } ou null (ainda não escolheu)
function vozDoCanal(raiz = RAIZ) {
  const b = blocoDoCanal(raiz);
  return b && b.voz && b.voz.motor ? b.voz : null;
}

// ---------- ElevenLabs ----------

const dataBr = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const mil = (n) => Math.round(n).toLocaleString('pt-BR');

// Erro da ElevenLabs → tipo: 'creditos' | 'chave' | 'permissao' | 'bloqueio' | 'voz' | 'ocupado' | 'outro', e a mensagem dela
function erroElevenlabs(status, corpo) {
  let d = corpo;
  try { const j = JSON.parse(corpo); d = j.detail || j.error || j; } catch { /* corpo em texto */ }
  const cod = String((d && typeof d === 'object' && (d.status || d.code || d.type)) || '').toLowerCase();
  const msg = String((d && typeof d === 'object' ? d.message : d) || '').slice(0, 300);
  const tem = (re) => re.test(cod) || re.test(msg.toLowerCase());
  let tipo = 'outro';
  if (tem(/quota|credits? remaining|character_limit|insufficient/)) tipo = 'creditos';
  else if (tem(/missing_permission/)) tipo = 'permissao';
  else if (tem(/invalid_api_key|invalid api key|api key.*invalid/)) tipo = 'chave';
  else if (tem(/unusual|abuse|free_users_not_allowed|free tier/)) tipo = 'bloqueio';
  else if (tem(/voice_not_found|voice.*not.*found|voice_id/) || status === 404) tipo = 'voz';
  else if (status === 429 || tem(/too_many|busy|rate.?limit|concurrent/)) tipo = 'ocupado';
  else if (status === 401 || status === 403) tipo = 'chave';
  return { tipo, msg };
}

// O que dizer pra pessoa em cada erro (o render para com isso; a IA explica e pergunta o que ela prefere)
function explicarElevenlabs(tipo, msg = '', extra = {}) {
  const pasta = extra.pasta || 'videos/<tema>';
  const saidas = [
    '  1. esperar o plano renovar' + (extra.renova ? ` (em ${dataBr(extra.renova)})` : '') + ' e rodar de novo',
    '  2. comprar mais créditos ou subir o plano em elevenlabs.io',
    '  3. usar a voz grátis do VoiceStudio, que roda no computador (comandos/instalar.md, passo 3)',
    `  4. fazer este vídeo com a voz do computador (robótica, só pra testar): node motor/render.js ${pasta} --voz-teste`
  ].join('\n');
  const guardadas = 'As frases que já foram narradas ficaram guardadas na pasta narracao/ e não gastam de novo.';
  if (tipo === 'creditos') return `Os créditos da ElevenLabs acabaram${msg ? ` (${msg})` : ''}.\n${guardadas}\nDá pra:\n${saidas}`;
  if (tipo === 'chave') return 'A ElevenLabs recusou a chave do arquivo .env. Copie a chave de novo, inteira (começa com sk_), ' +
    'no site da ElevenLabs (Developers > API Keys) e cole no .env, na linha ELEVENLABS_API_KEY= (ou rode npm run chave).';
  if (tipo === 'permissao') return 'A chave da ElevenLabs não tem permissão pra isso. Crie uma chave nova sem restrições ' +
    `(Developers > API Keys > Create API Key) e salve no .env (ou rode npm run chave).${msg ? `\n(${msg})` : ''}`;
  if (tipo === 'bloqueio') return 'A ElevenLabs bloqueou o plano grátis desta conta (acontece com VPN, conta nova ou várias contas no ' +
    `mesmo computador). Dá pra assinar um plano pago ou usar a voz grátis do VoiceStudio.${msg ? `\n(${msg})` : ''}`;
  if (tipo === 'voz') return `A voz "${extra.id || '?'}" não existe nesta conta da ElevenLabs. Rode npm run vozes pra ver as vozes da ` +
    'conta e troque o "id" da voz no bloco "No roteiro.json" de canal/identidade.md e no roteiro.json do vídeo.';
  if (tipo === 'ocupado') return `A ElevenLabs está ocupada agora (muitos pedidos ao mesmo tempo). Espere um minuto e rode de novo.${msg ? `\n(${msg})` : ''}`;
  return `A ElevenLabs deu erro: ${msg || 'sem mensagem'}`;
}

// Quanto sobra no plano: { ok, restante, limite, renova, plano, estende } ou { ok: false, erro: tipo | 'rede', msg }
async function contaElevenlabs(chave, ms = 8000) {
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': chave }, signal: AbortSignal.timeout(ms) });
    const corpo = await res.text();
    if (!res.ok) return { ok: false, erro: erroElevenlabs(res.status, corpo).tipo, msg: erroElevenlabs(res.status, corpo).msg };
    const s = JSON.parse(corpo);
    const limite = s.character_limit || 0, usado = s.character_count || 0;
    return {
      ok: true, limite, restante: Math.max(0, limite - usado), plano: s.tier || '',
      renova: s.next_character_count_reset_unix ? new Date(s.next_character_count_reset_unix * 1000) : null,
      // Plano pago com cobrança por uso: passa do limite sem parar
      estende: s.can_extend_character_limit === true && s.max_credit_limit_extension !== 0
    };
  } catch (e) {
    return { ok: false, erro: 'rede', msg: e.message };
  }
}

// ---------- VoiceStudio (voz grátis no computador: github.com/debpalash/VoiceStudio) ----------

const voicestudioUrl = () => (process.env.VOICESTUDIO_URL || 'http://127.0.0.1:3900').replace(/\/+$/, '');

// O VoiceStudio está aberto? { ok, vozes: [{ id, nome, idioma }] } ou { ok: false, erro }
async function voicestudio(ms = 4000) {
  try {
    const res = await fetch(voicestudioUrl() + '/v1/audio/voices', { signal: AbortSignal.timeout(ms) });
    // 503: o programa abriu, mas ainda está carregando (na primeira vez, baixando vários GB)
    if (res.status === 503) return { ok: false, erro: 'abrindo' };
    if (!res.ok) return { ok: false, erro: `respondeu ${res.status}` };
    const j = await res.json();
    const vozes = (j.voices || []).filter((v) => v.type !== 'openai_alias')
      .map((v) => ({ id: v.voice_id || v.id, nome: v.name || v.voice_id || v.id, idioma: v.language || '', porNome: v.addressable_by_name !== false }));
    return { ok: true, vozes };
  } catch (e) {
    return { ok: false, erro: 'fechado' };
  }
}
const mesmaVoz = (v, nome) => {
  const n = (s) => String(s || '').normalize('NFKC').trim().toLowerCase();
  return n(v.id) === n(nome) || n(v.nome) === n(nome);
};

// Erro do VoiceStudio em português
function explicarVoicestudio(status, corpo, extra = {}) {
  let msg = corpo;
  try { const j = JSON.parse(corpo); msg = (j.error && j.error.message) || j.detail || corpo; } catch { /* texto */ }
  msg = String(typeof msg === 'object' ? JSON.stringify(msg) : msg).slice(0, 300);
  if (status == null) return `O VoiceStudio não está aberto (procurei em ${voicestudioUrl()}). Abra o programa VoiceStudio, espere ` +
    'ele terminar de carregar e rode de novo (npm run voicestudio -- --abrir abre e espera). Não tem o VoiceStudio? Passo a ' +
    'passo em comandos/voicestudio.md.';
  if (status === 503) return 'O VoiceStudio ainda está carregando. Espere 1 ou 2 minutos e rode de novo (npm run voicestudio mostra quando ele fica pronto).';
  if (/licen|accept/i.test(msg)) return `O VoiceStudio pede pra aceitar a licença do modelo de voz antes do primeiro uso: abra o app, ` +
    `aceite no aviso do modelo e rode de novo.\n(${msg})`;
  if (status === 409 || /ambiguous_voice/i.test(msg)) return `Tem mais de uma voz chamada "${extra.id || '?'}" no VoiceStudio. Renomeie uma ` +
    `delas no próprio VoiceStudio (ou apague a repetida) e rode de novo.\n(${msg})`;
  if (/model_not_found|model_not_available|unknown model|not available/i.test(msg)) return 'O motor de voz que o roteiro pede não está ' +
    `instalado no VoiceStudio. Abra o VoiceStudio, vá em Modelos (Catálogo de modelos) e instale o OmniVoice (passo 4 de comandos/voicestudio.md).\n(${msg})`;
  if (status === 404 || /voice|profile/i.test(msg)) return `O VoiceStudio não achou a voz "${extra.id || 'default'}". ` +
    `Rode npm run voicestudio pra ver as vozes que existem nele, com o nome exato.\n(${msg})`;
  return `O VoiceStudio deu erro (${status}): ${msg}\nSe for o primeiro uso, abra o app e espere ele baixar o modelo de voz.`;
}

module.exports = {
  RAIZ, ARQUIVOS, CARACTERES_POR_MINUTO, JEITO_DE_CHAVE, chaveElevenlabs, carregarEnv, blocoDoCanal, vozDoCanal,
  erroElevenlabs, explicarElevenlabs, contaElevenlabs, voicestudioUrl, voicestudio, mesmaVoz, explicarVoicestudio,
  dataBr, mil
};
