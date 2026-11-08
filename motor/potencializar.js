// Potencializar a Máquina: os extras vendidos à parte (os order bumps da Cakto). O menu "Potencializar a máquina" do
// painel mostra cada um com o link de compra e o passo a passo, e recebe o arquivo que a pessoa baixou na área de
// membros: o .zip, a pasta dele (se o computador já abriu o zip) ou o PDF. Vale o arquivo de hoje e o que foi entregue
// antes pelo Google Drive (outubro de 2026), e até a pasta inteira do Drive: a Máquina reconhece pelo que tem dentro.
//   30 Roteiros + 100 Temas: cada roteiro vira videos/<NN-tema>/ (roteiro.json e roteiro.md), já com o personagem, a voz,
//      o cenário, a cor e o @ do canal (o bloco "No roteiro.json" de canal/identidade.md) e a assinatura do canal.md;
//      roteiro que já está em videos/ não é trocado. Os 100 temas ficam em canal/extras/roteiros/100-temas.md
//   Canal Gringo: os modelos de canal em inglês e em espanhol e os pedidos prontos, em canal/extras/gringo/
//   Checklist Viral + Plano de 30 Dias: o PDF, em canal/extras/checklist/checklist.pdf, e o texto pra IA ler
//      (checklist-*.md), em canal/extras/checklist/checklist.md
//   O guia em PDF de cada produto: canal/extras/<produto>/guia.pdf
// Tudo fica dentro de canal/ (o npm run importar leva o canal inteiro pra versão nova). O que foi instalado fica anotado
// em canal/extras/instalados.json. Os guias pra IA ficam em comandos/extras*.md.
//
// Sem o painel (quem roda é a IA):
//   npm run extras                          o que está instalado e os arquivos dos extras achados no computador
//                                           (Downloads, Mesa e Documentos), com o comando pronto pra cada um
//   npm run extras -- "<arquivo ou pasta>"  traz o .zip, o PDF ou a pasta dele (o de hoje ou o do Google Drive)
//   npm run extras -- --canal               põe o canal de agora nos 30 roteiros que ainda não viraram vídeo
//   npm run extras -- --gringo en           numa CÓPIA da Máquina: o modelo do Canal Gringo (en ou es) no lugar do
//      [--nome "..." --arroba @... --assinatura "..."] [--confirmar]   canal/canal.md, o idioma no bloco do canal
//                                           (o cartão de seguir e a voz do VoiceStudio) e o nome, o @ e a assinatura
const fs = require('fs');
const os = require('os');
const path = require('path');
const V = require('./voz');
const C = require('./canal-arquivos');

const RAIZ = V.RAIZ;
const arq = (...p) => path.join(RAIZ, ...p);
const REGISTRO = ['canal', 'extras', 'instalados.json'];

// Os produtos, na ordem do menu. checkout: o link de compra avulsa na Cakto (pay.cakto.com.br/<código da oferta>);
// secao e aula: onde o arquivo fica na área de membros
const PRODUTOS = [
  { id: 'roteiros', nome: '30 Roteiros + 100 Temas', checkout: 'https://pay.cakto.com.br/3a97cpz',
    secao: '30 Roteiros + 100 Temas', aula: 'Um roteiro por comando', arquivo: '30-roteiros.zip' },
  { id: 'gringo', nome: 'Canal Gringo', checkout: 'https://pay.cakto.com.br/8fewd4a',
    secao: 'Canal Gringo', aula: 'O mesmo canal em inglês e espanhol', arquivo: 'canal-gringo.zip' },
  { id: 'checklist', nome: 'Checklist Viral + Plano de 30 Dias', checkout: 'https://pay.cakto.com.br/z96x989',
    secao: 'Checklist Viral + 30 Dias', aula: 'O que conferir antes de postar', arquivo: 'checklist-viral-e-plano-de-30-dias.pdf' },
  { id: 'atualizacoes', nome: 'Atualizações Para Sempre', checkout: 'https://pay.cakto.com.br/3bxxh3s',
    secao: 'Atualizações Para Sempre', aula: 'Como receber cada versão nova', arquivo: 'atualizacoes-como-funciona.pdf' }
];
// Os 30 roteiros do produto: quem copiou à mão pra videos/, do jeito do guia antigo, também aparece como instalado
const TRINTA = ['01-guarda-chuva', '02-descarga', '03-chuveiro-eletrico', '04-caneta', '05-ferro-de-passar', '06-pneu', '07-extintor',
  '08-cadeado', '09-garrafa-termica', '10-elevador', '11-torneira', '12-secador-de-cabelo', '13-liquidificador', '14-ventilador',
  '15-filtro-de-barro', '16-pipa', '17-balao-de-ar-quente', '18-semaforo', '19-fogao-a-gas', '20-bomba-de-encher-pneu', '21-para-raios',
  '22-painel-solar', '23-barco-a-vela', '24-farol', '25-campainha', '26-cafeteira-italiana', '27-guindaste', '28-caminhao-betoneira',
  '29-hidrometro', '30-cadeira-de-escritorio'];

