// Jeito por chat (qualquer IA, até gratuita): pega o roteiro.json que a IA respondeu, direto da área de transferência,
// salva em videos/<tema>/roteiro.json com a identidade do canal e renderiza o vídeo.
// Uso: copie a resposta da IA e rode  npm run colar -- <tema>   (ex: npm run colar -- guarda-chuva)
//      opções do render passam junto:  npm run colar -- guarda-chuva --capa
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, execFileSync, spawnSync } = require('child_process');
const V = require('./voz');

const RAIZ = path.resolve(__dirname, '..');
const sair = (msg) => { console.error('\n' + msg + '\n'); process.exit(1); };

const tema = (process.argv[2] || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
if (!tema || tema.startsWith('-')) sair('Diga o nome do vídeo. Ex: npm run colar -- guarda-chuva');
const extras = process.argv.slice(3);

// Sem a Máquina instalada e o canal configurado, o vídeo sai genérico: confere antes de qualquer coisa
const conf = spawnSync(process.execPath, [path.join(__dirname, 'conferir.js')], { encoding: 'utf8' });
if (conf.status !== 0) sair(`${conf.stdout.trim()}\nNo jeito por chat: passos 1, 2 e 3 de comandos/modo-chat.md (instalar, configurar o canal e escolher a voz).`);

function areaDeTransferencia() {
  try {
    if (process.platform === 'darwin') return execSync('pbpaste', { encoding: 'utf8' });
    if (process.platform === 'win32') {
      // Por arquivo em UTF-8: pela saída do console, o PowerShell 5.1 usa a página de código antiga e estraga os acentos
      const arq = path.join(os.tmpdir(), `preguica3d-colar-${process.pid}.txt`);
      execFileSync('powershell', ['-NoProfile', '-Command',
        `[IO.File]::WriteAllText('${arq.replace(/'/g, "''")}', (Get-Clipboard -Raw), (New-Object Text.UTF8Encoding $false))`]);
      try { return fs.readFileSync(arq, 'utf8'); } finally { fs.rmSync(arq, { force: true }); }
    }
    try { return execSync('wl-paste', { encoding: 'utf8' }); } catch { return execSync('xclip -o -selection clipboard', { encoding: 'utf8' }); }
  } catch {
    return '';
  }
}

// A IA costuma responder com texto em volta e ```json ... ```: fica só o objeto
function extrairJson(txt) {
  const bloco = txt.match(/```(?:json)?\s*([\s\S]*?)```/);
  const s = bloco ? bloco[1] : txt;
  const ini = s.indexOf('{'), fim = s.lastIndexOf('}');
  if (ini < 0) return null;
  if (fim < ini) return { erro: 'a resposta veio cortada no meio' };
  try { return JSON.parse(s.slice(ini, fim + 1)); } catch (e) { return { erro: e.message }; }
}

const r = extrairJson(areaDeTransferencia());
if (!r) sair('Não achei o roteiro na área de transferência. Copie a resposta inteira da IA (o bloco que começa com {) e rode de novo.');
if (r.erro) sair(`O roteiro que a IA mandou tem um erro de formato (${r.erro}).\nCole isto pra IA: "O JSON veio com erro de formato. Mande de novo, completo, só o bloco JSON."`);

const problemas = [];
if (!Array.isArray(r.frases) || r.frases.length < 3) problemas.push('faltam as frases (o campo "frases")');
else r.frases.forEach((f, i) => { if (!f.texto || !f.plano) problemas.push(`a frase ${i + 1} está sem "texto" ou sem "plano"`); });
if (!r.objeto || !Array.isArray(r.objeto.pecas) || !r.objeto.pecas.length) problemas.push('faltam as peças do objeto (o campo "objeto.pecas")');
if (problemas.length) sair(`O roteiro está incompleto: ${problemas.join('; ')}.\nCole isto pra IA: "Faltou ${problemas[0]}. Mande o roteiro.json completo de novo."`);

// Identidade do canal (o bloco "No roteiro.json" de canal/identidade.md), sem sobrescrever o que a IA escolheu pro vídeo
const canal = V.blocoDoCanal(RAIZ) || {};
const temChave = !!V.chaveElevenlabs(RAIZ).chave;
// A voz é sempre a que a pessoa escolheu pro canal (na instalação); a IA de chat não escolhe voz
const voz = canal.voz || (temChave ? { motor: 'elevenlabs', id: 'TX3LPaxmHKxFdv7VOQHJ', velocidade: 1.1, acelerar: 'auto' } : { motor: 'teste' });
const nomeVoz = { elevenlabs: 'ElevenLabs', voicestudio: 'VoiceStudio (deixe o programa aberto)', teste: 'a do computador (robótica, só pra testar)' }[voz.motor] || voz.motor;

const roteiro = {
  ...canal,
  ...r,
  modelo: 'montagem',
  personagem: canal.personagem || r.personagem,
  estilo: r.estilo || canal.estilo || 'redondo',
  efeitos: { abaixa: true, ...(canal.efeitos || {}), ...(r.efeitos || {}) },
  alvoPpm: r.alvoPpm || 190,
  voz,
  cauda: r.cauda || { segundos: 1.6, plano: 'cartao' },
  trilha: r.trilha || { arquivo: 'trilha', ganho: 0.22 },
};

const pasta = path.join(RAIZ, 'videos', tema);
fs.mkdirSync(pasta, { recursive: true });
fs.writeFileSync(path.join(pasta, 'roteiro.json'), JSON.stringify(roteiro, null, 2) + '\n');
console.log(`\nRoteiro salvo em videos/${tema}/roteiro.json (${roteiro.frases.length} frases, ${roteiro.objeto.pecas.length} peças).`);
console.log(`Voz: ${nomeVoz}.`);
console.log('Fazendo o vídeo...\n');

const res = spawnSync(process.execPath, [path.join(__dirname, 'render.js'), pasta, ...extras], { stdio: 'inherit' });
// Código 3: o render parou por causa da voz (chave, créditos, VoiceStudio fechado) e já explicou o que fazer
if (res.status === 3) sair('O roteiro está certo: o que parou foi a voz (veja a explicação logo acima). Resolva e rode o mesmo comando de novo.');
// Código 4: o navegador que desenha o vídeo não abriu (o render já explicou o que fazer)
if (res.status === 4) sair('O roteiro está certo: o que parou foi o navegador que desenha o vídeo (veja a explicação logo acima). Rode npm run instalar e depois o mesmo comando de novo.');
if (res.status !== 0) sair(`Deu erro no render. Copie a mensagem acima e cole pra IA junto com: "Deu esse erro ao renderizar o roteiro. Corrija e mande o roteiro.json completo de novo."\nNão resolveu? Escreva pra desconstruindouniverso@gmail.com com o print.`);
console.log(extras.length ? `\nPronto: veja videos/${tema}/.` : `\nPronto: videos/${tema}/ (video.mp4 e capa.png).`);
console.log(`Quer ver as cenas antes do vídeo completo? npm run colar -- ${tema} --voz-teste --revisar faz a folha (uma imagem por frase) em videos/${tema}/testes/folha.jpg.`);
console.log('Ficou estranho? Mande a folha ou a capa.png pra IA e peça: "ajusta as cenas com problema" ou "ajusta as peças pra ficar mais parecido com o objeto de verdade".\n');
