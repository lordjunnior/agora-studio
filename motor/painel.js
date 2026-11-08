// O painel da Máquina: uma página no navegador da pessoa, com o menu do lado. É a parte visual: mostra o que a Máquina
// fez e facilita umas configurações; o resto a pessoa pede no chat da IA.
//   Comece aqui: como a Máquina funciona, o que já está instalado e configurado (o npm run conferir), com a barra de
//      progresso, o quadro do vídeo de exemplo (que vem no zip; se sumiu, importa de novo ali) e o pra vincular um
//      pacote extra de modelos 3D
//   Meu canal: a capa (o banner do YouTube), o logo, o nome e o @, do que o canal fala, quem assiste, o jeito de falar,
//      a marca registrada, o estilo da capa, o personagem, o cenário e a hora, a voz, a cor e as descrições nas redes.
//      Salva em canal/canal.md, canal/identidade.md (o texto e o bloco "No roteiro.json"), canal/perfil.md,
//      canal/logo.png e canal/banner.jpg
//   Vídeos: um card por pasta de videos/. Em cada vídeo: o vídeo pronto, o texto de postar (título, descrição e
//      comentário fixado, com botão de copiar), as cenas (uma imagem por frase, do --revisar) e o roteiro. Nas cenas, a
//      pessoa marca "gostei" ou "mudar" em cada uma; a opinião fica em videos/<tema>/opiniao.json pra IA ler
//   Modelos 3D: tudo que a Máquina sabe desenhar, por tipo, com a foto de cada um (referencias/modelos/, do npm run
//      modelos), e os pacotes extras vinculados
//   Potencializar a máquina: os extras vendidos à parte (30 Roteiros, Canal Gringo, Checklist e Atualizações), com o
//      link de compra, onde achar o arquivo na área de membros e o quadro pra trazer o arquivo pra cá
//      (motor/potencializar.js); depois de instalado, como usar cada um
//   Ajuda: as perguntas mais comuns por assunto, com um campo pra procurar e o pedido pronto pra mandar pra IA em cada
//      resposta, as boas práticas e, no fim, o suporte (só pra compra e acesso, ou depois de a IA tentar)
// Uso (quem roda é a IA):
//   npm run painel                       abre o painel e volta na hora (ele fica aberto por 12 horas; rodar de novo reabre).
//                                        Uma aba só: com o painel já na tela da pessoa, ele só troca de tela, sem aba
//                                        nova; abrindo aba nova, a velha se fecha sozinha (se não tiver nada sem salvar)
//   npm run painel -- <tema>             abre direto no vídeo videos/<tema>, nas cenas
//   npm run painel -- <tema> --opiniao   mostra aqui a opinião que a pessoa deu nas cenas e no vídeo pronto
//   npm run painel -- --canal            abre em "Meu canal" (o npm run canal abre assim, depois de salvar as respostas)
//   npm run painel -- --potencializar    abre em "Potencializar a máquina" (os extras: trazer o arquivo baixado e como usar)
//   npm run painel -- <tema> --pronto    abre no vídeo pronto (o render abre assim no fim; sem --pronto, abre nas cenas)
//   npm run painel -- --link             liga o painel sem abrir aba nova e mostra o link (pra IA pôr no fim da resposta;
//                                        o Claude Code roda isto sozinho no começo de toda conversa)
// Sem IA e sem terminal: dois cliques no ABRIR-PAINEL.command (Mac) ou no ABRIR-PAINEL.bat (Windows), na pasta (eles
// rodam npm run painel -- --atalho, que fala com a pessoa em vez de falar com a IA)
//   npm run painel -- --esperar          o painel preso a este comando (até 15 minutos): termina quando a pessoa clica em
//                                        "Mandar pra IA" ou "Terminei" e mostra o que ela mandou. Pra quando o programa
//                                        da IA fecha o que o comando abriu assim que ele termina
//   npm run painel -- --pacote <zip>     instala um pacote extra de modelos 3D e cenários (o .zip baixado ou a pasta dele);
//                                        no painel, é o quadro "Subir modelos 3D" (em Comece aqui e em Modelos 3D)
// Só responde pro próprio computador (127.0.0.1) e pra quem tem o código da página. Não lê nem mostra o .env.
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const net = require('net');
const crypto = require('crypto');
const { spawn, execFile } = require('child_process');
const V = require('./voz');
const C = require('./canal-arquivos');
const K = require('./canal');
const P = require('./potencializar');
const { lerZip, lerPasta } = require('./zip');
const { MODELO, REDES, CAMPOS, RE_BLOCO, campo, secoes, lerCampo, cenariosDoMotor } = C;

const RAIZ = V.RAIZ;
const PORTA = 47392; // a mesma sempre (a janelinha da chave usa a 47391): rodar de novo reaproveita o painel aberto
const DURA = 12 * 60 * 60 * 1000;
const ESPERA_COMANDO = 15 * 60 * 1000;
// Os arquivos de um vídeo que o painel mostra (se um muda, o painel atualiza sozinho)
const DO_VIDEO = ['roteiro.md', 'roteiro.json', 'publicacao.md', 'capa.png', 'video.mp4', 'opiniao.json', 'custos.json',
  'testes/cenas.json', 'testes/folha.jpg', 'testes/video-voz-teste.mp4', 'timeline.json'];
const COMO_LER = 'A opinião da pessoa, dada no painel (npm run painel). Em "cenas", cada cena que ela quer diferente vem com ' +
  '"opiniao": "mudar" e o pedido em "mudar". Arrume essas cenas no cena.js, anote no canal/historico.md, rode o --revisar ' +
  'de novo e peça pra ela olhar as cenas novas no painel. "video" é a nota e o comentário do vídeo pronto.';

const arq = (...p) => path.join(RAIZ, ...p);
const ler = (...p) => { try { return fs.readFileSync(arq(...p), 'utf8').replace(/^﻿/, ''); } catch { return null; } };
const lerJson = (...p) => { try { return JSON.parse(ler(...p)); } catch { return null; } };
const quando = (...p) => { try { return fs.statSync(arq(...p)).mtimeMs; } catch { return 0; } };
const existe = (...p) => quando(...p) > 0;
const iso = (ms) => (ms ? new Date(ms).toISOString() : null);
const dataHora = (d) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// A porta do painel desta pasta, guardada na pasta temporária: com duas Máquinas no computador, a segunda fica noutra
// porta, e rodar de novo reaproveita o painel dela em vez de ligar outro
const PORTA_SALVA = path.join(os.tmpdir(), `preguica3d-painel-${crypto.createHash('sha1').update(RAIZ).digest('hex').slice(0, 10)}.porta`);
// O código da página fica guardado na pasta temporária do computador: o endereço continua valendo quando o painel é
// aberto de novo
function codigo() {
  const f = path.join(os.tmpdir(), `preguica3d-painel-${crypto.createHash('sha1').update(RAIZ).digest('hex').slice(0, 10)}.txt`);
  try { const t = fs.readFileSync(f, 'utf8').trim(); if (/^[a-f0-9]{18}$/.test(t)) return t; } catch { /* primeira vez */ }
  const t = crypto.randomBytes(9).toString('hex');
  try { fs.writeFileSync(f, t); } catch { /* sem pasta temporária: o código vale só desta vez */ }
  return t;
}

// ---------- O canal ----------