const agora = () => new Date().toISOString();
const lerRegistro = () => { try { return JSON.parse(fs.readFileSync(arq(...REGISTRO), 'utf8')); } catch { return {}; } };
function salvarRegistro(r) {
  fs.mkdirSync(path.dirname(arq(...REGISTRO)), { recursive: true });
  fs.writeFileSync(arq(...REGISTRO), JSON.stringify(r, null, 2) + '\n');
}
function gravar(rel, conteudo) {
  const f = arq(...rel.split('/'));
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, conteudo);
}
const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const sujeira = (c) => /(^|\/)(__MACOSX|\.)/.test(c);

// ---------- O canal (o que vai em cada roteiro) ----------
// { bloco, assinatura } quando o canal já tem nome e o bloco "No roteiro.json"; null antes de configurar (o bloco do
// modelo em branco tem um @ e um personagem de exemplo, que não podem ir pros vídeos de ninguém)
function canalPronto() {
  const txt = C.ler('canal', 'canal.md');
  const bloco = V.blocoDoCanal(RAIZ);
  if (!txt || !bloco || !C.campo(txt, 'Nome do canal')) return null;
  return { bloco, assinatura: C.campo(txt, 'Assinatura do fim do vídeo') || null };
}
// O roteiro com o canal: o bloco por cima (como o /novo-video faz em todo vídeo novo) e a assinatura na frase "segue"
function comCanal(rj, { bloco, assinatura }) {
  const { idioma, ...doCanal } = bloco; // o idioma do Canal Gringo fica de fora: os 30 roteiros estão em português
  const r = { ...rj, ...doCanal };
  if (bloco.cenario) { delete r.lugar; delete r.casa; } // o cenário pronto é o lugar inteiro
  const i = Array.isArray(r.frases) ? r.frases.map((f) => f && f.plano).lastIndexOf('segue') : -1;
  if (assinatura && i >= 0) r.frases = r.frases.map((f, k) => (k === i ? { ...f, texto: assinatura } : f));
  return r;
}

// ---------- O que chegou ----------
// Abre os .zip que vierem dentro (a pasta do Drive tem o .zip e o PDF juntos) e tira a sujeira do Mac
function abrir(itens, lerZip) {
  const r = [];
  for (const it of itens) {
    const c = it.caminho.replace(/\\/g, '/');
    if (sujeira(c)) continue;
    if (/\.zip$/i.test(c)) {
      try { for (const x of lerZip(it.pegar())) r.push({ caminho: `${c.slice(0, -4)}/${x.caminho.replace(/\\/g, '/')}`, pegar: x.pegar }); } catch { /* zip estragado: o resto segue */ }
      continue;
    }
    r.push({ caminho: c, pegar: it.pegar });
  }
  return r.filter((x) => !sujeira(x.caminho));
}
// O produto de um PDF, pelo nome do arquivo (o de hoje e o do Drive: "Comece Aqui - Canal Gringo.pdf")
function produtoDoPdf(nome) {
  const n = semAcento(path.posix.basename(nome));
  if (/checklist|plano.de.30/.test(n)) return 'checklist';
  if (/atualizaco/.test(n)) return 'atualizacoes'; // atualização, atualizações (não "atualizada")
  if (/gringo|ingles|espanhol/.test(n)) return 'gringo';
  if (/roteiro|temas/.test(n)) return 'roteiros';
  return null;
}
function separar(itens) {
  const s = { roteiros: new Map(), temas: null, gringo: {}, pdfs: [] };
  for (const it of itens) {
    const c = it.caminho;
    let m = c.match(/(?:^|\/)(\d{2}-[a-z0-9-]+)\/(roteiro\.json|roteiro\.md)$/);
    if (m) { if (!s.roteiros.has(m[1])) s.roteiros.set(m[1], {}); s.roteiros.get(m[1])[m[2]] = it; continue; }
    if (/(^|\/)100-temas\.md$/i.test(c)) { s.temas = it; continue; }
    m = c.match(/(?:^|\/)canal-(en|es)\/canal\.md$/i);
    if (m) { s.gringo[m[1].toLowerCase()] = it; continue; }
    if (/(^|\/)prompts\.md$/i.test(c)) { s.gringo.prompts = it; continue; }
    if (/(^|\/)[^/]*checklist[^/]*\.md$/i.test(c)) { s.checklistMd = it; continue; }
    if (/\.pdf$/i.test(c)) s.pdfs.push(it);
  }
  return s;
}

