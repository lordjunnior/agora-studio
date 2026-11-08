// Tira quadros de um vídeo de referência (um vídeo de outro canal que a pessoa admira) pra IA olhar: quase nenhuma IA
// assiste vídeo, mas toda IA de código enxerga imagem. Faz uma folha com os quadros na ordem do vídeo.
// Uso: npm run quadros -- <arquivo do vídeo> [quantos quadros, padrão 12]
// Salva em canal/referencias/<nome-do-video>-folha.jpg
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const opcional = (fn) => { try { return fn(); } catch { return null; } };
const FFMPEG = opcional(() => require('ffmpeg-static')) || 'ffmpeg';
const FFPROBE = opcional(() => require('ffprobe-static').path) || 'ffprobe';
const sair = (msg) => { console.error('\n' + msg + '\n'); process.exit(1); };

const arquivo = process.argv[2] && path.resolve(process.argv[2]);
const n = Math.max(4, Math.min(24, Number(process.argv[3]) || 12));
if (!arquivo || !fs.existsSync(arquivo)) sair('Diga onde está o vídeo. Ex: npm run quadros -- "Downloads/video.mp4"');

let dur = NaN;
try {
  dur = parseFloat(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arquivo], { stdio: ['ignore', 'pipe', 'ignore'] }).toString());
} catch { /* não é vídeo */ }
if (!(dur > 0)) sair('Não consegui ler esse arquivo como vídeo. Confira se é um vídeo (mp4, mov, webm) e se ele abre no computador.');

const nome = path.basename(arquivo).replace(/\.[^.]+$/, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'video';
const pasta = path.join(RAIZ, 'canal', 'referencias');
fs.mkdirSync(pasta, { recursive: true });
// Outro vídeo com o mesmo nome não apaga a folha do anterior
let folha = path.join(pasta, `${nome}-folha.jpg`);
for (let k = 2; fs.existsSync(folha); k++) folha = path.join(pasta, `${nome}-${k}-folha.jpg`);
const cols = n <= 6 ? 3 : n <= 12 ? 4 : 6;
const passo = dur / n;
// Um quadro no meio de cada pedaço do vídeo; depois, todos lado a lado na ordem (da esquerda pra direita, de cima pra baixo)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'preguica3d-quadros-'));
try {
  let feitos = 0;
  for (let i = 0; i < n; i++) {
    const q = path.join(tmp, `q${String(feitos).padStart(2, '0')}.jpg`);
    try {
      execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-ss', (passo * (i + 0.5)).toFixed(2), '-i', arquivo,
        '-frames:v', '1', '-vf', 'scale=360:-2', q]);
      if (fs.existsSync(q)) feitos++;
    } catch { /* quadro que não saiu: segue com os outros */ }
  }
  if (!feitos) sair('Não consegui tirar nenhum quadro desse vídeo. Confira se ele abre no computador.');
  execFileSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', path.join(tmp, 'q%02d.jpg'),
    '-vf', `tile=${cols}x${Math.ceil(feitos / cols)}:padding=6:color=white`, '-frames:v', '1', '-q:v', '3', folha]);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
console.log(`\nFolha com ${n} quadros do vídeo (${mmss(dur)} no total): ${path.relative(RAIZ, folha).split(path.sep).join('/')}`);
console.log(`Os quadros vão da esquerda pra direita e de cima pra baixo, um a cada ${passo.toFixed(1).replace('.', ',')} segundos.`);
console.log('PRA IA: abra a folha e olhe o que a pessoa gosta ali (lugar, cores, tamanho das coisas, câmera, ritmo). Anote em');
console.log('canal/historico.md e, se ela disser que é pra todo vídeo, em canal/aprendizados.md. Nunca copie o vídeo: pegue o jeito.\n');