function lerCanal() {
  const txt = ler('canal', 'canal.md') || '';
  const id = ler('canal', 'identidade.md') || '';
  const m = id.match(RE_BLOCO);
  const bloco = V.blocoDoCanal(RAIZ);
  const p = secoes(ler('canal', 'perfil.md'));
  const logo = ['logo.png', 'logo.jpg'].find((n) => existe('canal', n));
  const banner = ['banner.jpg', 'banner.png'].find((n) => existe('canal', n));
  const evitar = (txt.match(/^\*\*Evitar:?\*\*:?[ \t]*(.*)$/m) || [])[1] || '';
  return {
    nome: campo(txt, 'Nome do canal') || '',
    arroba: campo(txt, '@ nas redes') || '',
    assinatura: campo(txt, 'Assinatura do fim do vídeo') || '',
    configurado: [txt, id].every((t) => t && !MODELO.test(t)),
    logo: logo ? arquivo(`canal/${logo}`) : null,
    banner: banner ? arquivo(`canal/${banner}`) : null,
    descricoes: Object.fromEntries(Object.entries(REDES).map(([k, r]) => [k, p[r.titulo] || ''])),
    limites: Object.fromEntries(Object.entries(REDES).map(([k, r]) => [k, r.limite])),
    campos: {
      ...Object.fromEntries(Object.entries(CAMPOS).map(([k, c]) => [k, lerCampo(c.arq === 'canal.md' ? txt : id, c)])),
      evitar: MODELO.test(evitar) ? { valor: '', exemplo: (evitar.match(/\b(?:ex|Ex)[:.]\s*([^\]]*)/) || [, ''])[1].trim() } : { valor: evitar.trim(), exemplo: '' }
    },
    // erroNoBloco: o bloco existe, mas o JSON dele está quebrado (o painel não muda nada nele até a IA arrumar)
    bloco: bloco || {},
    erroNoBloco: !!m && !bloco
  };
}

// A janelinha de colar a chave da ElevenLabs (npm run chave): abre à parte, no navegador
function abrirChave() {
  spawn(process.execPath, [path.join(__dirname, 'chave.js')], { cwd: RAIZ, detached: true, stdio: 'ignore', windowsHide: true }).unref();
  return { ok: true };
}

// O logo vem em PNG quadrado e o banner em JPG 2560x1440 (a página recorta e converte antes de mandar)
function salvarImagem(tipo, dados) {
  const nomes = tipo === 'logo' ? ['logo.png', 'logo.jpg'] : tipo === 'banner' ? ['banner.jpg', 'banner.png'] : null;
  if (!nomes) return { ok: false, mensagem: 'Imagem de quê?' };
  if (!dados) { nomes.forEach((n) => fs.rmSync(arq('canal', n), { force: true })); return { ok: true }; }
  const m = String(dados).match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/);
  const buf = m ? Buffer.from(m[2], 'base64') : Buffer.alloc(0);
  const png = buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])), jpg = buf[0] === 0xff && buf[1] === 0xd8;
  if (!(tipo === 'logo' ? png : jpg)) return { ok: false, mensagem: 'Não consegui ler essa imagem. Tente outra, em PNG ou JPG.' };
  fs.mkdirSync(arq('canal'), { recursive: true });
  fs.writeFileSync(arq('canal', nomes[0]), buf);
  fs.rmSync(arq('canal', nomes[1]), { force: true });
  return { ok: true };
}

// ---------- Os vídeos ----------

// O endereço de um arquivo da pasta, pro navegador (com a hora da última mudança, pra não mostrar a imagem velha)
let TOKEN = '';
const arquivo = (rel) => `/arquivo/${rel.split('/').map(encodeURIComponent).join('/')}?t=${TOKEN}&v=${Math.round(quando(...rel.split('/')))}`;
const humano = (id) => id.replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
const idValido = (id) => typeof id === 'string' && /^[^/\\.][^/\\]*$/.test(id) && fs.existsSync(arq('videos', id));

function pastasDeVideo() {
  try {
    return fs.readdirSync(arq('videos'), { withFileTypes: true }).filter((d) => d.isDirectory() && !/^[._]/.test(d.name)).map((d) => d.name);
  } catch { return []; }
}