// ---------- Instalar ----------
function instalarRoteiros(s, reg) {
  const canal = canalPronto();
  const novos = [], jaTinha = [];
  for (const [id, f] of s.roteiros) {
    if (!f['roteiro.json']) continue;
    let rj;
    try { rj = JSON.parse(f['roteiro.json'].pegar().toString('utf8')); } catch { continue; }
    if (!rj || !Array.isArray(rj.frases)) continue;
    if (fs.existsSync(arq('videos', id, 'roteiro.json'))) { jaTinha.push(id); continue; }
    gravar(`videos/${id}/roteiro.json`, JSON.stringify(canal ? comCanal(rj, canal) : rj, null, 2) + '\n');
    if (f['roteiro.md']) gravar(`videos/${id}/roteiro.md`, f['roteiro.md'].pegar());
    novos.push(id);
  }
  if (s.temas) gravar('canal/extras/roteiros/100-temas.md', s.temas.pegar());
  const r = reg.roteiros || {};
  reg.roteiros = { ...r, instalado: agora(), roteiros: [...new Set([...(r.roteiros || []), ...novos, ...jaTinha])].sort(),
    ...(canal && novos.length ? { canalAplicado: agora() } : {}) };
  return { produto: 'roteiros', novos: novos.length, jaTinha: jaTinha.length, comCanal: !!canal, temas: !!s.temas };
}
function instalarGringo(s, reg) {
  const modelos = ['en', 'es'].filter((l) => s.gringo[l]);
  for (const l of modelos) gravar(`canal/extras/gringo/canal-${l}.md`, s.gringo[l].pegar());
  if (s.gringo.prompts) gravar('canal/extras/gringo/prompts.md', s.gringo.prompts.pegar());
  reg.gringo = { ...(reg.gringo || {}), instalado: agora(), modelos: [...new Set([...((reg.gringo || {}).modelos || []), ...modelos])] };
  return { produto: 'gringo', modelos };
}
function guardarPdf(id, it, reg) {
  const b = it.pegar();
  if (b.subarray(0, 5).toString('latin1') !== '%PDF-') return null;
  gravar(id === 'checklist' ? 'canal/extras/checklist/checklist.pdf' : `canal/extras/${id}/guia.pdf`, b);
  reg[id] = { ...(reg[id] || {}), instalado: agora() };
  return { produto: id, pdf: true };
}

// itens: [{ caminho, pegar() }] (o .zip aberto, a pasta ou um arquivo só); lerZip: a função do painel que abre um .zip;
// produto: o quadro onde a pessoa soltou (vale pro PDF com nome que a Máquina não reconhece)
function instalar(itens, { lerZip, produto } = {}) {
  const s = separar(abrir(itens, lerZip));
  const reg = lerRegistro();
  const feitos = [];
  if (s.roteiros.size) feitos.push(instalarRoteiros(s, reg));
  if (s.gringo.en || s.gringo.es) feitos.push(instalarGringo(s, reg));
  if (s.checklistMd) {
    gravar('canal/extras/checklist/checklist.md', s.checklistMd.pegar());
    reg.checklist = { ...(reg.checklist || {}), instalado: agora() };
    feitos.push({ produto: 'checklist', texto: true });
  }
  for (const pdf of s.pdfs) {
    const id = produtoDoPdf(pdf.caminho) || (s.pdfs.length === 1 && PRODUTOS.some((p) => p.id === produto) ? produto : null);
    const r = id && guardarPdf(id, pdf, reg);
    if (r && !feitos.some((x) => x.produto === id)) feitos.push(r);
  }
  if (!feitos.length) {
    return { ok: false, mensagem: 'Não reconheci esse arquivo. Aqui entram os arquivos dos extras que você baixou na área de membros da Cakto: o 30-roteiros.zip, o canal-gringo.zip ou o PDF do produto (a pasta do zip aberta também serve).' };
  }
  salvarRegistro(reg);
  return { ok: true, feitos };
}

