// Ler e gravar os arquivos do canal (canal/canal.md, canal/identidade.md com o bloco "No roteiro.json" e
// canal/perfil.md) sem estragar o resto deles. Quem usa: o painel (npm run painel, em "Meu canal") e o npm run canal
// (o modelo de prompt que a pessoa preenche, CONFIGURAR-MEU-CANAL.txt)
const fs = require('fs');
const path = require('path');
const V = require('./voz');

const RAIZ = V.RAIZ;
const MODELO = /\[[^\]]*\b(ex|Ex|ej|Ej|Descreva)[:.][^\]]*\]/; // campo de exemplo do modelo (o mesmo do conferir)
const REDES = {
  youtube: { titulo: 'YouTube', limite: 1000, dica: 'a descrição do canal, até 1.000 caracteres' },
  tiktok: { titulo: 'TikTok', limite: 80, dica: 'a bio, até 80 caracteres' },
  instagram: { titulo: 'Instagram', limite: 150, dica: 'a bio, até 150 caracteres' }
};
const arq = (...p) => path.join(RAIZ, ...p);
const ler = (...p) => { try { return fs.readFileSync(arq(...p), 'utf8').replace(/^\uFEFF/, ''); } catch { return null; } };
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Os arquivos do canal nascem dos modelos em branco de motor/canal-em-branco/, só quando faltam. Os modelos não ficam
// em canal/: assim, extrair uma versão nova da Máquina por cima da antiga nunca apaga o canal de ninguém
const EM_BRANCO = path.join(__dirname, 'canal-em-branco');
function garantirCanal() {
  try {
    fs.mkdirSync(arq('canal', 'pecas'), { recursive: true });
    for (const f of fs.readdirSync(EM_BRANCO)) if (f.endsWith('.md') && !fs.existsSync(arq('canal', f))) fs.copyFileSync(path.join(EM_BRANCO, f), arq('canal', f));
  } catch { /* sem os modelos (pasta mexida): quem lê o canal avisa o que falta */ }
}
const emBranco = (f) => { try { return fs.readFileSync(path.join(EM_BRANCO, f), 'utf8'); } catch { return null; } };

// Os cenários prontos que o motor tem (motor/cenarios.js)
const cenariosDoMotor = () => [...(ler('motor', 'cenarios.js') || '').matchAll(/CENARIOS\.(\w+)\s*=\s*function/g)].map((m) => m[1]);