// "**Outra opção:** ..." → a outra opção. Tira marcação, "Título:" e aspas
const limparLinha = (l) => l.replace(/^#+\s*/, '').replace(/^[-*]\s+|^\d+[.)]\s+/, '').replace(/^\**\s*(principal|t[íi]tulo( principal)?)\s*:?\s*\**\s*:?\s*/i, '')
  .replace(/\*\*/g, '').replace(/^["“]+|["”]+$/g, '').trim();
// O publicacao.md (comandos/publicar.md): o título e a outra opção, a descrição e o comentário fixado
function lerPublicacao(txt) {
  if (!txt) return null;
  const s = secoes(txt);
  const pega = (re) => { const k = Object.keys(s).find((n) => re.test(n)); return k ? s[k] : ''; };
  const linhas = pega(/^t[íi]tulo/i).split('\n').map((l) => l.trim()).filter(Boolean);
  let titulo = '', outra = '';
  for (let i = 0; i < linhas.length; i++) {
    const o = linhas[i].match(/^#*\s*(?:[-*]\s*)?\**\s*outra op[çc][ãa]o\s*:?\s*\**\s*:?\s*(.*)$/i);
    if (o) { outra = limparLinha(o[1] || linhas[i + 1] || ''); if (!o[1]) i++; continue; }
    if (!titulo) titulo = limparLinha(linhas[i]);
  }
  return { titulo, outra, descricao: pega(/^descri/i), comentario: pega(/coment/i) };
}

function resumoDoVideo(id) {
  const rj = lerJson('videos', id, 'roteiro.json') || {};
  const pub = lerPublicacao(ler('videos', id, 'publicacao.md'));
  const rmd = ler('videos', id, 'roteiro.md');
  const h1 = rmd && (rmd.match(/^#\s+(?:Roteiro\s*[:·-]\s*)?(.+)$/m) || [])[1];
  const cenas = lerJson('videos', id, 'testes', 'cenas.json');
  const op = lerJson('videos', id, 'opiniao.json') || {};
  const doMesmo = cenas && op.cenasDe === cenas.feito;
  const primeira = cenas && cenas.cenas && cenas.cenas[0] && existe('videos', id, cenas.cenas[0].imagem) ? `videos/${id}/${cenas.cenas[0].imagem}` : null;
  const tl = existe('videos', id, 'video.mp4') ? lerJson('videos', id, 'timeline.json') : null;
  return {
    id,
    exemplo: id === 'exemplo',
    titulo: (pub && pub.titulo) || rj.titulo || (h1 && h1.trim()) || humano(id),
    capa: existe('videos', id, 'capa.png') ? arquivo(`videos/${id}/capa.png`) : primeira ? arquivo(primeira) : null,
    etapas: {
      roteiro: existe('videos', id, 'roteiro.md') || Array.isArray(rj.frases),
      cenas: !!cenas || existe('videos', id, 'testes', 'folha.jpg'),
      video: existe('videos', id, 'video.mp4') ? 'pronto' : existe('videos', id, 'testes', 'video-voz-teste.mp4') ? 'teste' : '',
      texto: !!pub
    },
    duracao: tl && tl.total ? Math.round(tl.total) : null,
    mudar: doMesmo ? (op.cenas || []).filter((c) => c.opiniao === 'mudar').length : 0,
    semOpiniao: !!(cenas && !doMesmo),
    atualizado: Math.max(...DO_VIDEO.map((f) => quando('videos', id, ...f.split('/'))), quando('videos', id, 'cena.js'))
  };
}

function detalheDoVideo(id) {
  const r = resumoDoVideo(id);
  const rj = lerJson('videos', id, 'roteiro.json') || {};
  const c = lerJson('videos', id, 'testes', 'cenas.json');
  const versoes = (() => {
    try { return fs.readdirSync(arq('videos', id, 'versoes')).filter((f) => /\.(mp4|png|jpe?g)$/i.test(f)).sort().reverse(); } catch { return []; }
  })();
  return {
    ...r,
    roteiroMd: ler('videos', id, 'roteiro.md'),
    frases: (rj.frases || []).map((f, i) => ({ n: i + 1, texto: String(f.texto || '').replace(/\*/g, '') })),
    cenas: c && Array.isArray(c.cenas) ? {
      feito: c.feito,
      lista: c.cenas.map((x) => ({ n: x.n, texto: x.texto || '', img: x.imagem && existe('videos', id, x.imagem) ? arquivo(`videos/${id}/${x.imagem}`) : null }))
    } : null,
    folha: existe('videos', id, 'testes', 'folha.jpg') ? arquivo(`videos/${id}/testes/folha.jpg`) : null,
    video: r.etapas.video === 'pronto' ? { url: arquivo(`videos/${id}/video.mp4`), feito: iso(quando('videos', id, 'video.mp4')) } : null,
    teste: existe('videos', id, 'testes', 'video-voz-teste.mp4') ? arquivo(`videos/${id}/testes/video-voz-teste.mp4`) : null,
    capaPng: existe('videos', id, 'capa.png') ? arquivo(`videos/${id}/capa.png`) : null,
    publicacao: lerPublicacao(ler('videos', id, 'publicacao.md')),
    opiniao: lerJson('videos', id, 'opiniao.json'),
    custos: lerJson('videos', id, 'custos.json'),
    versoes: versoes.map((f) => ({ nome: f, url: arquivo(`videos/${id}/versoes/${f}`) }))
  };
}

// A opinião da pessoa vai pra videos/<tema>/opiniao.json. A opinião das cenas vale pra uma rodada de cenas (o "feito"
// do testes/cenas.json): quando a IA refaz as cenas, a opinião anterior vai pra "anteriores" e começa outra
function salvarOpiniao(id, d) {
  if (!idValido(id)) return { ok: false, mensagem: 'Não achei esse vídeo.' };
  const op = lerJson('videos', id, 'opiniao.json') || {};
  const agora = new Date().toISOString();
  if (Array.isArray(d.cenas)) {
    const c = lerJson('videos', id, 'testes', 'cenas.json') || {};
    const frases = Object.fromEntries((c.cenas || []).map((x) => [x.n, x.texto || '(fim: o cartão de seguir)']));
    if ((op.cenas || []).length && op.cenasDe !== (c.feito || null)) {
      op.anteriores = [{ cenasDe: op.cenasDe, atualizado: op.atualizado, mandado: op.mandado || null, cenas: op.cenas, geral: op.geral || '' },
        ...(op.anteriores || [])].slice(0, 10);
      op.mandado = null;
    }
    op.cenasDe = c.feito || null;
    op.cenas = d.cenas.filter((x) => Number.isInteger(x.cena) && ['gostei', 'mudar'].includes(x.opiniao)).sort((a, b) => a.cena - b.cena)
      .map((x) => ({ cena: x.cena, frase: frases[x.cena] || '', opiniao: x.opiniao,
        ...(x.opiniao === 'mudar' ? { mudar: String(x.mudar || '').trim().slice(0, 2000) } : {}) }));
    op.geral = String(d.geral || '').trim().slice(0, 4000);
    op.atualizado = agora;
    if (d.mandar) op.mandado = agora;
  }
  if (d.video) {
    const nota = Number(d.video.nota);
    op.video = { nota: nota >= 1 && nota <= 5 ? Math.round(nota) : null, comentario: String(d.video.comentario || '').trim().slice(0, 4000),
      videoDe: iso(quando('videos', id, 'video.mp4')), atualizado: agora, ...(d.mandar ? { mandado: agora } : {}) };
  }
  const { comoLer, ...resto } = op;
  fs.writeFileSync(arq('videos', id, 'opiniao.json'), JSON.stringify({ comoLer: COMO_LER, ...resto }, null, 2) + '\n');
  return { ok: true };
}

// A opinião em texto, pra IA (npm run painel -- <tema> --opiniao)
function textoDaOpiniao(id) {
  const op = lerJson('videos', id, 'opiniao.json');
  const c = lerJson('videos', id, 'testes', 'cenas.json');
  const l = [];
  if (!op || (!(op.cenas || []).length && !op.video)) {
    l.push(`OPINIÃO: a pessoa ainda não deu opinião no painel sobre o vídeo videos/${id}.`);
    l.push(`PRA IA: abra o painel nas cenas (npm run painel -- ${id}) e peça pra ela marcar Gostei ou Mudar em cada cena, ou pergunte aqui na conversa.`);
    return l.join('\n');
  }
  if ((op.cenas || []).length) {
    const velha = c && op.cenasDe !== c.feito;
    l.push(`OPINIÃO DAS CENAS: videos/${id} (${op.mandado ? `mandada em ${dataHora(op.mandado)}` : `rascunho de ${dataHora(op.atualizado)}, ainda sem clicar em "Mandar pra IA"`})`);
    if (velha) l.push(`ATENÇÃO: essa opinião é das cenas de ${dataHora(op.cenasDe)}, e as cenas foram refeitas depois (${dataHora(c.feito)}).`);
    const total = c && c.cenas ? c.cenas.length : null;
    for (const x of op.cenas.filter((y) => y.opiniao === 'mudar')) l.push(`- cena ${x.cena} "${x.frase}": MUDAR: ${x.mudar || '(não disse o quê: pergunte)'}`);
    const gostei = op.cenas.filter((x) => x.opiniao === 'gostei').map((x) => x.cena);
    if (gostei.length) l.push(`- gostou ${gostei.length > 1 ? `das cenas ${gostei.join(', ')}` : `da cena ${gostei[0]}`}`);
    const vistas = op.cenas.length;
    if (total && vistas < total && !velha) l.push(`(${total - vistas} de ${total} cenas ainda sem opinião)`);
    if (op.geral) l.push(`No geral: ${op.geral}`);
    const mudar = op.cenas.filter((x) => x.opiniao === 'mudar').map((x) => x.cena);
    if (velha) l.push(`PRA IA: peça pra pessoa olhar as cenas novas no painel (npm run painel -- ${id}).`);
    else if (mudar.length) {
      l.push(`PRA IA: arrume no cena.js ${mudar.length > 1 ? `as cenas ${mudar.join(', ')}` : `a cena ${mudar[0]}`} (o pedido de cada uma está acima), anote a opinião em canal/historico.md, rode o --revisar de novo e abra o painel nas cenas novas (npm run painel -- ${id}) pra ela conferir.`);
    } else l.push('PRA IA: ela gostou de todas as cenas que viu. Anote no canal/historico.md e, se não falta nenhuma, siga pro vídeo completo.');
  }
  if (op.video) {
    const velho = op.video.videoDe && existe('videos', id, 'video.mp4') && op.video.videoDe !== iso(quando('videos', id, 'video.mp4'));
    l.push(`OPINIÃO DO VÍDEO PRONTO: ${op.video.nota ? `nota ${op.video.nota} de 5` : 'sem nota'}${op.video.comentario ? ` · "${op.video.comentario}"` : ''}${velho ? ' (sobre uma versão anterior do vídeo)' : ''}`);
    l.push('PRA IA: anote no canal/historico.md; nota 4 ou 5 → as cenas que ela elogiou vão pra "Cenas que funcionaram" de canal/aprendizados.md.');
  }
  return l.join('\n');
}

// O que mudou em cada versão (NOVIDADES.md), pra tela de Atualizações: [{ titulo, itens }], a mais nova primeiro
function lerNovidades() {
  const versoes = [];
  for (const linha of (ler('NOVIDADES.md') || '').replace(/\r/g, '').split('\n')) {
    const v = versoes[versoes.length - 1];
    if (linha.startsWith('## ')) versoes.push({ titulo: linha.slice(3).trim(), itens: [] });
    else if (v && linha.startsWith('- ')) v.itens.push(linha.slice(2).trim());
    else if (v && v.itens.length && /^\s+\S/.test(linha)) v.itens[v.itens.length - 1] += ' ' + linha.trim();
  }
  return versoes;
}

// O que o painel mostra muda quando algum destes arquivos muda
function versao() {
  const h = crypto.createHash('sha1');
  for (const f of ['canal.md', 'identidade.md', 'perfil.md', 'logo.png', 'logo.jpg', 'banner.jpg', 'banner.png']) h.update(f + quando('canal', f));
  h.update('pacotes' + quando(...REGISTRO) + quando('motor', 'modelos'));
  h.update('extras' + P.marca());
  h.update('fotos' + quando('referencias', 'modelos') + quando('referencias', 'modelos', 'catalogo.json') + fotografando());
  for (const id of pastasDeVideo()) for (const f of DO_VIDEO) h.update(id + f + quando('videos', id, ...f.split('/')));
  return h.digest('hex').slice(0, 12);
}

// O npm run conferir, pro quadro "Como está a Máquina" (guardado por 20 s: ele fala com a ElevenLabs)
let conferido = null;
function conferir() {
  if (conferido && Date.now() - conferido.em < 20000) return Promise.resolve(conferido.r);
  return new Promise((ok) => {
    execFile(process.execPath, [path.join(__dirname, 'conferir.js')], { cwd: RAIZ, timeout: 30000, windowsHide: true }, (erro, saida) => {
      const linhas = String(saida || '').split('\n');
      const itens = linhas.map((l) => l.match(/^\[(ok|falta|aviso|opcional)\]\s+(.*)$/)).filter(Boolean).map((m) => ({ status: m[1], texto: m[2] }));
      const r = itens.length ? { pronto: /^PRONTO/m.test(saida), itens } : { erro: true };
      conferido = { em: Date.now(), r };
      ok(r);
    });
  });
}

// ---------- Trazer da versão antiga (o npm run importar, pro quadro de "Comece aqui") ----------
// Procurar leva uns segundos e trazer os vídeos pode levar minutos: roda à parte, com a resposta em JSON
function importar(args) {
  return new Promise((ok) => {
    execFile(process.execPath, [path.join(__dirname, 'importar.js'), ...args, '--json'], { cwd: RAIZ, timeout: 30 * 60 * 1000, maxBuffer: 20 * 1024 * 1024, windowsHide: true }, (erro, saida) => {
      try { ok(JSON.parse(String(saida || '').trim().split('\n').pop())); } catch { ok({ ok: false, mensagem: 'Não deu certo agora. Peça pra IA: "traz o canal da minha pasta antiga".' }); }
    });
  });
}

// ---------- Pacotes extras (modelos 3D e cenários baixados à parte) ----------
// Um pacote é um .zip (ou a pasta dele) com a mesma estrutura da Máquina: motor/modelos/*.js (o render carrega todos)
// e referencias/cenarios/ (fotos e catálogo), com um pacote.json na raiz: {"nome", "versao", "maquina"}. Só entra o que
// é dessas pastas. O que cada pacote instalou fica anotado em motor/modelos/pacotes.json (pra trocar de versão e tirar)
const DO_PACOTE = [
  { pasta: 'motor/modelos/', tipos: /\.js$/i, raso: true },
  { pasta: 'referencias/cenarios/', tipos: /\.(jpe?g|png|webp|md)$/i }
];
const REGISTRO = ['motor', 'modelos', 'pacotes.json'];
const PREPARO = path.join(os.tmpdir(), `preguica3d-pacote-${crypto.createHash('sha1').update(RAIZ).digest('hex').slice(0, 10)}`);
const versaoDaMaquina = () => (lerJson('package.json') || {}).version || '';
const maisNova = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };

function instalarPacote(itens) {
  let info = {};
  const certos = [];
  for (const it of itens) {
    const c = it.caminho.replace(/\\/g, '/');
    if (/(^|\/)(__MACOSX|\.)/.test(c)) continue; // sujeira do Mac e arquivos escondidos
    if (/(^|\/)pacote\.json$/i.test(c)) { try { info = JSON.parse(it.pegar().toString('utf8')); } catch { /* sem nome */ } continue; }
    const m = c.match(/(?:^|\/)((?:motor\/modelos|referencias\/cenarios)\/.+)$/);
    if (!m || m[1].split('/').some((p) => !p || p === '..')) continue;
    const regra = DO_PACOTE.find((x) => m[1].startsWith(x.pasta));
    if (!regra.tipos.test(m[1]) || (regra.raso && m[1].slice(regra.pasta.length).includes('/'))) continue;
    certos.push({ rel: m[1], pegar: it.pegar });
  }
  if (!certos.length) {
    return { ok: false, mensagem: 'Isso não parece um pacote da Máquina: não achei modelos 3D (motor/modelos) nem cenários (referencias/cenarios) dentro. Confira se é o arquivo certo da área de membros.' };
  }
  const nome = String(info.nome || 'Pacote extra').slice(0, 80), versao = String(info.versao || '').slice(0, 20);
  const registro = lerJson(...REGISTRO) || [];
  const antigo = registro.find((p) => p.nome === nome);
  for (const x of certos) { const f = arq(...x.rel.split('/')); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, x.pegar()); }
  // Versão nova do mesmo pacote: o que a antiga tinha e a nova não tem sai
  if (antigo) for (const rel of antigo.arquivos || []) if (!certos.some((x) => x.rel === rel)) fs.rmSync(arq(...rel.split('/')), { force: true });
  const novo = { nome, versao, maquina: String(info.maquina || ''), instalado: new Date().toISOString(), arquivos: certos.map((x) => x.rel) };
  fs.mkdirSync(path.dirname(arq(...REGISTRO)), { recursive: true });
  fs.writeFileSync(arq(...REGISTRO), JSON.stringify([...registro.filter((p) => p.nome !== nome), novo], null, 2) + '\n');
  const modelos = certos.filter((x) => x.rel.startsWith('motor/')).length;
  const aviso = novo.maquina && versaoDaMaquina() && maisNova(novo.maquina, versaoDaMaquina())
    ? `Esse pacote é pra Máquina ${novo.maquina} ou mais nova, e a sua é a ${versaoDaMaquina()}: baixe a versão nova da Máquina na área de membros, senão algum modelo pode não funcionar.` : '';
  return { ok: true, nome, versaoDoPacote: versao, modelos, outros: certos.length - modelos, aviso };
}
function tirarPacote(nome) {
  const registro = lerJson(...REGISTRO) || [];
  const p = registro.find((x) => x.nome === nome);
  if (!p) return { ok: false, mensagem: 'Esse pacote não está instalado.' };
  for (const rel of p.arquivos || []) fs.rmSync(arq(...rel.split('/')), { force: true });
  fs.writeFileSync(arq(...REGISTRO), JSON.stringify(registro.filter((x) => x.nome !== nome), null, 2) + '\n');
  return { ok: true };
}
function listarPacotes() {
  const registro = lerJson(...REGISTRO) || [];
  let modelos = [];
  try { modelos = fs.readdirSync(arq('motor', 'modelos')).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)).sort(); } catch { /* sem modelos */ }
  const dePacote = new Set(registro.flatMap((p) => p.arquivos || []));
  return {
    instalados: registro.map((p) => ({ nome: p.nome, versao: p.versao, instalado: p.instalado,
      modelos: (p.arquivos || []).filter((f) => f.startsWith('motor/')).length, outros: (p.arquivos || []).filter((f) => !f.startsWith('motor/')).length })),
    modelos: modelos.map((m) => ({ nome: m, extra: dePacote.has(`motor/modelos/${m}.js`) }))
  };
}
// ---------- Modelos 3D: tudo que a Máquina sabe desenhar ----------
// As fotos e o catálogo vêm do npm run modelos (motor/ver-modelos.js), em referencias/modelos/. Os cenários e as peças
// dos pacotes (motor/modelos/*.js) são lidos do motor na hora: um pacote recém-vinculado aparece antes mesmo da foto
const CATEGORIAS = [['cenarios', 'Cenários'], ['personagens', 'Personagens'], ['bichos', 'Bichos'], ['objetos', 'Objetos'], ['modelos', 'Modelos prontos']];
const TRAVA_FOTOS = path.join(os.tmpdir(), `preguica3d-fotos-${crypto.createHash('sha1').update(RAIZ).digest('hex').slice(0, 10)}.txt`);
// As peças de cada motor/modelos/*.js (lidas uma vez por versão do arquivo: o da cidade tem 300 KB)
const pecasLidas = new Map();
function pecasDosModelos() {
  let nomes = [];
  try { nomes = fs.readdirSync(arq('motor', 'modelos')).filter((f) => f.endsWith('.js')).sort(); } catch { /* sem modelos */ }
  return nomes.flatMap((n) => {
    const rel = `motor/modelos/${n}`, v = quando('motor', 'modelos', n);
    if (!pecasLidas.has(rel) || pecasLidas.get(rel).v !== v) {
      const pecas = [...new Set([...(ler('motor', 'modelos', n) || '').matchAll(/MODELOS_PRONTOS\[(['"])(.+?)\1\]\s*=/g)].map((m) => m[2]))];
      pecasLidas.set(rel, { v, pecas });
    }
    return pecasLidas.get(rel).pecas.map((peca) => ({ peca, rel }));
  });
}
function fotografando() {
  try { process.kill(Number(fs.readFileSync(TRAVA_FOTOS, 'utf8')), 0); return true; } catch { return false; }
}
// Tira as fotos que faltam, à parte (o painel atualiza sozinho quando elas chegam)
function tirarFotos() {
  if (!fotografando()) spawn(process.execPath, [path.join(__dirname, 'ver-modelos.js')], { cwd: RAIZ, detached: true, stdio: 'ignore', windowsHide: true }).unref();
  return { ok: true };
}
function catalogo() {
  const cat = lerJson('referencias', 'modelos', 'catalogo.json') || {};
  const doCat = new Map((cat.itens || []).map((i) => [i.id, i]));
  const foto = (f) => (f && existe('referencias', 'modelos', f) ? arquivo(`referencias/modelos/${f}`) : null);
  const pacoteDe = {};
  for (const p of lerJson(...REGISTRO) || []) for (const f of p.arquivos || []) pacoteDe[f] = p.nome;
  const itens = [];
  for (const c of cenariosDoMotor()) {
    const i = doCat.get(`cenarios/${c}`) || { id: `cenarios/${c}`, categoria: 'cenarios', chave: c, nome: humano(c), uso: `K.cenario('${c}')` };
    itens.push({ ...i, foto: foto(i.foto) || (existe('referencias', 'cenarios', `${c}.jpg`) ? arquivo(`referencias/cenarios/${c}.jpg`) : null) });
  }
  for (const i of cat.itens || []) if (['personagens', 'bichos', 'objetos'].includes(i.categoria)) itens.push({ ...i, foto: foto(i.foto) });
  for (const { peca, rel } of pecasDosModelos()) {
    const i = doCat.get(`modelos/${peca}`) || { id: `modelos/${peca}`, categoria: 'modelos', chave: peca, nome: humano(peca.split('/').pop()),
      uso: `K.modelo('${peca}', { escala: 5 })`, pacote: peca.split('/')[0], pedir: `usa o modelo ${peca}` };
    itens.push({ ...i, foto: foto(i.foto || `modelos-${peca.replace(/\//g, '--')}.jpg`), extra: pacoteDe[rel] || null });
  }
  return { categorias: CATEGORIAS.map(([id, titulo]) => ({ id, titulo })), itens, fotografando: fotografando() };
}

// O que chega pela página: um .zip inteiro, ou os arquivos de uma pasta um por um (guardados no preparo até o fim)
function receber(req, destino, limite) {
  return new Promise((ok) => {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    const saida = fs.createWriteStream(destino);
    let n = 0, estourou = false;
    req.on('data', (d) => { n += d.length; if (n > limite && !estourou) { estourou = true; req.unpipe(saida); saida.destroy(); req.destroy(); ok(false); } });
    saida.on('finish', () => { if (!estourou) ok(true); });
    saida.on('error', () => ok(false));
    req.pipe(saida);
  });
}
// Pacote vinculado: as fotos dos modelos novos saem à parte, logo depois
const comFotos = (r) => { if (r.ok && r.modelos) tirarFotos(); return r; };
async function rotaPacote(req, url) {
  const etapa = url.pathname.split('/').pop();
  if (etapa === 'zip') {
    const z = path.join(PREPARO, 'pacote.zip');
    if (!(await receber(req, z, 4 * 1024 ** 3))) return { ok: false, mensagem: 'O arquivo não chegou inteiro. Tente de novo.' };
    try { return comFotos(instalarPacote(lerZip(z))); } catch { return { ok: false, mensagem: 'Não consegui abrir esse .zip. Baixe de novo da área de membros e tente outra vez.' }; } finally { fs.rmSync(PREPARO, { recursive: true, force: true }); }
  }
  if (etapa === 'comecar') { fs.rmSync(PREPARO, { recursive: true, force: true }); req.resume(); return { ok: true }; }
  if (etapa === 'arquivo') {
    const c = String(url.searchParams.get('caminho') || '').replace(/\\/g, '/');
    if (!c || c.split('/').some((p) => !p || p === '..')) { req.resume(); return { ok: false, mensagem: 'Caminho estranho.' }; }
    return (await receber(req, path.join(PREPARO, 'pasta', ...c.split('/')), 1024 ** 3)) ? { ok: true } : { ok: false, mensagem: 'Um arquivo não chegou inteiro. Tente de novo.' };
  }
  if (etapa === 'fim') {
    req.resume();
    try { return fs.existsSync(path.join(PREPARO, 'pasta')) ? comFotos(instalarPacote(lerPasta(path.join(PREPARO, 'pasta')))) : { ok: false, mensagem: 'Nenhum arquivo chegou.' }; }
    finally { fs.rmSync(PREPARO, { recursive: true, force: true }); }
  }
  req.resume();
  return { ok: false, mensagem: 'Não entendi.' };
}

// ---------- Os extras do Potencializar (motor/potencializar.js) ----------
// Chegam como o pacote: um arquivo só (o .zip ou o PDF, etapa "um"), ou os arquivos de uma pasta um por um (comecar,
// arquivo, fim). produto: o quadro onde a pessoa soltou
const PREPARO_EXTRA = PREPARO.replace('pacote', 'extra');
async function rotaExtra(req, url) {
  const etapa = url.pathname.split('/').pop(), produto = String(url.searchParams.get('produto') || '');
  const instalar = (itens) => P.instalar(itens, { lerZip, produto });
  try {
    if (etapa === 'um') {
      const f = path.join(PREPARO_EXTRA, 'um');
      if (!(await receber(req, f, 2 * 1024 ** 3))) return { ok: false, mensagem: 'O arquivo não chegou inteiro. Tente de novo.' };
      const b = fs.readFileSync(f), nome = String(url.searchParams.get('nome') || 'arquivo').split(/[\\/]/).pop();
      if (b.length >= 4 && b.readUInt32LE(0) === 0x04034b50) {
        try { return instalar(lerZip(b)); } catch { return { ok: false, mensagem: 'Não consegui abrir esse .zip. Baixe de novo da área de membros e tente outra vez.' }; }
      }
      return instalar([{ caminho: nome, pegar: () => b }]);
    }
    if (etapa === 'comecar') { fs.rmSync(PREPARO_EXTRA, { recursive: true, force: true }); req.resume(); return { ok: true }; }
    if (etapa === 'arquivo') {
      const c = String(url.searchParams.get('caminho') || '').replace(/\\/g, '/');
      if (!c || c.split('/').some((p) => !p || p === '..')) { req.resume(); return { ok: false, mensagem: 'Caminho estranho.' }; }
      return (await receber(req, path.join(PREPARO_EXTRA, 'pasta', ...c.split('/')), 1024 ** 3)) ? { ok: true } : { ok: false, mensagem: 'Um arquivo não chegou inteiro. Tente de novo.' };
    }
    if (etapa === 'fim') {
      req.resume();
      return fs.existsSync(path.join(PREPARO_EXTRA, 'pasta')) ? instalar(lerPasta(path.join(PREPARO_EXTRA, 'pasta'))) : { ok: false, mensagem: 'Nenhum arquivo chegou.' };
    }
    req.resume();
    return { ok: false, mensagem: 'Não entendi.' };
  } finally {
    if (etapa === 'um' || etapa === 'fim') fs.rmSync(PREPARO_EXTRA, { recursive: true, force: true });
  }
}

// ---------- O vídeo de exemplo (vem no zip; se sumiu da pasta, a pessoa importa de novo pelo painel) ----------
// Chega cru, como o pacote, e vira videos/exemplo/video.mp4 só se for mesmo um .mp4 (o "ftyp" no começo do arquivo)
async function receberExemplo(req) {
  const destino = arq('videos', 'exemplo', 'video.mp4'), chegando = arq('videos', 'exemplo', '.chegando.mp4');
  const falhou = (mensagem) => { fs.rmSync(chegando, { force: true }); return { ok: false, mensagem }; };
  if (!(await receber(req, chegando, 2 * 1024 ** 3))) return falhou('O vídeo não chegou inteiro. Tente de novo.');
  const b = Buffer.alloc(8), fd = fs.openSync(chegando, 'r');
  fs.readSync(fd, b, 0, 8, 0);
  fs.closeSync(fd);
  if (b.toString('latin1', 4, 8) !== 'ftyp') return falhou('Esse arquivo não é um vídeo .mp4. Arraste o video.mp4 da pasta videos/exemplo, de dentro do zip da Máquina.');
  try { fs.renameSync(chegando, destino); } catch { return falhou('Não consegui salvar o vídeo. Se ele estiver aberto em outro programa, feche e tente de novo.'); }
  return { ok: true };
}

// ---------- O servidor ----------

const TIPOS = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json; charset=utf-8', '.pdf': 'application/pdf' };

// Só arquivos de videos/ e de canal/ e as fotos de referencias/, sem arquivo escondido (o .env nunca sai)
function servirArquivo(req, res, rel, baixar) {
  const partes = rel.split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch { return '..'; } });
  const tipo = TIPOS[path.extname(partes[partes.length - 1] || '').toLowerCase()];
  const pasta = partes[0] === 'referencias' ? /^image\//.test(tipo || '') : ['videos', 'canal'].includes(partes[0]);
  if (!pasta || partes.some((p) => p.startsWith('.') || /[\\/]/.test(p)) || !tipo) {
    res.writeHead(404); return res.end();
  }
  const f = arq(...partes);
  let st;
  try { st = fs.statSync(f); } catch { res.writeHead(404); return res.end(); }
  if (!st.isFile()) { res.writeHead(404); return res.end(); }
  const cab = { 'Content-Type': tipo, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' };
  if (baixar) {
    const nome = partes[0] === 'videos' && partes.length > 2 ? `${partes[1]}-${partes[partes.length - 1]}` : partes[partes.length - 1];
    cab['Content-Disposition'] = `attachment; filename="${nome.replace(/[^\w.-]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(nome)}`;
  }
  // Pedaço do arquivo (o navegador pede assim pra tocar e avançar o vídeo)
  const m = String(req.headers.range || '').match(/^bytes=(\d*)-(\d*)$/);
  if (m && (m[1] || m[2])) {
    let ini = m[1] ? Number(m[1]) : Math.max(0, st.size - Number(m[2]));
    let fim = m[1] && m[2] ? Math.min(Number(m[2]), st.size - 1) : st.size - 1;
    if (ini > fim || ini >= st.size) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
    res.writeHead(206, { ...cab, 'Content-Range': `bytes ${ini}-${fim}/${st.size}`, 'Content-Length': fim - ini + 1 });
    if (req.method === 'HEAD') return res.end();
    return fs.createReadStream(f, { start: ini, end: fim }).pipe(res);
  }
  res.writeHead(200, { ...cab, 'Content-Length': st.size });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(f).pipe(res);
}

function lerCorpo(req, limite) {
  return new Promise((ok) => {
    const partes = [];
    let n = 0;
    req.on('data', (d) => { n += d.length; if (n > limite) { req.destroy(); ok(null); } else partes.push(d); });
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(partes).toString('utf8'))); } catch { ok(null); } });
    req.on('error', () => ok(null));
  });
}

// As abas do painel abertas agora: cada uma avisa, junto com a pergunta da versão (a cada 3 s), se está na tela. Com uma
// aba na tela, o npm run painel não abre aba nova: manda a tela pedida pra ela (pedidoIr), que troca sozinha
const abas = new Map(); // id → { visto, visivel }
let pedidoIr = null;    // { n, rota, em, entregue }
const abaNaTela = () => [...abas.values()].some((a) => a.visivel && Date.now() - a.visto < 5000);

// aoAcabar(motivo, dados): no modo --esperar, quando a pessoa clica em "Mandar pra IA" ou "Terminei"
function servir(porta, token, { esperando = false, aoAcabar = () => {} } = {}) {
  TOKEN = token;
  C.garantirCanal();
  const pagina = fs.readFileSync(path.join(__dirname, 'painel.html'), 'utf8');
  const srv = http.createServer(async (req, res) => {
    const host = String(req.headers.host || '').replace(/:\d+$/, '');
    if (!['127.0.0.1', 'localhost'].includes(host)) { res.writeHead(403); return res.end(); }
    const url = new URL(req.url, `http://127.0.0.1:${porta}`);
    const json = (status, obj) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
    if (url.pathname === '/ping') return json(200, { app: 'preguica3d-painel', pasta: RAIZ, token, esperando, naTela: abaNaTela(), ir: pedidoIr && { n: pedidoIr.n, entregue: pedidoIr.entregue } });
    if (url.searchParams.get('t') !== token) {
      if (url.pathname === '/') { res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end('<p style="font:18px system-ui;margin:40px">Abra o painel pelo endereço que a IA mostrou (ou peça pra ela: "abre o painel").</p>'); }
      return json(403, { ok: false, mensagem: 'Abra o painel de novo pelo endereço que a IA mostrou.' });
    }
    try {
      if (req.method === 'GET' || req.method === 'HEAD') {
        if (url.pathname === '/') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
          return res.end(pagina.replace('__TOKEN__', token));
        }
        if (url.pathname.startsWith('/arquivo/')) return servirArquivo(req, res, url.pathname.slice('/arquivo/'.length), url.searchParams.has('baixar'));
        if (url.pathname === '/api/versao') {
          // A aba conta se está na tela; a que está leva o pedido de tela do npm run painel (um só, recente)
          const aba = String(url.searchParams.get('aba') || '').slice(0, 20), visivel = url.searchParams.get('visivel') === '1';
          if (aba) abas.set(aba, { visto: Date.now(), visivel });
          let ir = null;
          if (aba && visivel && pedidoIr && !pedidoIr.entregue && Date.now() - pedidoIr.em < 8000) { pedidoIr.entregue = true; ir = pedidoIr.rota; }
          return json(200, { versao: versao(), ...(ir != null ? { ir } : {}) });
        }
        if (url.pathname === '/api/estado') {
          return json(200, { versao: versao(), esperando, canal: lerCanal(), pacotes: listarPacotes(), modelos: catalogo(), potencializar: P.estado(arquivo), novidades: lerNovidades(),
            videos: pastasDeVideo().map(resumoDoVideo).sort((a, b) => a.exemplo - b.exemplo || b.atualizado - a.atualizado) });
        }
        if (url.pathname === '/api/video') {
          const id = url.searchParams.get('id');
          return idValido(id) ? json(200, { versao: versao(), video: detalheDoVideo(id) }) : json(404, { ok: false, mensagem: 'Não achei esse vídeo.' });
        }
        if (url.pathname === '/api/conferir') return json(200, await conferir());
        if (url.pathname === '/api/importar') { const r = await importar(url.searchParams.get('pasta') ? [url.searchParams.get('pasta')] : []); return json(200, { ok: true, ...r }); }
        if (url.pathname === '/api/modelo-canal') return json(200, { texto: K.modelo(), arquivo: K.ARQUIVO_MODELO });
        return json(404, { ok: false });
      }
      // Pacote extra: o arquivo vem cru (não em JSON), então pede o código também num cabeçalho (outro site não consegue mandar)
      if (req.method === 'POST' && url.pathname.startsWith('/api/pacote/')) {
        if (req.headers['x-painel'] !== token) return json(403, { ok: false, mensagem: 'Abra o painel de novo pelo endereço que a IA mostrou.' });
        const r = await rotaPacote(req, url);
        return json(r.ok ? 200 : 400, { ...r, versao: versao() });
      }
      // Os extras do Potencializar (o .zip, a pasta ou o PDF baixado na área de membros) também vêm crus
      if (req.method === 'POST' && url.pathname.startsWith('/api/extra/')) {
        if (req.headers['x-painel'] !== token) return json(403, { ok: false, mensagem: 'Abra o painel de novo pelo endereço que a IA mostrou.' });
        const r = await rotaExtra(req, url);
        return json(r.ok ? 200 : 400, { ...r, versao: versao() });
      }
      // O vídeo de exemplo também vem cru, com o mesmo cabeçalho
      if (req.method === 'POST' && url.pathname === '/api/exemplo') {
        if (req.headers['x-painel'] !== token) return json(403, { ok: false, mensagem: 'Abra o painel de novo pelo endereço que a IA mostrou.' });
        const r = await receberExemplo(req);
        return json(r.ok ? 200 : 400, { ...r, versao: versao() });
      }
      if (req.method !== 'POST' || !/^application\/json/.test(String(req.headers['content-type']))) return json(405, { ok: false });
      const d = await lerCorpo(req, 30 * 1024 * 1024);
      if (!d) return json(400, { ok: false, mensagem: 'Não deu pra salvar (a imagem é grande demais?).' });
      let r;
      if (url.pathname === '/api/canal') { r = C.salvarCanal(d); conferido = null; }
      else if (url.pathname === '/api/descricoes') { r = C.salvarDescricoes(d); conferido = null; }
      else if (url.pathname === '/api/campos') { r = C.salvarCampos(d); conferido = null; }
      else if (url.pathname === '/api/bloco') { r = C.salvarBloco(d); conferido = null; }
      else if (url.pathname === '/api/importar') { r = await importar([String(d.pasta || ''), '--confirmar']); conferido = null; }
      else if (url.pathname === '/api/respostas') { r = K.aplicarRespostas(String(d.texto || '')); conferido = null; }
      else if (url.pathname === '/api/chave') r = abrirChave();
      else if (url.pathname === '/api/fotos') r = tirarFotos();
      else if (url.pathname === '/api/imagem') { r = salvarImagem(d.tipo, d.dados); conferido = null; }
      else if (url.pathname === '/api/opiniao') r = salvarOpiniao(d.id, d);
      else if (url.pathname === '/api/tirar-pacote') r = tirarPacote(d.nome);
      else if (url.pathname === '/api/aplicar-canal') r = P.aplicarCanal();
      else if (url.pathname === '/api/terminei') r = { ok: true };
      else if (url.pathname === '/api/ir') { pedidoIr = { n: ((pedidoIr && pedidoIr.n) || 0) + 1, rota: String(d.rota || ''), em: Date.now(), entregue: false }; r = { ok: true, n: pedidoIr.n }; }
      else if (url.pathname === '/api/fechar') { json(200, { ok: true }); srv.close(); return setTimeout(() => process.exit(0), 300); }
      else return json(404, { ok: false });
      json(r.ok ? 200 : 400, { ...r, versao: versao() });
      if (r.ok && esperando && (url.pathname === '/api/terminei' || (url.pathname === '/api/opiniao' && d.mandar))) aoAcabar(url.pathname === '/api/terminei' ? 'terminei' : 'opiniao', d);
    } catch (e) {
      json(500, { ok: false, mensagem: `Deu um erro aqui: ${e.message}. Conte pra IA.` });
    }
  });
  srv.listen(porta, '127.0.0.1');
  return srv;
}