// Põe o canal de agora nos roteiros dos 30 que ainda não viraram vídeo (depois de mudar o personagem, a voz ou a cor)
function aplicarCanal() {
  const canal = canalPronto();
  if (!canal) return { ok: false, mensagem: 'Configure o canal primeiro, em Meu canal: o nome, o personagem e a voz.' };
  const reg = lerRegistro();
  let n = 0, prontos = 0;
  for (const id of idsDosRoteiros(reg)) {
    if (fs.existsSync(arq('videos', id, 'video.mp4'))) { prontos++; continue; }
    let rj;
    try { rj = JSON.parse(fs.readFileSync(arq('videos', id, 'roteiro.json'), 'utf8')); } catch { continue; }
    fs.writeFileSync(arq('videos', id, 'roteiro.json'), JSON.stringify(comCanal(rj, canal), null, 2) + '\n');
    n++;
  }
  reg.roteiros = { ...(reg.roteiros || {}), canalAplicado: agora() };
  salvarRegistro(reg);
  return { ok: true, n, prontos };
}

// ---------- Pro painel ----------
const idsDosRoteiros = (reg) => [...new Set([...((reg.roteiros && reg.roteiros.roteiros) || []), ...TRINTA])]
  .filter((id) => fs.existsSync(arq('videos', id, 'roteiro.json'))).sort();