// "**Nome do canal:** Motor Curioso" → 'Motor Curioso' ('' se ainda é o exemplo do modelo; null se a linha não existe)
function campo(txt, rotulo) {
  const m = (txt || '').match(new RegExp(`^\\*\\*${escRe(rotulo)}:?\\*\\*:?[ \\t]*(.*)$`, 'm'));
  if (!m) return null;
  return MODELO.test(m[1]) ? '' : m[1].trim();
}
function trocarCampo(txt, rotulo, valor) {
  const re = new RegExp(`^(\\*\\*${escRe(rotulo)}:?\\*\\*:?)[ \\t]*.*$`, 'm');
  if (re.test(txt)) return txt.replace(re, (_, r) => `${r} ${valor}`);
  // Sem a linha: entra logo depois do título do arquivo
  const linhas = txt.split('\n'), i = linhas.findIndex((l) => l.startsWith('# '));
  linhas.splice(i + 1, 0, ...(i >= 0 ? ['', `**${rotulo}:** ${valor}`] : [`**${rotulo}:** ${valor}`]));
  return linhas.join('\n');
}
// As seções "## Título" de um .md → { 'Título': 'texto' }, sem as linhas de aviso ("> ...") e os comentários <!-- -->
function secoes(txt) {
  const r = {};
  let atual = null;
  for (const l of (txt || '').replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const m = l.match(/^##\s+(.+?)\s*$/);
    if (m) { atual = m[1]; r[atual] = []; continue; }
    if (atual && !l.startsWith('>')) r[atual].push(l);
  }
  for (const k of Object.keys(r)) r[k] = r[k].join('\n').trim();
  return r;
}
// Os textos do canal que o painel mostra e deixa mudar, cada um na sua seção "## Título" (vale o 1º título que existir).
// so1: só o 1º parágrafo é da pessoa (o resto da seção é a explicação pra IA, que fica); manter: linhas da seção que
// ficam como estão (o "**Evitar:**" do jeito de falar, que é um campo à parte)
const CAMPOS = {
  tema: { arq: 'canal.md', secoes: ['Tema'] },
  quemAssiste: { arq: 'canal.md', secoes: ['Quem assiste'] },
  jeito: { arq: 'canal.md', secoes: ['Jeito de falar'], manter: /^\*\*Evitar:?\*\*/ },
  mecanismo: { arq: 'canal.md', secoes: ['Mecanismo único'] },
  capa: { arq: 'canal.md', secoes: ['Estilo da capa'] },
  personagem: { arq: 'identidade.md', secoes: ['Personagem'], so1: true },
  lugar: { arq: 'identidade.md', secoes: ['Cenário e hora padrão', 'Lugar e hora padrão'], so1: true },
  voz: { arq: 'identidade.md', secoes: ['Voz'], so1: true },
  estiloVideo: { arq: 'canal.md', secoes: ['Estilo do vídeo'] },
  hashtags: { arq: 'canal.md', secoes: ['Hashtags (até 5)', 'Hashtags'] },
  estilo: { arq: 'identidade.md', secoes: ['Estilo'], so1: true }
};
// Os campos que são uma linha "**Rótulo:** valor" dentro de uma seção (sem a linha, ela entra no fim da seção)
const LINHAS = {
  evitar: { rotulo: 'Evitar', secao: CAMPOS.jeito },
  fechamento: { rotulo: 'Fechamento', secao: { arq: 'canal.md', secoes: ['Fechamento e chamada'] } },
  chamada: { rotulo: 'Chamada (CTA)', secao: { arq: 'canal.md', secoes: ['Fechamento e chamada'] } }
};
// As linhas de uma seção: { i (a linha do título), fim (a do próximo título) } ou null
function acharSecao(L, titulos) {
  const i = L.findIndex((l) => { const m = l.match(/^##\s+(.+?)\s*$/); return m && titulos.includes(m[1]); });
  if (i < 0) return null;
  const fim = L.findIndex((l, k) => k > i && /^##\s/.test(l));
  return { i, fim: fim < 0 ? L.length : fim };
}
// O 1º parágrafo de uma seção (depois dos avisos "> ..."): [início, fim) nas linhas do corpo
function primeiroParagrafo(corpo) {
  let a = 0;
  while (a < corpo.length && (!corpo[a].trim() || corpo[a].startsWith('>'))) a++;
  let b = a;
  while (b < corpo.length && corpo[b].trim()) b++;
  return [a, b];
}
// O texto de um campo: { valor, exemplo }. Ainda com o exemplo do modelo ("[Ex: ...]"), o valor é vazio e o exemplo
// vira a dica do campo no painel
function lerCampo(txt, c) {
  const L = (txt || '').split('\n'), s = acharSecao(L, c.secoes);
  if (!s) return { valor: '', exemplo: '' };
  let corpo = L.slice(s.i + 1, s.fim).filter((l) => !(c.manter && c.manter.test(l)));
  if (c.so1) { const [a, b] = primeiroParagrafo(corpo); corpo = corpo.slice(a, b); }
  const t = corpo.filter((l) => !l.startsWith('>')).join('\n').replace(/<!--[\s\S]*?-->/g, '').trim();
  if (MODELO.test(t)) {
    const ex = t.match(/\b(?:ex|Ex|ej|Ej)[:.]\s*([^\]]*)/);
    return { valor: '', exemplo: (ex ? ex[1] : t.replace(/^\[|\]$/g, '')).replace(/`/g, '').trim() };
  }
  return { valor: t.replace(/^\[([\s\S]*)\]$/, '$1'), exemplo: '' };
}
// Troca o texto de um campo. Sem a seção, ela entra antes do bloco "No roteiro.json" (ou no fim do arquivo)
function trocarCampoLongo(txt, c, valor) {
  const L = txt.split('\n');
  let v = String(valor).replace(/\r/g, '').trim();
  if (c.so1) v = v.replace(/\n\s*\n+/g, '\n'); // um parágrafo só: o 2º seria lido como explicação
  const novo = v.split('\n');
  const s = acharSecao(L, c.secoes);
  if (!s) {
    let k = L.findIndex((l) => /^##\s+No roteiro\.json/.test(l));
    if (k < 0) { while (L.length && !L[L.length - 1].trim()) L.pop(); k = L.length; L.push(''); }
    L.splice(k, 0, `## ${c.secoes[0]}`, '', ...novo, '');
    return L.join('\n');
  }
  const corpo = L.slice(s.i + 1, s.fim);
  let saida;
  if (c.so1) {
    const [a, b] = primeiroParagrafo(corpo);
    saida = [...corpo.slice(0, a), ...novo, ...corpo.slice(b)];
    if (!saida.length || saida[saida.length - 1].trim()) saida.push('');
  } else {
    const fica = corpo.filter((l) => l.startsWith('>') || (c.manter && c.manter.test(l)));
    saida = ['', ...novo, '', ...(fica.length ? [...fica, ''] : [])];
  }
  L.splice(s.i + 1, s.fim - s.i - 1, ...saida);
  return L.join('\n');
}

// O bloco "No roteiro.json" de canal/identidade.md (o /novo-video copia ele pra todo vídeo novo)
const RE_BLOCO = /(## No roteiro\.json[\s\S]*?```json\s*)([\s\S]*?)(```)/;
// Valor em JSON numa linha só, com espaço depois de ":" e de "," (o jeito do bloco)
const emLinha = (v) => (Array.isArray(v) ? `[${v.map(emLinha).join(', ')}]`
  : v && typeof v === 'object' ? `{${Object.entries(v).map(([k, x]) => `${JSON.stringify(k)}: ${emLinha(x)}`).join(', ')}}` : JSON.stringify(v));
// Muda chaves do bloco ({ chave: valor }; null tira a chave), sem mexer na ordem das outras. null se o bloco tem erro
function trocarNoBloco(txt, mudancas) {
  const m = txt.match(RE_BLOCO);
  let obj = {};
  if (m) { try { obj = JSON.parse(`{${m[2].trim().replace(/,\s*$/, '')}}`); } catch { return null; } }
  for (const [k, v] of Object.entries(mudancas)) if (v === null) delete obj[k]; else if (v !== undefined) obj[k] = v;
  const corpo = Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)}: ${emLinha(v)}`).join(',\n') + '\n';
  if (m) return txt.replace(m[0], () => m[1] + corpo + m[3]);
  return `${txt.replace(/\s*$/, '')}\n\n## No roteiro.json\n\n\`\`\`json\n${corpo}\`\`\`\n`;
}
// A cor no texto da seção "Cor do canal": troca o exemplo "[Ex: coral `#ff7a59`.]" ou o #hex que já estava lá
function trocarCorNoTexto(txt, cor) {
  const L = txt.split('\n'), s = acharSecao(L, ['Cor do canal']);
  if (!s) return trocarCampoLongo(txt, { secoes: ['Cor do canal'] }, `\`${cor}\``);
  const corpo = L.slice(s.i + 1, s.fim), [a] = primeiroParagrafo(corpo), k = s.i + 1 + a;
  if (a >= corpo.length) return trocarCampoLongo(txt, { secoes: ['Cor do canal'], so1: true }, `\`${cor}\``);
  if (/^\[[^\]]*\]/.test(L[k])) L[k] = L[k].replace(/^\[[^\]]*\]\.?/, `\`${cor}\`.`);
  else if (/#[0-9a-f]{6}\b/i.test(L[k])) L[k] = L[k].replace(/#[0-9a-f]{6}\b/i, cor);
  else L[k] = `\`${cor}\`. ${L[k]}`;
  return L.join('\n');
}


function salvarCanal(d) {
  const limpo = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
  const nome = limpo(d.nome, 80), assinatura = limpo(d.assinatura, 160);
  let arroba = limpo(d.arroba, 60).replace(/\s/g, '');
  if (arroba && !arroba.startsWith('@')) arroba = '@' + arroba;
  if (!nome) return { ok: false, mensagem: 'Escreva o nome do canal.' };
  // Campo vazio não é salvo: vazio, o conferir acharia que já está configurado
  let txt = ler('canal', 'canal.md');
  if (txt == null) return { ok: false, mensagem: 'Não achei o arquivo canal/canal.md. Peça pra IA: "configura o meu canal".' };
  txt = trocarCampo(txt, 'Nome do canal', nome);
  if (arroba) txt = trocarCampo(txt, '@ nas redes', arroba);
  if (assinatura) txt = trocarCampo(txt, 'Assinatura do fim do vídeo', assinatura);
  fs.writeFileSync(arq('canal', 'canal.md'), txt);
  const id = ler('canal', 'identidade.md');
  if (id != null && arroba) {
    const novo = trocarNoBloco(id, { arroba });
    if (novo && novo !== id) fs.writeFileSync(arq('canal', 'identidade.md'), novo);
  }
  return { ok: true };
}

// Os textos do canal (Do que fala, Quem assiste...): { campos: { tema: '...', evitar: '...' } }. Campo vazio não é salvo
function salvarCampos(d) {
  const campos = d && d.campos && typeof d.campos === 'object' ? d.campos : {};
  const txts = { 'canal.md': ler('canal', 'canal.md'), 'identidade.md': ler('canal', 'identidade.md') };
  if (txts['canal.md'] == null || txts['identidade.md'] == null) return { ok: false, mensagem: 'Não achei os arquivos do canal. Peça pra IA: "configura o meu canal".' };
  for (const [k, v] of Object.entries(campos)) {
    const valor = String(v ?? '').trim().slice(0, 4000);
    if (!valor) continue;
    const l = LINHAS[k];
    if (l) {
      const t = txts[l.secao.arq], linha = valor.replace(/\s+/g, ' ');
      txts[l.secao.arq] = campo(t, l.rotulo) !== null ? trocarCampo(t, l.rotulo, linha)
        : trocarCampoLongo(t, { ...l.secao, manter: null }, `${lerCampo(t, l.secao).valor || ''}\n\n**${l.rotulo}:** ${linha}`.trim());
      continue;
    }
    const c = CAMPOS[k];
    if (c) txts[c.arq] = trocarCampoLongo(txts[c.arq], c, valor);
  }
  for (const [f, t] of Object.entries(txts)) if (t !== ler('canal', f)) fs.writeFileSync(arq('canal', f), t);
  return { ok: true };
}

// O que vai no bloco "No roteiro.json": a cor, o personagem, o cenário e a hora, a voz. Só muda o que veio
const HEX = /^#[0-9a-f]{6}$/i;
// A voz de cada motor, com o que a voz de antes tinha a mais (a velocidade, o modelo do VoiceStudio...) se o motor é o mesmo
const resto = (v) => { const { motor, id, ...r } = v; return r; };
const VOZES = {
  elevenlabs: (v, id) => ({ motor: 'elevenlabs', id, ...(v.motor === 'elevenlabs' ? resto(v) : { velocidade: 1.1, acelerar: 'auto' }) }),
  voicestudio: (v, id) => ({ motor: 'voicestudio', id, ...(v.motor === 'voicestudio' ? resto(v) : { idioma: 'pt-BR', acelerar: 'auto' }) }),
  teste: () => ({ motor: 'teste' })
};
// op.vozSemId: aceita a ElevenLabs sem o id da voz (o npm run canal, quando a pessoa ainda não sabe o id; o conferir avisa)
function salvarBloco(d, op = {}) {
  const id = ler('canal', 'identidade.md');
  if (id == null) return { ok: false, mensagem: 'Não achei o canal/identidade.md. Peça pra IA: "configura o meu canal".' };
  const atual = V.blocoDoCanal(RAIZ);
  if (RE_BLOCO.test(id) && !atual) return { ok: false, mensagem: 'O bloco "No roteiro.json" do canal/identidade.md está com um erro. Peça pra IA: "arruma o bloco do canal".' };
  const b = atual || {}, m = {};
  let txt = id;
  if (d.cor !== undefined) {
    if (!HEX.test(d.cor)) return { ok: false, mensagem: 'Essa cor não está certa: escolha uma no seletor.' };
    m.cor = d.cor.toLowerCase();
    txt = trocarCorNoTexto(txt, m.cor);
  }
  if (d.personagem) {
    const p = d.personagem, tipo = ['menino', 'menina', 'doutor', 'operario'].includes(p.tipo) ? p.tipo : null;
    if (!tipo) return { ok: false, mensagem: 'Escolha um dos personagens.' };
    const cores = Object.fromEntries(Object.entries(p.cores || {}).filter(([k, v]) => /^[a-zA-Z]{2,20}$/.test(k) && HEX.test(v)).map(([k, v]) => [k, v.toLowerCase()]));
    // O que a IA pôs a mais no personagem (capacete, barba...) fica, se ainda é o mesmo tipo
    const antes = b.personagem && (b.personagem.tipo || 'menino') === tipo ? b.personagem : {};
    m.personagem = { ...antes, tipo, ...(tipo === 'menino' ? { roupa: p.roupa === 'moletom' ? 'moletom' : 'camiseta' } : {}), cores };
    if (tipo !== 'menino') delete m.personagem.roupa;
  }
  if (d.cenario !== undefined) {
    if (!cenariosDoMotor().includes(d.cenario)) return { ok: false, mensagem: 'Escolha um dos cenários.' };
    m.cenario = d.cenario;
    m.lugar = null; // o "lugar" é o jeito antigo: com o cenário, sai
  }
  if (d.hora !== undefined) {
    if (!['dia', 'tarde', 'noite'].includes(d.hora)) return { ok: false, mensagem: 'A hora é dia, tarde ou noite.' };
    m.hora = d.hora;
  }
  if (d.voz) {
    const fazer = VOZES[d.voz.motor];
    if (!fazer) return { ok: false, mensagem: 'Escolha de onde vem a voz.' };
    const vid = String(d.voz.id || '').trim().slice(0, 120);
    if (d.voz.motor !== 'teste' && !vid && !op.vozSemId) return { ok: false, mensagem: d.voz.motor === 'elevenlabs' ? 'Falta o id da voz da ElevenLabs.' : 'Falta o nome da voz no VoiceStudio.' };
    m.voz = fazer(b.voz || {}, vid);
  }
  if (d.estilo !== undefined) {
    // Redondo é o visual caprichado (com 60 quadros por segundo); sem o campo, sai o low-poly, mais simples e rápido
    if (!['redondo', 'simples'].includes(d.estilo)) return { ok: false, mensagem: 'O visual é redondo ou simples.' };
    Object.assign(m, d.estilo === 'redondo' ? { estilo: 'redondo', fps: 60 } : { estilo: null, fps: null });
  }
  const novo = trocarNoBloco(txt, m);
  if (!novo) return { ok: false, mensagem: 'O bloco "No roteiro.json" do canal/identidade.md está com um erro. Peça pra IA: "arruma o bloco do canal".' };
  if (novo !== id) fs.writeFileSync(arq('canal', 'identidade.md'), novo);
  return { ok: true };
}

const PERFIL_TOPO = `# Perfil do canal nas redes

> O que vai na página do canal em cada rede. A IA escreve com você, e o painel (\`npm run painel\`, em "Meu canal")
> mostra com o botão de copiar. O logo fica em \`canal/logo.png\` e o banner do YouTube em \`canal/banner.jpg\`.
`;
function salvarDescricoes(d) {
  const s = secoes(ler('canal', 'perfil.md'));
  const nomes = Object.values(REDES).map((r) => r.titulo);
  const partes = [PERFIL_TOPO];
  for (const [k, r] of Object.entries(REDES)) {
    const v = d[k] != null ? String(d[k]).replace(/\r/g, '').trim().slice(0, 5000) : s[r.titulo] || '';
    partes.push(`## ${r.titulo}\n\n${v || `<!-- ${r.dica} -->`}\n`);
  }
  // O que a IA tiver acrescentado em outras seções fica
  for (const [k, v] of Object.entries(s)) if (!nomes.includes(k)) partes.push(`## ${k}\n\n${v}\n`);
  fs.mkdirSync(arq('canal'), { recursive: true });
  fs.writeFileSync(arq('canal', 'perfil.md'), partes.join('\n'));
  return { ok: true };
}

module.exports = {
  MODELO, REDES, CAMPOS, LINHAS, RE_BLOCO, HEX, EM_BRANCO, garantirCanal, emBranco, acharSecao, primeiroParagrafo, ler, campo, trocarCampo, secoes, lerCampo, trocarCampoLongo, trocarNoBloco,
  trocarCorNoTexto, cenariosDoMotor, salvarCanal, salvarCampos, salvarBloco, salvarDescricoes
};