// ---------- O comando ----------

function abrirNoNavegador(url) {
  const op = { detached: true, stdio: 'ignore', windowsHide: true };
  try {
    const p = process.platform === 'win32' ? spawn('rundll32', ['url.dll,FileProtocolHandler', url], op)
      : spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], op);
    p.on('error', () => {}); // sem navegador: a IA passa o endereço pra pessoa
    p.unref();
  } catch { /* idem */ }
}
const ping = (porta) => new Promise((ok) => {
  const req = http.get({ host: '127.0.0.1', port: porta, path: '/ping', timeout: 1500 }, (res) => {
    let d = '';
    res.on('data', (x) => { d += x; });
    res.on('end', () => { try { const j = JSON.parse(d); ok(j.app === 'preguica3d-painel' ? j : null); } catch { ok(null); } });
  });
  req.on('error', () => ok(null));
  req.on('timeout', () => { req.destroy(); ok(null); });
});
const livre = (porta) => new Promise((ok) => {
  const s = net.createServer();
  s.once('error', () => ok(null));
  s.listen(porta, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); });
});
const dormir = (ms) => new Promise((ok) => setTimeout(ok, ms));
// A aba do painel que está na tela da pessoa troca pra rota pedida, sem abrir aba nova. true se ela recebeu (até ~5 s)
async function irNaAba(porta, token, rota) {
  const n = await new Promise((ok) => {
    const req = http.request({ host: '127.0.0.1', port: porta, path: `/api/ir?t=${token}`, method: 'POST', headers: { 'Content-Type': 'application/json' }, timeout: 2000 }, (res) => {
      let d = '';
      res.on('data', (x) => { d += x; });
      res.on('end', () => { try { ok(JSON.parse(d).n || 0); } catch { ok(0); } });
    });
    req.on('error', () => ok(0));
    req.on('timeout', () => { req.destroy(); ok(0); });
    req.end(JSON.stringify({ rota }));
  });
  if (!n) return false;
  for (let i = 0; i < 22; i++) {
    await dormir(250);
    const j = await ping(porta);
    if (j && j.ir && j.ir.n === n && j.ir.entregue) return true;
  }
  return false;
}
const fechar = (porta, token) => new Promise((ok) => {
  const req = http.request({ host: '127.0.0.1', port: porta, path: `/api/fechar?t=${token}`, method: 'POST', headers: { 'Content-Type': 'application/json' }, timeout: 2000 }, (res) => { res.resume(); res.on('end', ok); });
  req.on('error', ok);
  req.on('timeout', () => { req.destroy(); ok(); });
  req.end('{}');
});