// As linhas da tabela do 100-temas.md: | 1 | Tema | Gancho | Pergunta da capa |
function lerTemas() {
  const txt = C.ler('canal', 'extras', 'roteiros', '100-temas.md');
  if (!txt) return [];
  return txt.split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((c) => c.length >= 5 && /^\d+$/.test(c[1]))
    .map((c) => ({ n: Number(c[1]), tema: c[2], gancho: c[3], capa: c[4] }));
}
// arquivo(rel): o endereço do arquivo no painel (com o código da página)
function estado(arquivo) {
  const reg = lerRegistro();
  const url = (rel) => (fs.existsSync(arq(...rel.split('/'))) ? arquivo(rel) : null);
  const ids = idsDosRoteiros(reg);
  let versao = '';
  try { versao = (JSON.parse(fs.readFileSync(arq('package.json'), 'utf8')).version || '').replace(/\.0$/, ''); } catch { /* sem versão */ }
  return {
    canalPronto: !!canalPronto(),
    pasta: path.basename(RAIZ), // o nome da pasta da Máquina (o passo a passo do Canal Gringo fala dela)
    versao,
    produtos: PRODUTOS.map((p) => {
      const r = reg[p.id] || {};
      const base = { ...p, quando: r.instalado || null, guia: url(`canal/extras/${p.id}/guia.pdf`) };
      if (p.id === 'roteiros') {
        return { ...base, instalado: ids.length > 0, canalAplicado: r.canalAplicado || null, temas: lerTemas(),
          roteiros: ids.map((id) => ({ id, video: fs.existsSync(arq('videos', id, 'video.mp4')) })) };
      }
      if (p.id === 'gringo') {
        const modelos = { en: C.ler('canal', 'extras', 'gringo', 'canal-en.md'), es: C.ler('canal', 'extras', 'gringo', 'canal-es.md') };
        return { ...base, instalado: !!(modelos.en || modelos.es), modelos };
      }
      if (p.id === 'checklist') {
        const pdf = url('canal/extras/checklist/checklist.pdf'), texto = fs.existsSync(arq('canal', 'extras', 'checklist', 'checklist.md'));
        return { ...base, instalado: !!(pdf || texto), pdf, texto };
      }
      return { ...base, instalado: !!base.guia };
    })
  };
}
// ---------- Canal Gringo: preparar a cópia da Máquina pro outro idioma ----------
const IDIOMAS = { en: { nome: 'inglês', voz: 'en-US' }, es: { nome: 'espanhol', voz: 'es-MX' } };
// Põe o modelo do idioma no lugar do canal/canal.md (o de antes fica guardado em canal/extras/gringo/), o idioma no bloco
// do canal (o cartão de seguir do fim e a voz do VoiceStudio) e o nome, o @ e a assinatura que vieram. Numa pasta com o
// canal em português já configurado, só com confirmar: o Canal Gringo vai numa cópia da Máquina
function prepararGringo(l, d = {}) {
  const I = IDIOMAS[l];
  if (!I) return { ok: false, mensagem: 'O idioma é en (inglês) ou es (espanhol): npm run extras -- --gringo en' };
  const modelo = C.ler('canal', 'extras', 'gringo', `canal-${l}.md`);
  if (!modelo) return { ok: false, mensagem: `O Canal Gringo ainda não está nesta pasta (falta canal/extras/gringo/canal-${l}.md). Traga o canal-gringo.zip primeiro: npm run extras -- "<o zip>" (sem o caminho, npm run extras procura no computador).` };
  const atual = C.ler('canal', 'canal.md') || '';
  const jaEsta = /^\*\*Idioma dos vídeos:\*\*/m.test(atual);
  const nomeAtual = C.campo(atual, 'Nome do canal');
  // A cópia pro outro idioma termina em -en ou -es (o nome que o guia manda dar): fora disso, só com a pessoa confirmando
  const copia = new RegExp(`-${l}$`, 'i').test(path.basename(RAIZ));
  if (nomeAtual && !jaEsta && !copia && !d.confirmar) {
    return { ok: false, copia: true, mensagem: `Esta pasta (${path.basename(RAIZ)}) já é o canal "${nomeAtual}", em português, e o nome dela não termina em -${l}. O Canal Gringo vai numa CÓPIA da Máquina com o nome terminando em -${l} (passo 2 de comandos/extras-canal-gringo.md); aqui, o canal em português seria trocado.` };
  }
  if (!jaEsta) {
    if (atual) gravar(`canal/extras/gringo/canal-antes-${agora().slice(0, 10)}.md`, atual);
    // sem o aviso do topo do modelo ("copie este arquivo por cima..."), que já foi feito
    fs.writeFileSync(arq('canal', 'canal.md'), modelo.replace(/^> Modelo do Canal Gringo[\s\S]*?\n\n/m, '> A IA lê isso antes de escrever qualquer roteiro.\n\n'));
  }
  if (d.nome) { const r = C.salvarCanal({ nome: d.nome, arroba: d.arroba, assinatura: d.assinatura }); if (!r.ok) return r; }
  const id = C.ler('canal', 'identidade.md'), b = V.blocoDoCanal(RAIZ) || {};
  const mudar = { idioma: l };
  if (b.voz && b.voz.motor === 'voicestudio') mudar.voz = { ...b.voz, idioma: I.voz };
  const novo = id != null && C.trocarNoBloco(id, mudar);
  if (novo && novo !== id) fs.writeFileSync(arq('canal', 'identidade.md'), novo);
  const txt = C.ler('canal', 'canal.md') || '';
  const falta = ['Nome do canal', '@ nas redes', 'Assinatura do fim do vídeo'].filter((r) => !C.campo(txt, r));
  return { ok: true, idioma: I.nome, trocou: !jaEsta, falta, voz: (b.voz && b.voz.motor) || null };
}

