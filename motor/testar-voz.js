// Amostras de voz pra escolher a voz do canal: cada uma vira canal/testes-de-voz/<nome-da-voz>.mp3 (ou .wav).
// Uso: npm run testar-voz -- <id> [<id> ...]                 ElevenLabs, com a frase de teste padrão
//      npm run testar-voz -- <id> --texto "Outra frase"      com uma frase sua
//      npm run testar-voz -- --voicestudio [<voz> ...]       VoiceStudio (grátis, no computador; aberto), padrão "default"
//      npm run testar-voz -- --voicestudio Narrador --modelo voxcpm2   com outro motor do VoiceStudio (padrão: omnivoice)
// Cada amostra da ElevenLabs gasta os caracteres da frase (uns 110 na padrão) do plano. A do VoiceStudio não gasta nada.
const fs = require('fs');
const path = require('path');
const V = require('./voz');

const RAIZ = V.RAIZ;
const PASTA = path.join(RAIZ, 'canal', 'testes-de-voz');
const sair = (msg) => { console.error('\n' + msg + '\n'); process.exit(1); };

V.carregarEnv(RAIZ);
const CHAVE = process.env.ELEVENLABS_API_KEY;

const args = process.argv.slice(2);
const iTexto = args.indexOf('--texto');
const texto = iTexto >= 0 ? args[iTexto + 1] : 'Como uma pilha desse tamanho ilumina o quintal inteiro? Essa é a voz que vai narrar os vídeos do seu canal.';
const studio = args.includes('--voicestudio');
const iModelo = args.indexOf('--modelo');
const modelo = iModelo >= 0 ? args[iModelo + 1] : 'omnivoice';
let ids = args.filter((a, i) => a !== '--texto' && a !== '--voicestudio' && a !== '--modelo' &&
  (iTexto < 0 || i !== iTexto + 1) && (iModelo < 0 || i !== iModelo + 1));
if (studio && !ids.length) ids = ['default'];
if (!ids.length) sair('Diga o id de pelo menos uma voz (npm run vozes lista as vozes). Ex: npm run testar-voz -- TX3LPaxmHKxFdv7VOQHJ');
if (!texto) sair('Faltou a frase depois de --texto. Ex: npm run testar-voz -- <id> --texto "Oi, tudo bem?"');
if (!studio && !CHAVE) sair('Falta a chave da ElevenLabs no arquivo .env (rode npm run chave pra salvar do jeito certo).');

const nomeArquivo = (nome) => nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function amostraElevenlabs(id) {
  const info = await fetch(`https://api.elevenlabs.io/v1/voices/${id}`, { headers: { 'xi-api-key': CHAVE } });
  const nome = info.ok ? (await info.json()).name : id;
  // Os mesmos ajustes do render, pra amostra soar como o vídeo vai soar
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': CHAVE, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: texto, model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, speed: 1.1, use_speaker_boost: true }
    })
  });
  if (!res.ok) { const e = V.erroElevenlabs(res.status, await res.text()); return { nome, erro: V.explicarElevenlabs(e.tipo, e.msg, { id }) }; }
  return { nome, ext: 'mp3', audio: Buffer.from(await res.arrayBuffer()) };
}

async function amostraVoicestudio(id) {
  let res;
  try {
    res = await fetch(`${V.voicestudioUrl()}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelo, input: texto, voice: id, response_format: 'wav', language: 'pt-BR' }),
      signal: AbortSignal.timeout(300000)
    });
  } catch (e) {
    return { nome: id, erro: V.explicarVoicestudio(null) };
  }
  if (!res.ok) return { nome: id, erro: V.explicarVoicestudio(res.status, await res.text(), { id }) };
  return { nome: `voicestudio-${id}${modelo !== 'omnivoice' ? `-${modelo}` : ''}`, ext: 'wav', audio: Buffer.from(await res.arrayBuffer()) };
}

(async () => {
  fs.mkdirSync(PASTA, { recursive: true });
  let feitas = 0;
  for (const id of ids) {
    const r = studio ? await amostraVoicestudio(id) : await amostraElevenlabs(id);
    if (r.erro) { console.error(`${r.nome}: ${r.erro}`); continue; }
    const arq = path.join(PASTA, `${nomeArquivo(r.nome) || id}.${r.ext}`);
    fs.writeFileSync(arq, r.audio);
    console.log(`${r.nome}: ${path.relative(RAIZ, arq)}`);
    feitas++;
  }
  console.log(`${feitas} de ${ids.length} amostras em ${path.relative(RAIZ, PASTA)}` + (studio ? '' : ` (${texto.length} caracteres cada)`));
  if (!feitas) process.exit(1);
})();