function instrucoes(url, tema, temCenas, esperando, naAba) {
  if (naAba) console.log(`\nO painel já estava aberto na tela da pessoa: mudei ele pra ${tema ? `o vídeo videos/${tema}` : 'a tela pedida'}, sem abrir aba nova.`);
  else console.log(`\nAbri o painel da Máquina no navegador${tema ? `, no vídeo videos/${tema}` : ''} (se já tinha uma aba dele, ela se fecha sozinha).`);
  console.log(`Se ele não apareceu, o endereço é: ${url}`);
  if (tema && temCenas) {
    console.log('\nPRA IA: diga pra pessoa, com as suas palavras: "Abri o painel nas cenas do vídeo, uma imagem por frase. Em cada');
    console.log(`cena, clique em Gostei ou em Mudar (e escreva o que mudar). No fim, clique em Mandar pra IA${esperando ? ': eu recebo na hora."' : ' e me diga \'mandei\'.'}`);
    if (!esperando) console.log('Se preferir, pode me responder aqui mesmo."');
    if (!esperando) console.log(`Quando ela disser que mandou, rode npm run painel -- ${tema} --opiniao (mostra a opinião de cada cena) e siga a linha PRA IA de lá.`);
  } else if (tema) {
    console.log('\nPRA IA: diga pra pessoa, com as suas palavras: "Abri o painel no seu vídeo: lá ficam o roteiro, as cenas, o vídeo');
    console.log('pronto e o texto de postar, com botão de copiar."');
  } else {
    console.log('\nPRA IA: diga pra pessoa, com as suas palavras: "Abri o painel da Máquina no seu navegador. Em Comece aqui você vê');
    console.log('o que já está pronto; em Meu canal, o logo, a capa, o personagem, a voz e o resto do canal; em Vídeos, todos os');
    console.log('seus vídeos, com o vídeo pronto, as cenas e o texto de postar; e em Modelos 3D, tudo que a Máquina sabe desenhar."');
  }
  console.log('Se a página não abriu, mande o endereço acima pra pessoa clicar (link clicável) e diga que também dá pra abrir');
  console.log('com dois cliques no ABRIR-PAINEL, na pasta da Máquina (Mac: ABRIR-PAINEL.command; Windows: ABRIR-PAINEL.bat).');
  console.log('Nunca peça pra ela abrir o terminal.');
  if (!esperando) {
    console.log('O painel fica aberto por 12 horas e atualiza sozinho quando você muda alguma coisa; npm run painel abre de novo.');
    console.log('Se ele fechar sozinho quando este comando termina, rode npm run painel -- --esperar, com tempo limite de 15 minutos.');
  }
}