// O que aconteceu, em texto (o npm run extras; o painel tem o dele)
function textoDoResultado(feitos) {
  return feitos.map((f) => {
    if (f.produto === 'roteiros') {
      if (!f.novos) return `30 Roteiros: os ${f.jaTinha} roteiros já estavam em videos/ e ficaram como estavam.`;
      return `30 Roteiros: ${f.novos} roteiros entraram em videos/${f.jaTinha ? ` (${f.jaTinha} já estavam lá e ficaram)` : ''}${f.temas ? ', e os 100 temas em canal/extras/roteiros/100-temas.md' : ''}. ${f.comCanal ? 'Já com o personagem, a voz, o cenário, a cor, o @ e a assinatura do canal.' : 'AINDA SEM O CANAL: configure o canal (nome, personagem e voz) e rode npm run extras -- --canal.'}`;
    }
    if (f.produto === 'gringo') return `Canal Gringo: os modelos em ${f.modelos.map((l) => IDIOMAS[l].nome).join(' e ')} estão em canal/extras/gringo/.`;
    if (f.produto === 'checklist') return f.texto ? 'Checklist: o texto pra IA ler está em canal/extras/checklist/checklist.md.' : 'Checklist: o PDF está em canal/extras/checklist/checklist.pdf (no painel: Potencializar a máquina → Checklist).';
    const p = PRODUTOS.find((x) => x.id === f.produto);
    return `${p ? p.nome : f.produto}: o guia em PDF está em canal/extras/${f.produto}/guia.pdf.`;
  }).join('\n');
}
const PROXIMO = {
  roteiros: 'siga comandos/extras-30-roteiros.md (passo 2): fazer o vídeo de um roteiro',
  gringo: 'siga comandos/extras-canal-gringo.md (passo 2): a cópia da Máquina pro outro idioma',
  checklist: 'siga comandos/extras-checklist.md',
  atualizacoes: 'siga comandos/extras-atualizacoes.md'
};

// Os arquivos dos extras no computador: pelo nome (os de hoje e os do Drive), nas pastas de sempre
function qualProduto(nome) {
  const n = semAcento(nome);
  if (/maquina-preguica|^comece aqui - maquina/.test(n)) return null;
  if (/^30-roteiros$|30-roteiros.*\.zip$|roteiros.*temas.*\.pdf$|^100-temas\.md$/.test(n)) return 'roteiros';
  if (/^canal-gringo$|gringo.*\.(zip|pdf)$|ingles.*espanhol.*\.pdf$/.test(n)) return 'gringo';
  if (/checklist.viral.*\.(pdf|md)$/.test(n)) return 'checklist';
  if (/atualizacoes.(como.funciona|para.sempre).*\.pdf$/.test(n)) return 'atualizacoes';
  return null;
}
function procurar() {
  const casa = os.homedir(), achados = [];
  const ver = (dir, fundo) => {
    let ds;
    try { ds = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const d of ds) {
      if (d.name.startsWith('.') || /node_modules/i.test(d.name)) continue;
      const f = path.join(dir, d.name), qual = qualProduto(d.name);
      if (qual && (d.isFile() || /^(30-roteiros|canal-gringo)$/i.test(d.name))) achados.push({ caminho: f, produto: qual });
      else if (d.isDirectory() && fundo > 0) ver(f, fundo - 1);
    }
  };
  for (const p of ['Downloads', 'Desktop', 'Área de Trabalho', 'Documents', 'Documentos']) ver(path.join(casa, p), 1);
  return achados;
}

// Pra versão do painel (ele atualiza sozinho quando algo daqui muda)
const marca = () => { try { return fs.statSync(arq(...REGISTRO)).mtimeMs; } catch { return 0; } };

module.exports = { PRODUTOS, TRINTA, instalar, aplicarCanal, estado, marca, canalPronto, comCanal, prepararGringo, procurar };