// O resumo do canal, pro fim do --esperar
function textoDoCanal() {
  const c = lerCanal();
  const faltam = Object.entries(REDES).filter(([k]) => !c.descricoes[k]).map(([, r]) => r.titulo);
  return [
    `CANAL: ${c.nome || '(sem nome)'} ${c.arroba || ''}`.trim(),
    `logo: ${c.logo ? 'tem' : 'não tem'} · banner do YouTube: ${c.banner ? 'tem' : 'não tem'} · descrições: ${faltam.length ? `faltam ${faltam.join(', ')}` : 'as 3 prontas'}`
  ].join('\n');
}

(async () => {
  const args = process.argv.slice(2);
  if (args[0] === '--servidor') {
    const srv = servir(Number(args[1]), args[2]);
    try { fs.writeFileSync(PORTA_SALVA, args[1]); } catch { /* sem pasta temporária: só a porta de sempre */ }
    setTimeout(() => { srv.close(); process.exit(0); }, DURA).unref();
    return;
  }
  if (args.includes('--pacote')) {
    const alvo = args[args.indexOf('--pacote') + 1];
    const f = alvo && path.resolve(alvo.replace(/^~(?=$|[\\/])/, os.homedir()));
    if (!f || !fs.existsSync(f)) {
      console.log(`Não achei ${alvo ? `"${alvo}"` : 'o pacote'}. Uso: npm run painel -- --pacote <o .zip baixado ou a pasta dele>`);
      console.log('PRA IA: pergunte pra pessoa onde ela salvou o pacote (quase sempre em Downloads) e procure lá pelo nome do arquivo.');
      process.exit(1);
    }
    let r;
    try { r = instalarPacote(fs.statSync(f).isDirectory() ? lerPasta(f) : lerZip(f)); } catch { r = { ok: false, mensagem: 'Não consegui abrir esse .zip: pode ter vindo pela metade. Baixe de novo.' }; }
    if (!r.ok) { console.log(`PACOTE: NÃO INSTALADO. ${r.mensagem}`); process.exit(1); }
    console.log(`PACOTE: INSTALADO "${r.nome}"${r.versaoDoPacote ? ` ${r.versaoDoPacote}` : ''}:${r.modelos} ${r.modelos === 1 ? 'modelo 3D' : 'modelos 3D'} e ${r.outros} ${r.outros === 1 ? 'arquivo' : 'arquivos'} de cenários.`);
    if (r.aviso) console.log(`ATENÇÃO: ${r.aviso}`);
    comFotos(r);
    console.log('PRA IA: conte pra pessoa em uma frase. Os modelos já valem no próximo vídeo (o render carrega todo motor/modelos/*.js; K.MODELOS lista).');
    console.log('As fotos dos modelos novos estão saindo à parte (npm run modelos) e aparecem no painel, em Modelos 3D, em 1 ou 2 minutos.');
    return;
  }
  const esperar = args.includes('--esperar');
  const tema =(args.find((a) => !a.startsWith('--')) || '').replace(/\\/g, '/').replace(/^\.?\/?(videos\/)?/, '').replace(/\/+$/, '');
  if (tema && !idValido(tema)) {
    const ids = pastasDeVideo();
    console.log(`Não achei o vídeo videos/${tema}.${ids.length ? ` Os vídeos que existem: ${ids.join(', ')}.` : ''}`);
    if (args.includes('--opiniao')) process.exit(1);
  }
  const id = tema && idValido(tema) ? tema : '';
  if (args.includes('--opiniao')) {
    if (!id) { console.log('Uso: npm run painel -- <tema> --opiniao'); process.exit(1); }
    console.log(textoDaOpiniao(id));
    return;
  }
  const temCenas = !!(id && existe('videos', id, 'testes', 'cenas.json'));
  const token = codigo();
  const rota = id ? `#/video/${encodeURIComponent(id)}${temCenas && !args.includes('--pronto') ? '/cenas' : ''}` : args.includes('--canal') ? '#/canal' : args.includes('--potencializar') ? '#/potencializar' : '';
  // O painel desta pasta já ligado (na porta de sempre ou na guardada)
  let ja = null;
  for (const p of [PORTA, Number((() => { try { return fs.readFileSync(PORTA_SALVA, 'utf8'); } catch { return 0; } })())]) {
    const j = p && !ja ? await ping(p) : null;
    if (j && j.pasta === RAIZ) ja = { ...j, porta: p };
  }
  // --link: só liga o painel e mostra o endereço, sem abrir aba nova
  const link = args.includes('--link');
  // naAba: o painel já estava na tela da pessoa e trocou de tela sozinho (sem aba nova)
  const mostrar = (url, naAba = false) => {
    if (args.includes('--atalho')) {
      if (!naAba) abrirNoNavegador(url);
      console.log(`\n${naAba ? 'O painel da Máquina já estava aberto no seu navegador.' : 'Abri o painel da Máquina no seu navegador.'}\nSe ele não apareceu, copie este endereço e cole no navegador:\n\n   ${url}\n\nPode fechar esta janela: o painel continua aberto.`);
      return;
    }
    if (!link) { if (!naAba) abrirNoNavegador(url); return instrucoes(url, id, temCenas && !args.includes('--pronto'), false, naAba); }
    console.log(`O painel da Máquina está ligado. O endereço é: ${url}`);
    console.log('PRA IA: termine a sua resposta com este link, clicável, e uma frase do que a pessoa vê lá (os vídeos, o canal,');
    console.log('o que falta configurar). Quer abrir na tela dela? npm run painel. Ela disse que não abriu: mande o link de novo e');
    console.log('diga que também dá pra abrir com dois cliques no ABRIR-PAINEL, na pasta da Máquina.');
  };

  if (!esperar) {
    // Painel desta pasta já ligado: com uma aba dele na tela, ela troca pra tela pedida (nada de aba nova); senão, abre
    // uma aba nova, e a velha, se tiver, se fecha sozinha
    if (ja) {
      const url = `http://127.0.0.1:${ja.porta}/?t=${ja.token}${rota}`;
      return mostrar(url, !link && ja.naTela && (await irNaAba(ja.porta, ja.token, rota)));
    }
    const porta = (await livre(PORTA)) || (await livre(0));
    spawn(process.execPath, [__filename, '--servidor', String(porta), token], { cwd: RAIZ, detached: true, stdio: 'ignore', windowsHide: true }).unref();
    for (let i = 0; i < 40 && !(await ping(porta)); i++) await dormir(150);
    if (await ping(porta)) return mostrar(`http://127.0.0.1:${porta}/?t=${token}${rota}`);
    if (link) { console.log('O painel não conseguiu ficar ligado sozinho. PRA IA: quando a pessoa quiser ver, rode npm run painel -- --esperar.'); return; }
    console.log('O painel não conseguiu ficar aberto sozinho. Abrindo preso a este comando (até 15 minutos)...');
  }

  // --esperar (ou o painel à parte não subiu): o painel fica com este comando
  if (ja) {
    await fechar(ja.porta, ja.token);
    for (let i = 0; i < 20 && (await ping(ja.porta)); i++) await dormir(150);
  }
  const porta = (await livre(PORTA)) || (await livre(0));
  const url = `http://127.0.0.1:${porta}/?t=${token}${rota}`;
  const limite = setTimeout(() => {
    console.log('\nPassaram 15 minutos. O painel fechou junto com este comando.');
    console.log('PRA IA: pergunte pra pessoa se ela terminou. Pra abrir o painel de novo: npm run painel (ou com --esperar).');
    process.exit(1);
  }, ESPERA_COMANDO);
  const srv = servir(porta, token, {
    esperando: true,
    aoAcabar: (motivo, d) => {
      clearTimeout(limite);
      if (motivo === 'opiniao') {
        console.log(`\nA pessoa clicou em "Mandar pra IA".\n${textoDaOpiniao(d.id)}`);
      } else {
        console.log(`\nA pessoa clicou em "Terminei".\n${textoDoCanal()}`);
        console.log('PRA IA: conte pra ela em uma frase o que ficou salvo. Pra abrir o painel de novo: npm run painel.');
      }
      setTimeout(() => { srv.close(); process.exit(0); }, 1500);
    }
  });
  abrirNoNavegador(url);
  instrucoes(url, id, temCenas, true);
  console.log('\nEsperando a pessoa clicar em "Mandar pra IA" ou "Terminei" (até 15 minutos)...');
})();