// ---------- npm run extras ----------
if (require.main === module) {
  const { lerZip, lerPasta } = require('./zip');
  const args = process.argv.slice(2);
  const COM_VALOR = ['--gringo', '--nome', '--arroba', '--assinatura'];
  const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const caminhos = args.filter((a, i) => !a.startsWith('--') && !COM_VALOR.includes(args[i - 1]));
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const fim = (txt) => { console.log(`\nPRA IA: ${txt}`); };
  const falhou = (txt, pra) => { console.log(txt); fim(pra); process.exitCode = 1; };

  if (args.includes('--canal')) {
    const r = aplicarCanal();
    if (!r.ok) falhou(r.mensagem, 'peça pra pessoa configurar o canal (comandos/instalar.md, ou o painel em Meu canal) e rode npm run extras -- --canal de novo.');
    else { console.log(`Pronto: ${r.n} roteiros com o canal de agora.${r.prontos ? ` ${r.prontos} que já viraram vídeo ficaram como estavam.` : ''}`); fim(PROXIMO.roteiros + '.'); }
  } else if (args.includes('--gringo')) {
    const r = prepararGringo(valor('--gringo'), { nome: valor('--nome'), arroba: valor('--arroba'), assinatura: valor('--assinatura'), confirmar: args.includes('--confirmar') });
    if (!r.ok) falhou(r.mensagem, r.copia ? 'NÃO rode com --confirmar sem a pessoa dizer que esta pasta é a cópia pro outro idioma. Siga o passo 2 de comandos/extras-canal-gringo.md.' : 'siga comandos/extras-canal-gringo.md.');
    else {
      console.log(`Pronto: esta pasta agora é o canal em ${r.idioma}.${r.trocou ? ' O canal.md de antes ficou guardado em canal/extras/gringo/.' : ''}`);
      if (r.voz === 'voicestudio') console.log(`A voz do VoiceStudio passou pro ${r.idioma}: teste com ${npm} run testar-voz.`);
      fim(r.falta.length ? `falta ${r.falta.join(', ')}: pergunte pra pessoa (em ${r.idioma}) e rode ${npm} run extras -- --gringo ${valor('--gringo')} --nome "..." --arroba @... --assinatura "...". Depois, os passos 4 e 5 de comandos/extras-canal-gringo.md.`
        : 'siga os passos 4 e 5 de comandos/extras-canal-gringo.md (a voz e o primeiro vídeo).');
    }
  } else if (caminhos.length) {
    const todos = [];
    for (const c of caminhos) {
      const f = path.resolve(c.replace(/^~(?=$|[\\/])/, os.homedir()));
      let st;
      try { st = fs.statSync(f); } catch { falhou(`Não achei "${c}".`, `rode ${npm} run extras (sem nada) pra procurar os arquivos no computador, ou pergunte pra pessoa onde ela salvou.`); continue; }
      let itens;
      try { itens = st.isDirectory() ? lerPasta(f) : /\.zip$/i.test(f) ? lerZip(f) : [{ caminho: path.basename(f), pegar: () => fs.readFileSync(f) }]; } catch { falhou(`Não consegui abrir "${c}": o zip pode ter vindo pela metade.`, 'peça pra pessoa baixar de novo na área de membros da Cakto.'); continue; }
      const r = instalar(itens, { lerZip });
      if (!r.ok) { falhou(r.mensagem, `confira o arquivo com a pessoa (comandos/extras.md, "Qual arquivo é de qual extra").`); continue; }
      todos.push(...r.feitos);
    }
    if (todos.length) {
      console.log(textoDoResultado(todos));
      const ids = [...new Set(todos.map((f) => f.produto))];
      fim(`${ids.map((id) => PROXIMO[id]).join('; ')}. O painel (Potencializar a máquina) mostra o mesmo: ${npm} run painel -- --potencializar.`);
    }
  } else {
    const e = estado((rel) => rel);
    console.log('Extras desta Máquina (no painel: Potencializar a máquina)');
    for (const p of e.produtos) {
      let linha;
      if (p.id === 'roteiros') linha = p.instalado ? `${p.roteiros.length} roteiros em videos/ (${p.roteiros.filter((r) => r.video).length} já viraram vídeo)${e.canalPronto && p.canalAplicado ? ', com o canal' : ', AINDA SEM O CANAL (npm run extras -- --canal)'}` : 'não está nesta pasta';
      else if (p.id === 'gringo') linha = p.instalado ? 'os modelos estão em canal/extras/gringo/' : 'não está nesta pasta';
      else if (p.id === 'checklist') linha = p.instalado ? [p.pdf && 'o PDF', p.texto && 'o texto pra IA (canal/extras/checklist/checklist.md)'].filter(Boolean).join(' e ') : 'não está nesta pasta';
      else linha = `esta Máquina é a versão ${e.versao}${p.guia ? '; o guia está guardado' : ''}`;
      console.log(`  [${p.instalado || p.id === 'atualizacoes' ? 'ok' : '  '}] ${p.nome}: ${linha}`);
    }
    const achados = procurar();
    if (achados.length) {
      console.log('\nArquivos dos extras achados no computador:');
      for (const a of achados) console.log(`  ${PRODUTOS.find((p) => p.id === a.produto).nome}: ${npm} run extras -- "${a.caminho}"`);
      fim('mostre pra pessoa o que achou e, com o sim dela, rode o comando de cada arquivo (o mesmo extra duas vezes não estraga nada).');
    } else fim('não achei arquivo dos extras no computador. Se a pessoa comprou algum, peça pra ela baixar na área de membros da Cakto (comandos/extras.md) e dizer onde salvou, ou soltar no painel, em Potencializar a máquina.');
  }
}
